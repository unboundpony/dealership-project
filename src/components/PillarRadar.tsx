import { Radar as RadarIcon } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { HealthReport } from "@/types/health";
import { Panel } from "@/components/ui/Panel";

interface PillarRadarProps {
  report: HealthReport;
}

export function PillarRadar({ report }: PillarRadarProps) {
  const data = report.pillars.map((p) => ({
    pillar: p.label,
    score: Math.round(p.score * 10) / 10,
    target: 85,
  }));

  return (
    <Panel
      eyebrow="Omnichannel Coverage"
      title="Pillar Fingerprint"
      icon={<RadarIcon className="h-4 w-4 text-accent-cyan" />}
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <PolarGrid stroke="rgba(122,148,212,0.18)" />
            <PolarAngleAxis
              dataKey="pillar"
              tick={{ fill: "#B3C2E6", fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={54}
              domain={[0, 100]}
              tick={{ fill: "#6B7895", fontSize: 10 }}
              stroke="rgba(122,148,212,0.18)"
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="#4A6DBD"
              fill="#4A6DBD"
              fillOpacity={0.08}
              strokeDasharray="4 4"
            />
            <Radar
              name="Live Score"
              dataKey="score"
              stroke="#22D3EE"
              fill="#22D3EE"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value}`,
                name,
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-accent-cyan/60" /> Live
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-navy-400" /> Target = 85
        </span>
      </div>
    </Panel>
  );
}
