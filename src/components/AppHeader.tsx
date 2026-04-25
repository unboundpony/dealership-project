import {
  Activity,
  Bell,
  CircleDot,
  Pause,
  Play,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface AppHeaderProps {
  isLive: boolean;
  onToggleLive: () => void;
  onRefresh: () => void;
  lastUpdated: Date;
}

export function AppHeader({
  isLive,
  onToggleLive,
  onRefresh,
  lastUpdated,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo lockup */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 ring-1 ring-white/10">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-cyan/30 to-transparent" />
            <Activity className="relative h-4.5 w-4.5 text-accent-cyan" />
          </div>
          <div className="hidden sm:block">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
              Cox Automotive · PRISM
            </div>
            <div className="font-display text-[14px] font-semibold leading-tight tracking-tight text-ink-50">
              Omni-Channel Dealer Health Index
            </div>
          </div>
        </div>

        {/* Search — cosmetic, non-functional */}
        <div className="relative ml-2 hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search dealers, VINs, or metrics…"
            className="h-9 w-full rounded-lg border border-white/5 bg-navy-900/60 pl-9 pr-3 text-[12px] text-ink-100 placeholder:text-ink-400 focus:border-accent-cyan/40 focus:outline-none focus:ring-2 focus:ring-accent-cyan/30"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div
            className="chip gap-1.5"
            title={`Last update: ${lastUpdated.toLocaleTimeString()}`}
          >
            <CircleDot
              className={cn(
                "h-3 w-3",
                isLive ? "animate-sync-blink text-accent-emerald" : "text-ink-400",
              )}
            />
            <span className="hidden sm:inline">
              {isLive ? "Live feed" : "Paused"}
            </span>
            <span className="font-mono text-[10px] text-ink-300">
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleLive}
            className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-navy-900/80 px-3 text-[12px] font-semibold text-ink-100 transition hover:bg-navy-800"
          >
            {isLive ? (
              <>
                <Pause className="h-3.5 w-3.5 text-accent-amber" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-accent-emerald" /> Resume
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-navy-900/80 px-3 text-[12px] font-semibold text-ink-100 transition hover:bg-navy-800"
          >
            <RefreshCw className="h-3.5 w-3.5 text-accent-cyan" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            className="focus-ring relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-navy-900/80 text-ink-200 transition hover:bg-navy-800"
            aria-label="Alerts"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent-crimson" />
          </button>
          <button
            type="button"
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-navy-900/80 text-ink-200 transition hover:bg-navy-800"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <div className="ml-1 hidden h-9 items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-navy-800 to-navy-900 px-2.5 sm:flex">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-cyan/15 text-[11px] font-bold text-accent-cyan">
              AB
            </div>
            <div className="pr-1 text-[11px] leading-tight">
              <div className="font-semibold text-ink-50">A. Baxter</div>
              <div className="text-ink-300">Regional Ops</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
