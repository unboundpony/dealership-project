import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HealthReport, Pillar } from "@/types/health";
import {
  impactRanking,
  pillarSensitivity,
  sensitivityDelta,
  simulateReport,
  type PillarDelta,
  type PillarImpact,
  type PillarOverrides,
} from "@/utils/HealthScoreEngine";

/**
 * Hook: useHealthSimulation
 * ---------------------------------------------------------------------------
 * Treats the latest live `HealthReport` as a *baseline* and lets the operator
 * temporarily override any of the 5 pillar scores (Inventory, Demand,
 * Valuation, Service, Finance) and/or shock the floorplan APR to produce a
 * *projected* report + financial burn.
 *
 * Math (sensitivity analysis):
 *
 *     ΔS = Σ ( w_i · Δc_i )
 *
 * where `w_i` is the entropy-blended pillar weight from the live run and
 * `Δc_i` is the delta the GM dials in via the slider.
 *
 * UX model (v2):
 *   • `isOpen`   — whether the simulator side-panel is currently visible.
 *                  Closing the panel NEVER touches simulation state — the
 *                  projections stay "live" on the dashboard so the GM can
 *                  keep watching the Burn Card / Hero gauge react.
 *   • `isActive` — *derived* from state: there is at least one pillar
 *                  override OR a non-zero APR delta in place. This is what
 *                  the AppHeader "Lab · ON" badge and HeroScore ghost-needle
 *                  render against.
 *   • `reset()`  — clear pillar overrides + APR delta. Panel stays open.
 *   • `exitLabMode()` — clear everything AND close the panel (the "big red
 *                  button" that fully returns the dashboard to its live,
 *                  unmanipulated state).
 *
 * The baseline report is frozen while any simulation is active so that
 * background live polling of the dealer feed does not silently drift the
 * comparison under the operator mid-interaction.
 */

export interface HealthSimulationState {
  /** Panel UI is visible. Independent from whether the sim has state. */
  isOpen: boolean;
  /** Derived: any pillar override OR a non-zero APR delta is in place. */
  isActive: boolean;
  /** Equivalent to `isActive`; kept for backward-compat readability. */
  isDirty: boolean;
  /** The frozen baseline report driving the comparison (see note above). */
  baseline: HealthReport;
  /** The baseline with the operator's pillar overrides applied. */
  projected: HealthReport;
  /** Current override map (only populated for pillars that were touched). */
  overrides: PillarOverrides;
  /** Per-pillar sensitivity breakdown (Δc_i, w_i·Δc_i, projected score). */
  sensitivity: PillarDelta[];
  /** ΔS — total projected score delta against the baseline. */
  totalDelta: number;
  /** Ranked "highest-ROI" pillars for the operator to prioritize. */
  impact: PillarImpact[];
  /** Baseline ("Actual") floorplan APR (e.g. 0.075). */
  baselineAPR: number;
  /** Projected APR = baseline + aprDelta. Equals baseline when no override. */
  projectedAPR: number;
  /** Additive rate-hike delta in decimal form (e.g. 0.01 = +1%). */
  aprDelta: number;
  /** True when a rate-hike has been dialled in. */
  aprDirty: boolean;
  /** True when at least one pillar override is in place. */
  pillarsDirty: boolean;
}

export interface HealthSimulationActions {
  /** Show the simulator side-panel. No state changes. */
  openPanel: () => void;
  /** Hide the side-panel. No state changes — projections stay live. */
  closePanel: () => void;
  /** Flip panel visibility without touching simulation state. */
  togglePanel: () => void;
  /** Hide the panel AND clear every override + APR delta. Full exit. */
  exitLabMode: () => void;
  /** Set a single pillar's projected score (0-100). */
  setPillar: (pillar: Pillar, value: number) => void;
  /** Drop a single pillar override so it snaps back to baseline. */
  clearPillar: (pillar: Pillar) => void;
  /** Drop all pillar + APR overrides. Panel stays open. */
  reset: () => void;
  /** Snap every pillar slider to 100 — "best-case" headroom scenario. */
  maxOut: () => void;
  /** Set a +/- APR delta in decimal form (e.g. 0.02 for +200 bps). */
  setAprDelta: (delta: number) => void;
  /** Snap APR back to baseline (aprDelta = 0). */
  resetApr: () => void;
}

export type UseHealthSimulationReturn = HealthSimulationState &
  HealthSimulationActions;

