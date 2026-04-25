import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BrandSignal, HealthReport } from "@/types/health";
import { Panel } from "@/components/ui/Panel";

interface BrandRankBarProps {
  brands: BrandSignal[];
  report: HealthReport;
}

export function BrandRankBar({ brands, report }: BrandRankBarProps) {
  const accentBy = new Map(brands.map((b) => [b.id, { name: b.shortName, color: b.accent }]));
  const data = [...report.brands]
    .map((b) => ({
      name: accentBy.get(b.brand)?.name ?? b.brand,
      score: Math.round(b.score * 10) / 10,
      color: accentBy.get(b.brand)?.color ?? "#4A6DBD",
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <Panel
      eyebrow="Cross-Brand Benchmark"
      title="Pillar Scores by Source System"
      icon={<BarChart3 className="h-4 w-4 text-accent-cyan" />}
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              cursor={{ fill: "rgba(122,148,212,0.08)" }}
              formatter={(value: number) => [`${value}`, "Score"]}
            />
            <ReferenceLine
              y={85}
              stroke="#22D3EE"
              strokeDasharray="4 4"
              label={{
                value: "Target 85",
                position: "insideTopRight",
                fill: "#22D3EE",
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            <Bar dataKey="score" radius={[8, 8, 4, 4]} maxBarSize={44}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
