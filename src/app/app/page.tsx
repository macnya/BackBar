import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { requireBiz } from "@/lib/auth";
import { menuItems, products, stockMovements, suppliers } from "@/db/schema";
import { Badge, Card, PageHeader, StatCard, Th, Td, TableShell } from "@/components/ui";
import { money, num } from "@/lib/api-client";
import { IconAlert, IconBox, IconCalendar, IconChart, IconIn, IconOut, IconScan, IconSheet, IconAdjust } from "./dashboard-icons";

export const dynamic = "force-dynamic";

function daysUntilStr(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr + "T00:00:00").getTime();
  if (isNaN(t)) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((t - now.getTime()) / 86400000);
}

export default async function DashboardPage() {
  const { user, business } = await requireBiz();

  const [all, movements, menuCountRow] = await Promise.all([
    db
      .select({ product: products, supplierName: suppliers.name })
      .from(products)
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .where(eq(products.businessId, business.id))
      .orderBy(desc(products.id)),
    db
      .select({ m: stockMovements, productName: products.name })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .where(eq(stockMovements.businessId, business.id))
      .orderBy(desc(stockMovements.id))
      .limit(8),
    db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.businessId, business.id)),
  ]);

  const rows = all.map((r) => ({ ...r.product, supplierName: r.supplierName }));
  const totalValue = rows.reduce((s, p) => s + p.quantity * p.costPrice, 0);
  const lowStock = rows.filter((p) => p.reorderLevel > 0 && p.quantity <= p.reorderLevel);
  const expiring = rows
    .map((p) => ({ p, d: daysUntilStr(p.expiryDate) }))
    .filter((x) => x.d !== null && x.d >= 0 && x.d <= 7)
    .sort((a, b) => (a.d! - b.d!));
  const expired = rows
    .map((p) => ({ p, d: daysUntilStr(p.expiryDate) }))
    .filter((x) => x.d !== null && x.d < 0);
  const attention = lowStock.length + expiring.length + expired.length;

  return (
    <>
      <PageHeader
        title={`Service ready, ${user.name.split(" ")[0]}`}
        desc={`${business.name} — ${rows.length} stock lines, ${menuCountRow.length} menu items`}
        actions={
          <>
            <Link href="/app/scan">
              <button className="inline-flex items-center gap-2 rounded-lg bg-copper-600 px-4 py-2 text-sm font-semibold text-cream shadow-sm hover:bg-copper-700">
                <IconScan /> Scan stock
              </button>
            </Link>
            <Link href="/app/import">
              <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-cream px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-paper-100">
                <IconSheet /> Import Excel
              </button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Stock lines" value={rows.length} sub={`${rows.reduce((s, p) => s + p.quantity, 0) | 0} total units`} icon={<IconBox />} tone="neutral" />
        <StatCard label="Stock value" value={money(totalValue, business.currency)} sub="at unit cost" icon={<IconChart />} tone="copper" />
        <StatCard label="Low stock" value={lowStock.length} sub="at or below reorder level" icon={<IconAlert />} tone={lowStock.length ? "warn" : "ok"} />
        <StatCard
          label="Expiry alerts"
          value={expiring.length + expired.length}
          sub={`${expired.length} expired · ${expiring.length} within 7 days`}
          icon={<IconCalendar />}
          tone={expired.length || expiring.length ? "danger" : "ok"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Needs attention</h2>
            <Link href="/app/reports" className="text-sm font-semibold text-copper-600 hover:text-copper-700">
              Full report →
            </Link>
          </div>
          {attention === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="text-sm font-semibold text-ok-800">All clear — nothing is low, expiring or expired.</div>
              <div className="mt-1 text-xs text-ink-500">Set reorder levels on your fast movers to keep it that way.</div>
            </div>
          ) : (
            <TableShell>
              <table className="w-full">
                <thead className="border-b border-line bg-paper-50">
                  <tr>
                    <Th>Product</Th>
                    <Th>On hand</Th>
                    <Th>Issue</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {expired.map(({ p, d }) => (
                    <tr key={`e${p.id}`}>
                      <Td className="font-semibold">{p.name}</Td>
                      <Td>
                        {num(p.quantity)} {p.unit}
                      </Td>
                      <Td>
                        <Badge tone="danger">Expired {Math.abs(d!)}d ago</Badge>
                      </Td>
                    </tr>
                  ))}
                  {expiring.map(({ p, d }) => (
                    <tr key={`x${p.id}`}>
                      <Td className="font-semibold">{p.name}</Td>
                      <Td>
                        {num(p.quantity)} {p.unit}
                      </Td>
                      <Td>
                        <Badge tone="warn">{d === 0 ? "Expires today" : `Expires in ${d}d`}</Badge>
                      </Td>
                    </tr>
                  ))}
                  {lowStock.slice(0, 10).map((p) => (
                    <tr key={`l${p.id}`}>
                      <Td className="font-semibold">{p.name}</Td>
                      <Td>
                        {num(p.quantity)} / {num(p.reorderLevel)} {p.unit}
                      </Td>
                      <Td>
                        <Badge tone="copper">
                          Low · reorder {num(Math.max(p.reorderLevel * 2 - p.quantity, 1))}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Recent movements</h2>
            <Link href="/app/movements" className="text-sm font-semibold text-copper-600 hover:text-copper-700">
              View all →
            </Link>
          </div>
          {movements.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-500">
              No stock movements yet. Scan in your first delivery to get started.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {movements.map(({ m, productName }) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={
                      m.change > 0
                        ? "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ok-100 text-ok-800"
                        : "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper-100 text-ink-700"
                    }
                  >
                    {m.change > 0 ? <IconIn /> : m.type === "adjust" ? <IconAdjust /> : <IconOut />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{productName}</div>
                    <div className="truncate text-xs text-ink-500">{m.note || m.method}</div>
                  </div>
                  <span className={`text-sm font-bold ${m.change > 0 ? "text-ok-800" : "text-danger-700"}`}>
                    {m.change > 0 ? "+" : ""}
                    {num(m.change)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
