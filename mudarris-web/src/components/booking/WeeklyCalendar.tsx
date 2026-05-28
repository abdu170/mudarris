"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTutorAvailableSlotsAction, type AvailableSlot } from "@/lib/actions/availability";
import { Button } from "@/components/ui/Button";
import { BookingRequestModal } from "./BookingRequestModal";

// ─── Qatar timezone helpers (UTC+3, no DST) ────────────────────────────────

const QT_MS = 3 * 60 * 60 * 1000;

function toQT(utcStr: string): Date {
  return new Date(new Date(utcStr).getTime() + QT_MS);
}

function qtNow(): Date {
  return new Date(Date.now() + QT_MS);
}

function getWeekSunday(ref: Date = qtNow()): Date {
  const d = new Date(ref);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  const DAY_NAMES = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const MON_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return `${DAY_NAMES[qd.getUTCDay()]}، ${qd.getUTCDate()} ${MON_NAMES[qd.getUTCMonth()]}`;
}

// ─── Grid constants ────────────────────────────────────────────────────────

const DAY_SHORT = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const MON_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// 07:00 – 22:30 Qatar at 30-min intervals
const ROWS: { hour: number; minute: number; label: string }[] = [];
for (let h = 7; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) break;
    const suffix = h >= 12 ? "م" : "ص";
    ROWS.push({ hour: h, minute: m, label: m === 0 ? `${h % 12 || 12} ${suffix}` : "" });
  }
}

const MODE_LABEL: Record<string, string> = {
  online: "أونلاين",
  in_person: "حضوري",
  both: "أونلاين وحضوري",
};
const MODE_STYLE: Record<string, string> = {
  online:    "bg-[var(--color-info-container)] text-[var(--color-info)]",
  in_person: "bg-[var(--color-success-container)] text-[var(--color-success)]",
  both:      "bg-[var(--color-brand-gold-container)] text-[var(--color-brand-gold)]",
};
const MODE_SELECTED = "bg-[var(--color-brand-primary)] text-white";

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  tutorId: string;
  tutorName: string;
  tutorRate: number;
}

