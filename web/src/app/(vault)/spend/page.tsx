"use client";

import { useMemo, useState } from "react";
import { DayBars, HBars, VelocityGauge } from "@/components/charts";
import { Button, Card, Eyebrow, Field, Input, Modal, Segmented } from "@/components/ui";
import { formatInr, monthLabel } from "@/lib/format";
import { dailySpend, monthIncome, monthSpend, spendByCategory, spendByMode } from "@/lib/selectors";
import { useFinance } from "@/lib/store";

export default function SpendPage() {
  const { state, setBudget, setCategoryBudget } = useFinance();
  const [open, setOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(state.monthlyBudget));
  const [view, setView] = useState<"category" | "mode">("category");

  const spent = useMemo(() => monthSpend(state.transactions), [state.transactions]);
  const income = useMemo(() => monthIncome(state.transactions), [state.transactions]);
  const cats = useMemo(() => spendByCategory(state.transactions), [state.transactions]);
  const modes = useMemo(() => spendByMode(state.transactions), [state.transactions]);
  const days = useMemo(() => dailySpend(state.transactions), [state.transactions]);
  const velocity = state.monthlyBudget > 0 ? spent / state.monthlyBudget : 0;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Monthly utilisation</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">Spend velocity</h1>
          <p className="mt-2 text-sm text-muted">{monthLabel()} versus the plan you set</p>
        </div>
        <Button variant="ghost" onClick={() => setOpen(true)}>
          Edit budget
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid place-items-center">
          <VelocityGauge value={velocity} label="of monthly limit" />
          <div className="mt-2 grid w-full grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-muted">Spent</p>
              <p className="tabular text-xl">{formatInr(spent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Income</p>
              <p className="tabular text-xl">{formatInr(income)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <Eyebrow>Daily outflow</Eyebrow>
          <div className="mt-6">
            <DayBars points={days} />
          </div>
          <p className="mt-3 text-xs text-muted">Each bar is a day in {monthLabel()}.</p>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>{view === "category" ? "Categorisation engine" : "Payment mode analytics"}</Eyebrow>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { id: "category", label: "Verticals" },
              { id: "mode", label: "UPI / Card / NB / ATM" },
            ]}
          />
        </div>
        {view === "category" ? (
          <HBars
            rows={cats
              .filter((c) => c.category !== "EMI" && c.category !== "Income")
              .map((c) => ({
                label: c.category,
                value: c.amount,
                cap: state.categoryBudgets[c.category],
              }))}
          />
        ) : (
          <HBars rows={modes.map((m) => ({ label: m.mode.replaceAll("_", " "), value: m.amount }))} />
        )}
      </Card>

      <Card>
        <Eyebrow>Category caps</Eyebrow>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.entries(state.categoryBudgets).map(([category, cap]) => {
            const used = cats.find((c) => c.category === category)?.amount ?? 0;
            return (
              <label key={category} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2">
                <span className="text-sm">
                  {category}
                  <span className="ml-2 text-xs text-muted">
                    {formatInr(used)} / {formatInr(cap)}
                  </span>
                </span>
                <Input
                  className="h-9 w-28"
                  type="number"
                  value={cap}
                  onChange={(e) => setCategoryBudget(category, Number(e.target.value) || 0)}
                />
              </label>
            );
          })}
        </div>
      </Card>

      <Modal open={open} title="Monthly limit" onClose={() => setOpen(false)}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setBudget(Number(budgetDraft) || 0);
            setOpen(false);
          }}
        >
          <Field label="Total spend ceiling (₹)">
            <Input
              type="number"
              value={budgetDraft}
              onChange={(e) => setBudgetDraft(e.target.value)}
            />
          </Field>
          <Button type="submit">Save plan</Button>
        </form>
      </Modal>
    </div>
  );
}
