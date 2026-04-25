import { cn } from "@/utils/cn";
import type { SyncStatus } from "@/types/health";

const copy: Record<SyncStatus, { label: string; dot: string; text: string }> = {
  live: {
    label: "Live",
    dot: "bg-accent-emerald shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
    text: "text-accent-emerald",
  },
  syncing: {
    label: "Syncing",
    dot: "bg-accent-cyan shadow-[0_0_0_3px_rgba(34,211,238,0.18)]",
    text: "text-accent-cyan",
  },
  delayed: {
    label: "Delayed",
    dot: "bg-accent-amber shadow-[0_0_0_3px_rgba(245,158,11,0.18)]",
    text: "text-accent-amber",
  },
  offline: {
    label: "Offline",
    dot: "bg-accent-crimson shadow-[0_0_0_3px_rgba(239,68,68,0.18)]",
    text: "text-accent-crimson",
  },
};

interface SyncBadgeProps {
  status: SyncStatus;
  lastSyncSec?: number;
  compact?: boolean;
  className?: string;
}

function formatAgo(sec: number): string {
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  return `${Math.round(sec / 3600)}h ago`;
}

export function SyncBadge({
  status,
  lastSyncSec,
  compact = false,
  className,
}: SyncBadgeProps) {
  const c = copy[status];
  return (
    <span
      className={cn(
        "chip gap-2",
        compact && "px-2 py-[3px] text-[10px]",
        className,
      )}
      title={`Sync status: ${c.label}`}
    >
      <span className="relative inline-flex">
        <span
          className={cn("h-2 w-2 rounded-full", c.dot, {
            "animate-sync-blink": status === "live" || status === "syncing",
          })}
        />
      </span>
      <span className={cn("font-semibold uppercase tracking-wide", c.text)}>
        {c.label}
      </span>
      {lastSyncSec !== undefined && status !== "offline" && (
        <span className="text-ink-300/90 font-mono">
          {formatAgo(lastSyncSec)}
        </span>
      )}
    </span>
  );
}