export function WeeklyCalendar({ tutorId, tutorName, tutorRate }: Props) {
  const [weekSunday, setWeekSunday] = useState<Date>(() => getWeekSunday());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AvailableSlot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const weekStr = toDateStr(weekSunday);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    const res = await getTutorAvailableSlotsAction(tutorId, weekStr);
    setSlots(res.data ?? []);
    setLoading(false);
  }, [tutorId, weekStr]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Scroll to 9am on first load
  useEffect(() => {
    if (!loading && bodyRef.current) {
      const rowH = 36;
      bodyRef.current.scrollTop = (9 - 7) * 2 * rowH - 16;
    }
  }, [loading]);

  // Build slot lookup: "dayOfWeek-hour-minute" → slot
  const slotMap = new Map<string, AvailableSlot>();
  for (const s of slots) {
    const qd = toQT(s.slotStart);
    slotMap.set(`${qd.getUTCDay()}-${qd.getUTCHours()}-${qd.getUTCMinutes()}`, s);
  }

  const now = qtNow();
  const currentSunday = getWeekSunday();
  const isPrevDisabled = weekSunday <= currentSunday;

  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekSunday);
    d.setUTCDate(weekSunday.getUTCDate() + i);
    return d;
  });

  const weekLabel = (() => {
    const s = weekSunday;
    const e = dayDates[6];
    if (s.getUTCMonth() === e.getUTCMonth()) {
      return `${s.getUTCDate()} – ${e.getUTCDate()} ${MON_NAMES[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
    }
    return `${s.getUTCDate()} ${MON_NAMES[s.getUTCMonth()]} – ${e.getUTCDate()} ${MON_NAMES[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
  })();

  function goPrev() {
    if (!isPrevDisabled) {
      setWeekSunday(d => { const n = new Date(d); n.setUTCDate(d.getUTCDate() - 7); return n; });
    }
  }
  function goNext() {
    setWeekSunday(d => { const n = new Date(d); n.setUTCDate(d.getUTCDate() + 7); return n; });
  }

  const GRID_COLS = "44px repeat(7, 1fr)";

  return (
    <>
      {/* Navigation — dir="ltr" keeps chevrons LTR while label is Arabic */}
      <div className="flex items-center justify-between mb-3" dir="ltr">
        <button
          onClick={goPrev}
          disabled={isPrevDisabled}
          className={cn(
            "p-1.5 rounded-[var(--radius-sm)] transition-colors",
            isPrevDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-[var(--color-surface-low)]"
          )}
          aria-label="الأسبوع السابق"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-label-md font-semibold text-[var(--color-text-main)]" dir="rtl">
          {weekLabel}
        </span>

        <button
          onClick={goNext}
          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-low)] transition-colors"
          aria-label="الأسبوع التالي"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid — dir="ltr": time col left, days Sun→Sat left→right */}
      <div
        className="rounded-[var(--radius-md)] border border-[var(--color-outline-soft)] overflow-hidden"
        dir="ltr"
      >
        {/* Sticky day-headers */}
        <div
          className="grid bg-[var(--color-surface-low)] border-b border-[var(--color-outline-soft)]"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <div className="border-r border-[var(--color-outline-soft)]" />
          {dayDates.map((d, i) => {
            const isToday =
              d.getUTCDate() === now.getUTCDate() &&
              d.getUTCMonth() === now.getUTCMonth() &&
              d.getUTCFullYear() === now.getUTCFullYear();
            return (
              <div
                key={i}
                className={cn(
                  "py-2 text-center border-r border-[var(--color-outline-soft)] last:border-r-0",
                  isToday && "bg-[var(--color-brand-primary)]/5"
                )}
              >
                <p
                  className={cn(
                    "text-[10px] font-medium",
                    isToday ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"
                  )}
                >
                  {DAY_SHORT[i]}
                </p>
                <p
                  className={cn(
                    "text-sm font-bold leading-tight",
                    isToday ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-main)]"
                  )}
                >
                  {d.getUTCDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} className="overflow-y-auto" style={{ maxHeight: 432 }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--color-text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-body-sm" dir="rtl">جاري تحميل المواعيد...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-1 text-[var(--color-text-muted)]" dir="rtl">
              <p className="text-body-md">لا توجد مواعيد متاحة هذا الأسبوع</p>
              <p className="text-body-sm">جرّب الأسبوع التالي</p>
            </div>
          ) : (
            ROWS.map(({ hour, minute, label }) => (
              <div
                key={`${hour}-${minute}`}
                className="grid border-b border-[var(--color-outline-soft)] last:border-0"
                style={{ gridTemplateColumns: GRID_COLS, minHeight: 36 }}
              >
                {/* Time label */}
                <div className="flex items-start justify-end pr-1.5 pt-0.5 border-r border-[var(--color-outline-soft)]">
                  {label && (
                    <span className="text-[9px] text-[var(--color-text-muted)] leading-none whitespace-nowrap" dir="rtl">
                      {label}
                    </span>
                  )}
                </div>

                {/* Day cells */}
                {dayDates.map((_, dayIdx) => {
                  const slot = slotMap.get(`${dayIdx}-${hour}-${minute}`);
                  const isSelected = selected?.slotStart === slot?.slotStart;
                  return (
                    <div
                      key={dayIdx}
                      className="border-r border-[var(--color-outline-soft)] last:border-r-0 p-0.5"
                    >
                      {slot && (
                        <button
                          className={cn(
                            "w-full h-full min-h-[28px] rounded-[var(--radius-xs)] flex items-center justify-center",
                            "transition-all text-[8px] font-semibold leading-none px-0.5 text-center",
                            isSelected ? MODE_SELECTED : cn("hover:opacity-75", MODE_STYLE[slot.teachingMode])
                          )}
                          onClick={() => setSelected(isSelected ? null : slot)}
                          dir="rtl"
                        >
                          {MODE_LABEL[slot.teachingMode]}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[var(--color-text-muted)]" dir="rtl">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[var(--color-info-container)]" />
          أونلاين
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[var(--color-success-container)]" />
          حضوري
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[var(--color-brand-gold-container)]" />
          أونلاين وحضوري
        </span>
      </div>

      {/* Selected slot panel */}
      {selected && (
        <div
          className="mt-3 p-3 bg-[var(--color-surface-low)] rounded-[var(--radius-md)] border border-[var(--color-outline-soft)] flex items-center justify-between gap-3"
          dir="rtl"
        >
          <div>
            <p className="text-label-sm font-semibold text-[var(--color-text-main)]">
              {fmtDateFull(selected.slotStart)}
            </p>
            <p className="text-label-xs text-[var(--color-text-muted)]">
              {fmtTime(selected.slotStart)} — {fmtTime(selected.slotEnd)} · ٥٠ دقيقة
            </p>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            احجز هذا الموعد
          </Button>
        </div>
      )}

      {selected && (
        <BookingRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          slot={selected}
          tutorId={tutorId}
          tutorName={tutorName}
          tutorRate={tutorRate}
          onSuccess={() => {
            setModalOpen(false);
            setSelected(null);
            fetchSlots();
          }}
        />
      )}
    </>
  );
}
