import { useEffect, useMemo } from "react";
import {
  ArrowRight,
  Beaker,
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import type { HealthReport, Pillar } from "@/types/health";
import type {
  PillarDelta,
  PillarImpact,
  PillarOverrides,
} from "@/utils/HealthScoreEngine";
import { cn } from "@/utils/cn";

interface SimulationPanelProps {
  open: boolean;
  onClose: () => void;
  baseline: HealthReport;
  projected: HealthReport;
  overrides: PillarOverrides;
  sensitivity: PillarDelta[];
  impact: PillarImpact[];
  totalDelta: number;
  isDirty: boolean;
  onChange: (pillar: Pillar, value: number) => void;
  onReset: () => void;
  onMaxOut: () => void;
}

const PILLAR_PALETTE: Record<Pillar, string> = {
  inventory: "#4A6DBD",
  demand: "#22D3EE",
  valuation: "#14B8A6",
  service: "#F5B700",
  finance: "#FB7185",
};

const PILLAR_TAGLINE: Record<Pillar, string> = {
  inventory: "vAuto · Manheim",
  demand: "Autotrader",
  valuation: "Kelley Blue Book",
  service: "Xtime",
  finance: "Dealertrack",
};

function deltaClass(d: number, mode: "fg" | "bg" = "fg") {
  if (Math.abs(d) < 0.05)
    return mode === "fg" ? "text-ink-300" : "bg-navy-800/70 text-ink-300";
  if (d > 0)
    return mode === "fg"
      ? "text-accent-emerald"
      : "bg-accent-emerald/12 text-accent-emerald";
  return mode === "fg"
    ? "text-accent-crimson"
    : "bg-accent-crimson/12 text-accent-crimson";
}

function formatDelta(d: number) {
  if (Math.abs(d) < 0.05) return "0.0";
  return `${d > 0 ? "+" : ""}${d.toFixed(1)}`;
}

export function SimulationPanel({
  open,
  onClose,
  baseline,
  projected,
  overrides,
  sensitivity,
  impact,
  totalDelta,
  isDirty,
  onChange,
  onReset,
  onMaxOut,
}: SimulationPanelProps) {
  // Lock body scroll while the panel is open — prevents the page behind from
  // scrolling when the operator drags sliders on touch devices.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sensitivityByPillar = useMemo(() => {
    const m = new Map<Pillar, PillarDelta>();
    for (const s of sensitivity) m.set(s.pillar, s);
    return m;
  }, [sensitivity]);

  const topImpact = impact.slice(0, 3);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="What-If Strategy Simulator"
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close simulator"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-navy-950/70 backdrop-blur-sm"
      />

      {/* Slide-over panel */}
      <aside
        className={cn(
          "relative z-10 flex h-full w-full max-w-[460px] animate-panel-in flex-col",
          "border-l border-white/10 bg-navy-950/95 shadow-executive backdrop-blur-xl",
        )}
      >
        {/* ---------- Header ---------- */}
        <header className="relative overflow-hidden border-b border-white/5 px-6 py-5">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-gold/15 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="label-eyebrow flex items-center gap-2 text-accent-gold">
                <Beaker className="h-3.5 w-3.5" />
                Lab Mode · Decision Support
              </div>
              <h2 className="mt-1 font-display text-[17px] font-semibold tracking-tight text-ink-50">
                What-If Strategy Simulator
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-300">
                Temporarily override any of the 5 pillars to preview the
                projected Health Index.{" "}
                <span className="font-mono text-ink-200">
                  ΔS = Σ(w
                  <sub>i</sub>·Δc<sub>i</sub>)
                </span>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-navy-900/80 text-ink-200 transition hover:bg-navy-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ---------- Summary card: Actual → Projected ---------- */}
        <div className="border-b border-white/5 px-6 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-white/5 bg-navy-900/70 p-3.5">
            <div>
              <div className="label-eyebrow">Actual</div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tabular-nums text-ink-100">
                  {baseline.overall.toFixed(1)}
                </span>
                <span className="font-mono text-[10px] text-ink-400">
                  Grade {baseline.grade}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-accent-gold" aria-hidden />
            <div>
              <div className="label-eyebrow text-accent-gold">Projected</div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span
                  key={projected.overall.toFixed(1)}
                  className={cn(
                    "animate-score-rise font-display text-2xl font-bold tabular-nums",
                    totalDelta > 0.05 && "text-accent-emerald",
                    totalDelta < -0.05 && "text-accent-crimson",
                    Math.abs(totalDelta) < 0.05 && "text-ink-100",
                  )}
                >
                  {projected.overall.toFixed(1)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                    deltaClass(totalDelta, "bg"),
                  )}
                >
                  {formatDelta(totalDelta)} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Sliders ---------- */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="label-eyebrow flex items-center gap-2">
              <FlaskConical className="h-3.5 w-3.5 text-accent-cyan" />
              Pillar Controls
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              0 — 100
            </div>
          </div>

          <div className="space-y-3.5">
            {baseline.pillars.map((p) => {
              const s = sensitivityByPillar.get(p.pillar);
              const color = PILLAR_PALETTE[p.pillar];
              const current =
                overrides[p.pillar] !== undefined
                  ? (overrides[p.pillar] as number)
                  : p.score;
              const fillPct = Math.max(0, Math.min(100, current));
              const delta = s?.delta ?? 0;
              const weightedDelta = s?.weightedDelta ?? 0;
              const weightPct = Math.round(p.weight * 1000) / 10;

              return (
                <div
                  key={p.pillar}
                  className="rounded-xl border border-white/5 bg-navy-900/60 p-3.5"
                  style={{ boxShadow: `inset 0 0 0 1px ${color}10` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 10px ${color}88`,
                        }}
                      />
                      <div>
                        <div className="text-[13px] font-semibold text-ink-50">
                          {p.label}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                          {PILLAR_TAGLINE[p.pillar]} · w = {weightPct.toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold tabular-nums text-ink-50">
                        {current.toFixed(1)}
                      </div>
                      <div
                        className={cn(
                          "font-mono text-[10px] font-semibold tabular-nums",
                          deltaClass(delta),
                        )}
                      >
                        {formatDelta(delta)} vs {p.score.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={current}
                      onChange={(e) =>
                        onChange(p.pillar, Number(e.target.value))
                      }
                      aria-label={`${p.label} pillar score`}
                      className="lab-slider focus-ring"
                      style={
                        {
                          ["--lab-accent" as string]: color,
                          ["--lab-fill" as string]: `${fillPct}%`,
                        } as React.CSSProperties
                      }
                    />
                    {/* Baseline tick marker */}
                    <div className="relative -mt-2 h-3">
                      <div
                        className="absolute top-0 h-2 w-0.5 rounded-full bg-ink-100/70"
                        style={{
                          left: `calc(${Math.max(
                            0,
                            Math.min(100, p.score),
                          )}% - 1px)`,
                        }}
                        title={`Actual: ${p.score.toFixed(1)}`}
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                      Contribution to ΔS
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
                        deltaClass(weightedDelta, "bg"),
                      )}
                    >
                      w·Δc = {formatDelta(weightedDelta)} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---------- Impact ranking ---------- */}
          <div className="mt-6 rounded-xl border border-white/5 bg-navy-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="label-eyebrow flex items-center gap-2 text-accent-cyan">
                <TrendingUp className="h-3.5 w-3.5" />
                Impact Ranking · Highest ROI
              </div>
              <span
                className="font-mono text-[10px] text-ink-400"
                title="ROI = w · (100 − current)"
              >
                w·(100−c)
              </span>
            </div>
            <ol className="space-y-2">
              {topImpact.map((i, idx) => (
                <li
                  key={i.pillar}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-navy-850/70 px-3 py-2"
                >
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold"
                    style={{
                      color: PILLAR_PALETTE[i.pillar],
                      background: `${PILLAR_PALETTE[i.pillar]}22`,
                      boxShadow: `0 0 0 1px ${PILLAR_PALETTE[i.pillar]}55`,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[12px] font-semibold text-ink-50">
                        {i.label}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-accent-gold">
                        +{i.roi.toFixed(1)} pts
                      </span>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                      current {i.current.toFixed(1)} · headroom{" "}
                      {i.headroom.toFixed(1)} · w ={" "}
                      {(i.weight * 100).toFixed(1)}%
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/5 bg-navy-950/60 px-3 py-2.5 text-[11px] leading-relaxed text-ink-200">
              <Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-cyan" />
              <span>
                Moving{" "}
                <span className="font-semibold text-ink-50">
                  {topImpact[0]?.label}
                </span>{" "}
                to 100 unlocks the largest marginal gain — prioritize this lever
                first.
              </span>
            </div>
          </div>
        </div>

        {/* ---------- Footer actions ---------- */}
        <footer className="flex items-center gap-2 border-t border-white/5 bg-navy-900/70 px-6 py-3">
          <button
            type="button"
            onClick={onReset}
            disabled={!isDirty}
            className={cn(
              "focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-navy-900/80 px-3 text-[12px] font-semibold text-ink-100 transition",
              isDirty
                ? "hover:bg-navy-800"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <RotateCcw className="h-3.5 w-3.5 text-accent-cyan" />
            Reset
          </button>
          <button
            type="button"
            onClick={onMaxOut}
            className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-navy-900/80 px-3 text-[12px] font-semibold text-ink-100 transition hover:bg-navy-800"
            title="Max out every pillar (best-case scenario)"
          >
            <Zap className="h-3.5 w-3.5 text-accent-gold" />
            Max Out
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="chip gap-1.5 border-accent-gold/30 bg-accent-gold/10 text-accent-gold">
              <Sparkles className="h-3 w-3" />
              Projected
            </span>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg bg-accent-gold px-3.5 text-[12px] font-bold text-navy-950 transition hover:bg-accent-amber"
            >
              <Play className="h-3.5 w-3.5" />
              Apply
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
