export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`inline-flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gold font-[family-name:var(--font-display)] text-xl leading-none text-ink shadow-[0_0_0_1px_rgba(243,217,164,0.4)]">
        ₹
      </span>
      {compact ? (
        <span className="font-[family-name:var(--font-display)] text-xl leading-none">FinStack</span>
      ) : (
        <span className="text-left">
          <span className="block font-[family-name:var(--font-display)] text-2xl leading-none">FinStack</span>
          <span className="mt-1 block text-[10px] uppercase tracking-[0.28em] text-gold-2/80">India · Private ledger</span>
        </span>
      )}
    </div>
  );
}
