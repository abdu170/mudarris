"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  approveWithdrawalAction,
  rejectWithdrawalAction,
  type AdminWithdrawalItem,
} from "@/lib/actions/admin";
import { formatQAR, formatQatarDate } from "@/lib/utils";

interface Props {
  initialWithdrawals: AdminWithdrawalItem[];
}

type ActionState = { type: "approve" | "reject"; withdrawalId: string };

export function AdminWithdrawalsClient({ initialWithdrawals }: Props) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [action, setAction] = useState<ActionState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

  async function execute() {
    if (!action) return;
    setProcessing(true);
    setActionError(null);

    const res =
      action.type === "approve"
        ? await approveWithdrawalAction(action.withdrawalId)
        : await rejectWithdrawalAction(action.withdrawalId);

    setProcessing(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      const nextStatus = action.type === "approve" ? "approved" : "rejected";
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === action.withdrawalId ? { ...w, status: nextStatus } : w,
        ),
      );
      setAction(null);
    }
  }

  function statusLabel(s: AdminWithdrawalItem["status"]) {
    const map: Record<string, string> = {
      pending: "معلق",
      approved: "مكتمل",
      rejected: "مرفوض",
      processing: "قيد المعالجة",
      completed: "مكتمل",
    };
    return map[s] ?? s;
  }

  function statusVariant(s: AdminWithdrawalItem["status"]): "warning" | "success" | "error" | "muted" {
    if (s === "pending" || s === "processing") return "warning";
    if (s === "approved" || s === "completed") return "success";
    if (s === "rejected") return "error";
    return "muted";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">طلبات السحب</h1>
          <p className="text-body-md text-[var(--color-text-muted)] mt-1">{pendingCount} طلبات معلقة</p>
        </div>
      </div>

      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card p-6 max-w-sm w-full flex flex-col gap-4">
            <p className="text-label-lg font-semibold">
              {action.type === "approve" ? "تأكيد الموافقة على طلب السحب" : "تأكيد رفض طلب السحب"}
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-surface-low)] border-b border-[var(--color-outline-soft)]">
                {["المدرس", "المبلغ", "اسم الحساب / البنك", "تاريخ الطلب", "الحالة", "الإجراءات"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-label-sm font-semibold text-[var(--color-text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-[var(--color-outline-soft)] last:border-0 hover:bg-[var(--color-surface-low)] transition-colors">
                  <td className="px-4 py-3 text-label-md font-medium">{w.tutorName}</td>
                  <td className="px-4 py-3 text-label-md font-bold text-[var(--color-brand-primary)]">{formatQAR(w.amount)}</td>
                  <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)]">
                    {w.accountHolderName} · {w.bankName}
                  </td>
                  <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)]">{formatQatarDate(w.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(w.status)}>{statusLabel(w.status)}</Badge>
                    {w.adminNote && <p className="text-label-xs text-[var(--color-text-muted)] mt-0.5">{w.adminNote}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {w.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setAction({ type: "approve", withdrawalId: w.id })}>موافقة</Button>
                        <Button size="sm" variant="danger" onClick={() => setAction({ type: "reject", withdrawalId: w.id })}>رفض</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
