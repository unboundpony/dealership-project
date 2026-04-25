import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  FlaskConical,
  Gauge,
  Minus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import type { HealthReport, Pillar } from "@/types/health";
import type { PillarOverrides } from "@/utils/HealthScoreEngine";
import { ScoreSpark } from "@/components/ui/ScoreSpark";
import { cn } from "@/utils/cn";

export interface HeroSimulation {
  isActive: boolean;
  projected: HealthReport;
  overrides: PillarOverrides;
  totalDelta: number;
}

interface HeroScoreProps {
  report: HealthReport;
  trend: Array<{ day: string; score: number }>;
  simulation?: HeroSimulation;
}

const pillarPalette: Record<string, string> = {
  inventory: "#4A6DBD",
  demand: "#22D3EE",
  valuation: "#14B8A6",
  service: "#F5B700",
  finance: "#FB7185",
};

function scoreColor(score: number): string {
  if (score >= 85) return "#10B981";
  if (score >= 75) return "#22D3EE";
  if (score >= 65) return "#F5B700";
  if (score >= 55) return "#F59E0B";
  return "#EF4444";
}

function verdict(score: number): { label: string; blurb: string } {
  if (score >= 90)
    return {
      label: "Elite",
      blurb: "Omnichannel health is best-in-class across all Big 6 signals.",
    };
  if (score >= 80)
    return {
      label: "Strong",
      blurb: "Healthy operation with isolated optimization opportunities.",
    };
  if (score >= 70)
    return {
      label: "Stable",
      blurb: "Core pillars performing; targeted fixes will unlock upside.",
    };
  if (score >= 60)
    return {
      label: "Watch",
      blurb: "Material drag detected — prioritize the flagged bottlenecks.",
    };
  return {
    label: "At Risk",
    blurb: "Multi-pillar degradation. Executive intervention recommended.",
  };
}

