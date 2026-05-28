"use client";

import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatQAR, formatQatarDate, formatQatarTime } from "@/lib/utils";
import type { PaymentSummary } from "@/lib/actions/payments";

const STATUS_LABELS: Record<string, string> = {
  pending: "في الانتظار",
  processing: "قيد المعالجة",
  succeeded: "مكتمل",
  failed: "فشل",
  refunded: "مسترجع",
  partially_refunded: "مسترجع جزئياً",
};

function statusIcon(status: string) {
  if (status === "succeeded") return <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-[var(--color-error)]" />;
  return <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />;
}

function statusColor(status: string): string {
  if (status === "succeeded") return "text-[var(--color-success)]";
  if (status === "failed" || status === "refunded") return "text-[var(--color-error)]";
  return "text-[var(--color-text-muted)]";
}

interface Props {
  payments: PaymentSummary[];
}

export default function StudentWalletClient({ payments }: Props) {
  const totalPaid = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">المحفظة</h1>

      {/* Summary card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-brand-cream)] flex items-center justify-center text-[var(--color-brand-primary)]">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <p className="text-label-md text-[var(--color-text-muted)]">إجمالي المدفوعات</p>
          <p className="text-headline-lg text-[var(--color-brand-primary)] font-bold">
            {formatQAR(totalPaid)}
          </p>
        </div>
      </div>

      {/* Payment history */}
      <div className="card">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-headline-sm">سجل المدفوعات</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-label-md text-[var(--color-text-muted)]">لا توجد مدفوعات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  {statusIcon(p.status)}
                  <div>
                    <p className="text-label-md font-medium">
                      {STATUS_LABELS[p.status] ?? p.status}
                    </p>
                    <p className="text-label-sm text-[var(--color-text-muted)] font-mono text-xs">
                      {p.tapChargeId ?? p.id.slice(0, 8)}
                    </p>
                    <p className="text-label-sm text-[var(--color-text-muted)]">
                      {formatQatarDate(p.createdAt)} — {formatQatarTime(p.createdAt)}
                    </p>
                  </div>
                </div>
                <p className={`text-label-md font-semibold ${statusColor(p.status)}`}>
                  {formatQAR(p.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
