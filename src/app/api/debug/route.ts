import { db, pool } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const info: any = { ok: false, checks: [] };
  try {
    const r = await pool.query("select version() as v");
    info.checks.push({ name: "connect", ok: true, version: r.rows[0].v });
  } catch (err: any) {
    info.checks.push({ name: "connect", ok: false, error: err?.message, code: err?.code, stack: err?.stack });
  }
  try {
    const r = await pool.query(
      "select table_name from information_schema.tables where table_schema='public' order by table_name"
    );
    info.checks.push({ name: "list tables", ok: true, tables: r.rows.map((x: any) => x.table_name) });
  } catch (err: any) {
    info.checks.push({ name: "list tables", ok: false, error: err?.message, code: err?.code });
  }
  try {
    await db.execute(sql`select 1`);
    info.checks.push({ name: "drizzle select 1", ok: true });
  } catch (err: any) {
    info.checks.push({ name: "drizzle select 1", ok: false, error: err?.message, code: err?.code });
  }
  try {
    const r = await pool.query("select count(*)::int as n from users");
    info.checks.push({ name: "count users", ok: true, count: r.rows[0].n });
  } catch (err: any) {
    info.checks.push({ name: "count users", ok: false, error: err?.message, code: err?.code });
  }
  info.ok = info.checks.every((c: any) => c.ok);
  return Response.json(info, { status: info.ok ? 200 : 500 });
}