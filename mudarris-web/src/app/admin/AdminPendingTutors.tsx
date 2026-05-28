"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { approveTutorAction, rejectTutorAction, type AdminTutorItem } from "@/lib/actions/admin";
import { formatQatarDate } from "@/lib/utils";

interface Props {
  initialTutors: AdminTutorItem[];
}

export function AdminPendingTutors({ initialTutors }: Props) {
  const [tutors, setTutors] = useState(initialTutors);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function act(id: string, action: "approve" | "reject") {
    setProcessingId(id);
    setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    const res = action === "approve" ? await approveTutorAction(id) : await rejectTutorAction(id);
    setProcessingId(null);
    if (res.error) {
      setErrors((prev) => ({ ...prev, [id]: res.error }));
    } else {
      setTutors((prev) => prev.filter((t) => t.id !== id));
    }
  }

  if (tutors.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-body-md text-[var(--color-text-muted)]">لا يوجد مدرسون بانتظار الموافقة</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-surface-low)] border-b border-[var(--color-outline-soft)]">
              {["المدرس", "المادة", "تاريخ التقديم", "الحالة", "الإجراءات"].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-label-sm font-semibold text-[var(--color-text-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tutors.map((t) => (
              <tr key={t.id} className="border-b border-[var(--color-outline-soft)] last:border-0 hover:bg-[var(--color-surface-low)] transition-colors">
                <td className="px-4 py-3 text-label-md font-medium">{t.displayName}</td>
                <td className="px-4 py-3 text-label-md text-[var(--color-text-muted)]">{t.subjects.join("، ") || "—"}</td>
                <td className="px-4 py-3 text-label-md text-[var(--color-text-muted)]">{formatQatarDate(t.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">قيد المراجعة</Badge>
                  {errors[t.id] && <p className="text-label-xs text-[var(--color-error)] mt-1">{errors[t.id]}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => act(t.id, "approve")}
                      loading={processingId === t.id}
                      disabled={!!processingId}
                    >
                      <Check className="w-3.5 h-3.5" />قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => act(t.id, "reject")}
                      disabled={!!processingId}
                    >
                      <X className="w-3.5 h-3.5" />رفض
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
