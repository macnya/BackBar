"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, downloadCSV, fmtDateTime, num } from "@/lib/api-client";
import { Badge, Button, EmptyState, PageHeader, Select, Spinner, Td, Th, TableShell } from "@/components/ui";
import { IconClock, IconDownload } from "@/components/icons";
import { IconIn, IconOut, IconAdjust } from "@/app/app/dashboard-icons";

type Move = {
  id: number;
  change: number;
  type: "in" | "out" | "adjust";
  method: string;
  note: string;
  createdAt: string;
  productName: string;
  productSku: string;
  productUnit: string;
};

export default function MovementsPage() {
  const [items, setItems] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ items: Move[] }>(`/api/movements?limit=300&type=${type === "all" ? "" : type}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const exportCsv = () => {
    downloadCSV(
      "stock-movements.csv",
      ["date", "product", "type", "change", "unit", "method", "note"],
      items.map((m) => [
        new Date(m.createdAt).toISOString(),
        m.productName,
        m.type,
        m.change,
        m.productUnit,
        m.method,
        m.note,
      ])
    );
  };

  const totals = useMemo(() => {
    const inQty = items.filter((m) => m.change > 0).reduce((s, m) => s + m.change, 0);
    const outQty = items.filter((m) => m.change < 0).reduce((s, m) => s + m.change, 0);
    return { inQty, outQty };
  }, [items]);

  return (
    <>
      <PageHeader
        title="Movements"
        desc={`${items.length} recorded changes · ${num(totals.inQty)} in · ${num(Math.abs(totals.outQty))} out`}
        actions={
          <>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-40">
              <option value="all">All types</option>
              <option value="in">Stock in</option>
              <option value="out">Stock out</option>
              <option value="adjust">Adjustments</option>
            </Select>
            <Button variant="outline" onClick={exportCsv} disabled={items.length === 0}>
              <IconDownload /> Export CSV
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-ink-500">
          <Spinner /> Loading movements…
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconClock className="h-10 w-10" />}
          title="No movements yet"
          desc="Every scan, import and manual change shows up here with the who and when."
        />
      ) : (
        <TableShell>
          <table className="w-full">
            <thead className="border-b border-line bg-paper-50">
              <tr>
                <Th>When</Th>
                <Th>Product</Th>
                <Th>Change</Th>
                <Th>Type</Th>
                <Th>Method</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-paper-50/70">
                  <Td className="whitespace-nowrap text-ink-500">{fmtDateTime(m.createdAt)}</Td>
                  <Td>
                    <div className="font-semibold">{m.productName}</div>
                    <div className="font-mono text-xs text-ink-300">{m.productSku}</div>
                  </Td>
                  <Td>
                    <span
                      className={
                        m.change > 0
                          ? "inline-flex items-center gap-1.5 font-bold text-ok-800"
                          : "inline-flex items-center gap-1.5 font-bold text-danger-700"
                      }
                    >
                      {m.change > 0 ? <IconIn className="h-3.5 w-3.5" /> : m.type === "adjust" ? <IconAdjust className="h-3.5 w-3.5" /> : <IconOut className="h-3.5 w-3.5" />}
                      {m.change > 0 ? "+" : ""}
                      {num(m.change)} <span className="text-xs font-normal text-ink-500">{m.productUnit}</span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={m.type === "in" ? "ok" : m.type === "out" ? "neutral" : "copper"}>
                      {m.type === "in" ? "In" : m.type === "out" ? "Out" : "Adjust"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={m.method === "scan" ? "copper" : m.method === "excel" ? "neutral" : "neutral"}>{m.method}</Badge>
                  </Td>
                  <Td className="max-w-56 truncate text-ink-500">{m.note || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </>
  );
}
