import Link from "next/link";
import { Logo, IconArrowRight, IconScan, IconSheet, IconCup, IconAlert, IconCheck, IconIn, IconOut, IconBox } from "@/components/icons";

const HERO_IMG =
  "https://images.pexels.com/photos/9130342/pexels-photo-9130342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const SIDE_IMG =
  "https://images.pexels.com/photos/29092896/pexels-photo-29092896.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

export default function Landing() {
  return (
    <div className="bg-dark-900 text-dark-100">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-dark-800 bg-dark-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <span className="inline-flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="font-display text-xl font-semibold text-cream">BackBar</span>
          </span>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-dark-300 md:flex">
            <a href="#features" className="hover:text-cream">Features</a>
            <a href="#how" className="hover:text-cream">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-dark-100 hover:bg-dark-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-copper-600 px-3.5 py-2 text-sm font-bold text-cream shadow-sm hover:bg-copper-500"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(${HERO_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark-900/80 via-dark-900/90 to-dark-900" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-dark-700 bg-dark-800/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-copper-500">
            Inventory for restaurants & bars
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] text-cream sm:text-6xl">
            Your back bar, finally in order.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-dark-300">
            Register your venue, scan stock in with the phone you already carry — or import your
            whole cellar from an Excel sheet — and always know what you have, what it costs, and
            what’s about to run dry.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-copper-600 px-5 py-3 text-sm font-bold text-cream shadow-lg hover:bg-copper-500"
            >
              Register your restaurant
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800/60 px-5 py-3 text-sm font-bold text-dark-100 hover:border-dark-300 hover:text-cream"
            >
              Try the live demo
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark-300">
            {[
              ["No hardware needed", IconScan],
              ["Barcode + QR on every product", IconBox],
              ["Excel & CSV import", IconSheet],
            ].map(([label, Icon]) => (
              <span key={label as string} className="inline-flex items-center gap-2">
                <span className="text-copper-500">{(Icon as typeof IconScan)({ className: "h-4 w-4" })}</span>
                {label as string}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="max-w-lg font-display text-3xl font-semibold text-cream sm:text-4xl">
          Built for the chaos between the last delivery and the first pour.
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <FeatureRow
            flip={false}
            icon={<IconScan />}
            title="Scan stock in with your phone"
            body="Every product gets a printable barcode and QR label. Open the scanner on any phone, sweep a bottle, and choose stock in, stock out, or adjustment — no register, no hardware, no apps to install."
            mock={
              <div className="rounded-xl border border-dark-700 bg-dark-800/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-cream">Kentucky Bourbon 750ml</div>
                    <div className="font-mono text-xs text-dark-300">2001000000059</div>
                  </div>
                  <span className="rounded-full bg-ok-100 px-2 py-0.5 text-[11px] font-bold text-ok-800">Scanned</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-copper-600 py-2 text-xs font-bold text-cream">
                    <IconIn className="h-3.5 w-3.5" /> Stock in
                  </span>
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dark-700 py-2 text-xs font-bold text-dark-100">
                    <IconOut className="h-3.5 w-3.5" /> Stock out
                  </span>
                </div>
                <div className="mt-3 text-right text-xs text-dark-300">Now on hand: 10 bottles</div>
              </div>
            }
          />
          <FeatureRow
            flip
            icon={<IconSheet />}
            title="Import your whole cellar from Excel"
            body="Already tracking in a spreadsheet? Upload your .xlsx or .csv and BackBar maps the columns, creates missing products, updates existing ones, and logs every change. A template is one click away."
            mock={
              <div className="rounded-xl border border-dark-700 bg-dark-800/70 p-4">
                <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-dark-700 text-[11px]">
                  {["name", "qty", "cost", "status"].map((h) => (
                    <div key={h} className="bg-dark-700 px-2 py-1.5 font-bold uppercase tracking-wide text-dark-300">{h}</div>
                  ))}
                  {[
                    ["Merlot 750ml", "24", "18.50", "updated"],
                    ["Espresso Beans 1kg", "6", "14.00", "created"],
                    ["Lemons 1kg", "5", "3.20", "created"],
                  ].map((r, i) => (
                    <div key={i} className="contents">
                      <div className="bg-dark-800 px-2 py-1.5 text-dark-100">{r[0]}</div>
                      <div className="bg-dark-800 px-2 py-1.5 text-dark-100">{r[1]}</div>
                      <div className="bg-dark-800 px-2 py-1.5 text-dark-100">{r[2]}</div>
                      <div className={r[3] === "created" ? "bg-dark-800 px-2 py-1.5 font-bold text-copper-500" : "bg-dark-800 px-2 py-1.5 font-bold text-ok-800 bg-ok-100"}>{r[3]}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right text-xs text-dark-300">2 created · 1 updated · 0 errors</div>
              </div>
            }
          />
          <FeatureRow
            flip={false}
            icon={<IconCup />}
            title="Know the true cost of every plate and pour"
            body="Attach recipes to menu items. BackBar reads stock prices in real time, so dish cost and margin update the moment your supplier raises them."
            mock={
              <div className="space-y-2.5 rounded-xl border border-dark-700 bg-dark-800/70 p-4">
                {[
                  ["Old Fashioned", 13, 92],
                  ["Gin & Tonic", 11, 78],
                  ["Flat White", 4.6, 83],
                ].map(([name, price, margin]) => (
                  <div key={name as string} className="flex items-center gap-3">
                    <div className="w-32 truncate text-sm font-semibold text-cream">{name}</div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-dark-700">
                      <div className="h-full rounded-full bg-copper-500" style={{ width: `${margin as number}%` }} />
                    </div>
                    <div className="w-24 text-right text-xs text-dark-300">
                      ${price as number} · {margin as number}% margin
                    </div>
                  </div>
                ))}
              </div>
            }
          />
          <FeatureRow
            flip
            icon={<IconAlert />}
            title="Warnings before the tap runs dry"
            body="Set a reorder level on anything, add shelf life to the perishables, and the dashboard flags low stock, items expiring this week, and stock written off — with a suggested reorder quantity per supplier."
            mock={
              <div className="space-y-2 rounded-xl border border-dark-700 bg-dark-800/70 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-dark-100">Oat Milk 1L</span>
                  <span className="rounded-full bg-warn-100 px-2 py-0.5 text-[11px] font-bold text-warn-800">Low · expires in 3d</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-dark-100">London Dry Gin 700ml</span>
                  <span className="rounded-full bg-danger-100 px-2 py-0.5 text-[11px] font-bold text-danger-800">Low · reorder 7</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-dark-100">Basil (bunch)</span>
                  <span className="rounded-full bg-danger-100 px-2 py-0.5 text-[11px] font-bold text-danger-800">Expired — write off</span>
                </div>
              </div>
            }
          />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            ["Suppliers on file", "Every product can point at who delivers it, so reorder lists are actual order lists."],
            ["Full movement log", "Every scan, import and edit is recorded with who and when — your stock finally adds up."],
            ["Reports & exports", "Stock valuation, low-stock and expiry reports, all exportable to CSV for your accounts."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-dark-700 bg-dark-800/40 p-5">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-copper-600/20 text-copper-500">
                <IconCheck className="h-4 w-4" />
              </div>
              <div className="font-display text-lg font-semibold text-cream">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-dark-300">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-dark-800 bg-dark-800/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-semibold text-cream sm:text-4xl">Set up in an afternoon.</h2>
              <ol className="mt-8 space-y-6">
                {[
                  ["Register your venue", "Create an account with your restaurant or bar name — takes about a minute. Your workspace is ready immediately."],
                  ["Add your stock", "Print a few labels and scan bottles in with your phone, or drop in the Excel sheet you already keep. Either way, every unit is counted."],
                  ["Run service with eyes open", "Low stock, expiries and true dish costs update live. When a supplier call is due, you know exactly what to ask for."],
                ].map(([t, b], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-copper-600 font-display text-lg font-bold text-cream">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-display text-lg font-semibold text-cream">{t}</div>
                      <p className="mt-1 text-sm leading-relaxed text-dark-300">{b}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative">
              <img
                src={SIDE_IMG}
                alt="Bottles and syrups on a dim service counter"
                className="aspect-[4/3] w-full rounded-2xl border border-dark-700 object-cover"
              />
              <div className="absolute -bottom-5 left-5 rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 shadow-xl">
                <div className="text-[11px] font-bold uppercase tracking-widest text-copper-500">Tonight’s flags</div>
                <div className="mt-1 text-sm font-semibold text-cream">4 low · 2 expiring this week</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-dark-700 bg-gradient-to-r from-dark-800 to-dark-900 p-8 sm:p-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold text-cream">Stop guessing what’s in the walk-in.</h2>
            <p className="mt-2 text-dark-300">Register free, scan your first bottle in the next two minutes.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-copper-600 px-5 py-3 text-sm font-bold text-cream shadow-lg hover:bg-copper-500"
            >
              Get started <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-dark-700 px-5 py-3 text-sm font-bold text-dark-100 hover:text-cream"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-dark-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <span className="inline-flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="font-display text-lg font-semibold text-cream">BackBar</span>
          </span>
          <p className="text-sm text-dark-300">Stock control for restaurants & bars. Built for service speed.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureRow({
  title,
  body,
  icon,
  mock,
  flip,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  mock: React.ReactNode;
  flip: boolean;
}) {
  return (
    <div className={`flex flex-col gap-6 ${flip ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
      <div className="lg:w-1/2">
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-copper-600/20 text-copper-500">
          {icon}
        </div>
        <h3 className="font-display text-2xl font-semibold text-cream">{title}</h3>
        <p className="mt-3 leading-relaxed text-dark-300">{body}</p>
      </div>
      <div className="lg:w-1/2">{mock}</div>
    </div>
  );
}
