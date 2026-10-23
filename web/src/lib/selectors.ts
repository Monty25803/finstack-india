import type {
  Account,
  ActiveEmi,
  AppAlert,
  FinanceState,
  LedgerTransaction,
  PaymentMode,
  SpendCategory,
} from "./types";
import { monthKey } from "./format";

const BANK_TYPES = new Set(["SAVINGS", "CURRENT"]);
const ASSET_TYPES = new Set(["SAVINGS", "CURRENT", "WALLET", "FD", "MUTUAL_FUND"]);

export function bankBalances(accounts: Account[]) {
  return accounts
    .filter((a) => BANK_TYPES.has(a.accountType))
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

export function walletBalances(accounts: Account[]) {
  return accounts
    .filter((a) => a.accountType === "WALLET")
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

export function fdBalances(accounts: Account[]) {
  return accounts
    .filter((a) => a.accountType === "FD")
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

export function investmentBalances(accounts: Account[]) {
  return accounts
    .filter((a) => a.accountType === "MUTUAL_FUND")
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

export function creditOutstanding(accounts: Account[]) {
  return accounts
    .filter((a) => a.accountType === "CREDIT_CARD")
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

export function creditLimits(accounts: Account[]) {
  return accounts
    .filter((a) => a.accountType === "CREDIT_CARD")
    .reduce((sum, a) => sum + a.creditLimit, 0);
}

export function netStandings(accounts: Account[]) {
  return bankBalances(accounts) + walletBalances(accounts) - creditOutstanding(accounts);
}

export function totalAssets(accounts: Account[]) {
  return accounts
    .filter((a) => ASSET_TYPES.has(a.accountType))
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

export function totalLoanPrincipal(emis: ActiveEmi[]) {
  return emis.reduce((sum, e) => sum + e.remainingPrincipal, 0);
}

export function fullNetWorth(accounts: Account[], emis: ActiveEmi[]) {
  return totalAssets(accounts) - creditOutstanding(accounts) - totalLoanPrincipal(emis);
}

export function monthlyEmiBurden(emis: ActiveEmi[]) {
  return emis.reduce((sum, e) => sum + e.monthlyEmiAmount, 0);
}

export function inMonth(tx: LedgerTransaction, key = monthKey()) {
  return tx.transactionDate.slice(0, 7) === key;
}

export function monthSpend(transactions: LedgerTransaction[], key = monthKey()) {
  return transactions
    .filter((t) => inMonth(t, key) && t.transactionType === "DEBIT" && t.category !== "EMI")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthIncome(transactions: LedgerTransaction[], key = monthKey()) {
  return transactions
    .filter((t) => inMonth(t, key) && t.transactionType === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function spendByCategory(transactions: LedgerTransaction[], key = monthKey()) {
  const map = new Map<SpendCategory, number>();
  for (const t of transactions) {
    if (!inMonth(t, key) || t.transactionType !== "DEBIT" || t.category === "Income") continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function spendByMode(transactions: LedgerTransaction[], key = monthKey()) {
  const map = new Map<PaymentMode, number>();
  for (const t of transactions) {
    if (!inMonth(t, key) || t.transactionType !== "DEBIT") continue;
    map.set(t.paymentMode, (map.get(t.paymentMode) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([mode, amount]) => ({ mode, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function dailySpend(transactions: LedgerTransaction[], key = monthKey()) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!inMonth(t, key) || t.transactionType !== "DEBIT") continue;
    const day = t.transactionDate.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + t.amount);
  }
  const [year, month] = key.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const last = key === monthKey(today) ? today.getDate() : daysInMonth;
  return Array.from({ length: last }, (_, i) => {
    const date = `${key}-${String(i + 1).padStart(2, "0")}`;
    return { date, amount: map.get(date) ?? 0 };
  });
}

export function utilization(account: Account) {
  if (account.accountType !== "CREDIT_CARD" || account.creditLimit <= 0) return 0;
  return account.currentBalance / account.creditLimit;
}

export function blendedUtilization(accounts: Account[]) {
  const limit = creditLimits(accounts);
  if (limit <= 0) return 0;
  return creditOutstanding(accounts) / limit;
}

export function daysUntilDue(dueDay: number, from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  let due = new Date(year, month, dueDay);
  if (due < new Date(year, month, from.getDate())) {
    due = new Date(year, month + 1, dueDay);
  }
  const ms = due.getTime() - new Date(year, month, from.getDate()).getTime();
  return Math.round(ms / 86_400_000);
}

export function deriveAlerts(state: FinanceState): AppAlert[] {
  const alerts: AppAlert[] = [];
  for (const card of state.accounts.filter((a) => a.accountType === "CREDIT_CARD")) {
    const pct = utilization(card);
    if (pct >= 0.3) {
      alerts.push({
        id: `util_${card.id}`,
        kind: "UTILIZATION",
        title: `${card.institutionName} utilisation at ${(pct * 100).toFixed(0)}%`,
        body: "Credit utilisation crossed the 30% risk threshold. Paying down this card will protect your bureau score.",
        severity: pct >= 0.5 ? "critical" : "warn",
        href: "/credit",
      });
    }
  }

  for (const emi of state.emis) {
    const days = daysUntilDue(emi.emiDueDate);
    if (days <= 3) {
      alerts.push({
        id: `emi_${emi.id}`,
        kind: "EMI_REMINDER",
        title: `${emi.loanTitle} auto-debits in ${days} day${days === 1 ? "" : "s"}`,
        body: `Mandate ${emi.mandateStatus.toLowerCase()} · ${emi.lender} will pull the installment from the linked account.`,
        severity: days <= 1 ? "critical" : "warn",
        href: "/debt",
      });
    }
  }

  const spent = monthSpend(state.transactions);
  if (state.monthlyBudget > 0 && spent / state.monthlyBudget >= 0.85) {
    alerts.push({
      id: "budget_velocity",
      kind: "BUDGET",
      title: "Spend velocity is running hot",
      body: "You have used 85%+ of this month’s budget. Tighten discretionary categories to stay on plan.",
      severity: spent > state.monthlyBudget ? "critical" : "warn",
      href: "/spend",
    });
  }

  return alerts;
}

export function accountById(accounts: Account[], id: string) {
  return accounts.find((a) => a.id === id);
}

export function remainingInterest(emi: ActiveEmi) {
  const paidMonths = emi.totalTenureMonths - emi.remainingTenureMonths;
  const totalPayable = emi.monthlyEmiAmount * emi.totalTenureMonths;
  const estimatedPaid = emi.monthlyEmiAmount * paidMonths;
  return Math.max(0, totalPayable - emi.totalPrincipal - Math.max(0, estimatedPaid - (emi.totalPrincipal - emi.remainingPrincipal)));
}

export function totalInterestCost(emi: ActiveEmi) {
  return Math.max(0, emi.monthlyEmiAmount * emi.totalTenureMonths - emi.totalPrincipal);
}
