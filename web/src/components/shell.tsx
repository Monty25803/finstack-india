"use client";

import {
  Bell,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Link2,
  Lock,
  Receipt,
  Shield,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useFinance } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Standings", icon: LayoutDashboard },
  { href: "/spend", label: "Spend", icon: Wallet },
  { href: "/debt", label: "EMI desk", icon: Landmark },
  { href: "/ledger", label: "Ledger", icon: Receipt },
  { href: "/credit", label: "Credit", icon: CreditCard },
  { href: "/privacy", label: "Privacy", icon: Shield },
  { href: "/connect", label: "AA", icon: Link2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, alerts, lock } = useFinance();
  const critical = alerts.filter((a) => a.severity !== "info").length;

  return (
    <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-[rgba(230,179,90,0.12)] px-5 py-6 lg:flex">
        <BrandMark compact />
        <nav className="mt-10 grid gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                  active ? "bg-gold text-ink" : "text-muted hover:bg-white/5 hover:text-paper",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-3xl bg-black/25 p-4 shadow-[inset_0_0_0_1px_rgba(230,179,90,0.14)]">
          <p className="text-xs uppercase tracking-[0.18em] text-gold-2/80">Signed in</p>
          <p className="mt-2 text-sm text-paper">{state.user?.fullName}</p>
          <p className="text-xs text-muted">{state.user?.city}</p>
          <button
            onClick={lock}
            className="mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-gold"
          >
            <Lock size={12} /> Lock vault
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col pb-24 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[rgba(230,179,90,0.12)] bg-[#071018]/80 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Private session</p>
            <p className="text-sm text-paper">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {critical > 0 ? (
              <Link href="/spend" className="inline-flex items-center gap-2 text-coral">
                <Bell size={16} />
                <Badge tone="coral">{critical} alerts</Badge>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 text-muted">
                <Bell size={16} /> Quiet
              </span>
            )}
            <Link
              href="/privacy"
              className="hidden rounded-full bg-white/5 px-3 py-1.5 text-xs text-muted sm:inline"
            >
              DPDP portal
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[rgba(230,179,90,0.16)] bg-[#071018]/95 px-1 py-2 backdrop-blur lg:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "grid place-items-center gap-1 py-1 text-[10px]",
                active ? "text-gold" : "text-muted",
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
