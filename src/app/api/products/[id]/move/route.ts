import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { requireBiz } from "@/lib/auth";
import { toNumber } from "@/lib/sku";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { business } = await requireBiz();
  const { id } = await ctx.params;
  const pid = Number(id);

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, pid), eq(products.businessId, business.id)))
    .limit(1);
  if (!product) return Response.json({ ok: false, error: "Product not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const qty = toNumber(body.qty);
  if (qty <= 0) return Response.json({ ok: false, error: "Enter a quantity greater than zero." }, { status: 400 });

  const type = body.type === "out" ? "out" : body.type === "adjust" ? "adjust" : "in";
  const method = body.method === "scan" ? "scan" : body.method === "excel" ? "excel" : "manual";
  const note = String(body.note ?? "").trim().slice(0, 300);

  let newQty: number;
  let change: number;
  if (type === "in") {
    newQty = product.quantity + qty;
    change = qty;
  } else if (type === "out") {
    if (qty > product.quantity + 0.0001) {
      return Response.json(
        { ok: false, error: `Not enough stock — ${product.quantity} ${product.unit} on hand.` },
        { status: 400 }
      );
    }
    newQty = product.quantity - qty;
    change = -qty;
  } else {
    newQty = qty;
    change = qty - product.quantity;
  }

  const [updated] = await db
    .update(products)
    .set({ quantity: Math.round(newQty * 100) / 100, updatedAt: new Date() })
    .where(eq(products.id, pid))
    .returning();

  await db.insert(stockMovements).values({
    businessId: business.id,
    productId: pid,
    change,
    type,
    method,
    note: note || (type === "in" ? "Stock in" : type === "out" ? "Stock out" : "Adjustment"),
  });

  return Response.json({ ok: true, product: updated, change });
}
