"use client";

import { formatCompactInr } from "@/lib/format";

const PALETTE = ["#e6b35a", "#3ee0a2", "#7ec8e3", "#b9a6ff", "#ff6b6b", "#f3d9a4", "#8aa0b0"];

export function Donut({
  segments,
  size = 180,
  thickness = 22,
  center,
}: {
  segments: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  center?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="grid justify-items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c;
          const dash = `${len} ${c - len}`;
          const node = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return node;
        })}
      </svg>
      {center ? (
        <div className="pointer-events-none absolute grid place-items-center">
          <span className="tabular text-lg text-paper">{center}</span>
        </div>
      ) : null}
      <ul className="grid w-full gap-2 text-sm">
        {segments.map((seg, i) => (
          <li key={seg.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <i
                className="h-2 w-2 rounded-full"
                style={{ background: seg.color ?? PALETTE[i % PALETTE.length] }}
              />
              {seg.label}
            </span>
            <span className="tabular text-paper">{formatCompactInr(seg.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({
  values,
  width = 160,
  height = 48,
  color = "#3ee0a2",
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[72px] w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts.join(" ")} />
    </svg>
  );
}

export function HBars({
  rows,
}: {
  rows: { label: string; value: number; cap?: number; color?: string }[];
}) {
  const max = Math.max(...rows.map((r) => r.cap ?? r.value), 1);
  return (
    <div className="grid gap-3">
      {rows.map((row, i) => {
        const pct = (row.value / max) * 100;
        const over = row.cap ? row.value > row.cap : false;
        return (
          <div key={row.label} className="grid gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{row.label}</span>
              <span className="tabular text-paper">{formatCompactInr(row.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: over ? "#ff6b6b" : row.color ?? PALETTE[i % PALETTE.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DayBars({
  points,
}: {
  points: { date: string; amount: number }[];
}) {
  const max = Math.max(...points.map((p) => p.amount), 1);
  return (
    <div className="flex h-36 items-end gap-1">
      {points.map((p) => (
        <div key={p.date} className="relative flex h-full min-w-0 flex-1 items-end">
          <div
            className="w-full rounded-t-sm bg-gold/80 transition hover:bg-gold"
            style={{ height: `${Math.max(8, (p.amount / max) * 100)}%` }}
            title={`${p.date}: ${formatCompactInr(p.amount)}`}
          />
        </div>
      ))}
    </div>
  );
}

export function VelocityGauge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const clamped = Math.max(0, Math.min(1.15, value));
  const angle = -110 + clamped * 220;
  const tone = value > 1 ? "#ff6b6b" : value > 0.85 ? "#e6b35a" : "#3ee0a2";
  return (
    <div className="grid justify-items-center">
      <svg width="260" height="168" viewBox="0 0 260 168">
        <path
          d="M30 140 A100 100 0 1 1 230 140"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M30 140 A100 100 0 1 1 230 140"
          fill="none"
          stroke={tone}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${Math.min(clamped, 1) * 314} 314`}
        />
        <g transform={`translate(130 140) rotate(${angle})`}>
          <polygon points="0,-8 92,0 0,8" fill={tone} />
          <circle r="8" fill="#f3eee4" />
        </g>
        <text x="130" y="108" textAnchor="middle" fill="#f3eee4" fontSize="28" fontFamily="IBM Plex Mono, monospace">
          {Math.round(value * 100)}%
        </text>
      </svg>
      <p className="-mt-4 text-xs text-muted">{label}</p>
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const min = 300;
  const max = 900;
  const t = (score - min) / (max - min);
  const c = 2 * Math.PI * 54;
  const tone = score >= 750 ? "#3ee0a2" : score >= 650 ? "#e6b35a" : "#ff6b6b";
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
      <circle
        cx="80"
        cy="80"
        r="54"
        fill="none"
        stroke={tone}
        strokeWidth="12"
        strokeDasharray={`${t * c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
      />
      <text x="80" y="76" textAnchor="middle" fill="#f3eee4" fontSize="32" fontFamily="IBM Plex Mono, monospace">
        {score}
      </text>
      <text x="80" y="96" textAnchor="middle" fill="#8aa0b0" fontSize="11">
        Experian
      </text>
    </svg>
  );
}
