export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; form?: boolean } = {}
): Promise<T> {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers:
      opts.body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: isForm ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* not JSON — fall back to text */
  }
  if (!res.ok || data.ok === false) {
    const msg =
      data?.error ||
      (text && text.length < 400 ? text : undefined) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

const moneyFmt: Record<string, Intl.NumberFormat> = {};
export function money(n: number, currency = "USD") {
  const key = currency || "USD";
  if (!moneyFmt[key]) {
    moneyFmt[key] = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: key,
    });
  }
  return moneyFmt[key].format(Number.isFinite(n) ? n : 0);
}

export function num(n: number) {
  return String(Math.round((Number.isFinite(n) ? n : 0) * 100) / 100);
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d.length === 10 ? d + "T00:00:00" : d) : d;
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function downloadFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadCSV(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  downloadFile(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}
