import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-subtle/40 px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <span
          className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-subtle text-text-muted"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
