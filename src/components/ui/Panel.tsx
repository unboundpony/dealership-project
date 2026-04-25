import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  padding?: "sm" | "md" | "lg";
}

export function Panel({
  title,
  eyebrow,
  actions,
  icon,
  padding = "md",
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <section
      className={cn(
        "panel",
        padding === "sm" && "p-4",
        padding === "md" && "p-5 sm:p-6",
        padding === "lg" && "p-6 sm:p-7",
        className,
      )}
      {...rest}
    >
      {(title || eyebrow || actions) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && <div className="label-eyebrow">{eyebrow}</div>}
            {title && (
              <h2 className="mt-1 flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight text-ink-50">
                {icon}
                <span className="truncate">{title}</span>
              </h2>
            )}
          </div>
          {actions && (
            <div className="flex flex-shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
