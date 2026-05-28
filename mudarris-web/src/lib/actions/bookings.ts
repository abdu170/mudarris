"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import type { BookingRow, BookingStatus, TeachingMode } from "@/lib/supabase/types";

const LESSON_DURATION_SECONDS = 3000; // 50 minutes

async function getCommissionPct(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data } = await admin.rpc("get_commission_pct");
  return typeof data === "number" ? data : 0.15;
}

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

// ─── Booking summary type returned to the frontend ────────────────────────────

export type BookingSummary = {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string | null;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  scheduledAt: string;
  endsAt: string;
  teachingMode: TeachingMode;
  status: BookingStatus;
  tutorRate: number;
  inPersonArea: string | null;
  notes: string | null;
  merithubJoinUrl: string | null;
  aiReportStatus: string | null;
};

// ─── Request booking (student) ────────────────────────────────────────────────

const requestSchema = z.object({
  tutorId: z.string().uuid("معرّف المدرس غير صحيح"),
  scheduledAt: z.string().datetime({ message: "التاريخ غير صحيح" }),
  teachingMode: z.enum(["online", "in_person", "both"]),
  notes: z.string().max(500).optional(),
  inPersonArea: z.string().max(100).optional(),
});

export async function requestBookingAction(
  formData: FormData,
): Promise<ActionResult<{ bookingId: string }>> {
  const user = await requireAuth();

  const parsed = requestSchema.safeParse({
    tutorId: formData.get("tutorId"),
    scheduledAt: formData.get("scheduledAt"),
    teachingMode: formData.get("teachingMode"),
    notes: formData.get("notes") || undefined,
    inPersonArea: formData.get("inPersonArea") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { tutorId, scheduledAt, teachingMode, notes, inPersonArea } = parsed.data;

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) return { error: "لا يمكن حجز موعد في الماضي" };

  const endsAt = new Date(scheduledDate.getTime() + LESSON_DURATION_SECONDS * 1000).toISOString();

  const admin = createAdminClient();

  // Check caller is not suspended
  const { data: callerProfile } = await admin
    .from("users")
    .select("is_active")
    .eq("id", user.id)
    .single();
  if (callerProfile && !callerProfile.is_active) {
    return { error: "حسابك موقوف. لا يمكنك إنشاء حجوزات." };
  }

  // Fetch tutor's hourly rate and validate they're approved + visible
  const { data: tutorData, error: tutorErr } = await admin
    .from("tutors")
    .select("hourly_rate, status, is_visible")
    .eq("id", tutorId)
    .single();

  if (tutorErr || !tutorData) return { error: "المدرس غير موجود" };
  if (tutorData.status !== "approved" || !tutorData.is_visible) {
    return { error: "هذا المدرس غير متاح للحجز حالياً" };
  }

  // Verify user is a student
  const { data: studentData } = await admin
    .from("students")
    .select("id")
    .eq("id", user.id)
    .single();
  if (!studentData) return { error: "يجب أن تكون طالباً لإنشاء حجز" };

  // Check for time-range conflict (SELECT FOR UPDATE via RPC)
  const { data: hasConflict, error: conflictErr } = await admin.rpc(
    "check_booking_conflict",
    {
      p_tutor_id: tutorId,
      p_scheduled_at: scheduledAt,
      p_ends_at: endsAt,
    },
  );

  if (conflictErr) {
    console.error("[requestBooking] conflict check:", conflictErr.message);
    return { error: "تعذّر التحقق من توفر الموعد. يرجى المحاولة مجدداً" };
  }
  if (hasConflict) return { error: "هذا الموعد محجوز بالفعل. يرجى اختيار وقت آخر" };

  // Calculate financial snapshot (commission read from DB, not hardcoded)
  const commissionPct = await getCommissionPct(admin);
  const tutorRate = Number(tutorData.hourly_rate);
  const platformFee = Math.round(tutorRate * commissionPct * 100) / 100;
  const tutorEarning = Math.round((tutorRate - platformFee) * 100) / 100;

  // Insert booking
  const { data: booking, error: insertErr } = await admin
    .from("bookings")
    .insert({
      student_id: user.id,
      tutor_id: tutorId,
      status: "requested",
      teaching_mode: teachingMode,
      scheduled_at: scheduledAt,
      ends_at: endsAt,
      notes: notes ?? null,
      tutor_rate: tutorRate,
      platform_fee: platformFee,
      tutor_earning: tutorEarning,
      in_person_area: inPersonArea ?? null,
    })
    .select("id")
    .single();

  if (insertErr) {
    // 23P01 = exclusion constraint violation (double-booking race)
    if (insertErr.code === "23P01") {
      return { error: "هذا الموعد محجوز بالفعل. يرجى اختيار وقت آخر" };
    }
    // 23505 = unique constraint violation (duplicate student request)
    if (insertErr.code === "23505") {
      return { error: "لديك طلب حجز معلق لهذا الموعد بالفعل" };
    }
    console.error("[requestBooking] insert:", insertErr.message);
    return { error: "تعذّر إنشاء الحجز. يرجى المحاولة مجدداً" };
  }

  return { data: { bookingId: booking!.id } };
}

// ─── Respond to booking (tutor: accept or reject) ────────────────────────────

export async function respondToBookingAction(
  bookingId: string,
  action: "accept" | "reject",
  rejectionReason?: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const admin = createAdminClient();

  // Verify booking belongs to this tutor and is in 'requested' state
  const { data: booking, error: fetchErr } = await admin
    .from("bookings")
    .select("id, tutor_id, status, student_id, scheduled_at, ends_at")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { error: "الحجز غير موجود" };
  if (booking.tutor_id !== user.id) return { error: "غير مصرح" };
  if (booking.status !== "requested") {
    return { error: "لا يمكن تعديل حجز بهذه الحالة" };
  }

  if (action === "accept") {
    // Run conflict check before accepting (protects against concurrent accepts)
    const { data: hasConflict } = await admin.rpc("check_booking_conflict", {
      p_tutor_id: user.id,
      p_scheduled_at: booking.scheduled_at,
      p_ends_at: booking.ends_at,
    });
    if (hasConflict) {
      return { error: "لديك حجز مقبول في نفس الوقت. تعذّر قبول هذا الطلب" };
    }

    const { error } = await admin
      .from("bookings")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (error) {
      if (error.code === "23P01") {
        return { error: "لديك حجز مقبول في نفس الوقت" };
      }
      console.error("[respondToBooking accept]", error.message);
      return { error: "تعذّر قبول الحجز" };
    }
  } else {
    const { error } = await admin
      .from("bookings")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejected_reason: rejectionReason ?? null,
      })
      .eq("id", bookingId);

    if (error) {
      console.error("[respondToBooking reject]", error.message);
      return { error: "تعذّر رفض الحجز" };
    }
  }

  return { data: undefined };
}

