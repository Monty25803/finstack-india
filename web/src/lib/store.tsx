"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hashSms, uid } from "./format";
import { deriveAlerts } from "./selectors";
import { createDemoLedger, emptyLedger } from "./seed";
import type {
  Account,
  ActiveEmi,
  AppAlert,
  Consents,
  FinanceState,
  LedgerTransaction,
  PaymentMode,
  SpendCategory,
  TransactionType,
} from "./types";

const STORAGE_KEY = "finstack.india.v1";
const SESSION_KEY = "finstack.india.unlocked";

type StoreContextValue = {
  state: FinanceState;
  hydrated: boolean;
  unlocked: boolean;
  alerts: AppAlert[];
  unlock: (pin: string) => boolean;
  lock: () => void;
  completeOnboarding: (input: {
    fullName: string;
    phoneNumber: string;
    panNumber: string;
    pin: string;
    consents: Omit<Consents, "grantedAt">;
  }) => void;
  addTransaction: (input: {
    accountId: string;
    amount: number;
    transactionType: TransactionType;
    paymentMode: PaymentMode;
    merchantName: string;
    category: SpendCategory;
  }) => void;
  addEmi: (input: Omit<ActiveEmi, "id" | "userId" | "createdAt">) => void;
  setBudget: (monthlyBudget: number) => void;
  setCategoryBudget: (category: string, amount: number) => void;
  updateConsents: (patch: Partial<Consents>) => void;
  setCreditFetched: () => void;
  connectAa: () => void;
  applyAaSnapshot: (input: { accounts: Account[]; transactions: LedgerTransaction[] }) => void;
  payCard: (accountId: string, amount: number) => void;
  toggleBiometric: () => void;
  exportLedger: () => string;
  purgeProfile: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function applyTransaction(state: FinanceState, tx: LedgerTransaction): FinanceState {
  const accounts = state.accounts.map((account) => {
    if (account.id !== tx.accountId) return account;
    const next = { ...account, updatedAt: tx.transactionDate };
    if (account.accountType === "CREDIT_CARD") {
      next.currentBalance =
        tx.transactionType === "DEBIT"
          ? account.currentBalance + tx.amount
          : Math.max(0, account.currentBalance - tx.amount);
    } else {
      next.currentBalance =
        tx.transactionType === "DEBIT"
          ? account.currentBalance - tx.amount
          : account.currentBalance + tx.amount;
    }
    return next;
  });
  return { ...state, accounts, transactions: [tx, ...state.transactions] };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(emptyLedger);
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FinanceState;
        setState({ ...emptyLedger(), ...parsed });
      }
      setUnlocked(sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      setState(emptyLedger());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const unlock = useCallback(
    (pin: string) => {
      if (pin !== state.pin) return false;
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
      return true;
    },
    [state.pin],
  );

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  }, []);

  const completeOnboarding = useCallback(
    (input: {
      fullName: string;
      phoneNumber: string;
      panNumber: string;
      pin: string;
      consents: Omit<Consents, "grantedAt">;
    }) => {
      const demo = createDemoLedger();
      setState({
        ...demo,
        pin: input.pin || demo.pin,
        user: {
          ...demo.user!,
          fullName: input.fullName.trim() || demo.user!.fullName,
          phoneNumber: input.phoneNumber.replace(/\D/g, "").slice(-10),
          panNumber: input.panNumber.toUpperCase(),
        },
        consents: {
          ...input.consents,
          grantedAt: new Date().toISOString(),
        },
        onboarded: true,
      });
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    },
    [],
  );

  const addTransaction = useCallback(
    (input: {
      accountId: string;
      amount: number;
      transactionType: TransactionType;
      paymentMode: PaymentMode;
      merchantName: string;
      category: SpendCategory;
    }) => {
      setState((prev) => {
        if (!prev.user) return prev;
        const now = new Date().toISOString();
        const tx: LedgerTransaction = {
          id: uid("tx"),
          userId: prev.user.id,
          accountId: input.accountId,
          amount: input.amount,
          transactionType: input.transactionType,
          paymentMode: input.paymentMode,
          merchantName: input.merchantName,
          category: input.category,
          transactionDate: now,
          rawSmsHash: hashSms(`${input.merchantName}:${input.amount}:${now}`),
        };
        return applyTransaction(prev, tx);
      });
    },
    [],
  );

  const addEmi = useCallback((input: Omit<ActiveEmi, "id" | "userId" | "createdAt">) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const emi: ActiveEmi = {
        ...input,
        id: uid("emi"),
        userId: prev.user.id,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, emis: [emi, ...prev.emis] };
    });
  }, []);

  const setBudget = useCallback((monthlyBudget: number) => {
    setState((prev) => ({ ...prev, monthlyBudget }));
  }, []);

  const setCategoryBudget = useCallback((category: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      categoryBudgets: { ...prev.categoryBudgets, [category]: amount },
    }));
  }, []);

  const updateConsents = useCallback((patch: Partial<Consents>) => {
    setState((prev) => ({
      ...prev,
      consents: { ...prev.consents, ...patch },
    }));
  }, []);

  const setCreditFetched = useCallback(() => {
    setState((prev) => ({
      ...prev,
      creditProfile: {
        bureau: "Experian",
        score: prev.creditProfile?.score ?? 778,
        fetchedAt: new Date().toISOString(),
        paymentHistory: prev.creditProfile?.paymentHistory ?? 98,
        creditAgeMonths: prev.creditProfile?.creditAgeMonths ?? 86,
        hardEnquiries: prev.creditProfile?.hardEnquiries ?? 2,
        totalAccounts: prev.creditProfile?.totalAccounts ?? prev.accounts.length,
      },
    }));
  }, []);

  const connectAa = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aaConnected: true,
      accounts: prev.accounts.map((account) =>
        account.accountType === "WALLET" ? account : { ...account, aaLinked: true },
      ),
    }));
  }, []);

  const applyAaSnapshot = useCallback(
    (input: { accounts: Account[]; transactions: LedgerTransaction[] }) => {
      setState((prev) => ({
        ...prev,
        aaConnected: true,
        accounts: [
          ...input.accounts,
          ...prev.accounts.filter((account) => account.accountType === "WALLET"),
        ],
        transactions: [...input.transactions, ...prev.transactions],
      }));
    },
    [],
  );

  const payCard = useCallback((accountId: string, amount: number) => {
    setState((prev) => {
      const savings = prev.accounts.find((a) => a.accountType === "SAVINGS");
      if (!prev.user || !savings) return prev;
      const now = new Date().toISOString();
      const card = prev.accounts.find((a) => a.id === accountId);
      const tx: LedgerTransaction = {
        id: uid("tx"),
        userId: prev.user.id,
        accountId: savings.id,
        amount,
        transactionType: "DEBIT",
        paymentMode: "NET_BANKING",
        merchantName: `${card?.institutionName ?? "Card"} payment`,
        category: "Transfers",
        transactionDate: now,
        rawSmsHash: hashSms(`pay:${accountId}:${amount}:${now}`),
      };
      const withDebit = applyTransaction(prev, tx);
      const accounts = withDebit.accounts.map((account) => {
        if (account.id !== accountId) return account;
        return {
          ...account,
          currentBalance: Math.max(0, account.currentBalance - amount),
          updatedAt: now,
        };
      });
      return { ...withDebit, accounts };
    });
  }, []);

  const toggleBiometric = useCallback(() => {
    setState((prev) => ({ ...prev, biometricEnabled: !prev.biometricEnabled }));
  }, []);

  const exportLedger = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const purgeProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setState(emptyLedger());
    setUnlocked(false);
  }, []);

  const alerts = useMemo(() => (state.onboarded ? deriveAlerts(state) : []), [state]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      hydrated,
      unlocked,
      alerts,
      unlock,
      lock,
      completeOnboarding,
      addTransaction,
      addEmi,
      setBudget,
      setCategoryBudget,
      updateConsents,
      setCreditFetched,
      connectAa,
      applyAaSnapshot,
      payCard,
      toggleBiometric,
      exportLedger,
      purgeProfile,
    }),
    [
      state,
      hydrated,
      unlocked,
      alerts,
      unlock,
      lock,
      completeOnboarding,
      addTransaction,
      addEmi,
      setBudget,
      setCategoryBudget,
      updateConsents,
      setCreditFetched,
      connectAa,
      applyAaSnapshot,
      payCard,
      toggleBiometric,
      exportLedger,
      purgeProfile,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useFinance must be used within StoreProvider");
  return ctx;
}

export type { Account };
