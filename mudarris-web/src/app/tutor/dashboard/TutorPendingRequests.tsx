"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TeachingModeBadge } from "@/components/ui/Badge";
import { respondToBookingAction, type BookingSummary } from "@/lib/actions/bookings";
import { formatQAR, formatQatarDate, formatQatarTime } from "@/lib/utils";

interface Props {
  initialBookings: BookingSummary[];
}

export function TutorPendingRequests({ initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function respond(id: string, action: "accept" | "reject") {
    setProcessingId(id);
    setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    const res = await respondToBookingAction(id, action);
    setProcessingId(null);
    if (res.error) {
      setErrors((prev) => ({ ...prev, [id]: res.error }));
    } else {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  }

  if (bookings.length === 0) return null;

  return (
    <div>
      <h2 className="text-headline-sm text-[var(--color-warning)] mb-4">
        طلبات تحتاج موافقتك ({bookings.length})
      </h2>
      <div className="flex flex-col gap-3">
        {bookings.map((b) => (
          <div key={b.id} className="card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={b.studentName || "؟"} src={b.studentAvatar ?? undefined} size="md" />
              <div>
                <p className="text-label-md font-semibold">{b.studentName || "—"}</p>
                <p className="text-label-sm text-[var(--color-text-muted)]">
                  {formatQatarDate(b.scheduledAt)} · {formatQatarTime(b.scheduledAt)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <TeachingModeBadge mode={b.teachingMode} />
                  <span className="text-label-sm font-semibold text-[var(--color-brand-primary)]">
                    {formatQAR(b.tutorRate)}
                  </span>
                </div>
                {errors[b.id] && (
                  <p className="text-label-xs text-[var(--color-error)] mt-1">{errors[b.id]}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => respond(b.id, "accept")}
                loading={processingId === b.id}
                disabled={!!processingId}
              >
                <Check className="w-4 h-4" />قبول
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => respond(b.id, "reject")}
                disabled={!!processingId}
              >
                <X className="w-4 h-4" />رفض
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
