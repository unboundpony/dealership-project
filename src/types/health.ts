export type BrandId =
  | "vauto"
  | "manheim"
  | "autotrader"
  | "kbb"
  | "xtime"
  | "dealertrack";

export type Pillar =
  | "inventory"
  | "demand"
  | "valuation"
  | "service"
  | "finance";

export type SyncStatus = "live" | "syncing" | "delayed" | "offline";

export type MetricDirection = "higher-better" | "lower-better";

export interface MetricSpec {
  key: string;
  label: string;
  unit: "days" | "%" | "count" | "score" | "index" | "$";
  direction: MetricDirection;
  /** Raw value from the source system */
  value: number;
  /** Target "healthy" value the dealer is aiming for */
  target: number;
  /** Worst tolerable value before the metric is fully saturated */
  floor: number;
  /** Intra-pillar IE weight (entropy/importance), 0-1. Sum per pillar = 1. */
  weight: number;
  /** Short human description for tooltips / drill-down */
  description: string;
}

export interface BrandSignal {
  id: BrandId;
  name: string;
  shortName: string;
  tagline: string;
  pillar: Pillar;
  /** Source system color accent */
  accent: string;
  sync: SyncStatus;
  /** Seconds since last sync */
  lastSyncSec: number;
  metrics: MetricSpec[];
}

export interface PillarScore {
  pillar: Pillar;
  label: string;
  score: number;
  weight: number;
  brands: BrandId[];
}

export interface BrandScore {
  brand: BrandId;
  score: number;
  pillarScore: number;
  metrics: Array<{
    key: string;
    label: string;
    normalized: number;
    weight: number;
    contribution: number;
    raw: number;
    unit: MetricSpec["unit"];
    direction: MetricDirection;
  }>;
}

export interface Bottleneck {
  brand: BrandId;
  brandName: string;
  metricKey: string;
  metricLabel: string;
  pillar: Pillar;
  /** 0-100 score drag in absolute points (larger = worse) */
  drag: number;
  /** Percent of total gap attributable to this metric */
  share: number;
  raw: number;
  target: number;
  unit: MetricSpec["unit"];
  direction: MetricDirection;
  recommendation: string;
}

export interface HealthReport {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  trend: number;
  pillars: PillarScore[];
  brands: BrandScore[];
  bottlenecks: Bottleneck[];
  /** Shannon-entropy-derived pillar weights (IE weighting) */
  entropyWeights: Record<Pillar, number>;
}
