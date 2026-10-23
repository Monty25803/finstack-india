"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Eyebrow, Input } from "@/components/ui";
import { formatDate, maskPan, maskPhone } from "@/lib/format";
import { useFinance } from "@/lib/store";

export default function PrivacyPage() {
  const { state, updateConsents, exportLedger, purgeProfile, toggleBiometric, lock } = useFinance();
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  const download = () => {
    const blob = new Blob([exportLedger()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finstack-india-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      <header>
        <Eyebrow>DPDP Act portal</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">Your data, your mandate</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Consent before ingest. Export the structured ledger, or trigger a one-click profile purge.
          Unparsed SMS never leaves the device sandbox.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <ConsentCard
          title="Account Aggregator"
          body="RBI-licensed AA pull for banks, FDs, and funds."
          on={state.consents.accountAggregator}
          onToggle={() =>
            updateConsents({ accountAggregator: !state.consents.accountAggregator })
          }
        />
        <ConsentCard
          title="Credit bureau"
          body="Experian / CRIF via PAN and OTP."
          on={state.consents.creditBureau}
          onToggle={() => updateConsents({ creditBureau: !state.consents.creditBureau })}
        />
        <ConsentCard
          title="SMS parser"
          body="On-device regex. Cloud receives hashes only."
          on={state.consents.smsParser}
          onToggle={() => updateConsents({ smsParser: !state.consents.smsParser })}
        />
      </div>

      <Card>
        <Eyebrow>Profile</Eyebrow>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Row k="Name" v={state.user?.fullName ?? "—"} />
          <Row k="Mobile" v={state.user ? maskPhone(state.user.phoneNumber) : "—"} />
          <Row k="PAN" v={state.user ? maskPan(state.user.panNumber) : "—"} />
          <Row k="City" v={state.user?.city ?? "—"} />
          <Row
            k="Consents granted"
            v={state.consents.grantedAt ? formatDate(state.consents.grantedAt) : "—"}
          />
          <Row k="Vault opened" v={state.user ? formatDate(state.user.createdAt) : "—"} />
        </dl>
      </Card>

      <Card>
        <Eyebrow>Hardware-backed gate</Eyebrow>
        <p className="mt-2 text-sm text-muted">
          Production binds Windows Hello, Android biometrics, and Face ID. This web vault keeps a PIN
          plus a simulated sensor.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="ghost" onClick={toggleBiometric}>
            Biometric {state.biometricEnabled ? "on" : "off"}
          </Button>
          <Button variant="ghost" onClick={lock}>
            Lock now
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Eyebrow>Export</Eyebrow>
          <p className="mt-2 text-sm text-muted">
            Download the JSON ledger: users, accounts, transactions, EMIs, consents.
          </p>
          <Button className="mt-4" onClick={download}>
            Export data logs
          </Button>
        </Card>
        <Card>
          <Eyebrow>Purge</Eyebrow>
          <p className="mt-2 text-sm text-muted">
            Irreversible. Type DELETE to wipe the local vault and return to onboarding.
          </p>
          <div className="mt-4 flex gap-3">
            <Input
              placeholder="DELETE"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button
              variant="danger"
              disabled={confirm !== "DELETE"}
              onClick={() => {
                purgeProfile();
                router.replace("/");
              }}
            >
              Purge
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ConsentCard({
  title,
  body,
  on,
  onToggle,
}: {
  title: string;
  body: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <Eyebrow>{title}</Eyebrow>
        <Badge tone={on ? "jade" : "muted"}>{on ? "Granted" : "Revoked"}</Badge>
      </div>
      <p className="mt-3 text-sm text-muted">{body}</p>
      <button onClick={onToggle} className="mt-4 text-sm text-gold">
        {on ? "Revoke" : "Grant again"}
      </button>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[rgba(230,179,90,0.1)] pb-2 text-sm">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
