import { getAdminBookingsAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { BookingStatusBadge, TeachingModeBadge } from "@/components/ui/Badge";
import { formatQAR, formatQatarDate, formatQatarTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "إدارة الحجوزات" };

export default async function AdminBookingsPage() {
  const res = await getAdminBookingsAction();
  const bookings = res.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">إدارة الحجوزات</h1>
      {res.error ? (
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{res.error}</p>
        </div>
      ) : (
        <>
          <p className="text-body-md text-[var(--color-text-muted)]">إجمالي الحجوزات: {bookings.length}</p>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-low)] border-b border-[var(--color-outline-soft)]">
                    {["الطالب", "المدرس", "التاريخ", "الوقت", "النوع", "السعر", "الحالة", "إجراء"].map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-label-sm font-semibold text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-[var(--color-outline-soft)] last:border-0 hover:bg-[var(--color-surface-low)] transition-colors">
                      <td className="px-4 py-3 text-label-md">{b.studentName}</td>
                      <td className="px-4 py-3 text-label-md">{b.tutorName}</td>
                      <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] whitespace-nowrap">{formatQatarDate(b.scheduledAt)}</td>
                      <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] whitespace-nowrap">{formatQatarTime(b.scheduledAt)}</td>
                      <td className="px-4 py-3"><TeachingModeBadge mode={b.teachingMode} /></td>
                      <td className="px-4 py-3 text-label-md font-medium">{formatQAR(b.tutorRate)}</td>
                      <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">عرض</Button>
                          {b.status === "disputed" && <Button size="sm" variant="danger">حل</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
