"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  approveTutorAction,
  rejectTutorAction,
  suspendTutorAction,
  type AdminTutorItem,
} from "@/lib/actions/admin";
import { formatQatarDate } from "@/lib/utils";

interface Props {
  initialApproved: AdminTutorItem[];
  initialPending: AdminTutorItem[];
}

type ActionState = { type: "approve" | "reject" | "suspend"; tutorId: string };

export function AdminTutorsClient({ initialApproved, initialPending }: Props) {
  const [tutors, setTutors] = useState<AdminTutorItem[]>([
    ...initialApproved,
    ...initialPending,
  ]);
  const [action, setAction] = useState<ActionState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
