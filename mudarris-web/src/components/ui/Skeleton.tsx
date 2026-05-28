import { cn } from "@/lib/utils";

/* ── Generic Skeleton Block ─────────────────────────── */
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

/* ── Tutor Card Skeleton ────────────────────────────── */
export function TutorCardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-24 rounded-[var(--radius-sm)]" />
      </div>
    </div>
  );
}

/* ── Dashboard Widget Skeleton ──────────────────────── */
export function DashboardWidgetSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/* ── Table Row Skeleton ─────────────────────────────── */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[var(--color-outline-soft)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/* ── Booking Card Skeleton ──────────────────────────── */
export function BookingCardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-9 w-20 rounded-[var(--radius-sm)]" />
      </div>
    </div>
  );
}
