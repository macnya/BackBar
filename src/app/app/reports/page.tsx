"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, daysUntil, downloadCSV, fmtDate, money, num } from "@/lib/api-client";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  StatCard,
  Spinner,
  Td,
  Th,
  TableShell,
} from "@/components/ui";
import { IconDownload } from "@/components/icons";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  costPrice: number;
  reorderLevel: number;
  supplierName?: string;
  expiryDate: string | null;
};

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ items: Product[] }>("/api/products");
      setProducts(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalValue = useMemo(() => products.reduce((s, p) => s + p.quantity * p.costPrice, 0), [products]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { items: number; units: number; value: number }>();
    for (const p of products) {
      const e = map.get(p.category) ?? { items: 0, units: 0, value: 0 };
      e.items += 1;
      e.units += p.quantity;
      e.value += p.quantity * p.costPrice;
      map.set(p.category, e);
    }
    return Array.from(map.entries())
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.reorderLevel > 0 && p.quantity <= p.reorderLevel)
        .map((p) => ({ ...p, suggest: Math.max(Math.ceil(p.reorderLevel * 2 - p.quantity), 1) }))
        .sort((a, b) => a.quantity / Math.max(a.reorderLevel, 0.0001) - b.quantity / Math.max(b.reorderLevel, 0.0001)),
    [products]
  );

  const expiring = useMemo(
    () =>
      products
        .map((p) => ({ ...p, d: daysUntil(p.expiryDate) }))
        .filter((p) => p.d !== null && p.d <= 7)
        .sort((a, b) => (a.d! - b.d!)),
    [products]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-ink-500">
        <Spinner /> Building reports…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        desc="Stock valuation, reorder list and expiry risk — each exports to CSV for your accounts or suppliers."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total stock value" value={money(totalValue)} sub="at unit cost" />
        <StatCard label="Low stock lines" value={lowStock.length} sub="ready to reorder" tone={lowStock.length ? "warn" : "ok"} />
        <StatCard label="Expiry risk value" value={money(expiring.reduce((s, p) => s + p.quantity * p.costPrice, 0))} sub={`${expiring.length} lines within 7 days or expired`} tone={expiring.length ? "danger" : "ok"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Valuation by category</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCSV(
                  "stock-valuation.csv",
                  ["category", "items", "units", "value"],
                  byCategory.map((c) => [c.cat, c.items, num(c.units), num(c.value)])
                )
              }
            >
              <IconDownload /> CSV
            </Button>
          </div>
          <TableShell>
            <table className="w-full min-w-0">
              <thead className="border-b border-line bg-paper-50">
                <tr>
                  <Th>Category</Th>
                  <Th className="text-right">Items</Th>
                  <Th className="text-right">Units</Th>
                  <Th className="text-right">Value</Th>
                  <Th className="text-right">Share</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byCategory.map((c) => (
                  <tr key={c.cat}>
                    <Td className="font-semibold">{c.cat}</Td>
                    <Td className="text-right text-ink-700">{c.items}</Td>
                    <Td className="text-right text-ink-700">{num(c.units)}</Td>
                    <Td className="text-right font-semibold">{money(c.value)}</Td>
                    <Td className="text-right text-ink-500">
                      {totalValue > 0 ? Math.round((c.value / totalValue) * 100) : 0}%
                    </Td>
                  </tr>
                ))}
                {byCategory.length === 0 && (
                  <tr>
                    <Td className="text-ink-500" colSpan={5}>No stock yet.</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Reorder list</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={lowStock.length === 0}
              onClick={() =>
                downloadCSV(
                  "reorder-list.csv",
                  ["product", "code", "on_hand", "unit", "reorder_level", "suggested_order", "supplier"],
                  lowStock.map((p) => [p.name, p.sku, num(p.quantity), p.unit, num(p.reorderLevel), num(p.suggest), p.supplierName ?? ""])
                )
              }
            >
              <IconDownload /> CSV
            </Button>
          </div>
          {lowStock.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-ink-500">
              Nothing is below its reorder level. Set reorder levels on fast movers to build this list.
            </div>
          ) : (
            <TableShell>
              <table className="w-full min-w-0">
                <thead className="border-b border-line bg-paper-50">
                  <tr>
                    <Th>Product</Th>
                    <Th className="text-right">On hand</Th>
                    <Th className="text-right">Suggested</Th>
                    <Th>Supplier</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <Td className="font-semibold">{p.name}</Td>
                      <Td className="text-right">
                        <span className="font-bold text-warn-800">{num(p.quantity)}</span>{" "}
                        <span className="text-xs text-ink-500">/ {num(p.reorderLevel)} {p.unit}</span>
                      </Td>
                      <Td className="text-right font-bold text-copper-700">
                        {num(p.suggest)} {p.unit}
                      </Td>
                      <Td className="text-ink-500">{p.supplierName || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Expiring & expired</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={expiring.length === 0}
              onClick={() =>
                downloadCSV(
                  "expiry-report.csv",
                  ["product", "code", "expiry_date", "days_left", "quantity", "unit", "value_at_risk"],
                  expiring.map((p) => [p.name, p.sku, p.expiryDate ?? "", p.d ?? "", num(p.quantity), p.unit, num(p.quantity * p.costPrice)])
                )
              }
            >
              <IconDownload /> CSV
            </Button>
          </div>
          {expiring.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-ink-500">
              Nothing expires in the next 7 days.
            </div>
          ) : (
            <TableShell>
              <table className="w-full min-w-0">
                <thead className="border-b border-line bg-paper-50">
                  <tr>
                    <Th>Product</Th>
                    <Th>Expiry</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Value at risk</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {expiring.map((p) => (
                    <tr key={p.id}>
                      <Td className="font-semibold">{p.name}</Td>
                      <Td className="text-ink-700">{fmtDate(p.expiryDate)}</Td>
                      <Td>
                        {p.d! < 0 ? (
                          <Badge tone="danger">Expired {Math.abs(p.d!)}d ago</Badge>
                        ) : p.d === 0 ? (
                          <Badge tone="danger">Today</Badge>
                        ) : (
                          <Badge tone="warn">{p.d}d left</Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        {num(p.quantity)} {p.unit}
                      </Td>
                      <Td className="text-right font-semibold">{money(p.quantity * p.costPrice)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Card>
      </div>

      <div className="mt-6 flex justify-center">
        <Link href="/app/stock" className="text-sm font-semibold text-copper-600 hover:text-copper-700">
          Back to stock →
        </Link>
      </div>
    </>
  );
}
