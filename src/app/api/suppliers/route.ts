import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, suppliers } from "@/db/schema";
import { requireBiz } from "@/lib/auth";

export async function GET() {
  const { business } = await requireBiz();
  const rows = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.businessId, business.id))
    .orderBy(asc(suppliers.name));
  const counts = await db
    .select({ supplierId: products.supplierId, n: products.id })
    .from(products)
    .where(eq(products.businessId, business.id));
  const countMap = new Map<number, number>();
  for (const c of counts) if (c.supplierId) countMap.set(c.supplierId, (countMap.get(c.supplierId) ?? 0) + 1);
  return Response.json({ ok: true, items: rows.map((r) => ({ ...r, productCount: countMap.get(r.id) ?? 0 })) });
}

export async function POST(req: Request) {
  const { business } = await requireBiz();
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ ok: false, error: "Supplier name is required." }, { status: 400 });
  const [sup] = await db
    .insert(suppliers)
    .values({
      businessId: business.id,
      name,
      contactPerson: String(body.contactPerson ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      email: String(body.email ?? "").trim(),
      address: String(body.address ?? "").trim(),
    })
    .returning();
  return Response.json({ ok: true, supplier: sup });
}
