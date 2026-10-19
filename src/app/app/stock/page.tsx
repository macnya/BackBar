"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, cn, daysUntil, fmtDate, money, num } from "@/lib/api-client";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Spinner,
  Td,
  Th,
  TableShell,
} from "@/components/ui";
import {
  IconBox,
  IconPencil,
  IconPlus,
  IconPrinter,
  IconQr,
  IconTrash,
  IconIn,
  IconOut,
} from "@/components/icons";
import { LabelCard } from "@/components/Barcode";

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
  supplierName?: string;
  shelfLifeDays: number | null;
  expiryDate: string | null;
};

type Supplier = { id: number; name: string };

const UNITS = ["unit", "bottle", "can", "pack", "case", "bag", "box", "carton", "piece", "bunch", "kg", "g", "l", "ml", "portion", "tray"];

function randomSku() {
  return String(Math.floor(2e12 + Math.random() * 7.9e12));
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [flash, setFlash] = useState<{ tone: "ok" | "danger"; msg: string } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [moveTarget, setMoveTarget] = useState<Product | null>(null);
  const [moveType, setMoveType] = useState<"in" | "out" | "adjust">("in");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [labelsFor, setLabelsFor] = useState<Product[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ok = useCallback((msg: string) => setFlash({ tone: "ok", msg }), []);
  const fail = useCallback((msg: string) => setFlash({ tone: "danger", msg }), []);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4500);
    return () => clearTimeout(t);
  }, [flash]);

  const refresh = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        api<{ items: Product[] }>("/api/products"),
        api<{ items: Supplier[] }>("/api/suppliers"),
      ]);
      setProducts(p.items);
      setSuppliers(s.items);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load stock.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (lowOnly && !(p.reorderLevel > 0 && p.quantity <= p.reorderLevel)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, cat, lowOnly]);

  const openNew = () => {
    setEditTarget(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditTarget(p);
    setFormOpen(true);
  };
  const openMove = (p: Product, type: "in" | "out" | "adjust" = "in") => {
    setMoveTarget(p);
    setMoveType(type);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      ok(`Deleted “${deleteTarget.name}”.`);
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-ink-500">
        <Spinner /> Loading stock…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Stock"
        desc={`${products.length} products · ${money(
          products.reduce((s, p) => s + p.quantity * p.costPrice, 0)
        )} on hand at cost`}
        actions={
          <>
            <Button variant="outline" onClick={() => setLabelsFor(filtered.slice(0, 24))} disabled={filtered.length === 0}>
              <IconPrinter /> Print labels
            </Button>
            <Button onClick={openNew}>
              <IconPlus /> New product
            </Button>
          </>
        }
      />

      {flash && (
        <div className="mb-4">
          <Alert tone={flash.tone === "ok" ? "ok" : "danger"}>{flash.msg}</Alert>
        </div>
      )}
      {loadError && (
        <div className="mb-4">
          <Alert tone="danger">{loadError}</Alert>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or code…" className="w-full sm:w-72" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-auto min-w-40">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Button variant={lowOnly ? "soft" : "outline"} size="md" onClick={() => setLowOnly((v) => !v)}>
          Low stock only
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconBox className="h-10 w-10" />}
          title={products.length === 0 ? "No stock yet" : "Nothing matches your filters"}
          desc={
            products.length === 0
              ? "Add your first product, scan a code, or import your Excel sheet to get going."
              : "Try a different search term or clear the filters."
          }
          action={
            products.length === 0 ? (
              <Button onClick={openNew}>
                <IconPlus /> Add a product
              </Button>
            ) : undefined
          }
        />
      ) : (
        <TableShell>
          <table className="w-full">
            <thead className="border-b border-line bg-paper-50">
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">On hand</Th>
                <Th>Status</Th>
                <Th className="text-right">Unit cost</Th>
                <Th className="text-right">Value</Th>
                <Th>Expiry</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const low = p.reorderLevel > 0 && p.quantity <= p.reorderLevel;
                const d = daysUntil(p.expiryDate);
                return (
                  <tr key={p.id} className="hover:bg-paper-50/70">
                    <Td>
                      <div className="font-semibold text-ink-900">{p.name}</div>
                      <div className="font-mono text-xs text-ink-500">{p.sku}</div>
                    </Td>
                    <Td>
                      <Badge>{p.category}</Badge>
                    </Td>
                    <Td className="text-right">
                      <span className={cn("font-bold", low && "text-warn-800")}>{num(p.quantity)}</span>{" "}
                      <span className="text-xs text-ink-500">{p.unit}</span>
                    </Td>
                    <Td>
                      {p.quantity === 0 ? (
                        <Badge tone="danger">Out</Badge>
                      ) : low ? (
                        <Badge tone="warn">Low</Badge>
                      ) : (
                        <Badge tone="ok">In stock</Badge>
                      )}
                    </Td>
                    <Td className="text-right text-ink-700">{money(p.costPrice)}</Td>
                    <Td className="text-right font-semibold">{money(p.quantity * p.costPrice)}</Td>
                    <Td>
                      {p.expiryDate === null ? (
                        <span className="text-xs text-ink-300">—</span>
                      ) : d === null ? (
                        fmtDate(p.expiryDate)
                      ) : d < 0 ? (
                        <Badge tone="danger">Expired {fmtDate(p.expiryDate)}</Badge>
                      ) : d <= 7 ? (
                        <Badge tone="warn">{d}d left</Badge>
                      ) : (
                        <span className="text-xs text-ink-500">{fmtDate(p.expiryDate)}</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="outline" title="Stock in" onClick={() => openMove(p, "in")}>
                          <IconIn className="h-3.5 w-3.5" /> In
                        </Button>
                        <Button size="sm" variant="outline" title="Stock out" onClick={() => openMove(p, "out")}>
                          <IconOut className="h-3.5 w-3.5" /> Out
                        </Button>
                        <Button size="sm" variant="ghost" title="Label" onClick={() => setLabelsFor([p])}>
                          <IconQr className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(p)}>
                          <IconPencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete"
                          className="hover:bg-danger-100 hover:text-danger-700"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}

      <ProductForm
        open={formOpen}
        initial={editTarget}
        suppliers={suppliers}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={(p, isNew) => {
          ok(isNew ? `Added “${p.name}” with code ${p.sku}.` : `Updated “${p.name}”.`);
          setFormOpen(false);
          void refresh();
        }}
        onError={fail}
      />

      <MoveForm
        product={moveTarget}
        initialType={moveType}
        onClose={() => setMoveTarget(null)}
        onDone={(newQty, p) => {
          setMoveTarget(null);
          ok(`“${p.name}” is now at ${num(newQty)} ${p.unit}.`);
          void refresh();
        }}
        onError={fail}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product">
        {deleteTarget && (
          <div>
            <p className="text-sm text-ink-700">
              Delete <strong>{deleteTarget.name}</strong> ({num(deleteTarget.quantity)} {deleteTarget.unit} on hand)?
              Its movement history will be removed too. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete product"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!labelsFor} onClose={() => setLabelsFor(null)} title="Barcode labels" wide>
        {labelsFor && labelsFor.length > 0 && (
          <div>
            <p className="mb-4 text-sm text-ink-500">
              Print these and stick them on bottles, bags and bins. Scan them with any phone camera to adjust stock.
            </p>
            <div className="print-area flex flex-wrap gap-3">
              {labelsFor.map((p) => (
                <LabelCard key={p.id} name={p.name} sku={p.sku} unit={p.unit} quantity={p.quantity} />
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLabelsFor(null)}>Close</Button>
              <Button onClick={() => window.print()}>
                <IconPrinter /> Print {labelsFor.length} label{labelsFor.length > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ---------------- Product form ---------------- */

function ProductForm({
  open,
  initial,
  suppliers,
  categories,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  initial: Product | null;
  suppliers: Supplier[];
  categories: string[];
  onClose: () => void;
  onSaved: (p: Product, isNew: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("unit");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [shelfLifeDays, setShelfLifeDays] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setBusy(false);
    if (initial) {
      setName(initial.name);
      setSku(initial.sku);
      setCategory(initial.category);
      setUnit(initial.unit);
      setQuantity(String(initial.quantity));
      setCostPrice(String(initial.costPrice));
      setReorderLevel(String(initial.reorderLevel));
      setSupplierId(initial.supplierId ? String(initial.supplierId) : "");
      setShelfLifeDays(initial.shelfLifeDays ? String(initial.shelfLifeDays) : "");
      setExpiryDate(initial.expiryDate ?? "");
      setSeeded(true);
    } else if (!seeded) {
      setName("");
      setSku(randomSku());
      setCategory("");
      setUnit("bottle");
      setQuantity("");
      setCostPrice("");
      setReorderLevel("");
      setSupplierId("");
      setShelfLifeDays("");
      setExpiryDate("");
      setSeeded(true);
    }
  }, [open, initial, seeded]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = {
        name,
        sku,
        category: category.trim() || "Uncategorized",
        unit,
        quantity: quantity === "" ? 0 : Number(quantity),
        costPrice: costPrice === "" ? 0 : Number(costPrice),
        reorderLevel: reorderLevel === "" ? 0 : Number(reorderLevel),
        supplierId: supplierId || null,
        shelfLifeDays: shelfLifeDays === "" ? null : Number(shelfLifeDays),
        expiryDate: expiryDate || null,
      };
      const res = initial
        ? await api<{ product: Product }>(`/api/products/${initial.id}`, { method: "PUT", body })
        : await api<{ product: Product }>("/api/products", { body });
      onSaved(res.product, !initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit product" : "New product"} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Merlot 750ml" />
          </Field>
          <Field label="Code" hint="printed on the label">
            <div className="flex gap-2">
              <Input value={sku} onChange={(e) => setSku(e.target.value)} className="font-mono" />
              <Button type="button" variant="outline" onClick={() => setSku(randomSku())} title="Regenerate code">
                <IconQr className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          <Field label="Category">
            <Input list="stock-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Wine, Beer, Produce…" />
            <datalist id="stock-cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Unit">
            <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </Field>
          <Field label={initial ? "Quantity on hand" : "Opening quantity"}>
            <Input type="number" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Unit cost">
            <Input type="number" step="any" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Reorder level" hint="alert at/below this">
            <Input type="number" step="any" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Supplier">
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">— none —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Shelf life (days)">
            <Input type="number" min="0" value={shelfLifeDays} onChange={(e) => setShelfLifeDays(e.target.value)} placeholder="e.g. 30" />
          </Field>
          <Field label="Expiry date">
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Move (in / out / adjust) form ---------------- */

function MoveForm({
  product,
  initialType,
  onClose,
  onDone,
  onError,
}: {
  product: Product | null;
  initialType: "in" | "out" | "adjust";
  onClose: () => void;
  onDone: (newQty: number, p: Product) => void;
  onError: (msg: string) => void;
}) {
  const [type, setType] = useState<"in" | "out" | "adjust">(initialType);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setType(initialType);
    setQty("");
    setNote("");
    setError("");
    setBusy(false);
  }, [product, initialType]);

  if (!product) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api<{ product: Product }>(`/api/products/${product.id}/move`, {
        body: { qty: Number(qty), type, note, method: "manual" },
      });
      onDone(res.product.quantity, product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move failed.");
      setBusy(false);
    }
  };

  return (
    <Modal open={!!product} onClose={onClose} title={`${type === "in" ? "Stock in" : type === "out" ? "Stock out" : "Adjust"} — ${product.name}`}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="rounded-lg bg-paper-50 px-3 py-2 text-sm text-ink-700">
          Currently on hand: <strong>{num(product.quantity)} {product.unit}</strong>
          {product.reorderLevel > 0 && <span className="text-ink-500"> · reorder at {num(product.reorderLevel)}</span>}
        </div>
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
        <Field label={type === "adjust" ? "Set quantity to" : `Quantity (${product.unit})`}>
          <Input
            type="number"
            step="any"
            min="0"
            autoFocus
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder={type === "in" ? "e.g. 12" : type === "out" ? "e.g. 2" : "e.g. 8"}
          />
        </Field>
        <Field label="Note" hint="optional">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "in" ? "e.g. Delivery #142" : type === "out" ? "e.g. Kitchen service" : "e.g. Stocktake"} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !qty || Number(qty) <= 0}>
            {busy ? "Saving…" : type === "in" ? "Add to stock" : type === "out" ? "Remove from stock" : "Set quantity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
