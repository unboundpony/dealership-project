import type {
  BrandScore,
  BrandSignal,
  Bottleneck,
  FloorplanBurn,
  FloorplanVehicle,
  FloorplanVehicleBurn,
  HealthReport,
  MetricSpec,
  Pillar,
  PillarScore,
} from "@/types/health";

/**
 * ============================================================================
 * HealthScoreEngine — IE-weighted Multi-Criteria Decision Analysis (MCDA)
 * ============================================================================
 *
 * The Dealer Health Score is a single 0-100 number that consolidates dealer
 * performance across the Lee Automotive "Big 6" data sources.
 *
 * Methodology (three-stage MCDA pipeline):
 *
 *   1) NORMALIZATION
 *      Raw telemetry lives on wildly different scales (days, %, counts,
 *      indices, $). Each metric is mapped to [0, 1] using its `target`
 *      (healthy) and `floor` (worst-tolerated) thresholds, respecting its
 *      `direction` (higher-better vs lower-better).
 *
 *   2) IE WEIGHTING  (Information Entropy / Shannon)
 *      For the inter-pillar roll-up, weights are derived from the Shannon
 *      entropy of each pillar's normalized distribution across brands.
 *      Pillars with HIGHER dispersion (= more decision-relevant information)
 *      receive a HIGHER weight. This is the classic Entropy-Weight MCDA
 *      technique (CRITIC/EWM family). A fixed prior blends with the entropy
 *      weights so the dashboard stays executive-readable even when one
 *      pillar momentarily goes flat.
 *
 *      Intra-pillar metric weights are analyst-set importance priors
 *      (the IE "I" = Importance × Entropy combination) baked into the data
 *      service (e.g. Recon Cycle Time is 0.60 of the Service pillar).
 *
 *   3) AGGREGATION
 *      Pillar score  = Σ (w_metric × n_metric)   across brands in pillar
 *      Overall score = Σ (w_pillar × pillar_score)   × 100
 *
 * BOTTLENECK DETECTION
 *      The engine also emits a ranked list of "drag" metrics — each weighted
 *      by how many raw score points it is personally subtracting from the
 *      100 ceiling. This is what powers the "Operational Bottlenecks"
 *      (IE Insight) section of the dashboard.
 * ============================================================================
 */

const PILLAR_LABELS: Record<Pillar, string> = {
  inventory: "Inventory",
  demand: "Demand",
  valuation: "Valuation",
  service: "Service",
  finance: "Finance",
};

/**
 * Analyst-set importance prior for each pillar. The runtime Shannon-entropy
 * weights are blended with this prior (70/30) to stabilize the dashboard.
 *
 * These priors reflect Lee's own "omnichannel retail" point of view:
 * inventory + demand are the biggest P&L levers, service is the recon
 * bottleneck that caps the other four, and finance closes the deal.
 */
const PRIOR_PILLAR_WEIGHTS: Record<Pillar, number> = {
  inventory: 0.26,
  demand: 0.24,
  valuation: 0.18,
  service: 0.18,
  finance: 0.14,
};

const ENTROPY_PRIOR_BLEND = 0.7; // weight on analyst prior, 1 - blend goes to entropy

/* --------------------------------------------------------------------------
 * Stage 1 — Normalization
 * ------------------------------------------------------------------------ */

/**
 * Map a raw metric value to [0, 1] using its target / floor thresholds,
 * respecting direction. Clamped on both ends.
 */
export function normalizeMetric(m: MetricSpec): number {
  const { value, target, floor, direction } = m;
  if (direction === "higher-better") {
    if (value >= target) return 1;
    if (value <= floor) return 0;
    return (value - floor) / (target - floor);
  }
  // lower-better
  if (value <= target) return 1;
  if (value >= floor) return 0;
  return (floor - value) / (floor - target);
}

/* --------------------------------------------------------------------------
 * Stage 2 — Shannon entropy over pillar distributions
 * ------------------------------------------------------------------------ */

function shannonEntropy(values: number[]): number {
  const total = values.reduce((s, v) => s + v, 0);
  if (total <= 0) return 0;
  let h = 0;
  for (const v of values) {
    if (v <= 0) continue;
    const p = v / total;
    h -= p * Math.log(p);
  }
  return h;
}

/**
 * Derive entropy-based pillar weights from the current normalized signal.
 * Pillars whose constituent metrics disagree (high entropy) are weighted up;
 * pillars that are "all one value" (low entropy) are weighted down because
 * they contribute less decision information.
 */
