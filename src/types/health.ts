export type BrandId =
  | "velocityauto"
  | "metrolane"
  | "autovista"
  | "blueledger"
  | "serviceflow"
  | "dealroute";

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

/* ---------------------------------------------------------------------------
 * Floorplan · Inventory Carrying-Cost ("Profit Evaporator") types
 * ------------------------------------------------------------------------- */

/**
 * A single vehicle on the floorplan. Basis = acquisition cost that the dealer
 * is actively paying interest on; projectedGross = expected retail gross.
 */
export interface FloorplanVehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  /** Rooftop / store identifier */
  rooftop: string;
  /** Acquisition cost (basis) on which floorplan interest accrues */
  basis: number;
  /** Expected retail gross profit on the unit */
  projectedGross: number;
  /** Days the unit has been on the lot / on floorplan */
  daysOnLot: number;
}

/**
 * A vehicle with its accrued interest drag and toxic-asset flags resolved.
 */
export interface FloorplanVehicleBurn extends FloorplanVehicle {
  /** Dollars burned per day at the active APR: basis · (APR / 365) */
  dailyInterest: number;
  /** Total accrued interest to date: dailyInterest · daysOnLot */
  accruedInterest: number;
  /** Accrued interest as a share of the projected gross (0-1+) */
  grossErosion: number;
  /** Toxic-asset flag: either erosion > 15% OR daysOnLot > 60 */
  toxic: boolean;
  toxicReasons: string[];
}

/**
 * Global "Profit Evaporator" readout for an entire fleet at a given APR.
 * All dollar figures are in USD.
 */
export interface FloorplanBurn {
  apr: number;
  totalUnits: number;
  totalBasis: number;
  /** H_d = Σ (basis · APR / 365) — daily interest across the whole fleet. */
  dailyBurn: number;
  /** 30-day projection of dailyBurn. */
  monthlyBurn: number;
  /** Sum of accruedInterest across units (cumulative to date). */
  accruedBurn: number;
  /** GM-authorized monthly floorplan tolerance. */
  lossTolerance: number;
  /** monthlyBurn / lossTolerance — 1.0 = at limit, >1 = breach. */
  burnRatio: number;
  /** Zone rating for the thermometer. */
  zone: "safe" | "watch" | "warning" | "breach";
  units: FloorplanVehicleBurn[];
  /** All units flagged toxic (erosion >15% of gross OR >60 DOL). */
  toxic: FloorplanVehicleBurn[];
  /** Top N money-losers (by accruedInterest, descending). */
  topMoneyLosers: FloorplanVehicleBurn[];
}
