import type { BrandSignal, Pillar } from "@/types/health";

/**
 * Mock dealer telemetry for the Big 6 Lee Automotive brands.
 *
 * Values are anchored to real industry benchmarks:
 *   - VelocityAuto:       Market Days Supply (MDS) ~45d target, stocking level vs demand
 *   - MetroLane:     Auction win-rate + floor price variance
 *   - AutoVista:  VDP views per VIN + lead-to-appointment conversion
 *   - BLG:         Price-to-Market (P2M) index + trade-in volume/week
 *   - ServiceFlow:       Recon cycle time (speed-to-retail) + bay utilization
 *   - DealRoute: F&I penetration + credit tier A/B mix
 */

const pillarLabels: Record<Pillar, string> = {
  inventory: "Inventory",
  demand: "Demand",
  valuation: "Valuation",
  service: "Service",
  finance: "Finance",
};

export const PILLAR_LABELS = pillarLabels;

export const MOCK_BRANDS: BrandSignal[] = [
  {
    id: "velocityauto",
    name: "VelocityAuto",
    shortName: "VelocityAuto",
    tagline: "Inventory intelligence",
    pillar: "inventory",
    accent: "#4A6DBD",
    sync: "live",
    lastSyncSec: 12,
    metrics: [
      {
        key: "market_days_supply",
        label: "Market Days Supply",
        unit: "days",
        direction: "lower-better",
        value: 58,
        target: 45,
        floor: 110,
        weight: 0.55,
        description:
          "Days of inventory on the ground relative to local market demand velocity.",
      },
      {
        key: "stocking_health",
        label: "Stocking Health",
        unit: "index",
        direction: "higher-better",
        value: 74,
        target: 90,
        floor: 40,
        weight: 0.45,
        description:
          "Composite of price-to-market, age bands, and velocity vs mix plan.",
      },
    ],
  },
  {
    id: "metrolane",
    name: "MetroLane",
    shortName: "MetroLane",
    tagline: "Wholesale & auction",
    pillar: "inventory",
    accent: "#7A94D4",
    sync: "live",
    lastSyncSec: 34,
    metrics: [
      {
        key: "auction_winrate",
        label: "Auction Win Rate",
        unit: "%",
        direction: "higher-better",
        value: 41,
        target: 55,
        floor: 15,
        weight: 0.5,
        description:
          "Percent of targeted lanes won relative to bids placed over 30d.",
      },
      {
        key: "floor_price_variance",
        label: "Floor Price Variance",
        unit: "%",
        direction: "lower-better",
        value: 4.8,
        target: 2.5,
        floor: 12,
        weight: 0.5,
        description:
          "Avg absolute delta of win-price vs MetroLane Market Report floor.",
      },
    ],
  },
  {
    id: "autovista",
    name: "AutoVista",
    shortName: "AutoVista",
    tagline: "Consumer demand",
    pillar: "demand",
    accent: "#22D3EE",
    sync: "live",
    lastSyncSec: 7,
    metrics: [
      {
        key: "vdp_views",
        label: "VDP Views / VIN",
        unit: "count",
        direction: "higher-better",
        value: 186,
        target: 240,
        floor: 60,
        weight: 0.5,
        description:
          "Avg vehicle detail-page views per active VIN over the trailing 14 days.",
      },
      {
        key: "lead_conversion",
        label: "Lead → Appt Conversion",
        unit: "%",
        direction: "higher-better",
        value: 22,
        target: 32,
        floor: 8,
        weight: 0.5,
        description:
          "Share of inbound leads that reach a set and confirmed appointment.",
      },
    ],
  },
  {
    id: "blueledger",
    name: "BlueLedger Guide",
    shortName: "BLG",
    tagline: "Valuation & trade-ins",
    pillar: "valuation",
    accent: "#14B8A6",
    sync: "syncing",
    lastSyncSec: 96,
    metrics: [
      {
        key: "price_to_market",
        label: "Price-to-Market Index",
        unit: "index",
        direction: "higher-better",
        value: 97,
        target: 100,
        floor: 80,
        weight: 0.55,
        description:
          "Retail price positioning vs local market (100 = parity, <100 = under-priced).",
      },
      {
        key: "trade_volume",
        label: "Trade-In Volume / wk",
        unit: "count",
        direction: "higher-better",
        value: 38,
        target: 55,
        floor: 10,
        weight: 0.45,
        description:
          "Confirmed trade appraisals completed via BLG ICO per week.",
      },
    ],
  },
  {
    id: "serviceflow",
    name: "ServiceFlow",
    shortName: "ServiceFlow",
    tagline: "Service & recon",
    pillar: "service",
    accent: "#F5B700",
    sync: "delayed",
    lastSyncSec: 412,
    metrics: [
      {
        key: "recon_cycle_time",
        label: "Recon Cycle Time",
        unit: "days",
        direction: "lower-better",
        value: 9.2,
        target: 4.5,
        floor: 18,
        weight: 0.6,
        description:
          "Days from acquisition to frontline-ready (speed-to-retail).",
      },
      {
        key: "bay_utilization",
        label: "Bay Utilization",
        unit: "%",
        direction: "higher-better",
        value: 71,
        target: 88,
        floor: 40,
        weight: 0.4,
        description:
          "Service bay productive hours vs available hours, trailing 7d.",
      },
    ],
  },
  {
    id: "dealroute",
    name: "DealRoute",
    shortName: "DealRoute",
    tagline: "F&I and financing",
    pillar: "finance",
    accent: "#FB7185",
    sync: "live",
    lastSyncSec: 48,
    metrics: [
      {
        key: "fi_penetration",
        label: "F&I Penetration",
        unit: "%",
        direction: "higher-better",
        value: 63,
        target: 78,
        floor: 30,
        weight: 0.55,
        description:
          "Share of retailed units with one or more F&I products attached.",
      },
      {
        key: "tier_a_b_mix",
        label: "Tier A+B Credit Mix",
        unit: "%",
        direction: "higher-better",
        value: 58,
        target: 70,
        floor: 25,
        weight: 0.45,
        description:
          "Percent of funded contracts in prime credit tiers A or B.",
      },
    ],
  },
];

