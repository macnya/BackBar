import { desc, eq, ilike, and, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, suppliers, stockMovements } from "@/db/schema";
import { requireBiz } from "@/lib/auth";
import { ensureUniqueSku, toNumber } from "@/lib/sku";

export async function GET(req: Request) {
  const { business } = await requireBiz();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const low = url.searchParams.get("low") === "1";

  const conditions = [eq(products.businessId, business.id)];
  if (q) conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`))!);
  if (low) conditions.push(sql`${products.quantity} <= ${products.reorderLevel}`);

  const rows = await db
    .select({
      product: products,
      supplierName: suppliers.name,
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(and(...conditions))
    .orderBy(desc(products.id));

  return Response.json({
    ok: true,
    items: rows.map((r) => ({ ...r.product, supplierName: r.supplierName ?? "" })),
  });
}

export async function POST(req: Request) {
  const { business } = await requireBiz();
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ ok: false, error: "Product name is required." }, { status: 400 });

  const skuRows = await db
    .select({ sku: products.sku })
    .from(products)
    .where(eq(products.businessId, business.id));
  const skuSet = new Set(skuRows.map((r) => r.sku));
  const sku = ensureUniqueSku(body.sku, skuSet);

  const quantity = toNumber(body.quantity);
  const [product] = await db
    .insert(products)
    .values({
      businessId: business.id,
      name,
      sku,
      category: String(body.category ?? "").trim() || "Uncategorized",
      unit: String(body.unit ?? "").trim() || "unit",
      quantity,
      costPrice: toNumber(body.costPrice),
      reorderLevel: toNumber(body.reorderLevel),
      supplierId: body.supplierId ? Number(body.supplierId) : null,
      shelfLifeDays: body.shelfLifeDays ? Math.round(toNumber(body.shelfLifeDays)) : null,
      expiryDate: body.expiryDate ? String(body.expiryDate) : null,
    })
    .returning();

  if (quantity !== 0) {
    await db.insert(stockMovements).values({
      businessId: business.id,
      productId: product.id,
      change: quantity,
      type: quantity > 0 ? "in" : "adjust",
      method: "manual",
      note: "Opening stock",
    });
  }

  return Response.json({ ok: true, product });
}
