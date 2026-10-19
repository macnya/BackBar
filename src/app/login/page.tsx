"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, cn } from "@/lib/api-client";
import { Alert, Button, Field, Input, Spinner } from "@/components/ui";
import { Brand } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth", { body: { action: "login", email, password } });
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setError("");
    setDemoBusy(true);
    try {
      await api("/api/demo", { body: {} });
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed to load.");
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-50 px-4 py-10">
      <Link href="/" className="mb-8">
        <Brand />
      </Link>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-cream p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to manage your stock.</p>

          {error && (
            <div className="mt-4">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@yourvenue.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full" size="lg">
              {busy ? <Spinner className="border-cream/40 border-t-cream" /> : "Sign in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-ink-300">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            variant="outline"
            className={cn("w-full")}
            size="lg"
            onClick={demo}
            disabled={demoBusy || busy}
          >
            {demoBusy ? "Preparing demo…" : "Explore the live demo venue"}
          </Button>
          <p className="mt-2 text-center text-xs text-ink-300">
            Loads a fully stocked bistro & bar — no account needed.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">
          New venue?{" "}
          <Link href="/register" className="font-bold text-copper-600 hover:text-copper-700">
            Register your restaurant or bar
          </Link>
        </p>
      </div>
    </div>
  );
}
