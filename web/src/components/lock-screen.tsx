"use client";

import { Fingerprint } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui";
import { useFinance } from "@/lib/store";

export function LockScreen() {
  const { state, unlock } = useFinance();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  const submit = (value: string) => {
    const ok = unlock(value);
    if (!ok) {
      setError("PIN does not match this vault.");
      setPin("");
    }
  };

  const biometric = async () => {
    setScanning(true);
    setError("");
    await new Promise((r) => setTimeout(r, 900));
    if (state.biometricEnabled) {
      unlock(state.pin);
    } else {
      setError("Biometric unlock is switched off in settings.");
      setScanning(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rise rounded-3xl bg-[rgba(16,36,48,0.8)] p-8 text-center shadow-[inset_0_0_0_1px_rgba(230,179,90,0.2)]">
        <BrandMark />
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Unlock vault</h1>
        <p className="mt-2 text-sm text-muted">
          Hardware-backed gate for {state.user?.fullName ?? "your ledger"}. Windows Hello / Face ID
          path is simulated in this web build; PIN is the fallback.
        </p>
        <div className="mx-auto mt-8 grid max-w-xs grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key) => (
            <button
              key={key || "blank"}
              disabled={!key}
              onClick={() => {
                setError("");
                if (key === "⌫") {
                  setPin((p) => p.slice(0, -1));
                  return;
                }
                const next = (pin + key).slice(0, 4);
                setPin(next);
                if (next.length === 4) submit(next);
              }}
              className="grid h-14 place-items-center rounded-2xl text-lg text-paper transition hover:bg-white/5 disabled:opacity-0"
            >
              {key}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i < pin.length ? "bg-gold" : "bg-white/15"}`}
            />
          ))}
        </div>
        {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
        <Button className="mt-6 w-full" variant="ghost" onClick={biometric} disabled={scanning}>
          <span className="relative grid h-5 w-5 place-items-center">
            {scanning ? (
              <span className="absolute inset-0 animate-[pulse-ring_1s_ease-out_infinite] rounded-full bg-jade/40" />
            ) : null}
            <Fingerprint size={18} />
          </span>
          {scanning ? "Reading sensor…" : "Use biometric"}
        </Button>
        <p className="mt-4 text-xs text-muted">Demo PIN {state.pin}</p>
      </div>
    </div>
  );
}

export function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="text-center">
        <BrandMark />
        <p className="mt-4 text-sm tracking-[0.25em] text-muted uppercase">Loading ledger</p>
      </div>
    </div>
  );
}
