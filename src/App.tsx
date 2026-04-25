import { useDealerHealth } from "@/hooks/useDealerHealth";
import { AppHeader } from "@/components/AppHeader";
import { HeroScore } from "@/components/HeroScore";
import { KpiStrip } from "@/components/KpiStrip";
import { BrandGrid } from "@/components/BrandGrid";
import { OperationalBottlenecks } from "@/components/OperationalBottlenecks";
import { PillarRadar } from "@/components/PillarRadar";
import { BrandRankBar } from "@/components/BrandRankBar";
import { MethodologyPanel } from "@/components/MethodologyPanel";

export default function App() {
  const { brands, report, trend, isLive, lastUpdated, toggleLive, refresh } =
    useDealerHealth({ pollMs: 6000, trendDays: 30 });

  return (
    <div className="min-h-screen">
      <AppHeader
        isLive={isLive}
        onToggleLive={toggleLive}
        onRefresh={refresh}
        lastUpdated={lastUpdated}
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
              A single, IE-weighted view of every Cox Automotive source system —
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

        <HeroScore report={report} trend={trend} />

        <section className="grid gap-6 xl:grid-cols-2">
          <PillarRadar report={report} />
          <BrandRankBar brands={brands} report={report} />
        </section>

        <BrandGrid brands={brands} report={report} />

        <OperationalBottlenecks report={report} />

        <MethodologyPanel report={report} />

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
          <span>
            Cox Automotive · Omni-Channel Dealer Health Index · v1.0
          </span>
          <span>
            Engine: HealthScoreEngine.ts · MCDA + Shannon Entropy Weighting
          </span>
        </footer>
      </main>
    </div>
  );
}
