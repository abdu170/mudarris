import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-high)] flex items-center justify-center text-[var(--color-text-muted)] text-2xl">
          {icon}
        </div>
      )}

      {/* Decorative geometric shape as fallback illustration */}
      {!icon && (
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-[var(--color-surface-container)] rotate-6 opacity-60" />
          <div className="absolute inset-2 rounded-xl bg-[var(--color-surface-high)]" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl text-[var(--color-text-muted)]">
            📋
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="text-headline-sm text-[var(--color-text-main)]">{title}</h3>
        {description && (
          <p className="text-body-md text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/* ── Full-page loading state ─────────────────────────── */
export function LoadingState({ message = "جاري التحميل..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
      <div className="w-10 h-10 rounded-full border-4 border-[var(--color-surface-high)] border-t-[var(--color-brand-primary)] animate-spin" />
      <p className="text-label-md text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}

/* ── Inline error state ─────────────────────────────── */
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-body-md text-[var(--color-error)]">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