/**
 * Small stateful jitter so the dashboard "feels" live without a backend.
 * Bounded so directionally accurate without drifting out of realistic ranges.
 */
export function jitterBrands(brands: BrandSignal[]): BrandSignal[] {
  return brands.map((b) => ({
    ...b,
    lastSyncSec:
      b.sync === "live"
        ? Math.max(1, Math.round(Math.random() * 60))
        : b.sync === "syncing"
          ? Math.max(40, Math.round(60 + Math.random() * 90))
          : b.sync === "delayed"
            ? Math.round(300 + Math.random() * 300)
            : 0,
    metrics: b.metrics.map((m) => {
      const span = Math.abs(m.target - m.floor);
      const nudge = (Math.random() - 0.5) * span * 0.035;
      const next = m.value + nudge;
      return {
        ...m,
        value:
          m.direction === "lower-better"
            ? Math.max(m.target * 0.4, Math.min(m.floor * 1.05, next))
            : Math.max(m.floor * 0.95, Math.min(m.target * 1.08, next)),
      };
    }),
  }));
}

/**
 * Simulate a 30-day trend series for the overall score so the sparkline
 * matches the rest of the live data.
 */
export function generateTrendSeries(
  current: number,
  days = 30,
): Array<{ day: string; score: number }> {
  const out: Array<{ day: string; score: number }> = [];
  let value = Math.max(40, Math.min(98, current - 6));
  for (let i = days - 1; i >= 0; i--) {
    const drift = (Math.random() - 0.48) * 1.8;
    value = Math.max(40, Math.min(98, value + drift));
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: Math.round(value * 10) / 10,
    });
  }
  // Anchor the last point to the current live score so the chart is coherent
  out[out.length - 1].score = Math.round(current * 10) / 10;
  return out;
}
