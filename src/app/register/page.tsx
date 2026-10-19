"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Alert, Button, Field, Input, Select, Spinner } from "@/components/ui";
import { Brand } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("restaurant");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth", {
        body: { action: "register", businessName, businessType, address, name, email, password },
      });
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-50 px-4 py-10">
      <Link href="/" className="mb-8">
        <Brand />
      </Link>
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-line bg-cream p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Register your venue</h1>
          <p className="mt-1 text-sm text-ink-500">
            Set up your restaurant or bar — stock, suppliers and menu costing are ready the moment you sign in.
          </p>

          {error && (
            <div className="mt-4">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Venue name">
              <Input
                required
                placeholder="e.g. Copper & Oak — Bistro & Bar"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Venue type">
                <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar</option>
                  <option value="bistro">Bistro & Bar</option>
                </Select>
              </Field>
              <Field label="Address" hint="optional">
                <Input placeholder="Street, city" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
            </div>
            <Field label="Your name">
              <Input required placeholder="e.g. Sam Rivera" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
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
            <Field label="Password" hint="min. 6 characters">
              <Input
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full" size="lg">
              {busy ? <Spinner className="border-cream/40 border-t-cream" /> : "Create my workspace"}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-copper-600 hover:text-copper-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
