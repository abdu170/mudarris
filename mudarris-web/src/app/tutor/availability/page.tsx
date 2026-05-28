"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  getTutorScheduleManagementAction,
  addScheduleWindowAction,
  deleteScheduleWindowAction,
  addUnavailableBlockAction,
  deleteUnavailableBlockAction,
  type ScheduleManagementData,
} from "@/lib/actions/availability";
import type { TutorWeeklyScheduleRow, TutorUnavailableBlockRow } from "@/lib/supabase/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const DAY_NAMES = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const hour = 6 + Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const label = `${String(hour).padStart(2, "0")}:${minute}`;
  return { value: label, label };
});

const MODE_OPTIONS = [
  { value: "online", label: "أونلاين" },
  { value: "in_person", label: "حضوري" },
  { value: "both", label: "أونلاين وحضوري" },
];

const MODE_STYLE: Record<string, string> = {
  online:    "bg-[var(--color-info-container)] text-[var(--color-info)]",
  in_person: "bg-[var(--color-success-container)] text-[var(--color-success)]",
  both:      "bg-[var(--color-brand-gold-container)] text-[var(--color-brand-gold)]",
};
const MODE_LABEL: Record<string, string> = {
  online: "أونلاين",
  in_person: "حضوري",
  both: "أونلاين وحضوري",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const QT_MS = 3 * 60 * 60 * 1000;

function toQT(utcStr: string): Date {
  return new Date(new Date(utcStr).getTime() + QT_MS);
}

function fmtQTDatetime(utcStr: string): string {
  const qd = toQT(utcStr);
  const MON = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const DAY = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const h = qd.getUTCHours();
  const m = qd.getUTCMinutes();
  const suffix = h >= 12 ? "م" : "ص";
  const time = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
  return `${DAY[qd.getUTCDay()]}، ${qd.getUTCDate()} ${MON[qd.getUTCMonth()]} ${qd.getUTCFullYear()} — ${time}`;
}

// Convert HH:MM:SS stored time to display label
function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "م" : "ص";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// For datetime-local input: get Qatar "now" in YYYY-MM-DDTHH:MM format
function qtNowInputValue(): string {
  const qd = new Date(Date.now() + QT_MS);
  return qd.toISOString().slice(0, 16);
}

// Convert datetime-local (local Qatar) to UTC ISO string for DB storage
// Since the input is in Qatar timezone (UTC+3), subtract 3 hours to get UTC
function localToUtc(localStr: string): string {
  return new Date(new Date(localStr).getTime() - QT_MS).toISOString();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TutorAvailabilityPage() {
  const [data, setData] = useState<ScheduleManagementData | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Schedule window modal state
  const [schedModal, setSchedModal] = useState(false);
  const [schedDay, setSchedDay] = useState("0");
  const [schedStart, setSchedStart] = useState("09:00");
  const [schedEnd, setSchedEnd] = useState("11:00");
  const [schedMode, setSchedMode] = useState("online");
  const [schedErr, setSchedErr] = useState<string | null>(null);

  // Block modal state
  const [blockModal, setBlockModal] = useState(false);
  const [blockStart, setBlockStart] = useState(qtNowInputValue);
  const [blockEnd, setBlockEnd] = useState(qtNowInputValue);
  const [blockReason, setBlockReason] = useState("");
  const [blockErr, setBlockErr] = useState<string | null>(null);

  // Delete confirm
  const [deletingSchedId, setDeletingSchedId] = useState<string | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  async function loadData() {
    const res = await getTutorScheduleManagementAction();
    if (res.error) { setLoadErr(res.error); return; }
    setData(res.data ?? null);
  }

  useEffect(() => { loadData(); }, []);

  // Group schedule by day of week
  const schedByDay = Array.from({ length: 7 }, (_, i) =>
    (data?.schedule ?? []).filter((s) => s.day_of_week === i)
  );

  async function handleAddSchedule() {
    setSchedErr(null);
    const fd = new FormData();
    fd.set("dayOfWeek", schedDay);
    fd.set("startTime", schedStart);
    fd.set("endTime", schedEnd);
    fd.set("teachingMode", schedMode);

    startTransition(async () => {
      const res = await addScheduleWindowAction(fd);
      if (res.error) { setSchedErr(res.error); return; }
      setSchedModal(false);
      await loadData();
    });
  }

  async function handleDeleteSchedule(id: string) {
    setDeletingSchedId(id);
    const res = await deleteScheduleWindowAction(id);
    setDeletingSchedId(null);
    if (!res.error) await loadData();
  }

  async function handleAddBlock() {
    setBlockErr(null);
    const fd = new FormData();
    fd.set("startsAt", localToUtc(blockStart));
    fd.set("endsAt", localToUtc(blockEnd));
    if (blockReason.trim()) fd.set("reason", blockReason.trim());

    startTransition(async () => {
      const res = await addUnavailableBlockAction(fd);
      if (res.error) { setBlockErr(res.error); return; }
      setBlockModal(false);
      setBlockReason("");
      await loadData();
    });
  }

  async function handleDeleteBlock(id: string) {
    setDeletingBlockId(id);
    const res = await deleteUnavailableBlockAction(id);
    setDeletingBlockId(null);
    if (!res.error) await loadData();
  }

  if (loadErr) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-text-muted)]">
        <p className="text-body-md">{loadErr}</p>
        <Button variant="secondary" size="sm" onClick={loadData}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg">إدارة الجدول</h1>
        <p className="text-body-md text-[var(--color-text-muted)] mt-1">
          حدد أوقات إتاحتك الأسبوعية المتكررة، وأضف أيام الغياب الاستثنائية
        </p>
      </div>

      {/* ── Weekly Schedule ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-brand-primary)]" />
            <h2 className="text-headline-sm">الجدول الأسبوعي المتكرر</h2>
          </div>
          <Button
            size="sm"
            onClick={() => { setSchedErr(null); setSchedModal(true); }}
            disabled={!data}
          >
            <Plus className="w-4 h-4" />
            إضافة نافذة زمنية
          </Button>
        </div>

        <div className="card divide-y divide-[var(--color-outline-soft)]">
          {!data ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="w-20 h-4 bg-[var(--color-surface-high)] rounded" />
                <div className="flex-1 h-4 bg-[var(--color-surface-high)] rounded" />
              </div>
            ))
          ) : (
            DAY_NAMES.map((dayName, dayIdx) => {
              const windows = schedByDay[dayIdx];
              return (
                <div key={dayIdx} className="flex items-start gap-4 p-4">
                  <p className="text-label-md font-semibold text-[var(--color-text-muted)] w-20 shrink-0 pt-0.5">
                    {dayName}
                  </p>

                  <div className="flex-1 flex flex-wrap gap-2 min-h-[28px]">
                    {windows.length === 0 ? (
                      <span className="text-label-sm text-[var(--color-text-muted)] pt-0.5">—</span>
                    ) : (
                      windows.map((w) => (
                        <div
                          key={w.id}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-medium",
                            MODE_STYLE[w.teaching_mode]
                          )}
                        >
                          <span>{fmtTime(w.start_time)} – {fmtTime(w.end_time)}</span>
                          <span className="opacity-60 text-[10px]">·</span>
                          <span className="text-[10px]">{MODE_LABEL[w.teaching_mode]}</span>
                          <button
                            onClick={() => handleDeleteSchedule(w.id)}
                            disabled={deletingSchedId === w.id}
                            className="mr-1 opacity-60 hover:opacity-100 transition-opacity"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-label-sm text-[var(--color-text-muted)] mt-2">
          يُولّد النظام مواعيد متاحة مدتها ٥٠ دقيقة بشكل تلقائي خلال هذه النوافذ
        </p>
      </section>

      {/* ── Unavailable Blocks ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--color-brand-primary)]" />
            <h2 className="text-headline-sm">أيام وأوقات الغياب</h2>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setBlockErr(null); setBlockStart(qtNowInputValue()); setBlockEnd(qtNowInputValue()); setBlockModal(true); }}
            disabled={!data}
          >
            <Plus className="w-4 h-4" />
            إضافة فترة غياب
          </Button>
        </div>

        <div className="card p-0">
          {!data ? (
            <div className="p-4 animate-pulse">
              <div className="h-4 bg-[var(--color-surface-high)] rounded w-1/2" />
            </div>
          ) : data.upcomingBlocks.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-[var(--color-text-muted)]">
              <p className="text-body-md">لا توجد أوقات غياب مضافة</p>
              <p className="text-body-sm">يمكنك إضافة إجازة أو موعد طارئ لتعطيل الحجوزات مؤقتاً</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-outline-soft)]">
              {data.upcomingBlocks.map((block) => (
                <li key={block.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-label-md font-medium text-[var(--color-text-main)]">
                      {fmtQTDatetime(block.starts_at)}
                    </p>
                    <p className="text-label-sm text-[var(--color-text-muted)]">
                      حتى {fmtQTDatetime(block.ends_at)}
                    </p>
                    {block.reason && (
                      <p className="text-label-xs text-[var(--color-text-muted)] mt-0.5">{block.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    disabled={deletingBlockId === block.id}
                    className="p-2 rounded-full hover:bg-[var(--color-error-container)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors disabled:opacity-40"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Add Schedule Window Modal ── */}
      <Modal
        open={schedModal}
        onClose={() => setSchedModal(false)}
        title="إضافة نافذة زمنية متكررة"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Select
            label="اليوم"
            options={DAY_NAMES.map((name, i) => ({ value: String(i), label: name }))}
            value={schedDay}
            onChange={(e) => setSchedDay(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="وقت البداية"
              options={TIME_OPTIONS}
              value={schedStart}
              onChange={(e) => setSchedStart(e.target.value)}
            />
            <Select
              label="وقت النهاية"
              options={TIME_OPTIONS.filter((t) => t.value > schedStart)}
              value={schedEnd}
              onChange={(e) => setSchedEnd(e.target.value)}
            />
          </div>

          <Select
            label="طريقة التدريس"
            options={MODE_OPTIONS}
            value={schedMode}
            onChange={(e) => setSchedMode(e.target.value)}
          />

          {schedErr && (
            <p className="text-label-sm text-[var(--color-error)] text-center">{schedErr}</p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSchedModal(false)} disabled={isPending}>
              إلغاء
            </Button>
            <Button className="flex-1" onClick={handleAddSchedule} loading={isPending}>
              إضافة
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Unavailable Block Modal ── */}
      <Modal
        open={blockModal}
        onClose={() => setBlockModal(false)}
        title="إضافة فترة غياب"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-label-md font-medium text-[var(--color-text-main)] block mb-1.5">
              من (بتوقيت قطر)
            </label>
            <input
              type="datetime-local"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="w-full h-11 px-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-body-md text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]"
            />
          </div>

          <div>
            <label className="text-label-md font-medium text-[var(--color-text-main)] block mb-1.5">
              حتى (بتوقيت قطر)
            </label>
            <input
              type="datetime-local"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="w-full h-11 px-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-body-md text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]"
            />
          </div>

          <Input
            label="السبب (اختياري)"
            placeholder="مثال: إجازة، موعد طبي..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />

          {blockErr && (
            <p className="text-label-sm text-[var(--color-error)] text-center">{blockErr}</p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setBlockModal(false)} disabled={isPending}>
              إلغاء
            </Button>
            <Button className="flex-1" onClick={handleAddBlock} loading={isPending}>
              إضافة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
