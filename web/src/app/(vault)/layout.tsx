"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LockScreen, Splash } from "@/components/lock-screen";
import { AppShell } from "@/components/shell";
import { useFinance } from "@/lib/store";

export default function VaultLayout({ children }: { children: ReactNode }) {
  const { hydrated, state, unlocked } = useFinance();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.onboarded) router.replace("/");
  }, [hydrated, state.onboarded, router]);

  if (!hydrated) return <Splash />;
  if (!state.onboarded) return <Splash />;
  if (!unlocked) return <LockScreen />;
  return <AppShell>{children}</AppShell>;
}
