/** Generates a 13-digit printable code (Code128 / EAN-style). */
export function randomSku() {
  return String(Math.floor(2e12 + Math.random() * 7.9e12));
}

export function ensureUniqueSku(sku: string | undefined | null, existing: Set<string>) {
  if (sku && sku.trim() && !existing.has(sku.trim())) return sku.trim();
  let s = randomSku();
  while (existing.has(s)) s = randomSku();
  return s;
}

export function toNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function toDateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
