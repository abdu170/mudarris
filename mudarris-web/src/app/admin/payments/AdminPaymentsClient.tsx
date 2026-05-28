"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { formatQAR, formatQatarDate, formatQatarTime } from "@/lib/utils";
import type { AdminPaymentItem } from "@/lib/actions/payments";

const STATUS_LABELS: Record<string, string> = {
  pending: "في الانتظار",
  processing: "قيد المعالجة",
  succeeded: "مكتمل",
  failed: "فشل",
  refunded: "مسترجع",
  partially_refunded: "مسترجع جزئياً",
};

function statusColor(s: string): string {
  if (s === "succeeded") return "text-[var(--color-success)]";
  if (s === "failed" || s === "refunded") return "text-[var(--color-error)]";
  return "text-[var(--color-text-muted)]";
}

function statusIcon(s: string) {
  if (s === "succeeded") return <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />;
  if (s === "failed") return <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />;
  return <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />;
}

interface Props {
  payments: AdminPaymentItem[];
}

export default function AdminPaymentsClient({ payments }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? payments.filter((p) =>
        p.studentName.includes(query) ||
        p.tutorName.includes(query) ||
        (p.tapChargeId ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : payments;

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="بحث باسم الطالب أو المدرس أو رقم المعاملة..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full ps-9 pe-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-body-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-label-sm">
            <thead className="bg-[var(--color-surface-container)]">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-text-muted)]">الطالب</th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-text-muted)]">المدرس</th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-text-muted)]">المبلغ</th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-text-muted)]">الحالة</th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-text-muted)]">رقم Tap</th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-text-muted)]">التاريخ</th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-text-muted)]">Webhook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center px-4 py-8 text-[var(--color-text-muted)]">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-surface-container)] transition-colors">
                    <td className="px-4 py-3">{p.studentName}</td>
                    <td className="px-4 py-3">{p.tutorName}</td>
                    <td className="px-4 py-3 font-semibold">{formatQAR(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 ${statusColor(p.status)}`}>
                        {statusIcon(p.status)}
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">
                      {p.tapChargeId ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {formatQatarDate(p.createdAt)}
                      <br />
                      <span className="text-xs">{formatQatarTime(p.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {p.webhookReceivedAt
                        ? formatQatarDate(p.webhookReceivedAt)
                        : <span className="text-[var(--color-text-muted)]">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-label-sm text-[var(--color-text-muted)] text-end">
        {filtered.length} من {payments.length} معاملة
      </p>
    </div>
  );
}
