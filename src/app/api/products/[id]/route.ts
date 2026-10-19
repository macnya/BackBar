import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { requireBiz } from "@/lib/auth";
import { toNumber } from "@/lib/sku";

async function findProduct(businessId: number, id: number) {
  const [p] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.businessId, businessId)))
    .limit(1);
  return p ?? null;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { business } = await requireBiz();
  const { id } = await ctx.params;
  const pid = Number(id);
  const product = await findProduct(business.id, pid);
  if (!product) return Response.json({ ok: false, error: "Product not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return Response.json({ ok: false, error: "Product name is required." }, { status: 400 });
    patch.name = name;
  }
  if (body.sku !== undefined) {
    const sku = String(body.sku).trim();
    if (!sku) return Response.json({ ok: false, error: "Code cannot be empty." }, { status: 400 });
    const [dup] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.businessId, business.id), eq(products.sku, sku), ne(products.id, pid)))
      .limit(1);
    if (dup) return Response.json({ ok: false, error: "Another product already uses this code." }, { status: 409 });
    patch.sku = sku;
  }
  if (body.category !== undefined) patch.category = String(body.category).trim() || "Uncategorized";
  if (body.unit !== undefined) patch.unit = String(body.unit).trim() || "unit";
  if (body.costPrice !== undefined) patch.costPrice = toNumber(body.costPrice);
  if (body.reorderLevel !== undefined) patch.reorderLevel = toNumber(body.reorderLevel);
  if (body.supplierId !== undefined) patch.supplierId = body.supplierId ? Number(body.supplierId) : null;
  if (body.shelfLifeDays !== undefined)
    patch.shelfLifeDays = body.shelfLifeDays ? Math.round(toNumber(body.shelfLifeDays)) : null;
  if (body.expiryDate !== undefined) patch.expiryDate = body.expiryDate ? String(body.expiryDate) : null;

  const [updated] = await db.update(products).set(patch).where(eq(products.id, pid)).returning();

  if (body.quantity !== undefined) {
    const newQty = toNumber(body.quantity);
    const delta = newQty - product.quantity;
    if (Math.abs(delta) > 0.0001) {
      const [withQty] = await db
        .update(products)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(products.id, pid))
        .returning();
      await db.insert(stockMovements).values({
        businessId: business.id,
        productId: pid,
        change: delta,
        type: "adjust",
        method: "manual",
        note: "Quantity edited",
      });
      return Response.json({ ok: true, product: withQty });
    }
  }

  return Response.json({ ok: true, product: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { business } = await requireBiz();
  const { id } = await ctx.params;
  const product = await findProduct(business.id, Number(id));
  if (!product) return Response.json({ ok: false, error: "Product not found." }, { status: 404 });
  await db.delete(products).where(eq(products.id, product.id));
  return Response.json({ ok: true });
}
