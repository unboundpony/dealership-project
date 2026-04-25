import {
  AlertTriangle,
  ChevronRight,
  Flame,
  Lightbulb,
  ListFilter,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Bottleneck, HealthReport, Pillar } from "@/types/health";
import { cn } from "@/utils/cn";
import { formatDays, formatNumber, formatPercent } from "@/utils/format";

interface OperationalBottlenecksProps {
  report: HealthReport;
}

const pillarColor: Record<Pillar, string> = {
  inventory: "#4A6DBD",
  demand: "#22D3EE",
  valuation: "#14B8A6",
  service: "#F5B700",
  finance: "#FB7185",
};

function severity(drag: number): {
  label: "Critical" | "High" | "Medium" | "Low";
  color: string;
  ring: string;
} {
  if (drag >= 4)
    return {
      label: "Critical",
      color: "text-accent-crimson",
      ring: "ring-accent-crimson/40 bg-accent-crimson/10",
    };
  if (drag >= 2.5)
    return {
      label: "High",
      color: "text-accent-amber",
      ring: "ring-accent-amber/40 bg-accent-amber/10",
    };
  if (drag >= 1.2)
    return {
      label: "Medium",
      color: "text-accent-gold",
      ring: "ring-accent-gold/30 bg-accent-gold/10",
    };
  return {
    label: "Low",
    color: "text-accent-cyan",
    ring: "ring-accent-cyan/30 bg-accent-cyan/10",
  };
}

function formatValue(
  value: number,
  unit: Bottleneck["unit"],
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
    default:
      return value.toFixed(1);
  }
}

export function OperationalBottlenecks({
  report,
}: OperationalBottlenecksProps) {
  const [filter, setFilter] = useState<Pillar | "all">("all");

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? report.bottlenecks
        : report.bottlenecks.filter((b) => b.pillar === filter);
    return list.slice(0, 6);
  }, [filter, report.bottlenecks]);

  const top = report.bottlenecks[0];
  const totalDrag = report.bottlenecks.reduce((s, b) => s + b.drag, 0);

  return (
    <section className="panel p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="label-eyebrow flex items-center gap-2 text-accent-amber">
            <TriangleAlert className="h-3.5 w-3.5" />
            IE Insight · Information-Entropy Flagged
          </div>
          <h2 className="mt-1 font-display text-[15px] font-semibold tracking-tight text-ink-50">
            Operational Bottlenecks
          </h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-300">
            Every metric is ranked by the absolute number of score-points it is
            subtracting from a perfect 100. Fixing items at the top of this
            list yields the largest Health Score lift per dollar of effort.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip gap-1.5">
            <Flame className="h-3 w-3 text-accent-crimson" />
            <span className="text-ink-200">
              Total drag:&nbsp;
              <span className="font-mono font-semibold text-ink-50">
                {totalDrag.toFixed(1)} pts
              </span>
            </span>
          </span>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-navy-800/70 p-1">
            <ListFilter className="ml-1.5 h-3 w-3 text-ink-400" />
            {(
              ["all", "inventory", "demand", "valuation", "service", "finance"] as const
            ).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setFilter(p)}
                className={cn(
                  "focus-ring rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition",
                  filter === p
                    ? "bg-accent-cyan/15 text-accent-cyan"
                    : "text-ink-300 hover:bg-white/5 hover:text-ink-100",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Featured top bottleneck */}
      {top && (
        <div className="mb-5 overflow-hidden rounded-xl border border-accent-amber/20 bg-gradient-to-br from-accent-amber/[0.06] via-accent-amber/[0.02] to-transparent p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-amber/15 text-accent-amber">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="label-eyebrow text-accent-amber">
                  Primary Drag · {top.brandName}
                </div>
                <div className="mt-0.5 font-display text-[15px] font-semibold text-ink-50">
                  {top.metricLabel}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-200">
                  <span>
                    Current:{" "}
                    <span className="font-mono font-semibold text-ink-50">
                      {formatValue(top.raw, top.unit)}
                    </span>
                  </span>
                  <span className="text-ink-400">→</span>
                  <span>
                    Target:{" "}
                    <span className="font-mono font-semibold text-accent-emerald">
                      {formatValue(top.target, top.unit)}
                    </span>
                  </span>
                  <span className="text-ink-400">·</span>
                  <span>
                    Score drag:{" "}
                    <span className="font-mono font-semibold text-accent-crimson">
                      −{top.drag.toFixed(1)} pts
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                Share of total drag
              </div>
              <div className="font-display text-2xl font-bold tabular-nums text-accent-amber">
                {top.share.toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/5 bg-navy-900/50 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-cyan" />
            <p className="text-[12px] leading-relaxed text-ink-100">
              <span className="font-semibold text-ink-50">
                Recommended action:{" "}
              </span>
              <span className="text-ink-200">{top.recommendation}</span>
            </p>
          </div>
        </div>
      )}

      {/* Ranked list */}
      <ol className="space-y-2">
        {filtered.map((b, i) => {
          const s = severity(b.drag);
          return (
            <li
              key={`${b.brand}-${b.metricKey}`}
              className={cn(
                "group grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl border border-white/5 bg-navy-850/50 p-3 transition hover:border-white/10 hover:bg-navy-850/80",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md ring-1 font-mono text-[11px] font-bold",
                  s.ring,
                  s.color,
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: pillarColor[b.pillar] }}
                  />
                  <span className="truncate text-[12px] font-semibold text-ink-50">
                    {b.brandName} · {b.metricLabel}
                  </span>
                  <span
                    className={cn(
                      "chip py-0.5 text-[9px] uppercase tracking-widest",
                      s.color,
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-ink-300">
                  {b.recommendation}
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-navy-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, b.share * 4)}%`,
                      background: `linear-gradient(90deg, ${pillarColor[b.pillar]}, ${pillarColor[b.pillar]}77)`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    Drag
                  </div>
                  <div className="font-display text-sm font-bold tabular-nums text-accent-crimson">
                    −{b.drag.toFixed(1)}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-accent-cyan" />
              </div>
            </li>
          );
        })}
      </ol>

      {/* Methodology footnote */}
      <footer className="mt-5 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-ink-400">
        <span className="font-mono uppercase tracking-widest">
          Method · MCDA + Shannon Entropy Weighting
        </span>
        <span className="font-mono">
          drag = (1 − n<sub>metric</sub>) · w<sub>metric</sub> · w
          <sub>pillar</sub> · 100
        </span>
      </footer>
    </section>
  );
}
