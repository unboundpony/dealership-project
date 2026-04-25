import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";

interface ScoreSparkProps {
  data: Array<{ day: string; score: number }>;
  color?: string;
  height?: number;
}

export function ScoreSpark({
  data,
  color = "#22D3EE",
  height = 52,
}: ScoreSparkProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis
            hide
            domain={[
              (dataMin: number) => Math.max(0, Math.floor(dataMin - 4)),
              (dataMax: number) => Math.min(100, Math.ceil(dataMax + 4)),
            ]}
          />
          <Tooltip
            cursor={{
              stroke: "rgba(122,148,212,0.35)",
              strokeDasharray: "3 3",
            }}
            formatter={(v: number) => [`${v}`, "Score"]}
            labelFormatter={(d) => String(d)}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            fill="url(#sparkFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