// ─── Cancel booking (student or tutor) ───────────────────────────────────────

export async function cancelBookingAction(
  bookingId: string,
  reason?: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data: booking, error: fetchErr } = await admin
    .from("bookings")
    .select("id, student_id, tutor_id, status")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { error: "الحجز غير موجود" };

  const isParticipant = booking.student_id === user.id || booking.tutor_id === user.id;
  if (!isParticipant) return { error: "غير مصرح" };

  const cancellableStatuses: BookingStatus[] = ["requested", "accepted"];
  if (!cancellableStatuses.includes(booking.status)) {
    return { error: "لا يمكن إلغاء حجز بهذه الحالة" };
  }

  const { error } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? null,
    })
    .eq("id", bookingId);

  if (error) {
    console.error("[cancelBooking]", error.message);
    return { error: "تعذّر إلغاء الحجز" };
  }

  // Best-effort: mark any linked Merithub session as locally cancelled
  // Failure here does NOT un-cancel the booking — the cancellation already succeeded.
  admin
    .from("merithub_sessions")
    .update({
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason ?? "booking_cancelled",
    })
    .eq("booking_id", bookingId)
    .then(({ error: mErr }) => {
      if (mErr) console.warn("[cancelBooking] Merithub session cancel:", mErr.message);
    });

  return { data: undefined };
}

// ─── Get student bookings ─────────────────────────────────────────────────────

export async function getStudentBookingsAction(): Promise<ActionResult<BookingSummary[]>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("bookings")
    .select(`
      id, tutor_id, student_id, scheduled_at, ends_at,
      teaching_mode, status, tutor_rate, in_person_area, notes,
      users!bookings_tutor_id_fkey ( full_name_ar, avatar_url )
    `)
    .eq("student_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) {
    console.error("[getStudentBookings]", error.message);
    return { error: "تعذّر تحميل الحجوزات" };
  }

  const bookings: BookingSummary[] = (data ?? []).map((b: any) => ({
    id: b.id,
    tutorId: b.tutor_id,
    tutorName: b.users?.full_name_ar ?? "—",
    tutorAvatar: b.users?.avatar_url ?? null,
    studentId: b.student_id,
    studentName: "",
    studentAvatar: null,
    scheduledAt: b.scheduled_at,
    endsAt: b.ends_at,
    teachingMode: b.teaching_mode,
    status: b.status,
    tutorRate: b.tutor_rate,
    inPersonArea: b.in_person_area,
    notes: b.notes,
    merithubJoinUrl: null,
    aiReportStatus: null,
  }));

  return { data: bookings };
}

// ─── Get tutor bookings ───────────────────────────────────────────────────────

export async function getTutorBookingsAction(): Promise<ActionResult<BookingSummary[]>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("bookings")
    .select(`
      id, tutor_id, student_id, scheduled_at, ends_at,
      teaching_mode, status, tutor_rate, in_person_area, notes,
      users!bookings_student_id_fkey ( full_name_ar, avatar_url )
    `)
    .eq("tutor_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) {
    console.error("[getTutorBookings]", error.message);
    return { error: "تعذّر تحميل الحجوزات" };
  }

  const bookings: BookingSummary[] = (data ?? []).map((b: any) => ({
    id: b.id,
    tutorId: b.tutor_id,
    tutorName: "",
    tutorAvatar: null,
    studentId: b.student_id,
    studentName: b.users?.full_name_ar ?? "—",
    studentAvatar: b.users?.avatar_url ?? null,
    scheduledAt: b.scheduled_at,
    endsAt: b.ends_at,
    teachingMode: b.teaching_mode,
    status: b.status,
    tutorRate: b.tutor_rate,
    inPersonArea: b.in_person_area,
    notes: b.notes,
    merithubJoinUrl: null,
    aiReportStatus: null,
  }));

  return { data: bookings };
}

// ─── Complete booking (admin) ─────────────────────────────────────────────────
// Marks booking completed and releases tutor earnings from pending → available.
// Uses complete_booking_release_earnings RPC for atomic execution.

export async function completeBookingAction(bookingId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const userRole = user.app_metadata?.role as string | undefined;
  if (userRole !== "admin") return { error: "غير مصرح" };

  const admin = createAdminClient();
  const { error } = await admin.rpc("complete_booking_release_earnings", {
    p_booking_id: bookingId,
    p_admin_id: user.id,
  });

  if (error) {
    console.error("[completeBooking]", error.message);
    if (error.message.includes("must be confirmed")) {
      return { error: "يجب أن يكون الحجز مؤكداً لإكماله" };
    }
    return { error: "تعذّر إكمال الحجز" };
  }

  return { data: undefined };
}
