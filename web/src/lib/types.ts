export const ACCOUNT_TYPES = [
  "SAVINGS",
  "CURRENT",
  "CREDIT_CARD",
  "WALLET",
  "FD",
  "MUTUAL_FUND",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_TYPES = ["DEBIT", "CREDIT"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_MODES = [
  "UPI",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "NET_BANKING",
  "ATM",
] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const SPEND_CATEGORIES = [
  "Food",
  "Utilities",
  "Travel",
  "Shopping",
  "Health",
  "Entertainment",
  "Fuel",
  "Transfers",
  "Income",
  "EMI",
] as const;
export type SpendCategory = (typeof SPEND_CATEGORIES)[number];

export type User = {
  id: string;
  fullName: string;
  phoneNumber: string;
  panNumber: string;
  city: string;
  createdAt: string;
};

export type Account = {
  id: string;
  userId: string;
  accountType: AccountType;
  institutionName: string;
  accountMask: string;
  creditLimit: number;
  currentBalance: number;
  updatedAt: string;
  aaLinked: boolean;
};

export type LedgerTransaction = {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  transactionType: TransactionType;
  paymentMode: PaymentMode;
  merchantName: string;
  category: SpendCategory;
  transactionDate: string;
  rawSmsHash: string;
};

export type ActiveEmi = {
  id: string;
  userId: string;
  accountId: string;
  loanTitle: string;
  lender: string;
  loanKind: "HOME" | "PERSONAL" | "CARD_EMI" | "BNPL";
  totalPrincipal: number;
  remainingPrincipal: number;
  monthlyEmiAmount: number;
  totalTenureMonths: number;
  remainingTenureMonths: number;
  emiDueDate: number;
  interestRate: number;
  mandateStatus: "ACTIVE" | "PENDING" | "FAILED";
  createdAt: string;
};

export type CreditProfile = {
  bureau: "Experian" | "CRIF High Mark";
  score: number;
  fetchedAt: string;
  paymentHistory: number;
  creditAgeMonths: number;
  hardEnquiries: number;
  totalAccounts: number;
};

export type Consents = {
  accountAggregator: boolean;
  creditBureau: boolean;
  smsParser: boolean;
  grantedAt: string | null;
};

export type AppAlert = {
  id: string;
  kind: "UTILIZATION" | "EMI_REMINDER" | "BUDGET" | "CONSENT";
  title: string;
  body: string;
  severity: "info" | "warn" | "critical";
  href: string;
};

export type FinanceState = {
  user: User | null;
  pin: string;
  biometricEnabled: boolean;
  onboarded: boolean;
  aaConnected: boolean;
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  accounts: Account[];
  transactions: LedgerTransaction[];
  emis: ActiveEmi[];
  creditProfile: CreditProfile | null;
  consents: Consents;
  netHistory: { month: string; standings: number }[];
};

export type SessionState = {
  hydrated: boolean;
  unlocked: boolean;
};
