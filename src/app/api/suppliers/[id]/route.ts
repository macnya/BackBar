import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { requireBiz } from "@/lib/auth";

async function find(businessId: number, id: number) {
  const [s] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.businessId, businessId)))
    .limit(1);
  return s ?? null;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { business } = await requireBiz();
  const { id } = await ctx.params;
  const sup = await find(business.id, Number(id));
  if (!sup) return Response.json({ ok: false, error: "Supplier not found." }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ ok: false, error: "Supplier name is required." }, { status: 400 });
  const [updated] = await db
    .update(suppliers)
    .set({
      name,
      contactPerson: String(body.contactPerson ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      email: String(body.email ?? "").trim(),
      address: String(body.address ?? "").trim(),
    })
    .where(eq(suppliers.id, sup.id))
    .returning();
  return Response.json({ ok: true, supplier: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { business } = await requireBiz();
  const { id } = await ctx.params;
  const sup = await find(business.id, Number(id));
  if (!sup) return Response.json({ ok: false, error: "Supplier not found." }, { status: 404 });
  await db.delete(suppliers).where(eq(suppliers.id, sup.id));
  return Response.json({ ok: true });
}
