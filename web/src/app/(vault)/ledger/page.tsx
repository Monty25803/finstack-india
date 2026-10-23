"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, Eyebrow, Field, Input, Modal, Select } from "@/components/ui";
import { formatDayMonth, formatInr, formatTime } from "@/lib/format";
import { accountById } from "@/lib/selectors";
import { useFinance } from "@/lib/store";
import {
  PAYMENT_MODES,
  SPEND_CATEGORIES,
  type PaymentMode,
  type SpendCategory,
  type TransactionType,
} from "@/lib/types";

export default function LedgerPage() {
  const { state, addTransaction } = useFinance();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [mode, setMode] = useState<string>("ALL");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    return state.transactions
      .filter((tx) => {
        const hay = `${tx.merchantName} ${tx.category} ${tx.paymentMode}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (category !== "ALL" && tx.category !== category) return false;
        if (mode !== "ALL" && tx.paymentMode !== mode) return false;
        return true;
      })
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  }, [state.transactions, q, category, mode]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>On-device classified ledger</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">Transactions</h1>
          <p className="mt-2 text-sm text-muted">
            Raw SMS never leaves the sandbox. Only hashed structured rows are stored.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Log entry</Button>
      </header>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <Input
            placeholder="Search merchant, category, rail…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="ALL">All verticals</option>
            {SPEND_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="ALL">All rails</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card padded={false}>
        <ul className="divide-y divide-[rgba(230,179,90,0.1)]">
          {rows.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-muted">No matching rows.</li>
          ) : null}
          {rows.map((tx) => {
            const account = accountById(state.accounts, tx.accountId);
            const credit = tx.transactionType === "CREDIT";
            return (
              <li key={tx.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm text-paper">{tx.merchantName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDayMonth(tx.transactionDate)} · {formatTime(tx.transactionDate)} ·{" "}
                    {account?.institutionName} · {tx.paymentMode.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted/70">sms {tx.rawSmsHash}</p>
                </div>
                <div className="text-right">
                  <p className={`tabular text-sm ${credit ? "text-jade" : "text-paper"}`}>
                    {credit ? "+" : "−"}
                    {formatInr(tx.amount)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <Badge tone={credit ? "jade" : "gold"}>{tx.category}</Badge>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <LogModal
        open={open}
        accounts={state.accounts}
        onClose={() => setOpen(false)}
        onSave={(entry) => {
          addTransaction(entry);
          setOpen(false);
        }}
      />
    </div>
  );
}

function LogModal({
  open,
  onClose,
  accounts,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; institutionName: string }[];
  onSave: (entry: {
    accountId: string;
    amount: number;
    transactionType: TransactionType;
    paymentMode: PaymentMode;
    merchantName: string;
    category: SpendCategory;
  }) => void;
}) {
  const [merchantName, setMerchantName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [transactionType, setTransactionType] = useState<TransactionType>("DEBIT");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [category, setCategory] = useState<SpendCategory>("Food");

  return (
    <Modal open={open} title="Log a movement" onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            accountId,
            amount: Number(amount),
            transactionType,
            paymentMode,
            merchantName: merchantName || "Manual entry",
            category,
          });
        }}
      >
        <Field label="Merchant">
          <Input value={merchantName} onChange={(e) => setMerchantName(e.target.value)} required />
        </Field>
        <Field label="Amount ₹">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Direction">
            <Select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as TransactionType)}
            >
              <option>DEBIT</option>
              <option>CREDIT</option>
            </Select>
          </Field>
          <Field label="Rail">
            <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
              {PAYMENT_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Account">
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.institutionName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Vertical">
          <Select value={category} onChange={(e) => setCategory(e.target.value as SpendCategory)}>
            {SPEND_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Post to ledger</Button>
      </form>
    </Modal>
  );
}
