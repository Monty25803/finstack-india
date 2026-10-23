"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Eyebrow, Input } from "@/components/ui";
import { useFinance } from "@/lib/store";

type FipResponse = { ok: boolean; count?: number; banks?: string[]; error?: string };
type Availability = { aa: string; vua: string; status: boolean };

export default function ConnectPage() {
  const { state, connectAa, applyAaSnapshot } = useFinance();
  const [fips, setFips] = useState<FipResponse | null>(null);
  const [mobile, setMobile] = useState(state.user?.phoneNumber ?? "9999999999");
  const [handles, setHandles] = useState<Availability[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [consentId, setConsentId] = useState<string | null>(null);

  const push = (line: string) => setLog((prev) => [line, ...prev].slice(0, 12));

  useEffect(() => {
    fetch("/api/setu/fips")
      .then((res) => res.json())
      .then((data: FipResponse) => {
        setFips(data);
        if (data.ok) connectAa();
      })
      .catch((error: unknown) => setFips({ ok: false, error: String(error) }));
  }, [connectAa]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const success = params.get("success");
    if (!id) return;
    setConsentId(id);
    if (success === "true") {
      push("Consent approved. Import FI data.");
    } else if (success === "false") {
      push(`Consent not approved (${params.get("errormsg") ?? params.get("errorcode") ?? "rejected"}).`);
    }
  }, []);

  const checkAvailability = async () => {
    setBusy("availability");
    try {
      const res = await fetch("/api/setu/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile }),
      });
      const data = (await res.json()) as { ok: boolean; accounts?: Availability[]; error?: string };
      if (!data.ok) throw new Error(data.error);
      setHandles(data.accounts ?? []);
      push(`Availability: ${(data.accounts ?? []).filter((a) => a.status).length} AA handles live`);
    } catch (error) {
      push(error instanceof Error ? error.message : "Availability failed");
    } finally {
      setBusy(null);
    }
  };

  const startConsent = async () => {
    setBusy("consent");
    try {
      const res = await fetch("/api/setu/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        consent?: { id: string; url: string; status: string };
        error?: string;
        code?: string;
      };
      if (!data.ok || !data.consent) {
        push(
          `Create consent blocked (${data.code ?? "error"}): ${data.error ?? "unknown"}.`,
        );
        return;
      }
      setConsentId(data.consent.id);
      setConsentUrl(data.consent.url);
      push(`Consent ${data.consent.status} · open Setu webview and pick Setu FIP-2, OTP 123456`);
      window.open(data.consent.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      push(error instanceof Error ? error.message : "Consent failed");
    } finally {
      setBusy(null);
    }
  };

  const importData = async () => {
    if (!consentId) return;
    setBusy("fetch");
    try {
      const statusRes = await fetch(`/api/setu/consent/${consentId}`);
      const statusData = (await statusRes.json()) as { ok: boolean; consent?: { status: string } };
      push(`Consent status: ${statusData.consent?.status ?? "unknown"}`);
      if (!["ACTIVE", "APPROVED"].includes(statusData.consent?.status ?? "")) {
        push("Approve the Setu webview first (Setu FIP-2 + OTP 123456).");
        return;
      }
      const res = await fetch(`/api/setu/consent/${consentId}/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: state.user?.id }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        accounts?: Parameters<typeof applyAaSnapshot>[0]["accounts"];
        transactions?: Parameters<typeof applyAaSnapshot>[0]["transactions"];
        error?: string;
      };
      if (!data.ok) throw new Error(data.error);
      applyAaSnapshot({
        accounts: data.accounts ?? [],
        transactions: data.transactions ?? [],
      });
      push(`Imported ${data.accounts?.length ?? 0} accounts · ${data.transactions?.length ?? 0} movements`);
    } catch (error) {
      push(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6">
      <header>
        <Eyebrow>Account Aggregator</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">Setu sandbox</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Live FIU keys are in use. This is still sandbox: Setu FIP / FIP-2 mock banks, not your HDFC login.
          Bank OTP for FIP-2 is <span className="text-gold">123456</span>.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Eyebrow>FIPs</Eyebrow>
          <p className="mt-3 tabular text-3xl">{fips?.count ?? "—"}</p>
          <p className="mt-1 text-sm text-muted">{fips?.ok ? "Sandbox directory reachable" : fips?.error}</p>
        </Card>
        <Card>
          <Eyebrow>Next bank to link</Eyebrow>
          <p className="mt-3 text-lg">Setu FIP-2</p>
          <p className="mt-1 text-sm text-muted">Static OTP 123456</p>
        </Card>
        <Card>
          <Eyebrow>Consent</Eyebrow>
          <p className="mt-3 text-lg">{consentId ? "Created" : "Not started"}</p>
          <p className="mt-1 text-sm text-muted">{consentId ?? "Call create consent after availability"}</p>
        </Card>
      </div>

      <Card>
        <Eyebrow>1. Discover accounts on AA rails</Eyebrow>
        <div className="mt-4 flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Mobile for VUA"
          />
          <Button onClick={checkAvailability} disabled={busy === "availability"}>
            {busy === "availability" ? "Checking…" : "Check availability"}
          </Button>
        </div>
        {handles.length > 0 ? (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {handles.map((handle) => (
              <li key={handle.aa} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2 text-sm">
                <span>
                  {handle.aa} · {handle.vua}
                </span>
                <Badge tone={handle.status ? "jade" : "muted"}>{handle.status ? "Found" : "No"}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card>
        <Eyebrow>2. Create consent and open Setu screens</Eyebrow>
        <p className="mt-2 text-sm text-muted">
          Put <b>your</b> 10-digit mobile above. Finvu SMS-OTP goes to that number. Then pick{" "}
          <b>Setu FIP-2</b> and use bank OTP <span className="text-gold">123456</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={startConsent} disabled={busy === "consent"}>
            {busy === "consent" ? "Creating…" : "Start consent"}
          </Button>
          {consentUrl ? (
            <Button variant="ghost" onClick={() => window.open(consentUrl, "_blank")}>
              Reopen webview
            </Button>
          ) : null}
          <Button variant="ghost" onClick={importData} disabled={!consentId || busy === "fetch"}>
            {busy === "fetch" ? "Fetching FI…" : "Import FI data"}
          </Button>
        </div>
      </Card>

      {fips?.banks?.length ? (
        <Card>
          <Eyebrow>Directory sample</Eyebrow>
          <p className="mt-3 text-sm text-muted">{fips.banks.join(" · ")}</p>
        </Card>
      ) : null}

      {log.length > 0 ? (
        <Card>
          <Eyebrow>Trace</Eyebrow>
          <ul className="mt-3 grid gap-1 font-mono text-xs text-muted">
            {log.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
