"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { api, cn, downloadFile, num } from "@/lib/api-client";
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, Td, Th, TableShell } from "@/components/ui";
import { IconDownload, IconSheet, IconUpload, IconCheck, IconAlert } from "@/components/icons";

type ImportRow = {
  row: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number | null;
  cost: number | null;
  reorder: number | null;
  supplier: string;
  shelf: number | null;
  expiry: string | null;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
};

type ImportResult = {
  committed: boolean;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  newSuppliers: string[];
  rows: ImportRow[];
};

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<"idle" | "previewing" | "preview" | "committing" | "done">("idle");
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const runImport = useCallback(async (f: File, commit: boolean) => {
    setError("");
    const form = new FormData();
    form.append("file", f);
    form.append("commit", commit ? "1" : "0");
    try {
      const res = await api<ImportResult>("/api/products/import", { body: form, method: "POST" });
      if (commit) {
        setResult(res);
        setPhase("done");
      } else {
        setPreview(res);
        setPhase("preview");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setPhase(file ? "idle" : "idle");
      if (file) setPhase("idle");
    }
  }, [file]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      setError("Use an .xlsx, .xls or .csv file.");
      return;
    }
    setFile(f);
    setResult(null);
    setPreview(null);
    setPhase("previewing");
    void runImport(f, false);
  };

  const commit = () => {
    if (!file) return;
    setPhase("committing");
    void runImport(file, true);
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch("/api/products/template", { credentials: "same-origin" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      downloadFile("backbar-stock-template.xlsx", blob);
    } catch {
      setError("Could not download the template.");
    }
  };

  return (
    <>
      <PageHeader
        title="Excel Import"
        desc="Bring in products from a spreadsheet — new rows are created, matching rows (by code or name) are updated, and every change is logged."
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <IconDownload /> Download template
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">1 · Get a template or use your own sheet</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
              The template matches what BackBar expects, but your own sheet works too — column
              names like <span className="font-mono text-xs">name</span>,{" "}
              <span className="font-mono text-xs">sku</span>, <span className="font-mono text-xs">quantity</span>,{" "}
              <span className="font-mono text-xs">cost</span> are all recognised.
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">2 · Upload</h2>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "mt-3 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
                dragOver ? "border-copper-500 bg-copper-50" : "border-paper-200 bg-paper-50/60"
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-copper-50 text-copper-600">
                <IconUpload className="h-6 w-6" />
              </span>
              <div className="text-sm font-semibold text-ink-700">
                {file ? file.name : "Drag a file here, or browse"}
              </div>
              <div className="text-xs text-ink-500">.xlsx · .xls · .csv — up to 2,000 rows</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  Choose file
                </Button>
                {file && phase !== "previewing" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setResult(null);
                      setPhase("idle");
                      setError("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {error && (
              <div className="mt-3">
                <Alert tone="danger">{error}</Alert>
              </div>
            )}
            {(phase === "previewing" || phase === "committing") && (
              <div className="mt-3 flex items-center gap-2 text-sm text-ink-500">
                <Spinner /> {phase === "previewing" ? "Reading your sheet…" : "Committing import…"}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">Recognised columns</h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-500">
              {["name (required)", "sku / code / barcode", "category", "unit", "quantity / qty", "cost_price / cost", "reorder_level", "supplier", "shelf_life_days", "expiry_date"].map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <IconCheck className="h-3 w-3 text-ok-700" /> <span className="font-mono">{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Rows are matched to existing products by <strong>code</strong>, then by exact{" "}
              <strong>name</strong>. New supplier names in the sheet are created automatically.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-display text-lg font-semibold">
                {phase === "done" ? "Import complete" : phase === "preview" ? "Preview — nothing written yet" : "Preview"}
              </h2>
              {preview && phase === "preview" && (
                <Badge tone="copper">{preview.total} rows</Badge>
              )}
            </div>

            {(phase === "idle" || phase === "previewing") && !preview && (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-paper-100 text-ink-300">
                  <IconSheet className="h-7 w-7" />
                </span>
                <div className="font-display text-lg font-semibold text-ink-700">
                  {phase === "previewing" ? "Reading your sheet…" : "Your preview appears here"}
                </div>
                <p className="max-w-sm text-sm text-ink-500">
                  Upload a file to see exactly what will be created and updated before anything is written to your stock.
                </p>
              </div>
            )}

            {preview && phase === "preview" && (
              <div>
                <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper-50 px-5 py-3">
                  <Badge tone="copper">{preview.created} to create</Badge>
                  <Badge tone="ok">{preview.updated} to update</Badge>
                  {preview.skipped > 0 && <Badge tone="danger">{preview.skipped} skipped</Badge>}
                  {preview.newSuppliers.length > 0 && (
                    <Badge tone="neutral">+ {preview.newSuppliers.length} new supplier{preview.newSuppliers.length > 1 ? "s" : ""}</Badge>
                  )}
                  <div className="ml-auto">
                    <Button onClick={commit} disabled={preview.created + preview.updated === 0}>
                      <IconCheck /> Commit import
                    </Button>
                  </div>
                </div>
                <ImportTable rows={preview.rows} />
              </div>
            )}

            {phase === "committing" && preview && (
              <div>
                <div className="flex items-center gap-2 border-b border-line bg-paper-50 px-5 py-4 text-sm text-ink-500">
                  <Spinner /> Writing {preview.created + preview.updated} changes to stock…
                </div>
                <ImportTable rows={preview.rows} />
              </div>
            )}

            {phase === "done" && result && (
              <div>
                <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper-50 px-5 py-3">
                  <Alert tone="ok">
                    Committed {result.created} new product{result.created === 1 ? "" : "s"} and updated{" "}
                    {result.updated} existing. {result.newSuppliers.length > 0 && `Created: ${result.newSuppliers.join(", ")}.`}
                  </Alert>
                  <Link href="/app/stock" className="ml-auto">
                    <Button variant="outline" size="sm">View stock →</Button>
                  </Link>
                </div>
                <ImportTable rows={result.rows} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function ImportTable({ rows }: { rows: ImportRow[] }) {
  const shown = rows.slice(0, 100);
  return (
    <div>
      <TableShell>
        <table className="w-full">
          <thead className="border-b border-line bg-cream">
            <tr>
              <Th>#</Th>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Cost</Th>
              <Th>Supplier</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((r) => (
              <tr key={r.row} className={r.status === "skipped" ? "opacity-50" : ""}>
                <Td className="text-xs text-ink-300">{r.row}</Td>
                <Td>
                  <div className="font-semibold">{r.name || "—"}</div>
                  {r.message && r.status === "skipped" && <div className="text-xs text-ink-500">{r.message}</div>}
                </Td>
                <Td className="text-ink-700">{r.category || "—"}</Td>
                <Td className="text-right">{r.quantity !== null ? num(r.quantity) : "—"}</Td>
                <Td className="text-right">{r.cost !== null ? num(r.cost) : "—"}</Td>
                <Td className="text-ink-700">{r.supplier || "—"}</Td>
                <Td>
                  {r.status === "created" && <Badge tone="copper">Create</Badge>}
                  {r.status === "updated" && <Badge tone="ok">Update</Badge>}
                  {r.status === "skipped" && (
                    <Badge tone="danger">
                      <IconAlert className="h-3 w-3" /> Skipped
                    </Badge>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
      {rows.length > 100 && (
        <div className="px-5 py-3 text-xs text-ink-500">Showing first 100 of {rows.length} rows.</div>
      )}
    </div>
  );
}
