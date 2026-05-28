"use client";

import { useState, useEffect } from "react";
import { Video, X, CreditCard, Loader2 } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { BookingStatusBadge, TeachingModeBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { getStudentBookingsAction, cancelBookingAction, type BookingSummary } from "@/lib/actions/bookings";
import { initiatePaymentAction } from "@/lib/actions/payments";
import { formatQAR, formatQatarDate, formatQatarTime, TEACHING_MODE_LABELS } from "@/lib/utils";

const TABS = [
  { key: "upcoming",  label: "القادمة" },
  { key: "completed", label: "المكتملة" },
  { key: "cancelled", label: "الملغية" },
];

function filterByTab(bookings: BookingSummary[], tab: string): BookingSummary[] {
  if (tab === "upcoming")  return bookings.filter((b) => ["requested","accepted","payment_pending","paid","confirmed"].includes(b.status));
  if (tab === "completed") return bookings.filter((b) => b.status === "completed");
  if (tab === "cancelled") return bookings.filter((b) => ["cancelled","rejected"].includes(b.status));
  return bookings;
}

function BookingCard({
  booking,
  onCancel,
}: {
  booking: BookingSummary;
  onCancel: (id: string) => void;
}) {
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);

  async function handlePay() {
    setPaying(true);
    setPayErr(null);
    const res = await initiatePaymentAction(booking.id);
    setPaying(false);
    if (res.error) { setPayErr(res.error); return; }
    // Redirect to Tap checkout in same tab
    window.location.href = res.data!.checkoutUrl;
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={booking.tutorName || "؟"} src={booking.tutorAvatar ?? undefined} size="md" />
          <div>
            <p className="text-label-md font-semibold">{booking.tutorName || "—"}</p>
            <p className="text-label-sm text-[var(--color-text-muted)]">
              {TEACHING_MODE_LABELS[booking.teachingMode] ?? booking.teachingMode}
            </p>
          </div>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="flex flex-wrap gap-3 text-label-sm text-[var(--color-text-muted)]">
        <span>{formatQatarDate(booking.scheduledAt)}</span>
        <span>{formatQatarTime(booking.scheduledAt)} — {formatQatarTime(booking.endsAt)}</span>
        <TeachingModeBadge mode={booking.teachingMode} />
        {booking.inPersonArea && <span>{booking.inPersonArea}</span>}
        <span className="font-semibold text-[var(--color-text-main)]">{formatQAR(booking.tutorRate)}</span>
      </div>

      {booking.notes && (
        <p className="text-label-sm text-[var(--color-text-muted)] bg-[var(--color-surface-low)] rounded-[var(--radius-sm)] px-3 py-2">
          {booking.notes}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(booking.status === "payment_pending" || booking.status === "accepted") && (
          <>
            <Button size="sm" onClick={handlePay} loading={paying}>
              <CreditCard className="w-4 h-4" />ادفع الآن
            </Button>
            {payErr && <p className="w-full text-label-sm text-[var(--color-error)]">{payErr}</p>}
          </>
        )}
        {booking.merithubJoinUrl && booking.status === "confirmed" && (
          <Button size="sm" variant="secondary" asChild>
            <a href={booking.merithubJoinUrl} target="_blank" rel="noopener noreferrer">
              <Video className="w-4 h-4" />انضم للحصة
            </a>
          </Button>
        )}
        {["confirmed", "accepted", "requested"].includes(booking.status) && (
          <Button size="sm" variant="ghost" onClick={() => onCancel(booking.id)}>
            <X className="w-4 h-4" />إلغاء الحجز
          </Button>
        )}
      </div>
    </div>
  );
}

export default function StudentBookingsPage() {
  const [tab, setTab] = useState("upcoming");
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  async function loadBookings() {
    const res = await getStudentBookingsAction();
    setBookings(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadBookings(); }, []);

  async function handleCancel() {
    if (!cancelId) return;
    setCancelling(true);
    setCancelErr(null);
    const res = await cancelBookingAction(cancelId);
    setCancelling(false);
    if (res.error) { setCancelErr(res.error); return; }
    setCancelId(null);
    loadBookings();
  }

  const filtered = filterByTab(bookings, tab);

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count: filterByTab(bookings, t.key).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">حجوزاتي</h1>

      <Tabs tabs={tabsWithCounts} active={tab} onChange={setTab} />

      <div className="flex flex-col gap-4 mt-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-[var(--color-text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="لا توجد حجوزات" description="لم تقم بأي حجوز في هذه الفئة بعد" />
        ) : (
          filtered.map((b) => (
            <BookingCard key={b.id} booking={b} onCancel={setCancelId} />
          ))
        )}
      </div>

      {/* Cancel confirmation modal */}
      <Modal open={!!cancelId} onClose={() => { setCancelId(null); setCancelErr(null); }} title="تأكيد الإلغاء" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-body-md text-[var(--color-text-muted)]">هل أنت متأكد من إلغاء هذا الحجز؟</p>
          {cancelErr && <p className="text-label-sm text-[var(--color-error)] text-center">{cancelErr}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setCancelId(null); setCancelErr(null); }} disabled={cancelling}>
              تراجع
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleCancel} loading={cancelling}>
              تأكيد الإلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
