import { cn } from "@/lib/cn";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "whatsapp";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-subtle text-text-secondary",
  success: "bg-success/10 text-success-strong",
  warning: "bg-warning/10 text-warning-strong",
  error: "bg-error/10 text-error-strong",
  info: "bg-info/10 text-info-strong",
  whatsapp: "bg-whatsapp/10 text-whatsapp-strong",
};

const STATUS_DOT_VARIANTS = new Set<BadgeVariant>(["success", "warning", "error", "whatsapp"]);

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeStyles[variant],
        className
      )}
    >
      {STATUS_DOT_VARIANTS.has(variant) && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  );
}