export function computeEntropyWeights(
  brands: BrandSignal[],
): Record<Pillar, number> {
  const byPillar: Record<Pillar, number[]> = {
    inventory: [],
    demand: [],
    valuation: [],
    service: [],
    finance: [],
  };

  for (const b of brands) {
    for (const m of b.metrics) {
      byPillar[b.pillar].push(normalizeMetric(m));
    }
  }

  const rawEntropy: Record<Pillar, number> = {
    inventory: shannonEntropy(byPillar.inventory),
    demand: shannonEntropy(byPillar.demand),
    valuation: shannonEntropy(byPillar.valuation),
    service: shannonEntropy(byPillar.service),
    finance: shannonEntropy(byPillar.finance),
  };

  const sum =
    rawEntropy.inventory +
    rawEntropy.demand +
    rawEntropy.valuation +
    rawEntropy.service +
    rawEntropy.finance;

  const entropyNorm: Record<Pillar, number> =
    sum > 0
      ? {
          inventory: rawEntropy.inventory / sum,
          demand: rawEntropy.demand / sum,
          valuation: rawEntropy.valuation / sum,
          service: rawEntropy.service / sum,
          finance: rawEntropy.finance / sum,
        }
      : { ...PRIOR_PILLAR_WEIGHTS };

  // Blend analyst prior with entropy weights for stability
  const blended: Record<Pillar, number> = {
    inventory:
      ENTROPY_PRIOR_BLEND * PRIOR_PILLAR_WEIGHTS.inventory +
      (1 - ENTROPY_PRIOR_BLEND) * entropyNorm.inventory,
    demand:
      ENTROPY_PRIOR_BLEND * PRIOR_PILLAR_WEIGHTS.demand +
      (1 - ENTROPY_PRIOR_BLEND) * entropyNorm.demand,
    valuation:
      ENTROPY_PRIOR_BLEND * PRIOR_PILLAR_WEIGHTS.valuation +
      (1 - ENTROPY_PRIOR_BLEND) * entropyNorm.valuation,
    service:
      ENTROPY_PRIOR_BLEND * PRIOR_PILLAR_WEIGHTS.service +
      (1 - ENTROPY_PRIOR_BLEND) * entropyNorm.service,
    finance:
      ENTROPY_PRIOR_BLEND * PRIOR_PILLAR_WEIGHTS.finance +
      (1 - ENTROPY_PRIOR_BLEND) * entropyNorm.finance,
  };

  const totalBlended =
    blended.inventory +
    blended.demand +
    blended.valuation +
    blended.service +
    blended.finance;

  return {
    inventory: blended.inventory / totalBlended,
    demand: blended.demand / totalBlended,
    valuation: blended.valuation / totalBlended,
    service: blended.service / totalBlended,
    finance: blended.finance / totalBlended,
  };
}

/* --------------------------------------------------------------------------
 * Stage 3 — Aggregation + scoring
 * ------------------------------------------------------------------------ */

function computeBrandScore(brand: BrandSignal): BrandScore {
  // Normalize per metric and roll up with intra-pillar weights
  const metrics = brand.metrics.map((m) => {
    const n = normalizeMetric(m);
    return {
      key: m.key,
      label: m.label,
      normalized: n,
      weight: m.weight,
      contribution: n * m.weight,
      raw: m.value,
      unit: m.unit,
      direction: m.direction,
    };
  });

  const weightSum = metrics.reduce((s, m) => s + m.weight, 0) || 1;
  const pillarScore =
    metrics.reduce((s, m) => s + m.contribution, 0) / weightSum;

  return {
    brand: brand.id,
    pillarScore,
    score: Math.round(pillarScore * 1000) / 10, // 0-100, one decimal
    metrics,
  };
}

function pillarAggregate(
  pillar: Pillar,
  brandScores: BrandScore[],
  brands: BrandSignal[],
): number {
  const ids = brands.filter((b) => b.pillar === pillar).map((b) => b.id);
  const relevant = brandScores.filter((b) => ids.includes(b.brand));
  if (relevant.length === 0) return 0;
  const avg =
    relevant.reduce((s, b) => s + b.pillarScore, 0) / relevant.length;
  return avg; // 0-1
}

