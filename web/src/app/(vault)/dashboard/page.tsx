"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Donut, Sparkline } from "@/components/charts";
import { Badge, Button, Card, Eyebrow, Progress } from "@/components/ui";
import { formatCompactInr, formatInr, monthLabel } from "@/lib/format";
import {
  bankBalances,
  blendedUtilization,
  creditOutstanding,
  daysUntilDue,
  fdBalances,
  fullNetWorth,
  investmentBalances,
  monthlyEmiBurden,
  netStandings,
  utilization,
  walletBalances,
} from "@/lib/selectors";
import { useFinance } from "@/lib/store";

export default function DashboardPage() {
  const { state, alerts } = useFinance();

  const metrics = useMemo(() => {
    const standings = netStandings(state.accounts);
    const assets = {
      savings: bankBalances(state.accounts),
      wallets: walletBalances(state.accounts),
      fds: fdBalances(state.accounts),
      funds: investmentBalances(state.accounts),
    };
    return {
      standings,
      assets,
      cards: creditOutstanding(state.accounts),
      util: blendedUtilization(state.accounts),
      worth: fullNetWorth(state.accounts, state.emis),
      emi: monthlyEmiBurden(state.emis),
    };
  }, [state.accounts, state.emis]);

  const upcoming = [...state.emis].sort(
    (a, b) => daysUntilDue(a.emiDueDate) - daysUntilDue(b.emiDueDate),
  )[0];

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Unified net standings</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl md:text-5xl">
            Namaskara, {state.user?.fullName.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-sm text-muted">{monthLabel()} · balances minus card dues</p>
        </div>
        <Link href="/connect">
          <Button variant="ghost">{state.aaConnected ? "Open AA desk" : "Connect AA"}</Button>
        </Link>
      </header>

      {alerts.length > 0 ? (
        <div className="grid gap-2">
          {alerts.slice(0, 2).map((alert) => (
            <Link
              key={alert.id}
              href={alert.href}
              className="flex items-start justify-between gap-3 rounded-2xl bg-coral/8 px-4 py-3 text-sm shadow-[inset_0_0_0_1px_rgba(255,107,107,0.25)]"
            >
              <span className="min-w-0">
                <span className="block text-coral">{alert.title}</span>
                <span className="text-muted">{alert.body}</span>
              </span>
              <Badge tone="coral">{alert.severity}</Badge>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rise">
          <Eyebrow>Live position</Eyebrow>
          <p className="mt-3 font-[family-name:var(--font-display)] text-5xl tracking-tight md:text-6xl">
            <span className="tabular">{formatInr(metrics.standings)}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Bank + wallet − credit card outstanding. Full net worth {formatCompactInr(metrics.worth)} after
            loans.
          </p>
          <div className="mt-6 overflow-x-auto">
            <Sparkline
              width={420}
              height={72}
              values={state.netHistory.map((h) => h.standings)}
              color={metrics.standings >= 0 ? "#3ee0a2" : "#ff6b6b"}
            />
            <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.16em] text-muted">
              {state.netHistory.map((h) => (
                <span key={h.month}>{h.month.slice(5)}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="rise delay-1">
          <Eyebrow>Asset mix</Eyebrow>
          <div className="relative mt-4">
            <Donut
              size={168}
              segments={[
                { label: "Savings", value: metrics.assets.savings, color: "#e6b35a" },
                { label: "FDs", value: metrics.assets.fds, color: "#3ee0a2" },
                { label: "Funds", value: metrics.assets.funds, color: "#7ec8e3" },
                { label: "Wallets", value: metrics.assets.wallets, color: "#b9a6ff" },
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rise delay-2">
          <Eyebrow>Liabilities</Eyebrow>
          <p className="mt-3 tabular text-3xl">{formatCompactInr(metrics.cards)}</p>
          <p className="mt-1 text-sm text-muted">Card outstanding</p>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>Blended utilisation</span>
              <span className={metrics.util >= 0.3 ? "text-coral" : "text-jade"}>
                {(metrics.util * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={metrics.util} tone={metrics.util >= 0.3 ? "coral" : "jade"} />
            <p className="mt-2 text-xs text-muted">Tripwire at 30% per card.</p>
          </div>
        </Card>
        <Card className="rise delay-3">
          <Eyebrow>EMI burden</Eyebrow>
          <p className="mt-3 tabular text-3xl">{formatInr(metrics.emi)}</p>
          <p className="mt-1 text-sm text-muted">Leaves the account every month</p>
          {upcoming ? (
            <p className="mt-4 text-sm">
              Next: {upcoming.loanTitle} in {daysUntilDue(upcoming.emiDueDate)} days
            </p>
          ) : null}
          <Link href="/debt" className="mt-4 inline-block text-sm text-gold">
            Open command desk →
          </Link>
        </Card>
        <Card className="rise delay-4">
          <Eyebrow>Bureau</Eyebrow>
          <p className="mt-3 tabular text-3xl">{state.creditProfile?.score ?? "—"}</p>
          <p className="mt-1 text-sm text-muted">{state.creditProfile?.bureau} snapshot</p>
          <Link href="/credit" className="mt-4 inline-block text-sm text-gold">
            Refresh with PAN OTP →
          </Link>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Eyebrow>Accounts</Eyebrow>
          <span className="text-xs text-muted">
            {state.accounts.filter((a) => a.aaLinked).length} AA-linked
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.accounts.map((account) => {
            const util = utilization(account);
            const isCard = account.accountType === "CREDIT_CARD";
            return (
              <article
                key={account.id}
                className="rounded-2xl bg-black/20 p-4 shadow-[inset_0_0_0_1px_rgba(230,179,90,0.12)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-paper">{account.institutionName}</p>
                    <p className="text-xs text-muted">
                      {account.accountType.replaceAll("_", " ")} · •••• {account.accountMask}
                    </p>
                  </div>
                  <Badge tone={account.aaLinked ? "jade" : "muted"}>
                    {account.aaLinked ? "AA" : "Local"}
                  </Badge>
                </div>
                <p className="mt-4 tabular text-2xl">
                  {formatInr(account.currentBalance)}
                </p>
                {isCard ? (
                  <div className="mt-3">
                    <Progress value={util} tone={util >= 0.3 ? "coral" : "jade"} />
                    <p className="mt-1 text-xs text-muted">
                      {(util * 100).toFixed(0)}% of {formatCompactInr(account.creditLimit)}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
