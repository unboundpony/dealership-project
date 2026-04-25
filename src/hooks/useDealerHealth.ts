import { useEffect, useMemo, useRef, useState } from "react";
import {
  MOCK_BRANDS,
  generateTrendSeries,
  jitterBrands,
} from "@/services/mockDealerData";
import { scoreDealer } from "@/utils/HealthScoreEngine";
import type { BrandSignal, HealthReport } from "@/types/health";

interface UseDealerHealthOptions {
  /** Polling interval in ms. 0 disables live sync. */
  pollMs?: number;
  /** Number of days of history to simulate for the trend sparkline. */
  trendDays?: number;
}

interface UseDealerHealthReturn {
  brands: BrandSignal[];
  report: HealthReport;
  trend: Array<{ day: string; score: number }>;
  isLive: boolean;
  lastUpdated: Date;
  toggleLive: () => void;
  refresh: () => void;
}

/**
 * Primary data hook for the dashboard. Simulates a live feed of the Big 6
 * Cox brands, runs it through the HealthScoreEngine every poll tick, and
 * exposes the derived report + trend to consumers.
 */
export function useDealerHealth(
  opts: UseDealerHealthOptions = {},
): UseDealerHealthReturn {
  const { pollMs = 6000, trendDays = 30 } = opts;

  const [brands, setBrands] = useState<BrandSignal[]>(MOCK_BRANDS);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const previousOverall = useRef<number | null>(null);

  useEffect(() => {
    if (!isLive || pollMs === 0) return;
    const id = window.setInterval(() => {
      setBrands((prev) => jitterBrands(prev));
      setLastUpdated(new Date());
    }, pollMs);
    return () => window.clearInterval(id);
  }, [isLive, pollMs]);

  const report = useMemo(() => {
    const r = scoreDealer(brands, {
      previousOverall: previousOverall.current ?? undefined,
    });
    previousOverall.current = r.overall;
    return r;
  }, [brands]);

  const [trend, setTrend] = useState(() =>
    generateTrendSeries(report.overall, trendDays),
  );

  useEffect(() => {
    setTrend((prev) => {
      // Slide the window: drop oldest, append latest
      const next = prev.slice(1);
      const d = new Date();
      next.push({
        day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: report.overall,
      });
      return next;
    });
    // only react to live overall updates; trendDays is a constant after mount
  }, [report.overall]);

  const refresh = () => {
    setBrands((prev) => jitterBrands(prev));
    setLastUpdated(new Date());
  };

  return {
    brands,
    report,
    trend,
    isLive,
    lastUpdated,
    toggleLive: () => setIsLive((v) => !v),
    refresh,
  };
}
