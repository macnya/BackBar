"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Td,
  Th,
  TableShell,
} from "@/components/ui";
import { IconPencil, IconPlus, IconTrash, IconTruck } from "@/components/icons";

type Supplier = {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  productCount: number;
};

export default function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [flash, setFlash] = useState<{ tone: "ok" | "danger"; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ items: Supplier[] }>("/api/suppliers");
      setItems(res.items);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/suppliers/${deleteTarget.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setFlash({ tone: "ok", msg: `Deleted “${deleteTarget.name}”.` });
      setDeleteTarget(null);
    } catch (e) {
      setFlash({ tone: "danger", msg: e instanceof Error ? e.message : "Delete failed." });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-ink-500">
        <Spinner /> Loading suppliers…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Suppliers"
        desc="Who delivers what — low-stock reports turn into ready-to-send order lists."
        actions={
          <Button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <IconPlus /> New supplier
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
          icon={<IconTruck className="h-10 w-10" />}
          title="No suppliers yet"
          desc="Add the distributors and growers you buy from, then link them to products."
          action={
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <IconPlus /> Add a supplier
            </Button>
          }
        />
      ) : (
        <TableShell>
          <table className="w-full">
            <thead className="border-b border-line bg-paper-50">
              <tr>
                <Th>Supplier</Th>
                <Th>Contact</Th>
                <Th>Phone / Email</Th>
                <Th className="text-right">Products</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((s) => (
                <tr key={s.id} className="hover:bg-paper-50/70">
                  <Td>
                    <div className="font-semibold">{s.name}</div>
                    {s.address && <div className="text-xs text-ink-500">{s.address}</div>}
                  </Td>
                  <Td className="text-ink-700">{s.contactPerson || "—"}</Td>
                  <Td>
                    <div className="text-ink-700">{s.phone || "—"}</div>
                    <div className="text-xs text-ink-500">{s.email || ""}</div>
                  </Td>
                  <Td className="text-right">
                    <Badge tone={s.productCount ? "copper" : "neutral"}>{s.productCount}</Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" title="Edit" onClick={() => { setEditTarget(s); setFormOpen(true); }}>
                        <IconPencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Delete"
                        className="hover:bg-danger-100 hover:text-danger-700"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      <SupplierForm
        open={formOpen}
        initial={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={(msg) => {
          setFormOpen(false);
          setFlash({ tone: "ok", msg });
          void refresh();
        }}
        onError={(m) => setFlash({ tone: "danger", msg: m })}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete supplier">
        {deleteTarget && (
          <div>
            <p className="text-sm text-ink-700">
              Delete <strong>{deleteTarget.name}</strong>? Their products keep working but lose the
              supplier link.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete supplier"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function SupplierForm({
  open,
  initial,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  initial: Supplier | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setContactPerson(initial?.contactPerson ?? "");
    setPhone(initial?.phone ?? "");
    setEmail(initial?.email ?? "");
    setAddress(initial?.address ?? "");
    setError("");
    setBusy(false);
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const body = { name, contactPerson, phone, email, address };
    try {
      if (initial) {
        await api(`/api/suppliers/${initial.id}`, { method: "PUT", body });
        onSaved(`Updated “${name}”.`);
      } else {
        await api("/api/suppliers", { body });
        onSaved(`Added supplier “${name}”.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit supplier" : "New supplier"}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Harvest & Vine Distributors" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact person">
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Who to ask for" />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 …" />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="orders@…" />
          </Field>
          <Field label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Add supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
