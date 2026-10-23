"use client";

import { useState } from "react";
import { ScoreRing } from "@/components/charts";
import { Badge, Button, Card, Eyebrow, Progress } from "@/components/ui";
import { formatCompactInr, formatDate, formatInr } from "@/lib/format";
import { blendedUtilization, creditLimits, creditOutstanding, utilization } from "@/lib/selectors";
import { useFinance } from "@/lib/store";

export default function CreditPage() {
  const { state, setCreditFetched, payCard } = useFinance();
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<"idle" | "otp" | "pulling">("idle");
  const cards = state.accounts.filter((a) => a.accountType === "CREDIT_CARD");
  const util = blendedUtilization(state.accounts);
  const profile = state.creditProfile;

  const pull = async () => {
    setPhase("pulling");
    await new Promise((r) => setTimeout(r, 1200));
    setCreditFetched();
    setPhase("idle");
    setOtp("");
  };

  return (
    <div className="grid gap-6">
      <header>
        <Eyebrow>Credit health</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">Bureau & utilisation</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          PAN-verified Experian / CRIF snapshot. A 30% utilisation tripwire fires the instant any card
          crosses the line — the spec’s primary risk alert.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="grid place-items-center">
          {profile ? <ScoreRing score={profile.score} /> : <p className="text-muted">No pull yet</p>}
          <p className="mt-2 text-xs text-muted">
            Last fetch {profile ? formatDate(profile.fetchedAt) : "—"}
          </p>
        </Card>
        <Card>
          <Eyebrow>Score drivers</Eyebrow>
          <div className="mt-5 grid gap-4">
            <Driver label="Payment history" value={(profile?.paymentHistory ?? 0) / 100} text={`${profile?.paymentHistory ?? 0}% on-time`} />
            <Driver label="Utilisation" value={util} text={`${(util * 100).toFixed(0)}% blended · tripwire 30%`} warn={util >= 0.3} />
            <Driver
              label="Credit age"
              value={Math.min(1, (profile?.creditAgeMonths ?? 0) / 120)}
              text={`${profile?.creditAgeMonths ?? 0} months`}
            />
            <p className="text-sm text-muted">
              {profile?.hardEnquiries ?? 0} hard enquiries · {profile?.totalAccounts ?? 0} tradelines
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>Card desk</Eyebrow>
          <p className="text-sm text-muted">
            {formatInr(creditOutstanding(state.accounts))} of {formatCompactInr(creditLimits(state.accounts))}
          </p>
        </div>
        <div className="grid gap-3">
          {cards.map((card) => {
            const pct = utilization(card);
            return (
              <article
                key={card.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-black/20 p-4"
              >
                <div>
                  <p className="text-sm">{card.institutionName}</p>
                  <p className="text-xs text-muted">•••• {card.accountMask}</p>
                  <div className="mt-3 w-56">
                    <Progress value={pct} tone={pct >= 0.3 ? "coral" : "jade"} />
                    <p className="mt-1 text-xs text-muted">
                      {formatInr(card.currentBalance)} · {(pct * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pct >= 0.3 ? <Badge tone="coral">Above 30%</Badge> : <Badge tone="jade">Healthy</Badge>}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={card.currentBalance <= 0}
                    onClick={() => payCard(card.id, Math.min(card.currentBalance, 10000))}
                  >
                    Pay ₹10,000
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </Card>

      <Card>
        <Eyebrow>PAN + OTP pull</Eyebrow>
        <p className="mt-2 text-sm text-muted">
          Production talks to Experian/CRIF. This demo completes a mock OTP against PAN{" "}
          {state.user?.panNumber}.
        </p>
        {phase === "idle" ? (
          <Button className="mt-4" onClick={() => setPhase("otp")}>
            Request OTP
          </Button>
        ) : (
          <form
            className="mt-4 flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (otp.length === 6) pull();
            }}
          >
            <input
              className="h-11 w-40 rounded-2xl bg-black/25 px-3 tracking-[0.4em] outline-none shadow-[inset_0_0_0_1px_rgba(230,179,90,0.2)]"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button type="submit" disabled={otp.length !== 6 || phase === "pulling"}>
              {phase === "pulling" ? "Fetching bureau…" : "Verify & pull"}
            </Button>
          </form>
        )}
        <p className="mt-2 text-xs text-muted">Any 6 digits work in demo mode.</p>
      </Card>
    </div>
  );
}

function Driver({
  label,
  value,
  text,
  warn,
}: {
  label: string;
  value: number;
  text: string;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted">{text}</span>
      </div>
      <Progress value={value} tone={warn ? "coral" : "jade"} />
    </div>
  );
}
