import { getAdminStatsAction } from "@/lib/actions/admin";
import { getAdminAllPaymentsAction } from "@/lib/actions/payments";
import { formatQAR } from "@/lib/utils";
import type { Metadata } from "next";
import AdminPaymentsClient from "./AdminPaymentsClient";

export const metadata: Metadata = { title: "إدارة المدفوعات" };

export default async function AdminPaymentsPage() {
  const [statsRes, paymentsRes] = await Promise.all([
    getAdminStatsAction(),
    getAdminAllPaymentsAction(),
  ]);

  const stats = statsRes.data;
  const totalPayments = stats?.totalPaymentsQar ?? 0;
  const platformFee = Math.round(totalPayments * 0.15);
  const tutorEarnings = Math.round(totalPayments * 0.85);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">إدارة المدفوعات</h1>

      {statsRes.error ? (
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{statsRes.error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-label-md text-[var(--color-text-muted)]">إجمالي الإيرادات</p>
            <p className="text-headline-lg text-[var(--color-brand-primary)] font-bold">{formatQAR(totalPayments)}</p>
            <p className="text-label-sm text-[var(--color-text-muted)] mt-1">{stats?.totalBookings ?? 0} حجز</p>
          </div>
          <div className="card p-5">
            <p className="text-label-md text-[var(--color-text-muted)]">عمولة المنصة (15%)</p>
            <p className="text-headline-lg text-[var(--color-success)] font-bold">{formatQAR(platformFee)}</p>
          </div>
          <div className="card p-5">
            <p className="text-label-md text-[var(--color-text-muted)]">مستحقات المدرسين (85%)</p>
            <p className="text-headline-lg text-[var(--color-text-main)] font-bold">{formatQAR(tutorEarnings)}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-headline-sm mb-4">جميع المعاملات</h2>
        {paymentsRes.error ? (
          <div className="card p-6 text-center">
            <p className="text-label-md text-[var(--color-error)]">{paymentsRes.error}</p>
          </div>
        ) : (
          <AdminPaymentsClient payments={paymentsRes.data ?? []} />
        )}
      </div>
    </div>
  );
}
