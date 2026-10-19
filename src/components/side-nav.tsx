"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/api-client";
import {
  IconGrid,
  IconBox,
  IconScan,
  IconSheet,
  IconCup,
  IconTruck,
  IconClock,
  IconChart,
} from "@/components/icons";

export type IconKey = "grid" | "box" | "scan" | "sheet" | "cup" | "truck" | "clock" | "chart";

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
};

const ICONS: Record<IconKey, (p: { className?: string }) => React.ReactNode> = {
  grid: IconGrid,
  box: IconBox,
  scan: IconScan,
  sheet: IconSheet,
  cup: IconCup,
  truck: IconTruck,
  clock: IconClock,
  chart: IconChart,
};

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/app" && pathname.startsWith(it.href));
        const Icon = ICONS[it.icon];
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-dark-800 text-cream shadow-[inset_2px_0_0_0_var(--color-copper-500)]"
                : "text-dark-300 hover:bg-dark-800/60 hover:text-dark-100"
            )}
          >
            <span className={cn(active ? "text-copper-500" : "text-dark-300")}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
