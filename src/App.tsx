import { useMemo } from "react";
import { useDealerHealth } from "@/hooks/useDealerHealth";
import { useHealthSimulation } from "@/hooks/useHealthSimulation";
import { AppHeader } from "@/components/AppHeader";
import { HeroScore } from "@/components/HeroScore";
import { KpiStrip } from "@/components/KpiStrip";
import { BrandGrid } from "@/components/BrandGrid";
import { FinanceBurnCard } from "@/components/FinanceBurnCard";
import { OperationalBottlenecks } from "@/components/OperationalBottlenecks";
import { PillarRadar } from "@/components/PillarRadar";
import { BrandRankBar } from "@/components/BrandRankBar";
import { MethodologyPanel } from "@/components/MethodologyPanel";
import { SimulationPanel } from "@/components/SimulationPanel";
import { calculateInventoryBurn } from "@/utils/HealthScoreEngine";

export default function App() {
  const {
    brands,
    report,
    trend,
    isLive,
    lastUpdated,
    toggleLive,
    refresh,
    fleet,
    floorplanAPR,
    lossToleranceMonthly,
  } = useDealerHealth({ pollMs: 6000, trendDays: 30 });

  const simulation = useHealthSimulation(report, { floorplanAPR });

  /* Compute baseline + projected floorplan burn once at the top so the
   * FinanceBurnCard and the SimulationPanel's "Financial Context" section
   * share the exact same numbers without duplicating work. */
  const baselineBurn = useMemo(
    () =>
      calculateInventoryBurn(fleet, floorplanAPR, {
        lossToleranceMonthly,
        topN: 3,
      }),
    [fleet, floorplanAPR, lossToleranceMonthly],
  );
  const projectedBurn = useMemo(
    () =>
      calculateInventoryBurn(fleet, simulation.projectedAPR, {
        lossToleranceMonthly,
        topN: 3,
      }),
    [fleet, simulation.projectedAPR, lossToleranceMonthly],
  );

  /* Chip click on the FinanceBurnCard:
   *   1) apply the APR delta to the shared simulation state, and
   *   2) open the side-panel so the GM can fine-tune from there.
   * This resolves the UI disconnect: clicking "+1%" now opens the panel
   * with the slider pre-positioned at +1%. */
  const handleAprChipFromCard = (delta: number) => {
    simulation.setAprDelta(delta);
    simulation.openPanel();
  };

  return (
    <div className="min-h-screen">
      <AppHeader
        isLive={isLive}
        onToggleLive={toggleLive}
        onRefresh={refresh}
        lastUpdated={lastUpdated}
        isSimulating={simulation.isActive}
        onToggleSimulator={simulation.togglePanel}
      />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Executive summary row */}
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-eyebrow">Horizon Motors Auto Group · Southeast Region</div>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-50 sm:text-[26px]">
              Executive Health Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-300">
              A single, IE-weighted view of every Lee Automotive source system —
              from lot-level inventory velocity through F&amp;I contract mix —
              updated in real time and ranked by operational drag.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-ink-300">
            <span className="chip">FY26 · Q2</span>
            <span className="chip">Region SE</span>
            <span className="chip">12 rooftops</span>
          </div>
        </section>

        <KpiStrip brands={brands} report={report} />

        <HeroScore
          report={report}
          trend={trend}
          simulation={{
            isActive: simulation.isActive,
            projected: simulation.projected,
            overrides: simulation.overrides,
            totalDelta: simulation.totalDelta,
          }}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <PillarRadar report={report} />
          <BrandRankBar brands={brands} report={report} />
        </section>

        <BrandGrid brands={brands} report={report} />

        <FinanceBurnCard
          fleet={fleet}
          baselineAPR={floorplanAPR}
          projectedAPR={simulation.projectedAPR}
          aprDelta={simulation.aprDelta}
          isSimulating={simulation.isActive}
          lossToleranceMonthly={lossToleranceMonthly}
          onAprDeltaChange={handleAprChipFromCard}
          onResetApr={simulation.resetApr}
        />

        <OperationalBottlenecks report={report} />

        <MethodologyPanel report={report} />

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
          <span>
            Lee Automotive · Omni-Channel Dealer Health Index · v1.3
          </span>
          <span>
            Engine: HealthScoreEngine.ts · MCDA + Shannon Entropy · What-If
            Simulator · FIN-305 Profit Evaporator
          </span>
        </footer>
      </main>

      <SimulationPanel
        open={simulation.isOpen}
        onClose={simulation.closePanel}
        onExitLabMode={simulation.exitLabMode}
        baseline={simulation.baseline}
        projected={simulation.projected}
        overrides={simulation.overrides}
        sensitivity={simulation.sensitivity}
        impact={simulation.impact}
        totalDelta={simulation.totalDelta}
        isDirty={simulation.isDirty}
        onChange={simulation.setPillar}
        onReset={simulation.reset}
        onMaxOut={simulation.maxOut}
        baselineAPR={simulation.baselineAPR}
        projectedAPR={simulation.projectedAPR}
        aprDelta={simulation.aprDelta}
        onAprDeltaChange={simulation.setAprDelta}
        onResetApr={simulation.resetApr}
        baselineMonthlyBurn={baselineBurn.monthlyBurn}
        projectedMonthlyBurn={projectedBurn.monthlyBurn}
        lossToleranceMonthly={lossToleranceMonthly}
      />
    </div>
  );
}
