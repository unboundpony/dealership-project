import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Flame,
  Info,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type {
  FloorplanBurn,
  FloorplanVehicle,
  FloorplanVehicleBurn,
} from "@/types/health";
import { calculateInventoryBurn } from "@/utils/HealthScoreEngine";
import { formatCurrency, formatNumber } from "@/utils/format";
import { cn } from "@/utils/cn";

interface FinanceBurnCardProps {
  fleet: FloorplanVehicle[];
  /** Baseline APR (decimal, e.g. 0.075). */
  baselineAPR: number;
  /** Projected APR after rate-hike simulation. Defaults to baselineAPR. */
  projectedAPR?: number;
  /** Current rate-hike delta vs baseline in decimal form. */
  aprDelta?: number;
  /** Whether Lab Mode (any simulation state) is currently engaged. Controls
   *  the "LAB" badge on the rate-hike section header. The projected burn
   *  display itself is driven purely by whether APR is shocked. */
  isSimulating?: boolean;
  /** GM-authorized monthly floorplan tolerance (USD). */
  lossToleranceMonthly: number;
  /** Callback when the operator picks a rate-hike scenario. */
  onAprDeltaChange?: (delta: number) => void;
  /** Reset the rate-hike delta back to 0. */
  onResetApr?: () => void;
}

/* ------------------------------------------------------------------------- */
/* Presets + helpers                                                          */
/* ------------------------------------------------------------------------- */

const APR_PRESETS: Array<{ delta: number; label: string }> = [
  { delta: 0, label: "Live" },
  { delta: 0.005, label: "+50 bps" },
  { delta: 0.01, label: "+1%" },
  { delta: 0.02, label: "+2%" },
  { delta: 0.03, label: "+3%" },
];

const ZONE_LABEL: Record<FloorplanBurn["zone"], string> = {
  safe: "Within Tolerance",
  watch: "Watch",
  warning: "Warning",
  breach: "Breach",
};

const ZONE_META: Record<
  FloorplanBurn["zone"],
  { accent: string; text: string; bg: string; ring: string }
> = {
  safe: {
    accent: "#22D3EE",
    text: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    ring: "ring-accent-cyan/30",
  },
  watch: {
    accent: "#F5B700",
    text: "text-accent-gold",
    bg: "bg-accent-gold/10",
    ring: "ring-accent-gold/40",
  },
  warning: {
    accent: "#F59E0B",
    text: "text-accent-amber",
    bg: "bg-accent-amber/15",
    ring: "ring-accent-amber/50",
  },
  breach: {
    accent: "#EF4444",
    text: "text-accent-crimson",
    bg: "bg-accent-crimson/15",
    ring: "ring-accent-crimson/50",
  },
};

function zonePct(ratio: number): number {
  // Clamp to 0-1 for the thermometer fill, but allow the label to say "120%"
  // when we're in breach so the user still sees the overage.
  return Math.max(0, Math.min(1, ratio)) * 100;
}

function signedCurrency(v: number): string {
  if (v === 0) return "$0";
  return `-${formatCurrency(Math.abs(v))}`;
}

/* ------------------------------------------------------------------------- */
/* Hook: rolling ticker of dollars burned since this panel was mounted.      */
/*                                                                            */
/*   Re-seeds whenever `rate` (USD/sec) changes materially so rate-hikes feel */
/*   immediate. Uses a 150ms interval: fast enough to feel alive, slow enough */
/*   not to thrash React.                                                     */
/* ------------------------------------------------------------------------- */
function useBurnTicker(ratePerSecond: number): {
  total: number;
  since: Date;
} {
  const [total, setTotal] = useState(0);
  const startRef = useRef<number>(performance.now());
  const sinceRef = useRef<Date>(new Date());
  const rateRef = useRef<number>(ratePerSecond);

  // When the rate changes (e.g. APR hike), lock in what's been burned so far
  // and restart the clock from this moment — so the ticker keeps climbing
  // monotonically instead of snapping backwards.
  useEffect(() => {
    setTotal((prev) => {
      const now = performance.now();
      startRef.current = now;
      rateRef.current = ratePerSecond;
      sinceRef.current = new Date();
      return prev; // carry forward
    });
  }, [ratePerSecond]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setTotal((t) => t + dt * rateRef.current);
      raf = window.setTimeout(tick, 150) as unknown as number;
    };
    raf = window.setTimeout(tick, 150) as unknown as number;
    return () => window.clearTimeout(raf);
  }, []);

  return { total, since: sinceRef.current };
}

