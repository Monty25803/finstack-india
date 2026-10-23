"use client";

import { X } from "lucide-react";
import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Button({
  variant = "gold",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "ghost" | "danger" | "jade" | "paper";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    gold: "bg-gold text-ink hover:bg-gold-2",
    jade: "bg-jade text-ink hover:brightness-110",
    paper: "bg-paper/95 text-ink hover:bg-white",
    ghost:
      "bg-transparent text-paper box-border shadow-[inset_0_0_0_1px_rgba(230,179,90,0.28)] hover:bg-white/5",
    danger: "bg-coral text-ink hover:brightness-110",
  };
  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-[rgba(16,36,48,0.72)] backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(230,179,90,0.16),0_20px_50px_rgba(0,0,0,0.25)]",
        padded && "p-5 md:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.22em] text-gold-2/80">{children}</p>
  );
}

export function Badge({
  tone = "gold",
  children,
}: {
  tone?: "gold" | "jade" | "coral" | "sky" | "muted";
  children: ReactNode;
}) {
  const tones = {
    gold: "text-gold bg-gold/10",
    jade: "text-jade bg-jade/10",
    coral: "text-coral bg-coral/10",
    sky: "text-sky bg-sky/10",
    muted: "text-muted bg-white/5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted/80">{hint}</span> : null}
    </label>
  );
}

const fieldClass =
  "h-11 w-full rounded-2xl bg-black/25 px-3 text-sm text-paper outline-none shadow-[inset_0_0_0_1px_rgba(230,179,90,0.2)] placeholder:text-muted/70 focus:shadow-[inset_0_0_0_1px_rgba(230,179,90,0.55)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, "pr-8", props.className)} {...props} />;
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end p-3 sm:place-items-center">
      <button
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-[#102430] p-5 shadow-[inset_0_0_0_1px_rgba(230,179,90,0.22),0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-paper">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-paper"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Progress({
  value,
  tone = "gold",
}: {
  value: number;
  tone?: "gold" | "jade" | "coral" | "sky";
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const tones = {
    gold: "bg-gold",
    jade: "bg-jade",
    coral: "bg-coral",
    sky: "bg-sky",
  };
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div className={cn("h-full rounded-full transition-all duration-700", tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full bg-black/30 p-1 shadow-[inset_0_0_0_1px_rgba(230,179,90,0.16)]">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs tracking-wide transition",
            value === opt.id ? "bg-gold text-ink" : "text-muted hover:text-paper",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
