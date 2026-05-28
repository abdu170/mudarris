"use client";

import { useState } from "react";
import { Flag, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import {
  updateReportStatusAction,
  suspendUserAction,
  type UserReportItem,
} from "@/lib/actions/messages";
import type { UserReportStatus } from "@/lib/supabase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<UserReportStatus, string> = {
  pending: "قيد المراجعة",
  reviewed: "تمت المراجعة",
  resolved: "تم الحل",
  dismissed: "مرفوض",
};

const STATUS_COLORS: Record<UserReportStatus, string> = {
  pending: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
  reviewed: "text-[var(--color-primary)] bg-[var(--color-primary)]/10",
  resolved: "text-[var(--color-success)] bg-[var(--color-success)]/10",
  dismissed: "text-[var(--color-text-muted)] bg-[var(--color-surface-low)]",
};

const STATUS_ICON: Record<UserReportStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  reviewed: <AlertCircle className="w-3 h-3" />,
  resolved: <CheckCircle className="w-3 h-3" />,
  dismissed: <XCircle className="w-3 h-3" />,
};

function StatusBadge({ status }: { status: UserReportStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_ICON[status]}
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-QA", {
    timeZone: "Asia/Qatar",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Report detail modal ──────────────────────────────────────────────────────

const NEXT_STATUS: Record<UserReportStatus, UserReportStatus[]> = {
  pending: ["reviewed", "resolved", "dismissed"],
  reviewed: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
};

function ReportModal({
  report,
  onClose,
  onUpdated,
}: {
  report: UserReportItem;
  onClose: () => void;
  onUpdated: (updated: UserReportItem) => void;
}) {
  const [status, setStatus] = useState<UserReportStatus>(report.status);
  const [note, setNote] = useState(report.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const nextStatuses = NEXT_STATUS[report.status];

  async function handleSave() {
    setSaving(true);
    setErr(null);
    const res = await updateReportStatusAction(report.id, status, note || undefined);
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    setSaved(true);
    onUpdated({ ...report, status, adminNote: note || null });
    setTimeout(onClose, 800);
  }

  async function handleSuspend() {
    if (!report.reportedUserId) return;
    const reason = note.trim() || "إيقاف بسبب انتهاك سياسة المنصة";
    setSuspending(true);
    setErr(null);
    const res = await suspendUserAction(report.reportedUserId, reason);
    setSuspending(false);
    if (res.error) { setErr(res.error); return; }
    // Also update report status to resolved
    await updateReportStatusAction(report.id, "resolved", reason);
    onUpdated({ ...report, status: "resolved", adminNote: reason });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="تفاصيل البلاغ" size="md">
      <div className="flex flex-col gap-4">
        {/* Report info */}
        <div className="grid grid-cols-2 gap-3 text-label-sm">
          <div>
            <p className="text-[var(--color-text-muted)]">المُبلّغ</p>
            <p className="font-semibold">{report.reporterName}</p>
          </div>
          <div>
            <p className="text-[var(--color-text-muted)]">المُبلَّغ عنه</p>
            <p className="font-semibold">{report.reportedUserName ?? "—"}</p>
          </div>
          <div>
            <p className="text-[var(--color-text-muted)]">الحالة</p>
            <StatusBadge status={report.status} />
          </div>
          <div>
            <p className="text-[var(--color-text-muted)]">التاريخ</p>
            <p>{formatDate(report.createdAt)}</p>
          </div>
        </div>

        {/* Reason */}
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-low)]">
          <p className="text-label-sm text-[var(--color-text-muted)] mb-1">سبب البلاغ:</p>
          <p className="text-body-md text-right" style={{ direction: "rtl" }}>{report.reason}</p>
        </div>

        {nextStatuses.length > 0 && (
          <>
            {/* Status update */}
            <div className="flex flex-col gap-2">
              <label className="text-label-sm font-medium">تحديث الحالة:</label>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-label-sm font-medium border transition-colors ${
                      status === s
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin note */}
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-medium">ملاحظة إدارية (اختياري):</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="أضف ملاحظة..."
                rows={2}
                maxLength={1000}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-2 text-label-md resize-none focus:outline-none w-full text-right"
                style={{ direction: "rtl" }}
              />
            </div>

            {err && <p className="text-label-sm text-[var(--color-error)]">{err}</p>}

            <div className="flex gap-2 flex-wrap">
              {report.reportedUserId && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleSuspend}
                  loading={suspending}
                >
                  إيقاف الحساب المُبلَّغ عنه
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleSave}
                loading={saving}
                disabled={saved}
              >
                {saved ? <CheckCircle className="w-4 h-4" /> : "حفظ التغييرات"}
              </Button>
            </div>
          </>
        )}

        {nextStatuses.length === 0 && (
          <p className="text-label-sm text-[var(--color-text-muted)] text-center">
            هذا البلاغ قد تمت معالجته نهائياً.
          </p>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { key: "pending", label: "قيد المراجعة" },
  { key: "reviewed", label: "تمت المراجعة" },
  { key: "resolved", label: "تم الحل" },
  { key: "dismissed", label: "مرفوض" },
  { key: "all", label: "الكل" },
];

export default function AdminReportsClient({
  initialReports,
}: {
  initialReports: UserReportItem[];
}) {
  const [reports, setReports] = useState<UserReportItem[]>(initialReports);
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<UserReportItem | null>(null);

  function handleUpdated(updated: UserReportItem) {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const filtered = tab === "all"
    ? reports
    : reports.filter((r) => r.status === tab);

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count: t.key === "all" ? reports.length : reports.filter((r) => r.status === t.key).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-headline-lg">البلاغات</h1>
        {reports.filter((r) => r.status === "pending").length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] text-label-sm font-bold">
            {reports.filter((r) => r.status === "pending").length} جديد
          </span>
        )}
      </div>

      <Tabs tabs={tabsWithCounts} active={tab} onChange={setTab} />

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="لا توجد بلاغات" description="لا توجد بلاغات في هذه الفئة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-low)]">
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">المُبلّغ</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">المُبلَّغ عنه</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">السبب</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">الحالة</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[var(--color-surface-low)] transition-colors"
                  >
                    <td className="px-4 py-3 text-label-md">{r.reporterName}</td>
                    <td className="px-4 py-3 text-label-md">{r.reportedUserName ?? "—"}</td>
                    <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] max-w-[200px] truncate">
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)]">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>
                        <Flag className="w-3 h-3" /> معالجة
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ReportModal
          report={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
