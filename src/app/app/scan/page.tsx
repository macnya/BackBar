"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, cn, num } from "@/lib/api-client";
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner } from "@/components/ui";
import { Scanner } from "@/components/Scanner";
import { IconCamera, IconIn, IconOut, IconPlus, IconSearch, IconX, IconCheck } from "@/components/icons";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  costPrice: number;
  reorderLevel: number;
  supplierId: number | null;
  shelfLifeDays: number | null;
  expiryDate: string | null;
};

type Found =
  | { state: "loading" }
  | { state: "found"; product: Product }
  | { state: "unknown"; code: string };

const UNITS = ["unit", "bottle", "can", "pack", "case", "bag", "box", "carton", "piece", "bunch", "kg", "g", "l", "ml", "portion"];

export default function ScanPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [found, setFound] = useState<Found | null>(null);
  const [manual, setManual] = useState("");
  const [flash, setFlash] = useState("");
  const lastScan = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const refresh = useCallback(async () => {
    const res = await api<{ items: Product[] }>("/api/products");
    setProducts(res.items);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setFlash("Could not load products."))
      .finally(() => setReady(true));
  }, [refresh]);

  const lookup = useCallback(
    (codeRaw: string) => {
      const code = codeRaw.trim();
      if (!code) return;
      const now = Date.now();
      if (code === lastScan.current.code && now - lastScan.current.at < 2500) return;
      lastScan.current = { code, at: now };
      setCameraOn(false);
      setFound({ state: "loading" });
      const hit = products.find((p) => p.sku.toLowerCase() === code.toLowerCase());
      setTimeout(() => {
        if (hit) {
          setFound({ state: "found", product: hit });
          setFlash("");
        } else {
          setFound({ state: "unknown", code });
        }
      }, 350);
    },
    [products]
  );

  const onScan = useCallback(
    (code: string) => {
      lookup(code);
    },
    [lookup]
  );

  return (
    <>
      <PageHeader
        title="Scan & Adjust"
        desc="Point your phone camera at a product’s barcode or QR label, then stock in, out or adjust. No hardware required."
      />
      {flash && (
        <div className="mb-4">
          <Alert tone="warn">{flash}</Alert>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Camera</h2>
            <Button
              size="sm"
              variant={cameraOn ? "danger" : "primary"}
              onClick={() => setCameraOn((v) => !v)}
              disabled={!ready}
            >
              <IconCamera /> {cameraOn ? "Stop camera" : "Start camera"}
            </Button>
          </div>
          <Scanner active={cameraOn && ready} onScan={onScan} />
          <div className="mt-4">
            <Field label="Manual entry" hint="no camera? type or paste a code">
              <div className="flex gap-2">
                <Input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder="e.g. 2001000000059"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      lookup(manual);
                      setManual("");
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    lookup(manual);
                    setManual("");
                  }}
                >
                  <IconSearch /> Look up
                </Button>
              </div>
            </Field>
          </div>
        </Card>

        <div>
          {found === null && (
            <Card className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-copper-50 text-copper-600">
                <IconSearch className="h-6 w-6" />
              </span>
              <div className="font-display text-lg font-semibold text-ink-700">Waiting for a code</div>
              <p className="max-w-xs text-sm text-ink-500">
                {ready
                  ? `Scanned codes are matched against your ${products.length} products. Print labels from the Stock page to code new items.`
                  : "Loading products…"}
              </p>
            </Card>
          )}
          {found?.state === "loading" && (
            <Card className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8">
              <Spinner />
              <div className="text-sm text-ink-500">Looking up code…</div>
            </Card>
          )}
          {found?.state === "found" && (
            <QuickAdjust
              product={found.product}
              onUpdated={(p) => {
                setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
                setFlash("");
              }}
              onRescan={() => {
                setFound(null);
                setCameraOn(true);
              }}
              onDismiss={() => setFound(null)}
            />
          )}
          {found?.state === "unknown" && (
            <CreateWithCode
              code={found.code}
              onCreated={(p) => {
                refresh().catch(() => {});
                setFound({ state: "found", product: p });
              }}
              onDismiss={() => setFound(null)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function QuickAdjust({
  product,
  onUpdated,
  onRescan,
  onDismiss,
}: {
  product: Product;
  onUpdated: (p: Product) => void;
  onRescan: () => void;
  onDismiss: () => void;
}) {
  const [type, setType] = useState<"in" | "out" | "adjust">("in");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setType("in");
    setQty("");
    setNote("");
    setBusy(false);
    setError("");
    setDone(false);
  }, [product.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api<{ product: Product }>(`/api/products/${product.id}/move`, {
        body: { qty: Number(qty), type, note, method: "scan" },
      });
      setDone(true);
      setBusy(false);
      onUpdated(res.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move failed.");
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-paper-50 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-ok-800">
              <span className="inline-flex items-center gap-1"><IconCheck className="h-3.5 w-3.5" /> Matched</span>
            </div>
            <h2 className="mt-1 truncate font-display text-xl font-semibold text-ink-900">{product.name}</h2>
            <div className="mt-0.5 font-mono text-xs text-ink-500">{product.sku}</div>
          </div>
          <button onClick={onDismiss} className="rounded-md p-1 text-ink-500 hover:bg-paper-100" aria-label="Dismiss">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge>{product.category}</Badge>
          <Badge tone={product.reorderLevel > 0 && product.quantity <= product.reorderLevel ? "warn" : "ok"}>
            {num(product.quantity)} {product.unit} on hand
          </Badge>
          {product.expiryDate && <Badge tone="neutral">exp. {product.expiryDate}</Badge>}
        </div>
      </div>
      {done ? (
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ok-100 text-ok-800">
            <IconCheck className="h-6 w-6" />
          </span>
          <div>
            <div className="font-display text-lg font-semibold">Recorded</div>
            <div className="mt-1 text-sm text-ink-500">
              {product.name} is now at {num(product.quantity)} {product.unit}.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDismiss}>Done</Button>
            <Button onClick={onRescan}>
              <IconCamera /> Scan next
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-paper-100 p-1">
            {(["in", "out", "adjust"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-semibold transition-colors",
                  type === t ? "bg-cream text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
                )}
              >
                {t === "in" ? "Stock in" : t === "out" ? "Stock out" : "Set to"}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={type === "adjust" ? `Set to (${product.unit})` : `Quantity (${product.unit})`}>
              <Input type="number" step="any" min="0" required autoFocus value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Note" hint="optional">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "in" ? "Delivery" : "Service usage"} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onRescan}>
              <IconCamera /> Scan next
            </Button>
            <Button type="submit" disabled={busy || !qty || Number(qty) <= 0}>
              {type === "in" ? <IconIn className="h-4 w-4" /> : <IconOut className="h-4 w-4" />}
              {busy ? "Saving…" : "Record"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function CreateWithCode({
  code,
  onCreated,
  onDismiss,
}: {
  code: string;
  onCreated: (p: Product) => void;
  onDismiss: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("bottle");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api<{ product: Product }>("/api/products", {
        body: {
          name,
          sku: code,
          category: category.trim() || "Uncategorized",
          unit,
          quantity: quantity === "" ? 0 : Number(quantity),
          costPrice: costPrice === "" ? 0 : Number(costPrice),
        },
      });
      onCreated(res.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-paper-50 px-5 py-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-warn-800">Unknown code</div>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink-900">
          No product with code <span className="font-mono text-base">{code}</span>
        </h2>
        <p className="mt-1 text-sm text-ink-500">Create it now — the code will be printed on its label automatically.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 px-5 py-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Product name">
          <Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tonic Syrup 750ml" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Bar" />
          </Field>
          <Field label="Unit">
            <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </Field>
          <Field label="Opening qty">
            <Input type="number" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Unit cost">
          <Input type="number" step="any" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onDismiss}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            <IconPlus /> {busy ? "Creating…" : "Create product"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
