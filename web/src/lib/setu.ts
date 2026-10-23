import { hashSms, uid } from "@/lib/format";
import type { Account, AccountType, LedgerTransaction, PaymentMode, SpendCategory } from "@/lib/types";

const TOKEN_URL = "https://uat.setu.co/api/v2/auth/token";
const FIU_URL = "https://fiu-sandbox.setu.co";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing from .env`);
  return value;
}

export async function getSetuToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientID: requireEnv("CLIENT_ID"),
      secret: requireEnv("CLIENT_SECRET"),
    }),
    cache: "no-store",
  });
  const json = (await res.json()) as {
    data?: { token?: string; accessToken?: string };
    error?: { title?: string; detail?: string };
  };
  const token = json.data?.token ?? json.data?.accessToken;
  if (!res.ok || !token) {
    throw new Error(json.error?.detail ?? json.error?.title ?? "Setu token failed");
  }
  return token;
}

async function fiuFetch(path: string, init: RequestInit = {}) {
  const token = await getSetuToken();
  const res = await fetch(`${FIU_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-product-instance-id": requireEnv("PRODUCT_INSTANCE_ID"),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

export type SetuFip = {
  id?: string;
  name?: string;
  fipId?: string;
};

export async function listSetuFips() {
  const { ok, json } = await fiuFetch("/v2/fips");
  const fips = (json.data ?? json.fips ?? []) as SetuFip[];
  if (!ok) throw new Error(json.errorMsg ?? json.error?.detail ?? "Setu FIP list failed");
  return fips;
}

export async function checkAccountAvailability(mobileNumber: string) {
  const { ok, json } = await fiuFetch("/v2/account-availability", {
    method: "POST",
    body: JSON.stringify({ mobileNumber: mobileNumber.replace(/\D/g, "").slice(-10) }),
  });
  if (!ok) throw new Error(json.errorMsg ?? "Account availability failed");
  return (json.accounts ?? []) as { aa: string; vua: string; status: boolean }[];
}

export async function createSetuConsent(mobileNumber: string) {
  const digits = mobileNumber.replace(/\D/g, "").slice(-10) || "9999999999";
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  const redirectUrl = process.env.SETU_REDIRECT_URL ?? "http://localhost:3001/connect";
  const { ok, status, json } = await fiuFetch("/v2/consents", {
    method: "POST",
    body: JSON.stringify({
      consentDuration: { unit: "MONTH", value: "12" },
      vua: `${digits}@finvu`,
      dataRange: { from: from.toISOString(), to: new Date().toISOString() },
      redirectUrl,
      fetchType: "PERIODIC",
      consentMode: "STORE",
      consentTypes: ["TRANSACTIONS"],
      fiTypes: ["DEPOSIT"],
      dataLife: { unit: "MONTH", value: "1" },
      frequency: { unit: "MONTH", value: 1 },
      context: [{ key: "fipId", value: "setu-fip-2" }],
    }),
  });
  if (!ok) {
    const err = new Error(json.errorMsg ?? json.errorCode ?? "Create consent failed") as Error & {
      status?: number;
      code?: string;
    };
    err.status = status;
    err.code = json.errorCode;
    throw err;
  }
  return json as { id: string; url: string; status: string };
}

export async function getSetuConsent(id: string) {
  const { ok, json } = await fiuFetch(`/v2/consents/${id}?expanded=true`);
  if (!ok) throw new Error(json.errorMsg ?? "Get consent failed");
  return json as {
    id: string;
    status: string;
    url?: string;
    accountsLinked?: unknown[];
    detail?: { dataRange?: { from?: string; to?: string } };
  };
}

export async function createDataSession(consentId: string) {
  const consent = await getSetuConsent(consentId);
  const range = consent.detail?.dataRange;
  const to = range?.to ? new Date(range.to) : new Date(Date.now() - 60_000);
  const from = range?.from ? new Date(range.from) : new Date(to.getTime());
  if (!range?.from) from.setMonth(from.getMonth() - 11);
  const { ok, json } = await fiuFetch("/v2/sessions", {
    method: "POST",
    body: JSON.stringify({
      consentId,
      dataRange: { from: from.toISOString(), to: to.toISOString() },
      format: "json",
    }),
  });
  if (!ok) throw new Error(json.errorMsg ?? "Create session failed");
  return json as { id: string; status: string; consentId: string };
}

export async function getDataSession(id: string) {
  const { ok, json } = await fiuFetch(`/v2/sessions/${id}`);
  if (!ok) throw new Error(json.errorMsg ?? "Fetch session failed");
  return json;
}

export async function listDataSessions(consentId: string) {
  const { ok, json } = await fiuFetch(`/v2/consents/${consentId}/data-sessions`);
  if (!ok) throw new Error(json.errorMsg ?? "List sessions failed");
  const sessions = (json.dataSessions ?? []) as { sessionId: string; status: string }[];
  return sessions;
}

function accountTypeFromFi(raw: string): AccountType {
  const value = raw.toUpperCase();
  if (value.includes("CREDIT")) return "CREDIT_CARD";
  if (value.includes("CURRENT")) return "CURRENT";
  if (value.includes("TERM") || value.includes("FD") || value === "TERM_DEPOSIT") {
    return "FD";
  }
  if (value.includes("MUTUAL") || value.includes("ETF")) return "MUTUAL_FUND";
  if (value.includes("WALLET")) return "WALLET";
  return "SAVINGS";
}

function paymentModeFromFi(raw: string): PaymentMode {
  const value = raw.toUpperCase();
  if (value.includes("UPI")) return "UPI";
  if (value.includes("CREDIT")) return "CREDIT_CARD";
  if (value.includes("DEBIT")) return "DEBIT_CARD";
  if (value.includes("ATM")) return "ATM";
  return "NET_BANKING";
}

function categoryFromNarration(narration: string): SpendCategory {
  const value = narration.toLowerCase();
  if (value.includes("swiggy") || value.includes("zomato") || value.includes("food")) return "Food";
  if (value.includes("uber") || value.includes("irctc") || value.includes("fuel")) return "Travel";
  if (value.includes("amazon") || value.includes("flipkart")) return "Shopping";
  if (value.includes("emi") || value.includes("loan")) return "EMI";
  if (value.includes("salary") || value.includes("payroll")) return "Income";
  return "Transfers";
}

export function mapFiToLedger(session: Record<string, unknown>, userId: string) {
  const accounts: Account[] = [];
  const transactions: LedgerTransaction[] = [];
  const fips = (session.fips ?? session.fiData ?? []) as Array<Record<string, unknown>>;

  for (const fip of fips) {
    const institution = String(fip.fipID ?? fip.fipId ?? "Setu FIP");
    const rows = (fip.accounts ?? fip.data ?? []) as Array<Record<string, unknown>>;
    for (const row of rows) {
      const data = row.data as Record<string, unknown> | undefined;
      const decrypted = (data?.account ??
        (row.decryptedFI as Record<string, unknown> | undefined)?.account ??
        row.account) as Record<string, unknown> | undefined;
      if (!decrypted) continue;
      const summary = (decrypted.summary ?? {}) as Record<string, unknown>;
      const mask = String(decrypted.maskedAccNumber ?? row.maskedAccNumber ?? "0000").slice(-4);
      const id = `acc_setu_${mask}_${accounts.length}`;
      const type = accountTypeFromFi(String(summary.type ?? decrypted.type ?? "SAVINGS"));
      const balance = Number(summary.currentBalance ?? 0);
      accounts.push({
        id,
        userId,
        accountType: type,
        institutionName: institution.replaceAll("-", " "),
        accountMask: mask,
        creditLimit: type === "CREDIT_CARD" ? Number(summary.currentODLimit ?? 0) : 0,
        currentBalance: Number.isFinite(balance) ? balance : 0,
        updatedAt: new Date().toISOString(),
        aaLinked: true,
      });

      const txnBlock = (decrypted.transactions ?? {}) as Record<string, unknown>;
      const rawTx = txnBlock.transaction;
      const list = Array.isArray(rawTx) ? rawTx : rawTx ? [rawTx] : [];
      for (const item of list as Array<Record<string, unknown>>) {
        const amount = Number(item.amount ?? 0);
        const kind = String(item.type ?? "DEBIT").toUpperCase() === "CREDIT" ? "CREDIT" : "DEBIT";
        const when = String(item.transactionTimestamp ?? item.valueDate ?? new Date().toISOString());
        const merchant = String(item.narration ?? "Setu FI movement");
        transactions.push({
          id: uid("tx"),
          userId,
          accountId: id,
          amount: Number.isFinite(amount) ? amount : 0,
          transactionType: kind,
          paymentMode: paymentModeFromFi(String(item.mode ?? "")),
          merchantName: merchant.slice(0, 100),
          category: kind === "CREDIT" ? "Income" : categoryFromNarration(merchant),
          transactionDate: when,
          rawSmsHash: hashSms(`${id}:${merchant}:${amount}:${when}`),
        });
      }
    }
  }

  return { accounts, transactions };
}
