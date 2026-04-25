import {
  CarFront,
  CircleDollarSign,
  Gauge,
  Timer,
  TrendingUp,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BrandSignal, HealthReport } from "@/types/health";
import { cn } from "@/utils/cn";
import { formatDays, formatPercent } from "@/utils/format";

interface KpiStripProps {
  brands: BrandSignal[];
  report: HealthReport;
}

function metricBy(
  brands: BrandSignal[],
  brandId: string,
  key: string,
): number | undefined {
  const b = brands.find((x) => x.id === brandId);
  return b?.metrics.find((m) => m.key === key)?.value;
}

interface Kpi {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down" | "flat";
  accent: string;
  sub: string;
}

export function KpiStrip({ brands, report }: KpiStripProps) {
  const mds = metricBy(brands, "vauto", "market_days_supply") ?? 0;
  const vdp = metricBy(brands, "autotrader", "vdp_views") ?? 0;
  const conv = metricBy(brands, "autotrader", "lead_conversion") ?? 0;
  const recon = metricBy(brands, "xtime", "recon_cycle_time") ?? 0;
  const fi = metricBy(brands, "dealertrack", "fi_penetration") ?? 0;

  const kpis: Kpi[] = [
    {
      icon: Gauge,
      label: "Health Index",
      value: report.overall.toFixed(1),
      delta: `${report.trend >= 0 ? "+" : ""}${report.trend.toFixed(1)} pts`,
      direction: report.trend >= 0 ? "up" : "down",
      accent: "#22D3EE",
      sub: `Grade ${report.grade}`,
    },
    {
      icon: CarFront,
      label: "Market Days Supply",
      value: formatDays(mds),
      delta: mds <= 45 ? "On target" : `${(mds - 45).toFixed(0)}d over`,
      direction: mds <= 45 ? "up" : "down",
      accent: "#4A6DBD",
      sub: "vAuto · Inventory",
    },
    {
      icon: Users2,
      label: "VDP Views / VIN",
      value: Math.round(vdp).toString(),
      delta: vdp >= 200 ? "Healthy" : `${Math.round(240 - vdp)} below`,
      direction: vdp >= 200 ? "up" : "down",
      accent: "#22D3EE",
      sub: "Autotrader · Demand",
    },
    {
      icon: TrendingUp,
      label: "Lead Conversion",
      value: formatPercent(conv),
      delta: conv >= 28 ? "Above plan" : "Below plan",
      direction: conv >= 28 ? "up" : "down",
      accent: "#14B8A6",
      sub: "Autotrader BDC",
    },
    {
      icon: Timer,
      label: "Recon Cycle",
      value: formatDays(recon),
      delta: recon <= 5 ? "Speed-to-Retail" : `${(recon - 5).toFixed(1)}d over`,
      direction: recon <= 5 ? "up" : "down",
      accent: "#F5B700",
      sub: "Xtime · Service",
    },
    {
      icon: CircleDollarSign,
      label: "F&I Penetration",
      value: formatPercent(fi),
      delta: fi >= 75 ? "Above plan" : `${Math.round(78 - fi)}pp gap`,
      direction: fi >= 75 ? "up" : "down",
      accent: "#FB7185",
      sub: "Dealertrack · Finance",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((k) => {
        const Icon = k.icon;
        const dir =
          k.direction === "up"
            ? "text-accent-emerald"
            : k.direction === "down"
              ? "text-accent-crimson"
              : "text-ink-300";
        return (
          <div
            key={k.label}
            className="panel relative overflow-hidden p-4"
            style={{ boxShadow: `inset 0 0 0 1px ${k.accent}14` }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl"
              style={{ background: `${k.accent}22` }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${k.accent}18`, color: k.accent }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "font-mono text-[10px] font-semibold uppercase tracking-wider",
                  dir,
                )}
              >
                {k.delta}
              </span>
            </div>
            <div className="relative mt-3 font-display text-2xl font-bold tracking-tight tabular-nums text-ink-50">
              {k.value}
            </div>
            <div className="relative mt-0.5 text-[11px] font-medium text-ink-200">
              {k.label}
            </div>
            <div className="relative mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {k.sub}
            </div>
          </div>
        );
      })}
    </section>
  );
}