function gradeOf(score: number): HealthReport["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/* --------------------------------------------------------------------------
 * Bottleneck detection
 * ------------------------------------------------------------------------ */

function recommendationFor(m: MetricSpec, pillar: Pillar): string {
  const table: Record<string, string> = {
    market_days_supply:
      "Aggressively price or wholesale aged units; tighten acquisition funnel to <45 MDS.",
    stocking_health:
      "Rebalance mix toward high-turn segments; refresh merchandising on stale VINs.",
    auction_winrate:
      "Recalibrate MMR proxy bids; target +2 lanes/week in shortfall segments.",
    floor_price_variance:
      "Tighten appraisal guardrails; enforce Market Report floor discipline.",
    vdp_views:
      "Boost AutoVista Top Dealer placements and refresh photography on <100-view VINs.",
    lead_conversion:
      "BDC follow-up SLA <8m; tighten appointment-set scripts; A/B test CTAs.",
    price_to_market:
      "Re-price to 95-100 P2M band; reduce >10d price-stale inventory.",
    trade_volume:
      "Push BLG ICO widget on VDP + service drive; incentive trade walks.",
    recon_cycle_time:
      "Reduce dwell in sublet & detail; target Speed-to-Retail <5 days.",
    bay_utilization:
      "Rebalance tech schedules; pre-load tomorrow's RO at 4pm close.",
    fi_penetration:
      "Menu-sell all eligible products; coach desk on tier-aware presentation.",
    tier_a_b_mix:
      "Tighten lead scoring; route tier-A credit to prime lenders first.",
  };
  return (
    table[m.key] ??
    `Close the ${PILLAR_LABELS[pillar].toLowerCase()} gap on ${m.label}.`
  );
}

function computeBottlenecks(
  brands: BrandSignal[],
  entropyWeights: Record<Pillar, number>,
): Bottleneck[] {
  const raw: Bottleneck[] = [];

  for (const b of brands) {
    // Pillar weight and how many metrics share it across brands of same pillar
    const pillarBrandCount = brands.filter((x) => x.pillar === b.pillar).length;
    const pillarW = entropyWeights[b.pillar];

    for (const m of b.metrics) {
      const n = normalizeMetric(m);
      const gap = 1 - n; // how far from healthy (0 = perfect, 1 = worst)
      // Score drag in absolute 0-100 points attributable to this single metric
      const drag = gap * m.weight * (pillarW / pillarBrandCount) * 100;
      raw.push({
        brand: b.id,
        brandName: b.name,
        metricKey: m.key,
        metricLabel: m.label,
        pillar: b.pillar,
        drag,
        share: 0, // filled in after normalization
        raw: m.value,
        target: m.target,
        unit: m.unit,
        direction: m.direction,
        recommendation: recommendationFor(m, b.pillar),
      });
    }
  }

  const total = raw.reduce((s, r) => s + r.drag, 0) || 1;
  return raw
    .map((r) => ({ ...r, share: (r.drag / total) * 100 }))
    .sort((a, b) => b.drag - a.drag);
}

export interface ScoringOptions {
  /** Previous overall score, for trend delta. Defaults to 0. */
  previousOverall?: number;
}

/* --------------------------------------------------------------------------
 * Simulation / "What-If" projection types
 * ------------------------------------------------------------------------ */

/**
 * Partial override of pillar scores on a 0-100 scale. Any pillar not present
 * in the record falls back to its "Actual" (live) value.
 */
export type PillarOverrides = Partial<Record<Pillar, number>>;

/**
 * Sensitivity analysis output for a single pillar. `weightedDelta` is the
 * pillar's individual contribution to the projected score change and is
 * directly comparable across pillars.
 */
export interface PillarDelta {
  pillar: Pillar;
  label: string;
  baseline: number;
  projected: number;
  /** Δc_i — raw pillar-score change on a 0-100 scale */
  delta: number;
  /** w_i — entropy-blended pillar weight (0-1) */
  weight: number;
  /** w_i · Δc_i — contribution to ΔS (total score) */
  weightedDelta: number;
}

/**
 * Forward-looking optimization ranking. `roi` is the maximum total-score gain
 * an operator could unlock by driving that pillar from its live value up to
 * the 100 ceiling, i.e. w_i · (100 − c_i). Bigger ROI = bigger lever.
 */
export interface PillarImpact {
  pillar: Pillar;
  label: string;
  current: number;
  headroom: number;
  weight: number;
  /** w_i · (100 − c_i) — max achievable total-score delta */
  roi: number;
}

const PILLAR_ORDER: Pillar[] = [
  "inventory",
  "demand",
  "valuation",
  "service",
  "finance",
];

/**
 * Produce a projected HealthReport from an already-scored baseline and a set
 * of pillar-score overrides. Re-uses the entropy-blended pillar weights from
 * the live run so that the projection remains directly comparable to the
 * "Actual" number driving the dashboard.
 *
 *   S_projected = 100 · Σ w_p · (c_p' / 100)
 *   ΔS         = Σ (w_p · Δc_p)
 */
export function simulateReport(
  baseline: HealthReport,
  overrides: PillarOverrides,
): HealthReport {
  const clamp = (x: number) => Math.max(0, Math.min(100, x));

  const projectedPillars: PillarScore[] = baseline.pillars.map((p) => {
    const override = overrides[p.pillar];
    const next = typeof override === "number" ? clamp(override) : p.score;
    return { ...p, score: Math.round(next * 10) / 10 };
  });

  const overallRaw = projectedPillars.reduce(
    (s, p) => s + (p.score / 100) * p.weight,
    0,
  );
  const overall = Math.round(overallRaw * 1000) / 10;
  const trend = Math.round((overall - baseline.overall) * 10) / 10;

  return {
    ...baseline,
    overall,
    grade: gradeOf(overall),
    trend,
    pillars: projectedPillars,
  };
}

/**
 * Per-pillar sensitivity contribution list. Sum of `weightedDelta` equals
 * the projected ΔS (in 0-100 points) against the baseline.
 */
export function pillarSensitivity(
  baseline: HealthReport,
  overrides: PillarOverrides,
): PillarDelta[] {
  return baseline.pillars.map((p) => {
    const projected =
      typeof overrides[p.pillar] === "number"
        ? Math.max(0, Math.min(100, overrides[p.pillar] as number))
        : p.score;
    const delta = projected - p.score;
    return {
      pillar: p.pillar,
      label: p.label,
      baseline: Math.round(p.score * 10) / 10,
      projected: Math.round(projected * 10) / 10,
      delta: Math.round(delta * 10) / 10,
      weight: p.weight,
      weightedDelta: Math.round(p.weight * delta * 10) / 10,
    };
  });
}

/**
 * Sensitivity delta ΔS = Σ (w_i · Δc_i), rounded to 1 decimal.
 */
export function sensitivityDelta(
  baseline: HealthReport,
  overrides: PillarOverrides,
): number {
  const total = pillarSensitivity(baseline, overrides).reduce(
    (s, d) => s + d.weightedDelta,
    0,
  );
  return Math.round(total * 10) / 10;
}

/**
 * Rank pillars by ROI — how many total-score points an operator could unlock
 * by driving that pillar from its current value to the 100 ceiling. This is
 * the core of the "Impact Ranking" in the Simulation Panel.
 */
export function impactRanking(baseline: HealthReport): PillarImpact[] {
  return baseline.pillars
    .map<PillarImpact>((p) => {
      const headroom = Math.max(0, 100 - p.score);
      return {
        pillar: p.pillar,
        label: p.label,
        current: Math.round(p.score * 10) / 10,
        headroom: Math.round(headroom * 10) / 10,
        weight: p.weight,
        roi: Math.round(p.weight * headroom * 10) / 10,
      };
    })
    .sort((a, b) => b.roi - a.roi);
}

export { PILLAR_LABELS, PILLAR_ORDER };

/* --------------------------------------------------------------------------
 * Public entry point — "Actual" (live) scoring
 * ------------------------------------------------------------------------ */

export function scoreDealer(
  brands: BrandSignal[],
  opts: ScoringOptions = {},
): HealthReport {
  const entropyWeights = computeEntropyWeights(brands);
  const brandScores = brands.map(computeBrandScore);

  const pillars: Pillar[] = [
    "inventory",
    "demand",
    "valuation",
    "service",
    "finance",
  ];

  const pillarScores: PillarScore[] = pillars.map((p) => ({
    pillar: p,
    label: PILLAR_LABELS[p],
    score: Math.round(pillarAggregate(p, brandScores, brands) * 1000) / 10,
    weight: entropyWeights[p],
    brands: brands.filter((b) => b.pillar === p).map((b) => b.id),
  }));

  // Weighted overall (already in 0-100 scale because pillarScore is 0-100)
  const overallRaw = pillarScores.reduce(
    (s, ps) => s + (ps.score / 100) * ps.weight,
    0,
  );
  const overall = Math.round(overallRaw * 1000) / 10; // one decimal

  const bottlenecks = computeBottlenecks(brands, entropyWeights);
  const prev = opts.previousOverall ?? overall;
  const trend = Math.round((overall - prev) * 10) / 10;

  return {
    overall,
    grade: gradeOf(overall),
    trend,
    pillars: pillarScores,
    brands: brandScores,
    bottlenecks,
    entropyWeights,
  };
}

/* ==========================================================================
 * FIN-305 · Floorplan "Profit Evaporator" engine
 * ==========================================================================
 *
 * Floorplan interest is the single biggest variable cost a dealer carries on
 * un-sold inventory. Every hour a unit sits on the lot, the basis is being
 * "burned" at a daily rate of:
 *
 *     dailyInterest_i  =  basis_i  ·  APR / 365
 *
 *     H_d  =  Σ_i  dailyInterest_i       (fleet-wide daily burn)
 *
 *     H_30 =  30 · H_d                   (monthly projection)
 *
 *     accruedInterest_i  =  dailyInterest_i · daysOnLot_i
 *
 * TOXIC-ASSET TRIGGER
 *   A unit is flagged "toxic" when EITHER of the following is true:
 *
 *     1)  accruedInterest_i  >  0.15 · projectedGross_i
 *         — i.e. floorplan interest has eaten >15% of the expected gross.
 *     2)  daysOnLot_i  >  60
 *         — the industry "aged-unit" threshold in 2026 used retail.
 *
 * LOSS-TOLERANCE ZONES
 *   burnRatio = monthlyBurn / lossTolerance
 *     < 0.50           → "safe"    (cyan)
 *     0.50 – 0.75      → "watch"   (gold)
 *     0.75 – 1.00      → "warning" (amber)
 *     > 1.00           → "breach"  (fire-red, flicker)
 * ======================================================================= */

export interface CalculateInventoryBurnOptions {
  /** GM-authorized monthly floorplan-interest tolerance, USD. */
  lossToleranceMonthly?: number;
  /** How many "Top Money Losers" to surface to the UI. Default 3. */
  topN?: number;
  /** Override the days-per-year basis for the interest calc. Default 365. */
  daysPerYear?: number;
}

const TOXIC_EROSION_THRESHOLD = 0.15;
const TOXIC_DAYS_ON_LOT = 60;

function zoneFromRatio(ratio: number): FloorplanBurn["zone"] {
  if (ratio > 1) return "breach";
  if (ratio > 0.75) return "warning";
  if (ratio > 0.5) return "watch";
  return "safe";
}

/**
 * Fleet-wide "Profit Evaporator" calculator. Returns per-vehicle burn, an
 * aggregate H_d / H_30, the burn-ratio zone and the ranked toxic-asset list
 * that powers the FinanceBurnCard UI.
 */
export function calculateInventoryBurn(
  fleet: FloorplanVehicle[],
  apr: number,
  opts: CalculateInventoryBurnOptions = {},
): FloorplanBurn {
  const {
    lossToleranceMonthly = 18_000,
    topN = 3,
    daysPerYear = 365,
  } = opts;

  const safeApr = Math.max(0, apr);

  const units: FloorplanVehicleBurn[] = fleet.map((v) => {
    const dailyInterest = (v.basis * safeApr) / daysPerYear;
    const accruedInterest = dailyInterest * v.daysOnLot;
    const grossErosion =
      v.projectedGross > 0 ? accruedInterest / v.projectedGross : Infinity;

    const toxicReasons: string[] = [];
    if (grossErosion > TOXIC_EROSION_THRESHOLD) {
      toxicReasons.push(
        `Interest has eroded ${Math.round(grossErosion * 100)}% of projected gross`,
      );
    }
    if (v.daysOnLot > TOXIC_DAYS_ON_LOT) {
      toxicReasons.push(`${v.daysOnLot}d on lot (>60d aged)`);
    }
    const toxic = toxicReasons.length > 0;

    return {
      ...v,
      dailyInterest,
      accruedInterest,
      grossErosion,
      toxic,
      toxicReasons,
    };
  });

  const dailyBurn = units.reduce((s, u) => s + u.dailyInterest, 0);
  const monthlyBurn = dailyBurn * 30;
  const accruedBurn = units.reduce((s, u) => s + u.accruedInterest, 0);
  const totalBasis = units.reduce((s, u) => s + u.basis, 0);
  const burnRatio = lossToleranceMonthly > 0 ? monthlyBurn / lossToleranceMonthly : 0;

  const toxic = units
    .filter((u) => u.toxic)
    .sort((a, b) => b.accruedInterest - a.accruedInterest);

  const topMoneyLosers = [...units]
    .sort((a, b) => b.accruedInterest - a.accruedInterest)
    .slice(0, topN);

  return {
    apr: safeApr,
    totalUnits: units.length,
    totalBasis,
    dailyBurn,
    monthlyBurn,
    accruedBurn,
    lossTolerance: lossToleranceMonthly,
    burnRatio,
    zone: zoneFromRatio(burnRatio),
    units,
    toxic,
    topMoneyLosers,
  };
}