/* ------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* ------------------------------------------------------------------------- */

function BurnThermometer({
  burn,
  ghostBurn,
}: {
  burn: FloorplanBurn;
  /** Optional "reference" overlay (e.g. baseline burn when APR is shocked). */
  ghostBurn?: FloorplanBurn;
}) {
  const ratio = burn.burnRatio;
  const fillPct = zonePct(ratio);
  const zone = ZONE_META[burn.zone];
  const ghostFillPct = ghostBurn ? zonePct(ghostBurn.burnRatio) : 0;
  const showGhost =
    ghostBurn && Math.abs(ghostBurn.burnRatio - ratio) > 0.01;

  return (
    <div className="relative flex w-full max-w-[180px] flex-col items-center gap-3 self-stretch">
      <div className="label-eyebrow flex items-center gap-1.5 text-center">
        <Flame className="h-3 w-3 text-accent-crimson" />
        Burn Gauge
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center">
        {/* Tube */}
        <div className="relative h-[240px] w-[28px] overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-navy-900 to-navy-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
          {/* Zone band markings */}
          <div className="pointer-events-none absolute inset-0">
            {[1.0, 0.75, 0.5].map((t) => (
              <div
                key={t}
                className="absolute left-0 right-0 h-px bg-white/10"
                style={{ bottom: `${t * 100}%` }}
              />
            ))}
          </div>

          {/* Ghost "reference" fill — baseline burn when APR is shocked. */}
          {showGhost && (
            <div
              className="absolute inset-x-0 bottom-0 rounded-b-full border-t border-dashed border-accent-gold/70 bg-accent-gold/15 transition-[height] duration-500"
              style={{ height: `${ghostFillPct}%` }}
              title={`Baseline ratio: ${(
                (ghostBurn?.burnRatio ?? 0) * 100
              ).toFixed(0)}%`}
              aria-hidden
            />
          )}

          {/* Actual fill — the live "mercury" */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out",
              burn.zone === "breach" && "animate-burn-rise",
            )}
            style={{
              height: `${fillPct}%`,
              background:
                burn.zone === "safe"
                  ? "linear-gradient(180deg, rgba(34,211,238,0.95) 0%, rgba(20,184,166,0.85) 100%)"
                  : burn.zone === "watch"
                    ? "linear-gradient(180deg, rgba(245,183,0,0.95) 0%, rgba(245,158,11,0.85) 100%)"
                    : burn.zone === "warning"
                      ? "linear-gradient(180deg, rgba(245,158,11,0.95) 0%, rgba(239,68,68,0.85) 100%)"
                      : "linear-gradient(180deg, rgba(239,68,68,1) 0%, rgba(245,158,11,0.9) 100%)",
              boxShadow: `0 0 22px ${zone.accent}99, inset 0 -6px 18px ${zone.accent}66`,
            }}
          />

          {/* Bulb at the bottom — styled as a flame reservoir */}
          <div
            className="absolute -bottom-2 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-white/10"
            style={{
              background: `radial-gradient(circle at 50% 35%, ${zone.accent}cc 0%, ${zone.accent}77 45%, rgba(6,11,26,0.95) 95%)`,
              boxShadow: `0 0 24px ${zone.accent}77`,
            }}
            aria-hidden
          />
        </div>

        {/* Zone scale labels */}
        <div
          className="absolute right-[calc(50%-56px)] top-0 flex h-[240px] translate-x-[120px] flex-col justify-between py-[2px] font-mono text-[9px] uppercase tracking-widest text-ink-400"
          aria-hidden
        >
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
      </div>

      <div
        className={cn(
          "w-full rounded-lg border px-2.5 py-2 text-center ring-1 ring-inset",
          "border-white/5 bg-navy-900/60",
          zone.ring,
        )}
      >
        <div className={cn("font-mono text-[10px] uppercase tracking-widest", zone.text)}>
          {ZONE_LABEL[burn.zone]}
        </div>
        <div className={cn("mt-0.5 font-display text-lg font-bold tabular-nums", zone.text)}>
          {Math.round(ratio * 100)}%
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
          of tolerance
        </div>
      </div>
    </div>
  );
}

