"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import type { TeachingMode, TutorWeeklyScheduleRow, TutorUnavailableBlockRow } from "@/lib/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvailableSlot = {
  slotStart: string; // ISO UTC
  slotEnd: string;   // ISO UTC
  teachingMode: TeachingMode;
};

export type TutorWeekData = {
  schedule: TutorWeeklyScheduleRow[];
  unavailableBlocks: TutorUnavailableBlockRow[];
  bookedRanges: { scheduledAt: string; endsAt: string; status: string }[];
};

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

export type ScheduleManagementData = {
  schedule: TutorWeeklyScheduleRow[];
  upcomingBlocks: TutorUnavailableBlockRow[];
};

// ─── Get tutor schedule management data (tutor dashboard) ─────────────────────

export async function getTutorScheduleManagementAction(): Promise<ActionResult<ScheduleManagementData>> {
  const user = await requireAuth();
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const [schedRes, blocksRes] = await Promise.all([
    admin
      .from("tutor_weekly_schedules")
      .select("*")
      .eq("tutor_id", user.id)
      .eq("is_active", true)
      .order("day_of_week")
      .order("start_time"),
    admin
      .from("tutor_unavailable_blocks")
      .select("*")
      .eq("tutor_id", user.id)
      .gte("ends_at", nowIso)
      .order("starts_at"),
  ]);

  if (schedRes.error || blocksRes.error) {
    console.error("[getScheduleManagement]", schedRes.error ?? blocksRes.error);
    return { error: "تعذّر تحميل بيانات الجدول" };
  }

  return {
    data: {
      schedule: schedRes.data ?? [],
      upcomingBlocks: blocksRes.data ?? [],
    },
  };
}

// ─── Get available slots (student-facing) ─────────────────────────────────────
// Returns computed available 50-min slots. Does NOT expose raw schedule data.

export async function getTutorAvailableSlotsAction(
  tutorId: string,
  weekStart: string, // "YYYY-MM-DD" in Asia/Qatar local date
): Promise<ActionResult<AvailableSlot[]>> {
  if (!tutorId || !weekStart) return { error: "معرّف المدرس والأسبوع مطلوبان" };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_tutor_available_slots", {
    p_tutor_id: tutorId,
    p_week_start: weekStart,
  });

  if (error) {
    console.error("[getTutorAvailableSlots]", error.message);
    return { error: "تعذّر تحميل المواعيد المتاحة" };
  }

  const slots: AvailableSlot[] = (data ?? []).map((row) => ({
    slotStart: row.slot_start,
    slotEnd: row.slot_end,
    teachingMode: row.teaching_mode,
  }));

  return { data: slots };
}

// ─── Get tutor's own week data (tutor dashboard / schedule page) ───────────────

export async function getTutorWeekDataAction(
  weekStart: string,
): Promise<ActionResult<TutorWeekData>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString();

  const [schedRes, blocksRes, bookingsRes] = await Promise.all([
    admin
      .from("tutor_weekly_schedules")
      .select("*")
      .eq("tutor_id", user.id)
      .eq("is_active", true)
      .order("day_of_week")
      .order("start_time"),
    admin
      .from("tutor_unavailable_blocks")
      .select("*")
      .eq("tutor_id", user.id)
      .gte("ends_at", weekStart)
      .lt("starts_at", weekEndStr),
    admin
      .from("bookings")
      .select("scheduled_at, ends_at, status")
      .eq("tutor_id", user.id)
      .in("status", ["requested", "accepted", "payment_pending", "paid", "confirmed"])
      .gte("ends_at", weekStart)
      .lt("scheduled_at", weekEndStr),
  ]);

  if (schedRes.error || blocksRes.error || bookingsRes.error) {
    console.error("[getTutorWeekData]", schedRes.error ?? blocksRes.error ?? bookingsRes.error);
    return { error: "تعذّر تحميل بيانات الجدول" };
  }

  return {
    data: {
      schedule: schedRes.data ?? [],
      unavailableBlocks: blocksRes.data ?? [],
      bookedRanges: (bookingsRes.data ?? []).map((b) => ({
        scheduledAt: b.scheduled_at,
        endsAt: b.ends_at,
        status: b.status,
      })),
    },
  };
}

// ─── Add schedule window ──────────────────────────────────────────────────────

const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "صيغة الوقت غير صحيحة (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "صيغة الوقت غير صحيحة (HH:MM)"),
  teachingMode: z.enum(["online", "in_person", "both"]),
});

export async function addScheduleWindowAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = scheduleSchema.safeParse({
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    teachingMode: formData.get("teachingMode"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { dayOfWeek, startTime, endTime, teachingMode } = parsed.data;
  if (startTime >= endTime) return { error: "وقت البداية يجب أن يكون قبل وقت النهاية" };

  const minDuration = 50;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const durationMin = (eh * 60 + em) - (sh * 60 + sm);
  if (durationMin < minDuration) return { error: "يجب أن تكون مدة النافذة 50 دقيقة على الأقل" };

  const admin = createAdminClient();
  const { error } = await admin.from("tutor_weekly_schedules").insert({
    tutor_id: user.id,
    day_of_week: dayOfWeek,
    start_time: startTime + ":00",
    end_time: endTime + ":00",
    teaching_mode: teachingMode,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") return { error: "هذه النافذة الزمنية موجودة بالفعل" };
    console.error("[addScheduleWindow]", error.message);
    return { error: "تعذّر إضافة النافذة الزمنية" };
  }

  return { data: undefined };
}

// ─── Delete schedule window ───────────────────────────────────────────────────

export async function deleteScheduleWindowAction(
  scheduleId: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { error } = await admin
    .from("tutor_weekly_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[deleteScheduleWindow]", error.message);
    return { error: "تعذّر حذف النافذة الزمنية" };
  }
  return { data: undefined };
}

// ─── Add unavailable block ────────────────────────────────────────────────────

const blockSchema = z.object({
  startsAt: z.string().datetime({ message: "تاريخ البداية غير صحيح" }),
  endsAt: z.string().datetime({ message: "تاريخ النهاية غير صحيح" }),
  reason: z.string().optional(),
});

export async function addUnavailableBlockAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = blockSchema.safeParse({
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { startsAt, endsAt, reason } = parsed.data;
  if (startsAt >= endsAt) return { error: "وقت البداية يجب أن يكون قبل وقت النهاية" };

  const admin = createAdminClient();
  const { error } = await admin.from("tutor_unavailable_blocks").insert({
    tutor_id: user.id,
    starts_at: startsAt,
    ends_at: endsAt,
    reason: reason ?? null,
  });

  if (error) {
    console.error("[addUnavailableBlock]", error.message);
    return { error: "تعذّر إضافة فترة الغياب" };
  }
  return { data: undefined };
}

// ─── Delete unavailable block ─────────────────────────────────────────────────

export async function deleteUnavailableBlockAction(
  blockId: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { error } = await admin
    .from("tutor_unavailable_blocks")
    .delete()
    .eq("id", blockId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[deleteUnavailableBlock]", error.message);
    return { error: "تعذّر حذف فترة الغياب" };
  }
  return { data: undefined };
}
