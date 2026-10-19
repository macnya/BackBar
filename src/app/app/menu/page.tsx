"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, cn, money, num } from "@/lib/api-client";
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
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { IconCup, IconPencil, IconPlus, IconTrash, IconX } from "@/components/icons";

type MenuProduct = { id: number; name: string; unit: string; quantity: number };
type RecipeRow = {
  productId: number;
  name: string;
  unit: string;
  quantity: number;
  costPrice: number;
  lineCost: number;
};
type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  recipe: RecipeRow[];
  cost: number;
  marginPct: number;
};

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MenuItem | null>(null);
  const [flash, setFlash] = useState<{ tone: "ok" | "danger"; msg: string } | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ items: MenuItem[]; products: MenuProduct[] }>("/api/menu");
      setItems(res.items);
      setProducts(res.products);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of items) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const toggleAvailable = async (item: MenuItem) => {
    try {
      await api(`/api/menu/${item.id}`, {
        method: "PUT",
        body: { name: item.name, description: item.description, category: item.category, price: item.price, available: !item.available, recipes: item.recipe.map((r) => ({ productId: r.productId, quantity: r.quantity })) },
      });
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, available: !x.available } : x)));
      setFlash({ tone: "ok", msg: `${item.name} is now ${item.available ? "86'd (unavailable)" : "available"}.` });
    } catch (e) {
      setFlash({ tone: "danger", msg: e instanceof Error ? e.message : "Update failed." });
    }
  };

  const remove = async (item: MenuItem) => {
    try {
      await api(`/api/menu/${item.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setFlash({ tone: "ok", msg: `Removed “${item.name}”.` });
    } catch (e) {
      setFlash({ tone: "danger", msg: e instanceof Error ? e.message : "Delete failed." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-ink-500">
        <Spinner /> Loading menu…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Menu & Costing"
        desc="Attach recipes to menu items — cost and margin update from live stock prices."
        actions={
          <Button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <IconPlus /> New menu item
          </Button>
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

      {items.length === 0 ? (
        <EmptyState
          icon={<IconCup className="h-10 w-10" />}
          title="No menu items yet"
          desc="Add your dishes and drinks, then link the stock they use so you always know what each one really costs."
          action={
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <IconPlus /> Add your first item
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, list]) => (
            <div key={cat}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-500">
                {cat} · {list.length}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map((item) => {
                  const thin = item.marginPct < 50;
                  const outOfIngredients = item.recipe.some(
                    (r) => products.find((p) => p.id === r.productId)?.quantity === 0
                  );
                  return (
                    <Card key={item.id} className={cn("flex flex-col p-4", !item.available && "opacity-60")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-display text-lg font-semibold text-ink-900">{item.name}</div>
                          {item.description && (
                            <div className="mt-0.5 line-clamp-2 text-xs text-ink-500">{item.description}</div>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button size="sm" variant="ghost" title="Edit" onClick={() => { setEditTarget(item); setFormOpen(true); }}>
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete"
                            className="hover:bg-danger-100 hover:text-danger-700"
                            onClick={() => remove(item)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="font-display text-xl font-semibold text-copper-600">{money(item.price)}</span>
                        <span className="text-xs text-ink-500">
                          cost {money(item.cost)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 overflow-hidden rounded-full bg-paper-100">
                          <div
                            className={cn("h-full rounded-full", thin ? "bg-warn-700" : "bg-ok-700")}
                            style={{ width: `${Math.max(0, Math.min(100, item.marginPct))}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-[11px] font-semibold text-ink-500">
                          <span>{item.marginPct}% margin</span>
                          <span>{item.recipe.length ? `${item.recipe.length} ingredient${item.recipe.length > 1 ? "s" : ""}` : "no recipe"}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {!item.available && <Badge tone="danger">86’d</Badge>}
                        {outOfIngredients && <Badge tone="warn">Ingredient out</Badge>}
                        {item.recipe.slice(0, 3).map((r) => (
                          <Badge key={r.productId}>{r.name}</Badge>
                        ))}
                        {item.recipe.length > 3 && <Badge>+{item.recipe.length - 3}</Badge>}
                      </div>
                      <div className="mt-auto pt-3">
                        <Button
                          size="sm"
                          variant={item.available ? "outline" : "soft"}
                          className="w-full"
                          onClick={() => toggleAvailable(item)}
                        >
                          {item.available ? "Mark 86’d" : "Back on"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <MenuForm
        open={formOpen}
        initial={editTarget}
        products={products}
        categories={Array.from(new Set(items.map((i) => i.category)))}
        onClose={() => setFormOpen(false)}
        onSaved={(msg) => {
          setFormOpen(false);
          setFlash({ tone: "ok", msg });
          void refresh();
        }}
        onError={(msg) => setFlash({ tone: "danger", msg })}
      />
    </>
  );
}

function MenuForm({
  open,
  initial,
  products,
  categories,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  initial: MenuItem | null;
  products: MenuProduct[];
  categories: string[];
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Drinks");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [rows, setRows] = useState<{ productId: string; quantity: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setCategory(initial.category);
      setPrice(String(initial.price));
      setDescription(initial.description);
      setAvailable(initial.available);
      setRows(initial.recipe.map((r) => ({ productId: String(r.productId), quantity: String(r.quantity) })));
    } else {
      setName("");
      setCategory("Drinks");
      setPrice("");
      setDescription("");
      setAvailable(true);
      setRows([]);
    }
    setError("");
    setBusy(false);
    setSeeded(true);
  }, [open, initial, seeded]);

  const cost = rows.reduce((s, r) => {
    const p = products.find((x) => x.id === Number(r.productId));
    return p ? s + (Number(r.quantity) || 0) * 0 : s;
  }, 0);
  const realCost = rows.reduce((s, r) => {
    const line = initial?.recipe.find((x) => x.productId === Number(r.productId));
    if (line) return s + (Number(r.quantity) || 0) * line.costPrice;
    const p = products.find((x) => x.id === Number(r.productId));
    return s + (Number(r.quantity) || 0) * (p ? 0 : 0);
  }, 0);
  const priceN = Number(price) || 0;
  const knownCost = initial
    ? rows.reduce((s, r) => {
        const line = initial.recipe.find((x) => x.productId === Number(r.productId));
        return s + (Number(r.quantity) || 0) * (line?.costPrice ?? 0);
      }, 0)
    : null;
  void cost;
  void realCost;
  const margin = knownCost !== null && priceN > 0 ? Math.round(((priceN - knownCost) / priceN) * 100) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = {
        name,
        category: category.trim() || "Food",
        price: Number(price) || 0,
        description,
        available,
        recipes: rows
          .filter((r) => r.productId && Number(r.quantity) > 0)
          .map((r) => ({ productId: Number(r.productId), quantity: Number(r.quantity) })),
      };
      if (initial) {
        await api(`/api/menu/${initial.id}`, { method: "PUT", body });
        onSaved(`Updated “${name}”.`);
      } else {
        await api("/api/menu", { body });
        onSaved(`Added “${name}” to the menu.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit menu item" : "New menu item"} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" className="sm:col-span-2">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Old Fashioned" />
          </Field>
          <Field label="Price">
            <Input required type="number" step="any" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Category" className="sm:col-span-2">
            <Input list="menu-cats" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="menu-cats">
              {["Drinks", "Starters", "Mains", "Desserts", ...categories].filter((v, i, a) => a.indexOf(v) === i).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Available">
            <Select value={available ? "1" : "0"} onChange={(e) => setAvailable(e.target.value === "1")}>
              <option value="1">On the menu</option>
              <option value="0">86’d</option>
            </Select>
          </Field>
        </div>
        <Field label="Description" hint="optional">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short line for the menu…" className="min-h-[50px]" />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Recipe (stock used)</span>
            {margin !== null && (
              <Badge tone={margin < 50 ? "warn" : "ok"}>
                cost {money(knownCost ?? 0)} · {margin}% margin
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={r.productId}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...r, productId: e.target.value };
                    setRows(next);
                  }}
                  className="flex-1"
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.quantity} {p.unit})
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={r.quantity}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...r, quantity: e.target.value };
                    setRows(next);
                  }}
                  placeholder="qty"
                  className="w-24"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="hover:bg-danger-100 hover:text-danger-700"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  title="Remove"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRows([...rows, { productId: "", quantity: "" }])}
            >
              <IconPlus /> Add ingredient
            </Button>
            {products.length === 0 && (
              <p className="text-xs text-ink-500">No stock products yet — add products first to build recipes.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Add to menu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
