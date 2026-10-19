import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, products, recipeItems } from "@/db/schema";
import { requireBiz } from "@/lib/auth";
import { toNumber } from "@/lib/sku";

async function fetchMenu(businessId: number) {
  const items = await db.select().from(menuItems).where(eq(menuItems.businessId, businessId)).orderBy(asc(menuItems.category), asc(menuItems.name));
  const recipes = await db
    .select({
      menuItemId: recipeItems.menuItemId,
      productId: recipeItems.productId,
      quantity: recipeItems.quantity,
      name: products.name,
      unit: products.unit,
      costPrice: products.costPrice,
      quantityOnHand: products.quantity,
    })
    .from(recipeItems)
    .innerJoin(menuItems, eq(recipeItems.menuItemId, menuItems.id))
    .innerJoin(products, eq(recipeItems.productId, products.id))
    .where(eq(menuItems.businessId, businessId));

  const byItem = new Map<number, typeof recipes>();
  for (const r of recipes) {
    if (!byItem.has(r.menuItemId)) byItem.set(r.menuItemId, []);
    byItem.get(r.menuItemId)!.push(r);
  }

  return items.map((item) => {
    const rec = byItem.get(item.id) ?? [];
    const cost = rec.reduce((sum, r) => sum + r.quantity * r.costPrice, 0);
    const margin = item.price > 0 ? (item.price - cost) / item.price : 0;
    return {
      ...item,
      recipe: rec.map((r) => ({ ...r, lineCost: r.quantity * r.costPrice })),
      cost: Math.round(cost * 1000) / 1000,
      marginPct: Math.round(margin * 100),
    };
  });
}

export async function GET() {
  const { business } = await requireBiz();
  const items = await fetchMenu(business.id);
  const [productList] = [await db.select({ id: products.id, name: products.name, unit: products.unit, quantity: products.quantity }).from(products).where(eq(products.businessId, business.id))];
  return Response.json({ ok: true, items, products: productList });
}

export async function POST(req: Request) {
  const { business } = await requireBiz();
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ ok: false, error: "Menu item name is required." }, { status: 400 });

  const [item] = await db
    .insert(menuItems)
    .values({
      businessId: business.id,
      name,
      description: String(body.description ?? "").trim(),
      category: String(body.category ?? "").trim() || "Food",
      price: toNumber(body.price),
      available: body.available !== false,
    })
    .returning();

  const recipes = Array.isArray(body.recipes) ? body.recipes : [];
  for (const r of recipes) {
    const qty = toNumber(r.quantity);
    if (!r.productId || qty <= 0) continue;
    await db.insert(recipeItems).values({ menuItemId: item.id, productId: Number(r.productId), quantity: qty }).catch(() => {});
  }

  return Response.json({ ok: true, item });
}
