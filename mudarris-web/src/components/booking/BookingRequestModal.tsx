"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { formatQAR } from "@/lib/utils";
import { requestBookingAction } from "@/lib/actions/bookings";
import type { AvailableSlot } from "@/lib/actions/availability";

// ─── Qatar time helpers (duplicated locally to avoid cross-file coupling) ──

const QT_MS = 3 * 60 * 60 * 1000;

function toQT(utcStr: string): Date {
  return new Date(new Date(utcStr).getTime() + QT_MS);
}

function fmtTime(utcStr: string): string {
  const qd = toQT(utcStr);
  const h = qd.getUTCHours();
  const m = qd.getUTCMinutes();
  const suffix = h >= 12 ? "م" : "ص";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function fmtDateFull(utcStr: string): string {
  const qd = toQT(utcStr);
  const DAY = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const MON = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return `${DAY[qd.getUTCDay()]}، ${qd.getUTCDate()} ${MON[qd.getUTCMonth()]} ${qd.getUTCFullYear()}`;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  slot: AvailableSlot;
  tutorId: string;
  tutorName: string;
  tutorRate: number;
  onSuccess: () => void;
}

const MODE_LABEL: Record<string, string> = {
  online: "أونلاين",
  in_person: "حضوري",
  both: "أونلاين أو حضوري",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function BookingRequestModal({
  open,
  onClose,
  slot,
  tutorId,
  tutorName,
  tutorRate,
  onSuccess,
}: Props) {
  const [notes, setNotes] = useState("");
  const [inPersonArea, setInPersonArea] = useState("");
  const [teachingMode, setTeachingMode] = useState<"online" | "in_person">(
    slot.teachingMode === "in_person" ? "in_person" : "online"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const needsArea = teachingMode === "in_person";
  const showModeChoice = slot.teachingMode === "both";

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.set("tutorId", tutorId);
    fd.set("scheduledAt", slot.slotStart);
    fd.set("teachingMode", teachingMode);
    if (notes.trim()) fd.set("notes", notes.trim());
    if (needsArea && inPersonArea.trim()) fd.set("inPersonArea", inPersonArea.trim());

    const res = await requestBookingAction(fd);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      setSuccess(false);
      setNotes("");
      setInPersonArea("");
    }, 1800);
  }

  function handleClose() {
    if (loading) return;
    setError(null);
    setSuccess(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="تأكيد طلب الحجز" size="sm">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-success-container)] flex items-center justify-center text-[var(--color-success)] text-2xl font-bold">
            ✓
          </div>
          <p className="text-headline-sm text-[var(--color-text-main)]">تم إرسال طلبك!</p>
          <p className="text-body-md text-[var(--color-text-muted)]">
            سيقوم المدرس بمراجعة طلبك والرد عليه قريباً
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Slot summary */}
          <div className="p-3 bg-[var(--color-surface-low)] rounded-[var(--radius-sm)] flex flex-col gap-1">
            <p className="text-label-sm font-semibold text-[var(--color-text-main)]">{tutorName}</p>
            <p className="text-body-md text-[var(--color-text-main)]">
              {fmtDateFull(slot.slotStart)}
            </p>
            <p className="text-label-sm text-[var(--color-text-muted)]">
              {fmtTime(slot.slotStart)} — {fmtTime(slot.slotEnd)} · ٥٠ دقيقة
            </p>
            <p className="text-label-sm font-semibold text-[var(--color-brand-primary)] mt-1">
              {formatQAR(tutorRate)}
            </p>
          </div>

          {/* Teaching mode selector (only if tutor offers both) */}
          {showModeChoice && (
            <div className="flex flex-col gap-1.5">
              <p className="text-label-sm font-medium text-[var(--color-text-main)]">طريقة التدريس</p>
              <div className="flex gap-2">
                {(["online", "in_person"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTeachingMode(m)}
                    className={`flex-1 py-2 rounded-[var(--radius-sm)] text-label-sm font-medium border transition-colors ${
                      teachingMode === m
                        ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]"
                        : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-outline-soft)] hover:bg-[var(--color-surface-low)]"
                    }`}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In-person area */}
          {needsArea && (
            <Input
              label="المنطقة (للتدريس الحضوري)"
              placeholder="مثال: الدوحة — الروضة"
              value={inPersonArea}
              onChange={(e) => setInPersonArea(e.target.value)}
            />
          )}

          {/* Notes */}
          <Textarea
            label="ملاحظات للمدرس (اختياري)"
            placeholder="أي تفاصيل تريد مشاركتها مع المدرس..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {/* Error */}
          {error && (
            <p className="text-label-sm text-[var(--color-error)] text-center">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" size="md" className="flex-1" onClick={handleClose} disabled={loading}>
              إلغاء
            </Button>
            <Button size="md" className="flex-1" onClick={handleSubmit} loading={loading}>
              إرسال الطلب
            </Button>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] text-center leading-relaxed">
            لن يتم خصم أي مبلغ الآن · الدفع فقط بعد قبول المدرس
          </p>
        </div>
      )}
    </Modal>
  );
}
