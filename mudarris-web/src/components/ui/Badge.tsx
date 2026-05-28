import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, TEACHING_MODE_LABELS } from "@/lib/utils";

/* ── Generic Badge ─────────────────────────────────── */
type BadgeVariant = "default" | "success" | "error" | "warning" | "info" | "gold" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-surface-high)] text-[var(--color-text-main)]",
  success: "bg-[var(--color-success-container)] text-[var(--color-success)]",
  error:   "bg-[var(--color-error-container)] text-[var(--color-error)]",
  warning: "bg-[var(--color-warning-container)] text-[var(--color-warning)]",
  info:    "bg-[var(--color-info-container)] text-[var(--color-info)]",
  gold:    "bg-[var(--color-brand-gold-container)] text-[var(--color-brand-gold)]",
  muted:   "bg-[var(--color-surface-container)] text-[var(--color-text-muted)]",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide",
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ── Booking Status Badge ───────────────────────────── */
const statusVariants: Record<string, BadgeVariant> = {
  requested:       "warning",
  accepted:        "success",
  payment_pending: "gold",
  paid:            "info",
  confirmed:       "info",
  completed:       "success",
  cancelled:       "muted",
  rejected:        "error",
  disputed:        "error",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariants[status] ?? "default"}>
      {BOOKING_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

/* ── Teaching Mode Badge ────────────────────────────── */
const modeVariants: Record<string, BadgeVariant> = {
  online:      "info",
  "in-person": "success",
  both:        "gold",
};

export function TeachingModeBadge({ mode }: { mode: string }) {
  return (
    <Badge variant={modeVariants[mode] ?? "default"}>
      {TEACHING_MODE_LABELS[mode] ?? mode}
    </Badge>
  );
}

/* ── Chip (Subject / Grade tag) ─────────────────────── */
interface ChipProps {
  children: React.ReactNode;
  className?: string;
}

export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full",
        "bg-[var(--color-surface-container)] text-[var(--color-text-muted)]",
        "text-[12px] font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ── Verification Badge (for tutors) ───────────────── */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      title="مدرس موثق"
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-full",
        "bg-[var(--color-brand-gold)] text-white text-[10px]",
        className
      )}
      aria-label="موثق"
    >
      ✓
    </span>
  );
}