export function HeroScore({ report, trend, simulation }: HeroScoreProps) {
  const [hover, setHover] = useState<string | null>(null);

  const simActive = Boolean(simulation?.isActive);
  const projectedReport = simulation?.projected ?? report;
  const totalDelta = simulation?.totalDelta ?? 0;

  const actualColor = scoreColor(report.overall);
  const projectedColor = scoreColor(projectedReport.overall);

  // Recharts radial data: put the projected "ghost" first so the solid
  // "actual" needle renders on top of it.
  const radialData = useMemo(
    () =>
      simActive
        ? [
            {
              name: "projected",
              value: projectedReport.overall,
              fill: "#F5B700",
            },
            { name: "actual", value: report.overall, fill: actualColor },
          ]
        : [{ name: "actual", value: report.overall, fill: actualColor }],
    [simActive, report.overall, projectedReport.overall, actualColor],
  );

  const pillarBar = useMemo(() => {
    const projectedByPillar = new Map<Pillar, number>();
    if (simulation) {
      for (const p of simulation.projected.pillars) {
        projectedByPillar.set(p.pillar, p.score);
      }
    }
    return report.pillars.map((p) => ({
      name: p.label,
      pillar: p.pillar,
      score: p.score,
      projected: projectedByPillar.get(p.pillar) ?? p.score,
      weight: Math.round(p.weight * 1000) / 10,
      fill: pillarPalette[p.pillar] ?? "#4A6DBD",
    }));
  }, [report.pillars, simulation]);

  const v = verdict(report.overall);
  const trendDir =
    report.trend > 0.1 ? "up" : report.trend < -0.1 ? "down" : "flat";
  const TrendIcon =
    trendDir === "up"
      ? ArrowUpRight
      : trendDir === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <section className="panel overflow-hidden p-6 sm:p-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="label-eyebrow flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-accent-cyan" />
            Dealer Health Index · IE-Weighted MCDA
          </div>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink-50">
            Omni-Channel Health Score
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {simActive && (
            <span
              className="chip gap-1.5 border-accent-gold/40 bg-accent-gold/10 text-accent-gold"
              title="Lab Mode is active — display shows projected values"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Projected · ΔS {totalDelta > 0 ? "+" : ""}
              {totalDelta.toFixed(1)}
            </span>
          )}
          <span
            className={cn(
              "chip gap-2 border-white/10",
              trendDir === "up" && "text-accent-emerald",
              trendDir === "down" && "text-accent-crimson",
              trendDir === "flat" && "text-ink-200",
            )}
            title="Change vs. last refresh"
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {report.trend > 0 ? "+" : ""}
            {report.trend.toFixed(1)} pts 24h
          </span>
          <span className="chip gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-cyan" />
            Grade {simActive ? projectedReport.grade : report.grade}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* ---------- Interactive gauge ring ---------- */}
        <div className="relative mx-auto flex h-[320px] w-full max-w-[360px] items-center justify-center">
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-2xl transition-colors duration-500",
              simActive
                ? "bg-gradient-to-b from-accent-gold/25 to-navy-900/0"
                : "bg-gradient-to-b from-navy-700/40 to-navy-900/0",
            )}
            aria-hidden
          />
          {/* Amber pulse ring — only when Lab Mode is live */}
          {simActive && (
            <div
              className="pointer-events-none absolute inset-3 rounded-full border border-accent-gold/40 animate-pulse-amber"
              aria-hidden
            />
          )}
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="78%"
              outerRadius="100%"
              data={radialData}
              startAngle={220}
              endAngle={-40}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              {/* Ghost needle first (so solid actual renders on top) */}
              {simActive && (
                <RadialBar
                  dataKey="value"
                  data={[
                    {
                      name: "projected",
                      value: projectedReport.overall,
                      fill: "#F5B700",
                    },
                  ]}
                  background={{ fill: "rgba(122,148,212,0.12)" }}
                  cornerRadius={12}
                  fill="#F5B700"
                  fillOpacity={0.35}
                  isAnimationActive
                />
              )}
              <RadialBar
                dataKey="value"
                data={[
                  { name: "actual", value: report.overall, fill: actualColor },
                ]}
                background={
                  simActive ? undefined : { fill: "rgba(122,148,212,0.12)" }
                }
                cornerRadius={12}
                isAnimationActive
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="label-eyebrow text-ink-300">
              {simActive ? "Projected Score" : "Overall Score"}
            </div>
            <div
              key={
                simActive
                  ? `proj-${projectedReport.overall.toFixed(1)}`
                  : `act-${report.overall.toFixed(1)}`
              }
              className="mt-1 animate-score-rise font-display text-6xl font-bold leading-none tracking-tight text-ink-50 tabular-nums"
              style={{
                color: simActive ? projectedColor : actualColor,
              }}
            >
              {(simActive ? projectedReport.overall : report.overall).toFixed(1)}
            </div>
            <div className="mt-1 font-mono text-xs text-ink-300">/ 100</div>
            {simActive ? (
              <>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">
                  Actual{" "}
                  <span className="text-ink-100">
                    {report.overall.toFixed(1)}
                  </span>{" "}
                  · Δ{" "}
                  <span
                    className={cn(
                      "font-bold",
                      totalDelta > 0.05 && "text-accent-emerald",
                      totalDelta < -0.05 && "text-accent-crimson",
                      Math.abs(totalDelta) < 0.05 && "text-ink-200",
                    )}
                  >
                    {totalDelta > 0 ? "+" : ""}
                    {totalDelta.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 rounded-full border border-accent-gold/40 bg-accent-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                  <FlaskConical className="h-3 w-3 text-accent-gold" />
                  <span className="text-accent-gold">Lab Mode</span>
                </div>
              </>
            ) : (
              <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-navy-800/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-accent-cyan" />
                <span className="text-ink-100">{v.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Right column: verdict + pillar bars + spark ---------- */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="panel-soft flex items-start gap-3 p-4">
            <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-cyan" />
            <p className="text-sm leading-relaxed text-ink-100">
              <span className="font-semibold text-ink-50">
                {v.label} · Grade {report.grade}.{" "}
              </span>
              <span className="text-ink-200">{v.blurb}</span>
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="label-eyebrow">
                Pillar Contribution · Entropy-Blended Weights
              </div>
              <div className="font-mono text-[10px] text-ink-300">
                Σw = 1.00
              </div>
            </div>
            <div className="space-y-2.5">
              {pillarBar.map((p) => {
                const showGhost =
                  simActive && Math.abs(p.projected - p.score) > 0.05;
                return (
                  <button
                    type="button"
                    key={p.pillar}
                    onMouseEnter={() => setHover(p.pillar)}
                    onMouseLeave={() => setHover(null)}
                    className={cn(
                      "focus-ring group grid w-full grid-cols-[110px_1fr_64px_48px] items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-left transition",
                      "hover:border-white/5 hover:bg-navy-800/40",
                      hover === p.pillar && "border-white/10 bg-navy-800/60",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: p.fill }}
                      />
                      <span className="text-xs font-medium text-ink-100">
                        {p.name}
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-navy-800">
                      {showGhost && (
                        <div
                          className="absolute inset-y-0 left-0 rounded-full border border-dashed border-accent-gold/60 bg-accent-gold/12 transition-[width] duration-300"
                          style={{ width: `${p.projected}%` }}
                          title={`Projected: ${p.projected.toFixed(1)}`}
                          aria-hidden
                        />
                      )}
                      <div
                        className="relative h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${p.score}%`,
                          background: `linear-gradient(90deg, ${p.fill} 0%, ${p.fill}cc 100%)`,
                          boxShadow: `0 0 18px ${p.fill}55`,
                        }}
                      />
                    </div>
                    <div className="text-right font-mono text-[12px] font-semibold tabular-nums text-ink-50">
                      {showGhost ? (
                        <>
                          <span className="text-accent-gold">
                            {p.projected.toFixed(1)}
                          </span>
                          <span className="ml-1 text-[10px] text-ink-400">
                            /{p.score.toFixed(0)}
                          </span>
                        </>
                      ) : (
                        p.score.toFixed(1)
                      )}
                    </div>
                    <div
                      className="text-right font-mono text-[10px] tabular-nums text-ink-300"
                      title="Entropy-blended pillar weight"
                    >
                      w={p.weight.toFixed(1)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="label-eyebrow">30-Day Trend</div>
              <div className="font-mono text-[10px] text-ink-300">
                {trend[0]?.day} → {trend[trend.length - 1]?.day}
              </div>
            </div>
            <ScoreSpark
              data={trend}
              color={scoreColor(report.overall)}
              height={64}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
