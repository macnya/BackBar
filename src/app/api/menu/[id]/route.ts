import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, recipeItems } from "@/db/schema";
import { requireBiz } from "@/lib/auth";
import { toNumber } from "@/lib/sku";

async function find(businessId: number, id: number) {
  const [m] = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.id, id), eq(menuItems.businessId, businessId)))
    .limit(1);
  return m ?? null;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { business } = await requireBiz();
  const { id } = await ctx.params;
  const item = await find(business.id, Number(id));
  if (!item) return Response.json({ ok: false, error: "Menu item not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ ok: false, error: "Menu item name is required." }, { status: 400 });

  await db
    .update(menuItems)
    .set({
      name,
      description: String(body.description ?? "").trim(),
      category: String(body.category ?? "").trim() || "Food",
      price: toNumber(body.price),
      available: body.available !== false,
    })
    .where(eq(menuItems.id, item.id));

  if (Array.isArray(body.recipes)) {
    await db.delete(recipeItems).where(eq(recipeItems.menuItemId, item.id));
    for (const r of body.recipes) {
      const qty = toNumber(r.quantity);
      if (!r.productId || qty <= 0) continue;
      await db.insert(recipeItems).values({ menuItemId: item.id, productId: Number(r.productId), quantity: qty }).catch(() => {});
    }
  }

  const [updated] = await db.select().from(menuItems).where(eq(menuItems.id, item.id)).limit(1);
  return Response.json({ ok: true, item: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { business } = await requireBiz();
  const { id } = await ctx.params;
  const item = await find(business.id, Number(id));
  if (!item) return Response.json({ ok: false, error: "Menu item not found." }, { status: 404 });
  await db.delete(menuItems).where(eq(menuItems.id, item.id));
  return Response.json({ ok: true });
}
