import Link from "next/link";
import { Users, BookOpen, CreditCard, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatQAR } from "@/lib/utils";
import { getAdminStatsAction, getAdminTutorsAction } from "@/lib/actions/admin";
import { AdminPendingTutors } from "./AdminPendingTutors";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "لوحة تحكم الإدارة" };

export default async function AdminPage() {
  const [statsRes, pendingRes] = await Promise.all([
    getAdminStatsAction(),
    getAdminTutorsAction("pending"),
  ]);

  const s = statsRes.data;
  const pendingTutors = pendingRes.data ?? [];

  const statCards = s
    ? [
        { icon: <Users className="w-5 h-5" />, label: "إجمالي المدرسين", value: s.totalTutors, sub: `${s.pendingApprovals} بانتظار الموافقة` },
        { icon: <Users className="w-5 h-5" />, label: "إجمالي الطلاب", value: s.totalStudents, sub: undefined },
        { icon: <BookOpen className="w-5 h-5" />, label: "إجمالي الحجوزات", value: s.totalBookings, sub: undefined },
        { icon: <CreditCard className="w-5 h-5" />, label: "إجمالي المدفوعات", value: formatQAR(s.totalPaymentsQar), sub: undefined },
        { icon: <Wallet className="w-5 h-5" />, label: "طلبات سحب معلقة", value: s.pendingWithdrawals, sub: undefined, urgent: true },
      ]
    : [];

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-headline-lg">لوحة تحكم الإدارة</h1>
        <p className="text-body-md text-[var(--color-text-muted)] mt-1">نظرة شاملة على عمليات المنصة</p>
      </div>

      {statsRes.error ? (
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{statsRes.error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`card p-5 flex flex-col gap-3 ${card.urgent ? "border-[var(--color-warning)]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${card.urgent ? "bg-[var(--color-warning-container)] text-[var(--color-warning)]" : "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"}`}>
                  {card.icon}
                </div>
                {card.urgent && <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />}
              </div>
              <div>
                <p className="text-label-sm text-[var(--color-text-muted)]">{card.label}</p>
                <p className="text-headline-md font-bold text-[var(--color-text-main)]">{card.value}</p>
                {card.sub && <p className="text-label-sm text-[var(--color-text-muted)]">{card.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline-sm">مدرسون بانتظار الموافقة ({pendingTutors.length})</h2>
          <Link href="/admin/tutors" className="text-label-sm text-[var(--color-brand-primary)] hover:underline">عرض الكل</Link>
        </div>
        <AdminPendingTutors initialTutors={pendingTutors} />
      </div>

      <div>
        <h2 className="text-headline-sm mb-4">التنقل السريع</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/admin/tutors",      label: "إدارة المدرسين" },
            { href: "/admin/bookings",    label: "الحجوزات" },
            { href: "/admin/payments",    label: "المدفوعات" },
            { href: "/admin/withdrawals", label: "طلبات السحب" },
            { href: "/admin/reports",     label: "البلاغات" },
          ].map((link) => (
            <Button key={link.href} variant="secondary" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