interface UseHealthSimulationOptions {
  /** Baseline floorplan APR (decimal). Defaults to 0.075 = 7.5%. */
  floorplanAPR?: number;
}

/** Clamp the APR delta into a realistic 2026 rate-shock band: -2% to +6%. */
const APR_DELTA_MIN = -0.02;
const APR_DELTA_MAX = 0.06;

export function useHealthSimulation(
  liveReport: HealthReport,
  options: UseHealthSimulationOptions = {},
): UseHealthSimulationReturn {
  const { floorplanAPR = 0.075 } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [overrides, setOverrides] = useState<PillarOverrides>({});
  const [aprDelta, setAprDeltaState] = useState(0);

  /* -------------------------------------------------------------------- */
  /* Derived "is any simulation in place" predicate                       */
  /* -------------------------------------------------------------------- */

  const pillarsDirty = useMemo(
    () => Object.keys(overrides).length > 0,
    [overrides],
  );
  const aprDirty = Math.abs(aprDelta) > 1e-6;
  const isActive = pillarsDirty || aprDirty;
  const isDirty = isActive;

  /* -------------------------------------------------------------------- */
  /* Frozen baseline — freeze while any simulation is engaged             */
  /* -------------------------------------------------------------------- */

  const frozenBaselineRef = useRef<HealthReport>(liveReport);
  const wasActiveRef = useRef<boolean>(false);

  // Freeze the baseline on the "live → active" transition; refresh with the
  // latest live report on every "active → live" transition so the next
  // simulation snapshots fresh data.
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      frozenBaselineRef.current = liveReport;
    } else if (!isActive) {
      frozenBaselineRef.current = liveReport;
    }
    wasActiveRef.current = isActive;
  }, [isActive, liveReport]);

  const baseline = isActive ? frozenBaselineRef.current : liveReport;

  /* -------------------------------------------------------------------- */
  /* Derived projections                                                   */
  /* -------------------------------------------------------------------- */

  const projected = useMemo(
    () => (pillarsDirty ? simulateReport(baseline, overrides) : baseline),
    [pillarsDirty, baseline, overrides],
  );

  const sensitivity = useMemo(
    () => pillarSensitivity(baseline, overrides),
    [baseline, overrides],
  );

  const totalDelta = useMemo(
    () => sensitivityDelta(baseline, overrides),
    [baseline, overrides],
  );

  const impact = useMemo(() => impactRanking(baseline), [baseline]);

  const projectedAPR = useMemo(
    () => Math.max(0, floorplanAPR + aprDelta),
    [floorplanAPR, aprDelta],
  );

  /* -------------------------------------------------------------------- */
  /* Actions                                                               */
  /* -------------------------------------------------------------------- */

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);

  const setPillar = useCallback((pillar: Pillar, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setOverrides((prev) => ({ ...prev, [pillar]: clamped }));
  }, []);

  const clearPillar = useCallback((pillar: Pillar) => {
    setOverrides((prev) => {
      if (!(pillar in prev)) return prev;
      const next = { ...prev };
      delete next[pillar];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setOverrides({});
    setAprDeltaState(0);
  }, []);

  const exitLabMode = useCallback(() => {
    setOverrides({});
    setAprDeltaState(0);
    setIsOpen(false);
  }, []);

  const maxOut = useCallback(() => {
    const next: PillarOverrides = {};
    for (const p of baseline.pillars) next[p.pillar] = 100;
    setOverrides(next);
  }, [baseline]);

  const setAprDelta = useCallback((delta: number) => {
    const clamped = Math.max(APR_DELTA_MIN, Math.min(APR_DELTA_MAX, delta));
    setAprDeltaState(clamped);
  }, []);

  const resetApr = useCallback(() => setAprDeltaState(0), []);

  return {
    isOpen,
    isActive,
    isDirty,
    baseline,
    projected,
    overrides,
    sensitivity,
    totalDelta,
    impact,
    baselineAPR: floorplanAPR,
    projectedAPR,
    aprDelta,
    aprDirty,
    pillarsDirty,
    openPanel,
    closePanel,
    togglePanel,
    exitLabMode,
    setPillar,
    clearPillar,
    reset,
    maxOut,
    setAprDelta,
    resetApr,
  };
}

/** Min/max for the APR slider (in decimal form). Exported so the panel can
 *  render a consistent track + baseline tick marker. */
export const APR_DELTA_RANGE = { min: APR_DELTA_MIN, max: APR_DELTA_MAX };
