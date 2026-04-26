import {
  Banknote,
  BarChart3,
  Car,
  ChevronRight,
  Gavel,
  Megaphone,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BrandScore, BrandSignal, HealthReport } from "@/types/health";
import { SyncBadge } from "@/components/ui/SyncBadge";
import { formatDays, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface BrandGridProps {
  brands: BrandSignal[];
  report: HealthReport;
}

const brandIcons: Record<string, LucideIcon> = {
  velocityauto: Car,
  metrolane: Gavel,
  autovista: Megaphone,
  blueledger: BarChart3,
  serviceflow: Wrench,
  dealroute: Banknote,
};

function metricDisplay(
  value: number,
  unit: "days" | "%" | "count" | "score" | "index" | "$",
): string {
  switch (unit) {
    case "days":
      return formatDays(value);
    case "%":
      return formatPercent(value);
    case "count":
      return formatNumber(value);
    case "$":
      return `$${formatNumber(value)}`;
    case "index":
      return value.toFixed(1);
    case "score":
    default:
      return value.toFixed(1);
  }
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-accent-emerald";
  if (score >= 75) return "text-accent-cyan";
  if (score >= 65) return "text-accent-gold";
  if (score >= 55) return "text-accent-amber";
  return "text-accent-crimson";
}

function scoreBg(score: number): string {
  if (score >= 85) return "from-emerald-500/20 via-emerald-500/0";
  if (score >= 75) return "from-cyan-500/20 via-cyan-500/0";
  if (score >= 65) return "from-yellow-500/20 via-yellow-500/0";
  if (score >= 55) return "from-amber-500/20 via-amber-500/0";
  return "from-rose-500/20 via-rose-500/0";
}

function BrandCard({
  brand,
  score,
}: {
  brand: BrandSignal;
  score: BrandScore;
}) {
  const Icon = brandIcons[brand.id] ?? Car;
  const delta = score.score - 70; // vs a synthetic "healthy baseline" for card UX
  const DeltaIcon = delta >= 0 ? TrendingUp : TrendingDown;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-navy-900/60 p-5 shadow-executive",
        "transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-navy-850/70",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 -top-8 h-24 bg-gradient-to-b blur-2xl",
          scoreBg(score.score),
        )}
        aria-hidden
      />

      <header className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-navy-800 to-navy-900"
            style={{ boxShadow: `inset 0 0 0 1px ${brand.accent}33` }}
          >
            <Icon className="h-5 w-5" style={{ color: brand.accent }} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-[15px] font-semibold tracking-tight text-ink-50">
              {brand.name}
            </div>
            <div className="truncate text-[11px] text-ink-300">
              {brand.tagline}
            </div>
          </div>
        </div>
        <SyncBadge
          status={brand.sync}
          lastSyncSec={brand.lastSyncSec}
          compact
        />
      </header>

      <div className="relative mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="label-eyebrow">Pillar Score</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-display text-4xl font-bold leading-none tracking-tight tabular-nums",
                scoreColor(score.score),
              )}
            >
              {score.score.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-ink-300">/100</span>
          </div>
        </div>
        <span
          className={cn(
            "chip gap-1 border-white/10",
            delta >= 0 ? "text-accent-emerald" : "text-accent-crimson",
          )}
          title="vs. 70-point healthy baseline"
        >
          <DeltaIcon className="h-3 w-3" />
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}
        </span>
      </div>

      <div className="relative mb-4 h-1.5 w-full overflow-hidden rounded-full bg-navy-800">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.max(3, score.score)}%`,
            background: `linear-gradient(90deg, ${brand.accent} 0%, ${brand.accent}aa 100%)`,
            boxShadow: `0 0 18px ${brand.accent}55`,
          }}
        />
      </div>

      <ul className="relative mt-auto space-y-2.5">
        {score.metrics.map((m) => {
          const pct = Math.round(m.normalized * 100);
          return (
            <li key={m.key} className="text-[12px]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-ink-200">{m.label}</span>
                <span className="font-mono font-semibold tabular-nums text-ink-50">
                  {metricDisplay(m.raw, m.unit)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 w-full overflow-hidden rounded-full bg-navy-800">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${brand.accent}cc, ${brand.accent}77)`,
                    }}
                  />
                </div>
                <span className="w-10 flex-shrink-0 text-right font-mono text-[10px] tabular-nums text-ink-300">
                  {pct}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="relative mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
          Pillar · {brand.pillar}
        </span>
        <button
          type="button"
          className="focus-ring group/cta inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-ink-200 hover:text-accent-cyan"
        >
          Drill-down
          <ChevronRight className="h-3 w-3 transition group-hover/cta:translate-x-0.5" />
        </button>
      </footer>
    </article>
  );
}

export function BrandGrid({ brands, report }: BrandGridProps) {
  const scoreMap = new Map(report.brands.map((b) => [b.brand, b]));

  return (
    <section className="panel p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="label-eyebrow">The Big 6 · Source Telemetry</div>
          <h2 className="mt-1 font-display text-[15px] font-semibold tracking-tight text-ink-50">
            Brand Signal Grid
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-300">
          <span className="chip gap-1">
            <span className="h-1.5 w-1.5 animate-sync-blink rounded-full bg-accent-emerald" />
            <span>Live Sync</span>
          </span>
          <span className="chip gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-amber" />
            <span>Delayed</span>
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {brands.map((b) => {
          const s = scoreMap.get(b.id);
          if (!s) return null;
          return <BrandCard key={b.id} brand={b} score={s} />;
        })}
      </div>
    </section>
  );
}
