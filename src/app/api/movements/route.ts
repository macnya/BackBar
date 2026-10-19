import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { requireBiz } from "@/lib/auth";

export async function GET(req: Request) {
  const { business } = await requireBiz();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 120) || 120, 500);

  const conditions = [eq(stockMovements.businessId, business.id)];
  if (type === "in" || type === "out" || type === "adjust") conditions.push(eq(stockMovements.type, type));

  const rows = await db
    .select({
      m: stockMovements,
      productName: products.name,
      productSku: products.sku,
      productUnit: products.unit,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(stockMovements.id))
    .limit(limit);

  return Response.json({
    ok: true,
    items: rows.map((r) => ({
      id: r.m.id,
      change: r.m.change,
      type: r.m.type,
      method: r.m.method,
      note: r.m.note,
      createdAt: r.m.createdAt,
      productName: r.productName,
      productSku: r.productSku,
      productUnit: r.productUnit,
    })),
  });
}
