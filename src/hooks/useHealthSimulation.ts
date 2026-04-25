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
 * Valuation, Service, Finance) to produce a *projected* report.
 *
 * Math (sensitivity analysis):
 *
 *     ΔS = Σ ( w_i · Δc_i )
 *
 * where `w_i` is the entropy-blended pillar weight from the live run and
 * `Δc_i` is the delta the GM dials in via the slider.
 *
 * The projection is computed over the *last non-simulation* baseline so that
 * background live refreshes do not silently drift the comparison under the
 * operator's feet while Lab Mode is active.
 */

export interface HealthSimulationState {
  /** True when the operator has opened "Lab Mode" / the simulator panel. */
  isActive: boolean;
  /** True when any slider has been nudged off the baseline value. */
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
}

export interface HealthSimulationActions {
  /** Enter Lab Mode. Freezes the baseline to the report at time of entry. */
  activate: () => void;
  /** Exit Lab Mode and discard any pending overrides. */
  deactivate: () => void;
  /** Toggle Lab Mode on/off. */
  toggle: () => void;
  /** Set a single pillar's projected score (0-100). */
  setPillar: (pillar: Pillar, value: number) => void;
  /** Drop a single pillar override so it snaps back to baseline. */
  clearPillar: (pillar: Pillar) => void;
  /** Drop all overrides without leaving Lab Mode. */
  reset: () => void;
  /** Snap every pillar slider to 100 — "best-case" headroom scenario. */
  maxOut: () => void;
}

export type UseHealthSimulationReturn = HealthSimulationState &
  HealthSimulationActions;

export function useHealthSimulation(
  liveReport: HealthReport,
): UseHealthSimulationReturn {
  const [isActive, setIsActive] = useState(false);
  const [overrides, setOverrides] = useState<PillarOverrides>({});

  // Keep the baseline frozen at the moment Lab Mode was entered, so the live
  // feed can keep refreshing the "Actual" report in the background without
  // yanking the projection around mid-interaction.
  const frozenBaselineRef = useRef<HealthReport>(liveReport);
  const baseline = isActive ? frozenBaselineRef.current : liveReport;

  // When entering Lab Mode, snapshot the current live report as the baseline.
  useEffect(() => {
    if (isActive) {
      frozenBaselineRef.current = liveReport;
    }
    // We intentionally only want to snapshot on the transition into Lab Mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const projected = useMemo(
    () => (isActive ? simulateReport(baseline, overrides) : baseline),
    [isActive, baseline, overrides],
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

  const isDirty = useMemo(() => {
    if (!isActive) return false;
    return baseline.pillars.some((p) => {
      const v = overrides[p.pillar];
      return typeof v === "number" && Math.abs(v - p.score) > 0.05;
    });
  }, [isActive, baseline, overrides]);

  const activate = useCallback(() => setIsActive(true), []);
  const deactivate = useCallback(() => {
    setIsActive(false);
    setOverrides({});
  }, []);
  const toggle = useCallback(() => {
    setIsActive((active) => {
      if (active) setOverrides({});
      return !active;
    });
  }, []);

  const setPillar = useCallback(
    (pillar: Pillar, value: number) => {
      const clamped = Math.max(0, Math.min(100, value));
      setOverrides((prev) => ({ ...prev, [pillar]: clamped }));
    },
    [],
  );

  const clearPillar = useCallback((pillar: Pillar) => {
    setOverrides((prev) => {
      if (!(pillar in prev)) return prev;
      const next = { ...prev };
      delete next[pillar];
      return next;
    });
  }, []);

  const reset = useCallback(() => setOverrides({}), []);

  const maxOut = useCallback(() => {
    const next: PillarOverrides = {};
    for (const p of baseline.pillars) next[p.pillar] = 100;
    setOverrides(next);
  }, [baseline]);

  return {
    isActive,
    isDirty,
    baseline,
    projected,
    overrides,
    sensitivity,
    totalDelta,
    impact,
    activate,
    deactivate,
    toggle,
    setPillar,
    clearPillar,
    reset,
    maxOut,
  };
}
