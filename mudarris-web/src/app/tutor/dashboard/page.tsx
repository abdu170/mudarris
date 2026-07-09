import Link from "next/link";
import { ArrowLeft, Star, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BookingStatusBadge, TeachingModeBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatQAR, formatQatarDate, formatQatarTime } from "@/lib/utils";
import { getTutorBookingsAction } from "@/lib/actions/bookings";
import { TutorPendingRequests } from "./TutorPendingRequests";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "لوحة تحكم المدرس" };

export default async function TutorDashboardPage() {
  const res = await getTutorBookingsAction();
  const bookings = res.data ?? [];
  const pending  = bookings.filter((b) => b.status === "requested");
  const upcoming = bookings.filter((b) => ["accepted","confirmed","paid"].includes(b.status));

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-headline-lg">مرحباً!</h1>
        <p className="text-body-md text-[var(--color-text-muted)] mt-1">إليك ملخص نشاطك اليوم</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Clock className="w-5 h-5" />,       label: "طلبات معلقة",   value: `${pending.length}`,  sub: "تحتاج موافقة",  urgent: pending.length > 0 },
          { icon: <CheckCircle2 className="w-5 h-5" />, label: "حصص قادمة",     value: `${upcoming.length}`, sub: "مقبولة",         urgent: false },
          { icon: <Wallet className="w-5 h-5" />,       label: "المحفظة",        value: "—",                  sub: "قريباً",         urgent: false },
          { icon: <Star className="w-5 h-5" />,         label: "التقييم",        value: "—",                  sub: "بعد أول تقييم", urgent: false },
        ].map((card) => (
          <div
            key={card.label}
            className={`card p-5 flex flex-col gap-3 ${card.urgent ? "border-[var(--color-warning)] bg-[var(--color-warning-container)]" : ""}`}
          >
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center">
              {card.icon}
            </div>
            <div>
              <p className="text-label-md text-[var(--color-text-muted)]">{card.label}</p>
              <p className="text-headline-md font-bold text-[var(--color-text-main)]">{card.value}</p>
              <p className="text-label-sm text-[var(--color-text-muted)]">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending requests — client component (has accept/reject buttons) */}
      {pending.length > 0 && <TutorPendingRequests initialBookings={pending} />}

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline-sm">الحصص القادمة</h2>
          <Link href="/tutor/bookings" className="text-label-sm text-[var(--color-brand-primary)] hover:underline flex items-center gap-0.5">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-body-md text-[var(--color-text-muted)]">لا توجد حصص قادمة</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.slice(0, 5).map((b) => (
              <div key={b.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={b.studentName || "؟"} src={b.studentAvatar ?? undefined} size="sm" />
                  <div>
                    <p className="text-label-md font-semibold">{b.studentName || "—"}</p>
                    <p className="text-label-sm text-[var(--color-text-muted)]">
                      {formatQatarDate(b.scheduledAt)} · {formatQatarTime(b.scheduledAt)}
                    </p>
                  </div>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-headline-sm mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" asChild><Link href="/tutor/availability">ضبط الجدول</Link></Button>
          <Button variant="secondary" asChild><Link href="/tutor/profile/edit">تعديل الملف</Link></Button>
          <Button variant="secondary" asChild><Link href="/tutor/wallet">المحفظة</Link></Button>
          <Button variant="ghost" asChild><Link href="/tutor/messages">الرسائل</Link></Button>
        </div>
      </div>
    </div>
  );
}