function ToxicList({
  units,
  totalToxic,
}: {
  units: FloorplanVehicleBurn[];
  totalToxic: number;
}) {
  if (units.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-navy-900/60 p-4 text-[12px] text-ink-200">
        <div className="label-eyebrow mb-1.5 flex items-center gap-1.5 text-accent-emerald">
          <AlertTriangle className="h-3 w-3" />
          Aged Units Clear
        </div>
        No units currently trip the 15%-gross-erosion or 60-day toxic
        thresholds.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent-crimson/20 bg-navy-900/70 p-4 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.08)]">
      <header className="mb-3 flex items-center justify-between">
        <div className="label-eyebrow flex items-center gap-1.5 text-accent-crimson">
          <AlertTriangle className="h-3.5 w-3.5" />
          Top 3 · Money Losers
        </div>
        <span className="chip gap-1.5 border-accent-crimson/40 bg-accent-crimson/10 text-accent-crimson">
          <Flame className="h-3 w-3" />
          {totalToxic} toxic
        </span>
      </header>
      <ol className="space-y-2">
        {units.map((u, idx) => {
          const erosion = Math.min(9.99, u.grossErosion);
          return (
            <li
              key={u.vin}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-navy-850/70 px-3 py-2"
            >
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold",
                  idx === 0
                    ? "bg-accent-crimson/20 text-accent-crimson shadow-[0_0_0_1px_rgba(239,68,68,0.55)]"
                    : idx === 1
                      ? "bg-accent-amber/20 text-accent-amber shadow-[0_0_0_1px_rgba(245,158,11,0.55)]"
                      : "bg-accent-gold/15 text-accent-gold shadow-[0_0_0_1px_rgba(245,183,0,0.5)]",
                )}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-ink-50">
                    {u.year} {u.make} {u.model}
                  </span>
                  <span className="font-mono text-[12px] font-bold tabular-nums text-accent-crimson">
                    -{formatCurrency(u.accruedInterest)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                  <span className="truncate">
                    {u.vin} · {u.rooftop}
                  </span>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-ink-300">
                      {u.daysOnLot}d
                    </span>
                    <span
                      className={cn(
                        erosion > 0.3
                          ? "text-accent-crimson"
                          : erosion > 0.15
                            ? "text-accent-amber"
                            : "text-ink-300",
                      )}
                    >
                      {Math.round(erosion * 100)}% gross
                    </span>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Main component                                                             */
/* ------------------------------------------------------------------------- */

export function FinanceBurnCard({
  fleet,
  baselineAPR,
  projectedAPR,
  aprDelta = 0,
  isSimulating = false,
  lossToleranceMonthly,
  onAprDeltaChange,
  onResetApr,
}: FinanceBurnCardProps) {
  const effectiveProjectedAPR = projectedAPR ?? baselineAPR;
  const aprIsShocked = Math.abs(effectiveProjectedAPR - baselineAPR) > 1e-6;

  const baselineBurn = useMemo(
    () =>
      calculateInventoryBurn(fleet, baselineAPR, {
        lossToleranceMonthly,
        topN: 3,
      }),
    [fleet, baselineAPR, lossToleranceMonthly],
  );

  const projectedBurn = useMemo(
    () =>
      calculateInventoryBurn(fleet, effectiveProjectedAPR, {
        lossToleranceMonthly,
        topN: 3,
      }),
    [fleet, effectiveProjectedAPR, lossToleranceMonthly],
  );

  // Display uses projected whenever the APR is shocked — regardless of Lab
  // Mode pillar state. This lets the GM keep observing the rate-hike effect
  // on the dashboard even after closing or exiting the simulator sidebar.
  const displayBurn = aprIsShocked ? projectedBurn : baselineBurn;

  const displayZone = ZONE_META[displayBurn.zone];
  const monthlyDelta = aprIsShocked
    ? projectedBurn.monthlyBurn - baselineBurn.monthlyBurn
    : 0;

  // Rolling "since you opened this" counter — the viscerally important ticker.
  const { total: burnedSinceOpen, since } = useBurnTicker(
    displayBurn.dailyBurn / 86_400,
  );

  const hot = displayBurn.zone === "breach" || displayBurn.zone === "warning";
  const flickerClass =
    displayBurn.zone === "breach"
      ? "animate-burn-flicker text-accent-crimson"
      : displayBurn.zone === "warning"
        ? "text-accent-amber"
        : displayBurn.zone === "watch"
          ? "text-accent-gold"
          : "text-accent-cyan";

  const sinceLabel = useMemo(
    () =>
      since.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [since],
  );

  return (
    <section
      className={cn(
        "panel relative overflow-hidden p-5 sm:p-6",
        hot &&
          "ring-1 ring-accent-crimson/25 shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_24px_48px_-20px_rgba(239,68,68,0.35)]",
      )}
      aria-label="Floorplan Profit Evaporator"
    >
      {/* Ember backdrop — warm glow when the thermometer is in the hot zone. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl transition-opacity duration-700",
          hot
            ? "bg-accent-crimson/20 opacity-100 animate-ember-glow"
            : displayBurn.zone === "watch"
              ? "bg-accent-gold/20 opacity-80"
              : "bg-accent-cyan/10 opacity-60",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full blur-3xl transition-opacity duration-700",
          hot
            ? "bg-accent-amber/15 opacity-100 animate-ember-glow"
            : "opacity-0",
        )}
      />

      {/* -------------------------------- Header -------------------------------- */}
      <header className="relative mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="label-eyebrow flex items-center gap-2">
            <Flame
              className={cn(
                "h-3.5 w-3.5",
                hot ? "animate-burn-flicker text-accent-crimson" : "text-accent-gold",
              )}
            />
            Floorplan · Profit Evaporator
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink-50">
            Inventory Carrying-Cost Burn Rate
          </h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-300">
            Real-time floorplan-interest drag across the fleet.{" "}
            <span className="font-mono text-ink-200">
              H<sub>d</sub> = Σ(basis · APR/365)
            </span>
            . Units flag <span className="text-accent-crimson">toxic</span> when
            accrued interest exceeds 15% of projected gross or days-on-lot
            crosses 60.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip gap-1.5">
            <Wallet className="h-3 w-3 text-accent-cyan" />
            Basis {formatCurrency(displayBurn.totalBasis)}
          </span>
          <span
            className={cn(
              "chip gap-1.5 border-white/10",
              displayZone.bg,
              displayZone.text,
            )}
          >
            <TrendingDown className="h-3 w-3" />
            APR {(displayBurn.apr * 100).toFixed(2)}%
            {aprIsShocked && (
              <span className="ml-1 rounded-sm bg-accent-gold/20 px-1 font-mono text-[9px] font-bold text-accent-gold">
                {aprDelta > 0 ? "+" : ""}
                {(aprDelta * 100).toFixed(1)}%
              </span>
            )}
          </span>
        </div>
      </header>

      {/* ------------------------------- Main body ------------------------------ */}
      <div className="relative grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Thermometer — ghost overlay shows baseline burn when APR is shocked. */}
        <BurnThermometer
          burn={displayBurn}
          ghostBurn={aprIsShocked ? baselineBurn : undefined}
        />

        {/* Center: daily burn ticker + monthly projections */}
        <div className="flex flex-col gap-4 self-stretch">
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4",
              hot
                ? "border-accent-crimson/30 bg-gradient-to-br from-navy-900 via-navy-950 to-[#1a0606]"
                : "border-white/5 bg-navy-900/70",
            )}
          >
            <div className="label-eyebrow flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-accent-crimson" />
              Current Daily Burn
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                key={displayBurn.dailyBurn.toFixed(0)}
                className={cn(
                  "font-display text-[40px] font-bold leading-none tracking-tight tabular-nums",
                  flickerClass,
                )}
              >
                -{formatCurrency(displayBurn.dailyBurn)}
              </span>
              <span className="font-mono text-[11px] text-ink-300">/ day</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
              <span>
                Per-sec{" "}
                <span className="text-ink-200">
                  -{formatCurrency(displayBurn.dailyBurn / 86_400)}
                </span>
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span>
                Per-min{" "}
                <span className="text-ink-200">
                  -{formatCurrency(displayBurn.dailyBurn / 1440)}
                </span>
              </span>
            </div>
            <div
              className={cn(
                "mt-3 rounded-lg border border-white/5 bg-navy-950/60 px-3 py-2",
                hot && "border-accent-crimson/20",
              )}
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                <Flame className="h-3 w-3 text-accent-crimson" />
                Burned since {sinceLabel}
              </div>
              <div
                className={cn(
                  "mt-0.5 font-display text-2xl font-bold tabular-nums",
                  flickerClass,
                )}
                aria-live="polite"
              >
                -{formatCurrency(burnedSinceOpen)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-navy-900/60 p-3">
              <div className="label-eyebrow flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3 text-accent-cyan" />
                30-Day Leakage
              </div>
              <div className="mt-1 font-display text-[22px] font-bold tabular-nums text-ink-50">
                {signedCurrency(displayBurn.monthlyBurn)}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                vs tolerance{" "}
                <span className="text-ink-200">
                  {formatCurrency(displayBurn.lossTolerance)}
                </span>
              </div>
              {aprIsShocked && (
                <div
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                    monthlyDelta > 0
                      ? "bg-accent-crimson/15 text-accent-crimson"
                      : "bg-accent-emerald/15 text-accent-emerald",
                  )}
                  title="Change vs. baseline APR"
                >
                  <ArrowRight className="h-3 w-3" />
                  {monthlyDelta > 0 ? "+" : ""}
                  {formatCurrency(monthlyDelta)}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-white/5 bg-navy-900/60 p-3">
              <div className="label-eyebrow flex items-center gap-1.5">
                <Info className="h-3 w-3 text-accent-cyan" />
                Accrued to Date
              </div>
              <div className="mt-1 font-display text-[22px] font-bold tabular-nums text-ink-50">
                {signedCurrency(displayBurn.accruedBurn)}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                {formatNumber(displayBurn.totalUnits)} units ·{" "}
                <span className="text-accent-crimson">
                  {displayBurn.toxic.length} toxic
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: toxic units list */}
        <ToxicList
          units={displayBurn.topMoneyLosers}
          totalToxic={displayBurn.toxic.length}
        />
      </div>

      {/* -------------------------------- Footer -------------------------------- */}
      <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow">Rate-Hike Simulator</span>
          {isSimulating && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent-gold/40 bg-accent-gold/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-accent-gold">
              <span className="h-1 w-1 animate-pulse rounded-full bg-accent-gold" />
              Lab
            </span>
          )}
          <div className="flex items-center gap-1">
            {APR_PRESETS.map((preset) => {
              const isActive = Math.abs(aprDelta - preset.delta) < 1e-6;
              const disabled = !onAprDeltaChange;
              return (
                <button
                  key={preset.delta}
                  type="button"
                  onClick={() => onAprDeltaChange?.(preset.delta)}
                  disabled={disabled}
                  className={cn(
                    "focus-ring inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-[11px] font-semibold transition",
                    disabled && "cursor-not-allowed opacity-50",
                    isActive
                      ? "border-accent-gold/50 bg-accent-gold/15 text-accent-gold shadow-[0_0_14px_rgba(245,183,0,0.25)]"
                      : "border-white/10 bg-navy-900/60 text-ink-200 hover:bg-navy-800",
                  )}
                  title={
                    preset.delta === 0
                      ? "Baseline (current market)"
                      : `Simulate a ${(preset.delta * 100).toFixed(1)}% rate hike`
                  }
                >
                  {preset.delta === 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {preset.label}
                </button>
              );
            })}
            {aprIsShocked && onResetApr && (
              <button
                type="button"
                onClick={onResetApr}
                className="focus-ring ml-1 inline-flex h-7 items-center gap-1 rounded-md border border-white/10 bg-navy-900/60 px-2 font-mono text-[11px] font-semibold text-ink-300 transition hover:bg-navy-800"
                title="Reset to baseline APR"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
          <span>Baseline {(baselineAPR * 100).toFixed(2)}%</span>
          <ArrowRight className="h-3 w-3" aria-hidden />
          <span
            className={cn(
              aprIsShocked ? "text-accent-gold" : "text-ink-200",
              "font-bold",
            )}
          >
            {(effectiveProjectedAPR * 100).toFixed(2)}%
          </span>
        </div>
      </footer>
    </section>
  );
}
