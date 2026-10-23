"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, Eyebrow, Field, Input, Modal, Progress, Select } from "@/components/ui";
import { formatInr, ordinal } from "@/lib/format";
import { daysUntilDue, monthlyEmiBurden, totalInterestCost, totalLoanPrincipal } from "@/lib/selectors";
import { useFinance } from "@/lib/store";
import type { ActiveEmi } from "@/lib/types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function DebtPage() {
  const { state, addEmi } = useFinance();
  const [open, setOpen] = useState(false);
  const burden = monthlyEmiBurden(state.emis);
  const principal = totalLoanPrincipal(state.emis);

  const calendar = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const cells: Array<{ day: number | null; emis: ActiveEmi[] }> = [];
    for (let i = 0; i < start.getDay(); i += 1) cells.push({ day: null, emis: [] });
    for (let d = 1; d <= days; d += 1) {
      cells.push({
        day: d,
        emis: state.emis.filter((e) => e.emiDueDate === d),
      });
    }
    return cells;
  }, [state.emis]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>EMI & debt command center</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">Active obligations</h1>
          <p className="mt-2 text-sm text-muted">
            Auto-debit calendar with reminders three days before each mandate.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Register EMI</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Eyebrow>Monthly outgo</Eyebrow>
          <p className="mt-3 tabular text-3xl">{formatInr(burden)}</p>
        </Card>
        <Card>
          <Eyebrow>Remaining principal</Eyebrow>
          <p className="mt-3 tabular text-3xl">{formatInr(principal)}</p>
        </Card>
        <Card>
          <Eyebrow>Live loans</Eyebrow>
          <p className="mt-3 tabular text-3xl">{state.emis.length}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          {state.emis.map((emi) => {
            const paid = 1 - emi.remainingTenureMonths / emi.totalTenureMonths;
            const days = daysUntilDue(emi.emiDueDate);
            const interest = totalInterestCost(emi);
            return (
              <Card key={emi.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg text-paper">{emi.loanTitle}</p>
                    <p className="text-sm text-muted">
                      {emi.lender} · {emi.loanKind.replaceAll("_", " ")}
                    </p>
                  </div>
                  <Badge tone={days <= 3 ? "coral" : emi.mandateStatus === "ACTIVE" ? "jade" : "gold"}>
                    {days <= 3 ? `Debit in ${days}d` : emi.mandateStatus}
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <Metric label="EMI" value={formatInr(emi.monthlyEmiAmount)} />
                  <Metric label="Left" value={formatInr(emi.remainingPrincipal)} />
                  <Metric label="Tenure" value={`${emi.remainingTenureMonths}/${emi.totalTenureMonths} mo`} />
                  <Metric label="Interest cost" value={formatInr(interest)} />
                </div>
                <div className="mt-4">
                  <Progress value={paid} tone="gold" />
                  <p className="mt-2 text-xs text-muted">
                    Due on the {ordinal(emi.emiDueDate)} · {emi.interestRate}% p.a.
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <Eyebrow>Auto-debit calendar</Eyebrow>
          <p className="mt-1 text-sm text-muted">
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
            {WEEKDAYS.map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
            {calendar.map((cell, i) => (
              <div
                key={i}
                className={`min-h-12 rounded-xl p-1 ${
                  cell.emis.length
                    ? "bg-gold/15 text-gold"
                    : cell.day
                      ? "bg-black/20 text-muted"
                      : ""
                }`}
              >
                {cell.day ?? ""}
                {cell.emis.length ? (
                  <span className="mt-1 block text-[9px] leading-3 text-gold-2">
                    {cell.emis[0].loanTitle.split(" ")[0]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AddEmiModal
        open={open}
        onClose={() => setOpen(false)}
        accounts={state.accounts}
        onSave={(emi) => {
          addEmi(emi);
          setOpen(false);
        }}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular text-sm text-paper">{value}</p>
    </div>
  );
}

function AddEmiModal({
  open,
  onClose,
  accounts,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; institutionName: string }[];
  onSave: (emi: Omit<ActiveEmi, "id" | "userId" | "createdAt">) => void;
}) {
  const [loanTitle, setLoanTitle] = useState("");
  const [lender, setLender] = useState("HDFC Bank");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [monthly, setMonthly] = useState("5000");
  const [principal, setPrincipal] = useState("60000");
  const [tenure, setTenure] = useState("12");
  const [due, setDue] = useState("10");
  const [rate, setRate] = useState("12");

  return (
    <Modal open={open} title="Register a loan" onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const monthlyEmiAmount = Number(monthly);
          const totalPrincipal = Number(principal);
          const totalTenureMonths = Number(tenure);
          onSave({
            accountId,
            loanTitle: loanTitle || "New EMI",
            lender,
            loanKind: "PERSONAL",
            totalPrincipal,
            remainingPrincipal: totalPrincipal,
            monthlyEmiAmount,
            totalTenureMonths,
            remainingTenureMonths: totalTenureMonths,
            emiDueDate: Math.min(31, Math.max(1, Number(due))),
            interestRate: Number(rate),
            mandateStatus: "PENDING",
          });
        }}
      >
        <Field label="Title">
          <Input value={loanTitle} onChange={(e) => setLoanTitle(e.target.value)} required />
        </Field>
        <Field label="Lender">
          <Input value={lender} onChange={(e) => setLender(e.target.value)} />
        </Field>
        <Field label="Linked account">
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.institutionName}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="EMI ₹">
            <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </Field>
          <Field label="Principal ₹">
            <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          </Field>
          <Field label="Tenure months">
            <Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} />
          </Field>
          <Field label="Due day">
            <Input type="number" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <Field label="Interest %">
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Button type="submit">Add to desk</Button>
      </form>
    </Modal>
  );
}
