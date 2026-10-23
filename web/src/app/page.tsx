"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand";
import { LockScreen, Splash } from "@/components/lock-screen";
import { Button, Field, Input } from "@/components/ui";
import { DEMO_PIN } from "@/lib/seed";
import { useFinance } from "@/lib/store";

const STEPS = ["Welcome", "Consent", "Vault"];

export default function HomePage() {
  const { hydrated, state, completeOnboarding, unlocked } = useFinance();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("Priya Menon");
  const [phoneNumber, setPhoneNumber] = useState("9845011223");
  const [panNumber, setPanNumber] = useState("BKMPM4821Q");
  const [pin, setPin] = useState(DEMO_PIN);
  const [aa, setAa] = useState(true);
  const [credit, setCredit] = useState(true);
  const [sms, setSms] = useState(true);

  useEffect(() => {
    if (hydrated && state.onboarded && unlocked) router.replace("/dashboard");
  }, [hydrated, state.onboarded, unlocked, router]);

  if (!hydrated) return <Splash />;
  if (state.onboarded && !unlocked) return <LockScreen />;
  if (state.onboarded && unlocked) return <Splash />;

  const consentsOk = aa && credit && sms;

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rise">
        <BrandMark />
        <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-gold-2/80">
          Built for the Indian financial stack
        </p>
        <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-5xl leading-[1.05] text-paper md:text-6xl">
          See every rupee, EMI, and bureau pulse in one private ledger.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted">
          Account Aggregator consents, on-device SMS parsing, and Experian/CRIF pulls — surfaced as
          net standings, spend velocity, and a debt command desk. Web build of the FinStack India spec.
        </p>
        <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
          {[
            ["₹11.4 L", "Demo assets"],
            ["30%", "Utilisation tripwire"],
            ["DPDP", "Export or purge"],
          ].map(([k, v]) => (
            <div key={v} className="rounded-2xl bg-black/20 p-3 shadow-[inset_0_0_0_1px_rgba(230,179,90,0.14)]">
              <dt className="tabular text-lg text-gold-2">{k}</dt>
              <dd className="text-xs text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rise delay-2 rounded-3xl bg-[rgba(16,36,48,0.78)] p-6 shadow-[inset_0_0_0_1px_rgba(230,179,90,0.2)] md:p-8">
        <div className="mb-6 flex gap-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-xs ${i === step ? "bg-gold text-ink" : "text-muted"}`}
            >
              {label}
            </span>
          ))}
        </div>

        {step === 0 ? (
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl">Enter the vault</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This session loads a Bengaluru demo household — HDFC, SBI, ICICI, Flipkart Axis BNPL —
              so every screen is interactive without live AA credentials.
            </p>
            <Button className="mt-6 w-full" onClick={() => setStep(1)}>
              Continue
            </Button>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl">DPDP consent</h2>
            <p className="mt-2 text-sm text-muted">
              Nothing is ingested until you opt in. Consents can be revoked later from the privacy portal.
            </p>
            <div className="mt-5 grid gap-3">
              <ConsentRow
                title="Account Aggregator"
                body="Encrypted bank, FD, and mutual fund ledgers via Setu / Finvu / Anumati."
                checked={aa}
                onChange={setAa}
              />
              <ConsentRow
                title="Credit bureau"
                body="Experian / CRIF High Mark score using PAN + OTP."
                checked={credit}
                onChange={setCredit}
              />
              <ConsentRow
                title="On-device SMS parser"
                body="Transactional SMS stays in the local sandbox. Only structured hashes leave the device."
                checked={sms}
                onChange={setSms}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button className="flex-1" disabled={!consentsOk} onClick={() => setStep(2)}>
                Grant & continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              completeOnboarding({
                fullName,
                phoneNumber,
                panNumber,
                pin,
                consents: {
                  accountAggregator: aa,
                  creditBureau: credit,
                  smsParser: sms,
                },
              });
              router.push("/dashboard");
            }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-3xl">Your vault keys</h2>
            <Field label="Full name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </Field>
            <Field label="Mobile" hint="Indian 10-digit number">
              <Input
                inputMode="numeric"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </Field>
            <Field label="PAN">
              <Input
                value={panNumber}
                maxLength={10}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                required
              />
            </Field>
            <Field label="4-digit PIN" hint={`Demo default ${DEMO_PIN}`}>
              <Input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                required
              />
            </Field>
            <div className="mt-2 flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={pin.length !== 4}>
                Open ledger
              </Button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function ConsentRow({
  title,
  body,
  checked,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-black/20 p-3 shadow-[inset_0_0_0_1px_rgba(230,179,90,0.12)]">
      <input
        type="checkbox"
        className="mt-1 accent-[#e6b35a]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm text-paper">{title}</span>
        <span className="block text-xs leading-5 text-muted">{body}</span>
      </span>
    </label>
  );
}
