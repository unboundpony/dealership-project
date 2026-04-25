import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
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
import type { HealthReport } from "@/types/health";
import { ScoreSpark } from "@/components/ui/ScoreSpark";
import { cn } from "@/utils/cn";

interface HeroScoreProps {
  report: HealthReport;
  trend: Array<{ day: string; score: number }>;
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

export function HeroScore({ report, trend }: HeroScoreProps) {
  const [hover, setHover] = useState<string | null>(null);

  const radialData = useMemo(
    () => [{ name: "score", value: report.overall, fill: scoreColor(report.overall) }],
    [report.overall],
  );

  const pillarBar = useMemo(
    () =>
      report.pillars.map((p) => ({
        name: p.label,
        pillar: p.pillar,
        score: p.score,
        weight: Math.round(p.weight * 1000) / 10,
        fill: pillarPalette[p.pillar] ?? "#4A6DBD",
      })),
    [report.pillars],
  );

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
            Grade {report.grade}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* ---------- Interactive gauge ring ---------- */}
        <div className="relative mx-auto flex h-[320px] w-full max-w-[360px] items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-b from-navy-700/40 to-navy-900/0 blur-2xl"
            aria-hidden
          />
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
              <RadialBar
                dataKey="value"
                background={{ fill: "rgba(122,148,212,0.12)" }}
                cornerRadius={12}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="label-eyebrow text-ink-300">Overall Score</div>
            <div
              key={report.overall.toFixed(1)}
              className="mt-1 animate-score-rise font-display text-6xl font-bold leading-none tracking-tight text-ink-50 tabular-nums"
              style={{ color: scoreColor(report.overall) }}
            >
              {report.overall.toFixed(1)}
            </div>
            <div className="mt-1 font-mono text-xs text-ink-300">/ 100</div>
            <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-navy-800/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-accent-cyan" />
              <span className="text-ink-100">{v.label}</span>
            </div>
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
              {pillarBar.map((p) => (
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
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${p.score}%`,
                        background: `linear-gradient(90deg, ${p.fill} 0%, ${p.fill}cc 100%)`,
                        boxShadow: `0 0 18px ${p.fill}55`,
                      }}
                    />
                  </div>
                  <div className="text-right font-mono text-[12px] font-semibold tabular-nums text-ink-50">
                    {p.score.toFixed(1)}
                  </div>
                  <div
                    className="text-right font-mono text-[10px] tabular-nums text-ink-300"
                    title="Entropy-blended pillar weight"
                  >
                    w={p.weight.toFixed(1)}%
                  </div>
                </button>
              ))}
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
