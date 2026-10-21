import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { businesses, products, stockMovements, suppliers } from "@/db/schema";
import { getSession } from "@/lib/auth";

type Row = {
  row?: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  costPrice: number;
  reorderLevel?: number;
  supplierName?: string;
  shelfLifeDays?: number | null;
  expiryDate?: string | null;
};

type ImportPayload = {
  rows: Row[];
  source?: string;
};

/**
 * Session carries { userId, businessId } (set by createSessionToken during
 * login/register). We only need businessId. If a session is ever minted
 * without one, fall back to looking it up via businesses.ownerId.
 */
async function currentBusinessId(): Promise<number | null> {
  const session = await getSession();
  if (!session) return null;

  // getSession already carries businessId; use it directly.
  if (typeof session.businessId === "number" && session.businessId > 0) {
    return session.businessId;
  }

  // Fallback: derive from the user.
  if (typeof session.userId === "number") {
    const [row] = await db
      .select({ businessId: businesses.id })
      .from(businesses)
      .where(eq(businesses.ownerId, session.userId))
      .limit(1);
    return row?.businessId ?? null;
  }

  return null;
}

export async function POST(req: Request) {
  const businessId = await currentBusinessId();
  if (!businessId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let payload: ImportPayload;
  try {
    payload = (await req.json()) as ImportPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const source = payload.source ?? "excel";

  if (rows.length === 0) {
    return NextResponse.json({ created: 0, updated: 0, errors: [] });
  }

  // 1. Resolve / create suppliers — scoped to this business.
  const supplierNames = Array.from(
    new Set(
      rows
        .map((r) => (r.supplierName ?? "").trim())
        .filter((n): n is string => n.length > 0),
    ),
  );

  const existingSuppliers = supplierNames.length
    ? await db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.businessId, businessId),
            inArray(suppliers.name, supplierNames),
          ),
        )
    : [];

  const supplierByName = new Map<string, number>(
    existingSuppliers.map((s) => [s.name.toLowerCase(), s.id]),
  );

  for (const name of supplierNames) {
    const key = name.toLowerCase();
    if (supplierByName.has(key)) continue;
    const [created] = await db
      .insert(suppliers)
      .values({ name, businessId })
      .returning();
    if (created) supplierByName.set(key, created.id);
  }

  // 2. Load existing products — scoped to this business.
  const skus = Array.from(new Set(rows.map((r) => r.sku).filter(Boolean)));
  const existingProducts = skus.length
    ? await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.businessId, businessId),
            inArray(products.sku, skus),
          ),
        )
    : [];

  const bySku = new Map(existingProducts.map((p) => [p.sku.toLowerCase(), p]));

  const errors: { row: number; message: string }[] = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = r.row ?? i + 2;

    try {
      const supplierId = r.supplierName
        ? supplierByName.get(r.supplierName.trim().toLowerCase()) ?? null
        : null;

      const existing = bySku.get(r.sku.toLowerCase());

      if (existing) {
        const delta = r.quantity - existing.quantity;

        await db
          .update(products)
          .set({
            name: r.name,
            category: r.category,
            unit: r.unit,
            quantity: r.quantity,
            costPrice: r.costPrice,
            reorderLevel: r.reorderLevel ?? existing.reorderLevel,
            supplierId: supplierId ?? existing.supplierId,
            shelfLifeDays: r.shelfLifeDays ?? existing.shelfLifeDays,
            expiryDate: r.expiryDate ?? existing.expiryDate,
          })
          .where(
            and(
              eq(products.businessId, businessId),
              eq(products.id, existing.id),
            ),
          );

        if (delta !== 0) {
          await db.insert(stockMovements).values({
            businessId,
            productId: existing.id,
            change: delta,
            type: "adjust",
            method: source,
            note: `Stock import (was ${existing.quantity} → ${r.quantity})`,
          });
        }

        updatedCount++;
      } else {
        const [inserted] = await db
          .insert(products)
          .values({
            businessId,
            name: r.name,
            sku: r.sku,
            category: r.category,
            unit: r.unit,
            quantity: r.quantity,
            costPrice: r.costPrice,
            reorderLevel: r.reorderLevel ?? 0,
            supplierId,
            shelfLifeDays: r.shelfLifeDays ?? null,
            expiryDate: r.expiryDate ?? null,
          })
          .returning();

        if (inserted && r.quantity > 0) {
          await db.insert(stockMovements).values({
            businessId,
            productId: inserted.id,
            change: r.quantity,
            type: "in",
            method: source,
            note: "Opening stock (import)",
          });
        }

        if (inserted) {
          bySku.set(inserted.sku.toLowerCase(), inserted);
        }
        createdCount++;
      }
    } catch (err) {
      errors.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    created: createdCount,
    updated: updatedCount,
    errors,
  });
}