"use client";

import { useEffect, useState, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { cn, api } from "@/lib/api-client";
import { IconX, IconSearch, IconAlert, IconCheck, Logo } from "@/components/icons";

/* ---------- Buttons ---------- */

const btnVariants = {
  primary: "bg-copper-600 text-cream hover:bg-copper-700 shadow-sm",
  dark: "bg-ink-900 text-cream hover:bg-ink-700 shadow-sm",
  outline: "border border-line bg-cream text-ink-900 hover:bg-paper-100",
  ghost: "text-ink-700 hover:bg-paper-100",
  danger: "bg-danger-700 text-white hover:bg-danger-800 shadow-sm",
  soft: "bg-copper-50 text-copper-700 hover:bg-copper-100",
  success: "bg-ok-700 text-white hover:bg-ok-800 shadow-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariants;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-copper-500 disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "px-2.5 py-1.5 text-xs",
        size === "md" && "px-3.5 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-sm",
        btnVariants[variant],
        className
      )}
      {...rest}
    />
  );
}

/* ---------- Form fields ---------- */

const fieldCls =
  "w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-copper-500/60 focus:border-copper-500 transition-shadow";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldCls, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldCls, "appearance-none pr-8 bg-no-repeat bg-[right_0.6rem_center] bg-[length:0.9rem] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23857a6a%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')]", className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldCls, "min-h-[70px]", className)} {...rest} />;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
        {hint && <span className="font-normal normal-case tracking-normal text-ink-300">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldCls, "pl-9")}
      />
    </div>
  );
}

/* ---------- Badge / Card / Stat ---------- */

const badgeTones = {
  neutral: "bg-paper-100 text-ink-700 border-paper-200",
  copper: "bg-copper-50 text-copper-700 border-copper-100",
  ok: "bg-ok-100 text-ok-800 border-ok-100",
  warn: "bg-warn-100 text-warn-800 border-warn-100",
  danger: "bg-danger-100 text-danger-800 border-danger-100",
  dark: "bg-ink-900 text-cream border-ink-900",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-line bg-cream shadow-[0_1px_2px_rgba(33,26,19,0.05)]", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "copper" | "warn" | "danger" | "ok";
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "text-ink-900",
    copper: "text-copper-600",
    warn: "text-warn-800",
    danger: "text-danger-700",
    ok: "text-ok-800",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
          <div className={cn("mt-1.5 truncate font-display text-2xl font-semibold", tones[tone])}>{value}</div>
          {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
        </div>
        {icon && <div className="text-ink-300">{icon}</div>}
      </div>
    </Card>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 sm:p-8"
      onMouseDown={onClose}
    >
      <div
        className={cn(
          "my-4 w-full rounded-xl border border-line bg-cream shadow-2xl",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-500 hover:bg-paper-100 hover:text-ink-900"
            aria-label="Close"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Misc ---------- */

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-paper-200 bg-paper-50/60 px-6 py-14 text-center">
      {icon && <div className="text-ink-300">{icon}</div>}
      <div className="font-display text-lg font-semibold text-ink-700">{title}</div>
      {desc && <p className="max-w-sm text-sm text-ink-500">{desc}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-copper-600",
        className
      )}
    />
  );
}

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-ink-500">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "ok" | "warn" | "info";
  children: ReactNode;
}) {
  const styles = {
    danger: "border-danger-100 bg-danger-100/50 text-danger-800",
    ok: "border-ok-100 bg-ok-100/50 text-ok-800",
    warn: "border-warn-100 bg-warn-100/50 text-warn-800",
    info: "border-paper-200 bg-paper-100 text-ink-700",
  };
  const Icon = tone === "ok" ? IconCheck : IconAlert;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm", styles[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Brand({ dark }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo className="h-8 w-8" />
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-tight",
          dark ? "text-cream" : "text-ink-900"
        )}
      >
        BackBar
      </span>
    </span>
  );
}

export function LogoutButton({ className, label }: { className?: string; label?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api("/api/auth", { body: { action: "logout" } });
        } catch {}
        router.push("/login");
        router.refresh();
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
        "text-ink-500 hover:bg-paper-100 hover:text-ink-900",
        className
      )}
    >
      <IconLogoutMini />
      {label && "Sign out"}
    </button>
  );
}

function IconLogoutMini() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" />
      <path d="m16 8 4 4-4 4M20 12H10" />
    </svg>
  );
}

/* ---------- Table primitives ---------- */

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-ink-500 first:pl-4 last:pr-4", className)}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-3 py-3 text-sm first:pl-4 last:pr-4", className)}>
      {children}
    </td>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">{children}</table>
      </div>
    </Card>
  );
}
