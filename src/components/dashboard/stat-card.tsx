import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
  className?: string;
}

const toneIcon: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
  success: "bg-success/10 text-success-strong group-hover:bg-success group-hover:text-white",
  warning: "bg-warning/10 text-warning-strong group-hover:bg-warning group-hover:text-white",
  info: "bg-info/10 text-info-strong group-hover:bg-info group-hover:text-white",
};

export function StatCard({ label, value, hint, icon, tone = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs leading-relaxed text-text-muted">{hint}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-transparent transition-colors",
              toneIcon[tone]
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}
