import Link from "next/link";
import { BookOpen, Clock, Wallet, Link2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatQAR, formatQatarDate, formatQatarTime } from "@/lib/utils";
import { BookingStatusBadge, TeachingModeBadge } from "@/components/ui/Badge";
import { getStudentBookingsAction } from "@/lib/actions/bookings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "لوحة تحكم الطالب" };

function StatCard({ icon, label, value, sub, href }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; href?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] bg-opacity-10 text-[var(--color-brand-primary)] flex items-center justify-center">
          {icon}
        </div>
        {href && (
          <Link href={href} className="text-label-sm text-[var(--color-brand-primary)] flex items-center gap-0.5 hover:underline">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div>
        <p className="text-label-md text-[var(--color-text-muted)]">{label}</p>
        <p className="text-headline-md text-[var(--color-text-main)] font-bold">{value}</p>
        {sub && <p className="text-label-sm text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function StudentDashboardPage() {
  const res = await getStudentBookingsAction();
  const bookings = res.data ?? [];
  const upcoming = bookings.filter((b) =>
    ["confirmed","payment_pending","accepted","requested"].includes(b.status)
  );

  return (
    <div className="flex flex-col gap-7">
      {/* Greeting */}
      <div>
        <h1 className="text-headline-lg text-[var(--color-text-main)]">أهلاً بك!</h1>
        <p className="text-body-md text-[var(--color-text-muted)] mt-1">هنا نظرة سريعة على نشاطك</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-5 h-5" />} label="حصص قادمة" value={`${upcoming.length}`} sub="في انتظار الحصة" href="/student/bookings" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="إجمالي الحجوزات" value={`${bookings.length}`} href="/student/bookings" />
        <StatCard icon={<Wallet className="w-5 h-5" />} label="المحفظة" value="—" sub="قريباً" href="/student/wallet" />
        <StatCard icon={<Link2 className="w-5 h-5" />} label="رابط الإحالة" value="قريباً" sub="شارك وأكسب رصيداً" />
      </div>

      {/* Upcoming lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline-sm">الحصص القادمة</h2>
          <Link href="/student/bookings" className="text-label-sm text-[var(--color-brand-primary)] hover:underline flex items-center gap-0.5">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-body-md text-[var(--color-text-muted)] mb-4">لا توجد حصص قادمة</p>
            <Button asChild>
              <Link href="/tutors">ابحث عن مدرس</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.slice(0, 5).map((booking) => (
              <div key={booking.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-label-md font-semibold">{booking.tutorName || "—"}</p>
                  <p className="text-label-sm text-[var(--color-text-muted)]">
                    {formatQatarDate(booking.scheduledAt)} · {formatQatarTime(booking.scheduledAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <BookingStatusBadge status={booking.status} />
                    <TeachingModeBadge mode={booking.teachingMode} />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {booking.status === "payment_pending" && (
                    <Button size="sm" asChild><Link href="/student/bookings">ادفع الآن</Link></Button>
                  )}
                  {booking.merithubJoinUrl && booking.status === "confirmed" && (
                    <Button size="sm" variant="secondary" asChild>
                      <a href={booking.merithubJoinUrl} target="_blank" rel="noopener noreferrer">انضم للحصة</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-headline-sm mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" asChild><Link href="/tutors">ابحث عن مدرس</Link></Button>
          <Button variant="secondary" asChild><Link href="/student/bookings">حجوزاتي</Link></Button>
          <Button variant="secondary" asChild><Link href="/student/messages">الرسائل</Link></Button>
          <Button variant="ghost" asChild><Link href="/student/wallet">المحفظة</Link></Button>
        </div>
      </div>
    </div>
  );
}
