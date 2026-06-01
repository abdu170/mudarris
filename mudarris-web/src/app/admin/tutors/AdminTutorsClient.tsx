"use client";

import { useState } from "react";
import { FileText, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  approveTutorAction,
  rejectTutorAction,
  suspendTutorAction,
  getAdminTutorDocumentsAction,
  type AdminTutorItem,
  type AdminTutorDocument,
} from "@/lib/actions/admin";

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id:            "هوية / إقامة",
  academic_certificate:   "شهادة أكاديمية",
  additional_certificate: "شهادة إضافية",
  teaching_certificate:   "شهادة تدريس",
};

function docTypeLabel(type: string): string {
  return DOC_TYPE_LABELS[type] ?? type;
}
import { formatQatarDate } from "@/lib/utils";

interface Props {
  initialApproved: AdminTutorItem[];
  initialPending: AdminTutorItem[];
}

type ActionState = { type: "approve" | "reject" | "suspend"; tutorId: string };

interface DocsModal {
  tutorId: string;
  tutorName: string;
  docs: AdminTutorDocument[] | null;
  loading: boolean;
  error: string | null;
}

export function AdminTutorsClient({ initialApproved, initialPending }: Props) {
  const [tutors, setTutors] = useState<AdminTutorItem[]>([
    ...initialApproved,
    ...initialPending,
  ]);
  const [action, setAction] = useState<ActionState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [docsModal, setDocsModal] = useState<DocsModal | null>(null);

  const approved = tutors.filter((t) => t.status === "approved");
  const pending = tutors.filter((t) => t.status === "pending");

  async function execute() {
    if (!action) return;
    setProcessing(true);
    setActionError(null);

    let res;
    if (action.type === "approve") res = await approveTutorAction(action.tutorId);
    else if (action.type === "reject") res = await rejectTutorAction(action.tutorId);
    else res = await suspendTutorAction(action.tutorId);

    setProcessing(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      if (action.type === "reject") {
        setTutors((prev) => prev.filter((t) => t.id !== action.tutorId));
      } else {
        const nextStatus = action.type === "approve" ? "approved" : "suspended";
        setTutors((prev) =>
          prev.map((t) =>
            t.id === action.tutorId
              ? { ...t, status: nextStatus, isVisible: action.type === "approve" }
              : t,
          ),
        );
      }
      setAction(null);
    }
  }

  async function openDocs(tutorId: string, tutorName: string) {
    setDocsModal({ tutorId, tutorName, docs: null, loading: true, error: null });
    const res = await getAdminTutorDocumentsAction(tutorId);
    if (res.error) {
      setDocsModal((prev) => prev ? { ...prev, loading: false, error: res.error ?? null } : null);
    } else {
      setDocsModal((prev) => prev ? { ...prev, loading: false, docs: res.data ?? [] } : null);
    }
  }

  function TutorRow({ t, mode }: { t: AdminTutorItem; mode: "approve" | "suspend" }) {
    return (
      <tr className="border-b border-[var(--color-outline-soft)] last:border-0 hover:bg-[var(--color-surface-low)] transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={t.displayName} src={t.avatar ?? undefined} size="sm" />
            <p className="text-label-md font-medium">{t.displayName}</p>
            {t.status === "approved" && <VerifiedBadge className="shrink-0" />}
          </div>
        </td>
        <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)]">{t.subjects.join("، ") || "—"}</td>
        <td className="px-4 py-3 text-label-md">{t.rating > 0 ? `★ ${t.rating}` : "—"}</td>
        <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)]">{formatQatarDate(t.createdAt)}</td>
        <td className="px-4 py-3">
          <Badge variant={t.status === "approved" ? "success" : t.status === "pending" ? "warning" : "error"}>
            {t.status === "approved" ? "معتمد" : t.status === "pending" ? "معلق" : t.status === "rejected" ? "مرفوض" : "موقوف"}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openDocs(t.id, t.displayName)}
              title="عرض الوثائق"
            >
              <FileText className="w-4 h-4" />
            </Button>
            {mode === "approve" ? (
              <>
                <Button size="sm" onClick={() => setAction({ type: "approve", tutorId: t.id })}>قبول</Button>
                <Button size="sm" variant="danger" onClick={() => setAction({ type: "reject", tutorId: t.id })}>رفض</Button>
              </>
            ) : (
              <Button size="sm" variant="danger" onClick={() => setAction({ type: "suspend", tutorId: t.id })}>تعليق</Button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  const COLS = ["المدرس", "المادة", "التقييم", "تاريخ التسجيل", "الحالة", "الإجراءات"];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">إدارة المدرسين</h1>

      {/* Approve/Reject/Suspend confirmation modal */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card p-6 max-w-sm w-full flex flex-col gap-4">
            <p className="text-label-lg font-semibold">
              {action.type === "approve" ? "تأكيد قبول المدرس" : action.type === "reject" ? "تأكيد رفض المدرس" : "تأكيد تعليق المدرس"}
            </p>
            {actionError && <p className="text-label-sm text-[var(--color-error)]">{actionError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setAction(null); setActionError(null); }}>إلغاء</Button>
              <Button
                variant={action.type === "approve" ? "primary" : "danger"}
                onClick={execute}
                loading={processing}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents modal */}
      {docsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card p-6 max-w-md w-full flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-label-lg font-semibold">وثائق {docsModal.tutorName}</p>
              <button
                onClick={() => setDocsModal(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {docsModal.loading && (
              <p className="text-label-md text-[var(--color-text-muted)] text-center py-4">جاري التحميل...</p>
            )}

            {docsModal.error && (
              <p className="text-label-sm text-[var(--color-error)]">{docsModal.error}</p>
            )}

            {!docsModal.loading && !docsModal.error && docsModal.docs !== null && (
              docsModal.docs.length === 0 ? (
                <p className="text-label-md text-[var(--color-text-muted)] text-center py-4">لا توجد وثائق مرفوعة</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {docsModal.docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-low)]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
                        <div className="min-w-0">
                          <p className="text-label-sm font-medium text-[var(--color-text-main)] truncate">{doc.fileName}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{docTypeLabel(doc.documentType)}</p>
                        </div>
                      </div>
                      {doc.signedUrl && (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 text-label-sm text-[var(--color-brand-primary)] hover:underline"
                        >
                          فتح
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <section>
        <h2 className="text-headline-sm mb-4">المدرسون المعتمدون ({approved.length})</h2>
        {approved.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-body-md text-[var(--color-text-muted)]">لا يوجد مدرسون معتمدون</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-low)] border-b border-[var(--color-outline-soft)]">
                    {COLS.map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-label-sm font-semibold text-[var(--color-text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approved.map((t) => <TutorRow key={t.id} t={t} mode="suspend" />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-headline-sm mb-4">طلبات التسجيل المعلقة ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-body-md text-[var(--color-text-muted)]">لا توجد طلبات معلقة</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-low)] border-b border-[var(--color-outline-soft)]">
                    {COLS.map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-label-sm font-semibold text-[var(--color-text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((t) => <TutorRow key={t.id} t={t} mode="approve" />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
