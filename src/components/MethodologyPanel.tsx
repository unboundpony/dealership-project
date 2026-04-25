import { BookOpen, Scale, Sigma, Workflow } from "lucide-react";
import type { HealthReport } from "@/types/health";
import { Panel } from "@/components/ui/Panel";

interface MethodologyPanelProps {
  report: HealthReport;
}

export function MethodologyPanel({ report }: MethodologyPanelProps) {
  const weights = report.pillars.map((p) => ({
    label: p.label,
    pct: Math.round(p.weight * 1000) / 10,
  }));

  return (
    <Panel
      eyebrow="Audit Trail"
      title="Scoring Methodology"
      icon={<BookOpen className="h-4 w-4 text-accent-cyan" />}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-navy-850/50 p-4">
          <div className="label-eyebrow flex items-center gap-2 text-accent-cyan">
            <Scale className="h-3.5 w-3.5" />
            Step 1 · Normalize
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-200">
            Every raw metric is mapped to{" "}
            <span className="font-mono text-ink-50">[0, 1]</span> against its
            dealer-specific{" "}
            <span className="font-mono text-ink-50">target</span> and{" "}
            <span className="font-mono text-ink-50">floor</span> thresholds —
            respecting whether higher or lower is better.
          </p>
          <div className="mt-3 rounded-lg border border-white/5 bg-navy-900/60 p-2.5 font-mono text-[11px] text-ink-200">
            n = (v − floor) / (target − floor)
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-navy-850/50 p-4">
          <div className="label-eyebrow flex items-center gap-2 text-accent-cyan">
            <Sigma className="h-3.5 w-3.5" />
            Step 2 · IE-Weight
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-200">
            Pillar weights combine an analyst <em>Importance</em> prior with a
            live <em>Shannon-Entropy</em> measure of signal dispersion. Pillars
            that carry more decision information are weighted up.
          </p>
          <div className="mt-3 rounded-lg border border-white/5 bg-navy-900/60 p-2.5 font-mono text-[11px] text-ink-200">
            w<sub>p</sub> = 0.7·prior<sub>p</sub> + 0.3·H(p)/ΣH
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-navy-850/50 p-4">
          <div className="label-eyebrow flex items-center gap-2 text-accent-cyan">
            <Workflow className="h-3.5 w-3.5" />
            Step 3 · Aggregate
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-200">
            Weighted sum of pillar scores produces the 0-100 Health Index and
            ranks every metric by its individual score drag — the output that
            feeds the Operational Bottlenecks panel.
          </p>
          <div className="mt-3 rounded-lg border border-white/5 bg-navy-900/60 p-2.5 font-mono text-[11px] text-ink-200">
            Score = 100 · Σ<sub>p</sub> w<sub>p</sub>·n̄<sub>p</sub>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-navy-900/60 p-4">
        <div className="label-eyebrow mb-3 text-ink-300">
          Resolved Pillar Weights · this refresh
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {weights.map((w) => (
            <div
              key={w.label}
              className="chip gap-2 border-white/10 py-1.5 text-[11px]"
            >
              <span className="text-ink-200">{w.label}</span>
              <span className="font-mono font-semibold text-accent-cyan">
                {w.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
