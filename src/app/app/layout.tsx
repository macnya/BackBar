import Link from "next/link";
import { requireBiz } from "@/lib/auth";
import { SideNav, type NavItem } from "@/components/side-nav";
import { LogoutButton, Brand } from "@/components/ui";

const typeLabels: Record<string, string> = {
  restaurant: "Restaurant",
  bar: "Bar",
  bistro: "Bistro & Bar",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, business } = await requireBiz();

  const items: NavItem[] = [
    { href: "/app", label: "Dashboard", icon: "grid" },
    { href: "/app/stock", label: "Stock", icon: "box" },
    { href: "/app/scan", label: "Scan & Adjust", icon: "scan" },
    { href: "/app/import", label: "Excel Import", icon: "sheet" },
    { href: "/app/menu", label: "Menu & Costing", icon: "cup" },
    { href: "/app/suppliers", label: "Suppliers", icon: "truck" },
    { href: "/app/movements", label: "Movements", icon: "clock" },
    { href: "/app/reports", label: "Reports", icon: "chart" },
  ];

  return (
    <div className="min-h-screen">
      <aside className="sticky top-0 z-40 flex max-h-screen flex-col border-b border-dark-700 bg-dark-900 lg:fixed lg:inset-y-0 lg:max-h-none lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4 lg:pt-5">
          <Link href="/app">
            <Brand dark />
          </Link>
        </div>
        <div className="hidden px-5 pb-4 lg:block">
          <div className="truncate text-sm font-bold text-cream">{business.name}</div>
          <div className="text-xs text-dark-300">{typeLabels[business.type] ?? "Venue"}</div>
        </div>
        <div className="flex-1 overflow-y-auto lg:pt-2">
          <SideNav items={items} />
        </div>
        <div className="border-t border-dark-800 px-4 py-3">
          <div className="mb-2 hidden px-1 lg:block">
            <div className="truncate text-sm font-semibold text-dark-100">{user.name}</div>
            <div className="truncate text-xs text-dark-300">{user.email}</div>
          </div>
          <LogoutButton label className="w-full justify-start rounded-lg px-3 py-2" />
        </div>
      </aside>
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
