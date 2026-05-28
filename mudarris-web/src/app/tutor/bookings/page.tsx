"use client";

import { useState, useEffect } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { BookingStatusBadge, TeachingModeBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import {
  getTutorBookingsAction,
  respondToBookingAction,
  cancelBookingAction,
  type BookingSummary,
} from "@/lib/actions/bookings";
import { formatQAR, formatQatarDate, formatQatarTime, TEACHING_MODE_LABELS } from "@/lib/utils";

const TABS = [
  { key: "pending",   label: "معلقة" },
  { key: "upcoming",  label: "القادمة" },
  { key: "completed", label: "المكتملة" },
  { key: "cancelled", label: "الملغية" },
];

function filterByTab(bookings: BookingSummary[], tab: string): BookingSummary[] {
  if (tab === "pending")   return bookings.filter((b) => b.status === "requested");
  if (tab === "upcoming")  return bookings.filter((b) => ["accepted","paid","confirmed"].includes(b.status));
  if (tab === "completed") return bookings.filter((b) => b.status === "completed");
  if (tab === "cancelled") return bookings.filter((b) => ["cancelled","rejected"].includes(b.status));
  return bookings;
}

interface ActionState {
  type: "accept" | "reject" | "cancel";
  bookingId: string;
}

export default function TutorBookingsPage() {
  const [tab, setTab] = useState("pending");
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<ActionState | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  async function loadBookings() {
    const res = await getTutorBookingsAction();
    setBookings(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadBookings(); }, []);

  function openAction(type: ActionState["type"], bookingId: string) {
    setAction({ type, bookingId });
    setRejectReason("");
    setActionErr(null);
  }

  async function handleConfirm() {
    if (!action) return;
    setSubmitting(true);
    setActionErr(null);

    let res;
    if (action.type === "accept") {
      res = await respondToBookingAction(action.bookingId, "accept");
    } else if (action.type === "reject") {
      res = await respondToBookingAction(action.bookingId, "reject", rejectReason || undefined);
    } else {
      res = await cancelBookingAction(action.bookingId);
    }

    setSubmitting(false);
    if (res.error) { setActionErr(res.error); return; }
    setAction(null);
    loadBookings();
  }

  const filtered = filterByTab(bookings, tab);
  const tabsWithCounts = TABS.map((t) => ({ ...t, count: filterByTab(bookings, t.key).length }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">الحجوزات</h1>

      <Tabs tabs={tabsWithCounts} active={tab} onChange={setTab} />

      <div className="flex flex-col gap-4 mt-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-[var(--color-text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد حجوزات" description="لا توجد حجوزات في هذه الفئة" />
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={b.studentName || "؟"} src={b.studentAvatar ?? undefined} size="md" />
                  <div>
                    <p className="text-label-md font-semibold">{b.studentName || "—"}</p>
                    <p className="text-label-sm text-[var(--color-text-muted)]">
                      {TEACHING_MODE_LABELS[b.teachingMode] ?? b.teachingMode}
                    </p>
                  </div>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>

              <div className="flex flex-wrap gap-3 text-label-sm text-[var(--color-text-muted)]">
                <span>{formatQatarDate(b.scheduledAt)}</span>
                <span>{formatQatarTime(b.scheduledAt)} — {formatQatarTime(b.endsAt)}</span>
                <TeachingModeBadge mode={b.teachingMode} />
                {b.inPersonArea && <span>{b.inPersonArea}</span>}
                <span className="font-semibold text-[var(--color-text-main)]">{formatQAR(b.tutorRate)}</span>
              </div>

              {b.notes && (
                <p className="text-label-sm text-[var(--color-text-muted)] bg-[var(--color-surface-low)] rounded-[var(--radius-sm)] px-3 py-2">
                  {b.notes}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {b.status === "requested" && (
                  <>
                    <Button size="sm" onClick={() => openAction("accept", b.id)}>
                      <Check className="w-4 h-4" />قبول
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => openAction("reject", b.id)}>
                      <X className="w-4 h-4" />رفض
                    </Button>
                  </>
                )}
                {b.status === "accepted" && (
                  <Button size="sm" variant="ghost" onClick={() => openAction("cancel", b.id)}>
                    <X className="w-4 h-4" />إلغاء
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action confirmation modal */}
      <Modal
        open={!!action}
        onClose={() => { setAction(null); setActionErr(null); }}
        title={action?.type === "accept" ? "قبول الحجز" : action?.type === "reject" ? "رفض الحجز" : "إلغاء الحجز"}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {action?.type === "reject" && (
            <Textarea
              label="سبب الرفض (اختياري)"
              placeholder="أخبر الطالب بسبب الرفض..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          )}
          {action?.type === "cancel" && (
            <p className="text-body-md text-[var(--color-text-muted)]">هل أنت متأكد من إلغاء هذا الحجز؟</p>
          )}
          {action?.type === "accept" && (
            <p className="text-body-md text-[var(--color-text-muted)]">هل تريد قبول هذا الطلب؟ سيتم إشعار الطالب بالقبول.</p>
          )}
          {actionErr && (
            <p className="text-label-sm text-[var(--color-error)] text-center">{actionErr}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setAction(null); setActionErr(null); }}
              disabled={submitting}
            >
              تراجع
            </Button>
            <Button
              variant={action?.type === "reject" || action?.type === "cancel" ? "danger" : "primary"}
              className="flex-1"
              onClick={handleConfirm}
              loading={submitting}
            >
              {action?.type === "accept" ? "قبول" : action?.type === "reject" ? "رفض" : "إلغاء"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
