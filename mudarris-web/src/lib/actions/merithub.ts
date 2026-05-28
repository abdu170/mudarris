"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

export type MerithubSessionInfo = {
  sessionId: string;
  studentJoinUrl: string;
  tutorJoinUrl: string;
  recordingUrl: string | null;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  createdAt: string;
};

// ─── Merithub API helpers ──────────────────────────────────────────────────────

interface MerithubCreateSessionResponse {
  id: string;
  student_url?: string;
  tutor_url?: string;
  student_join_url?: string;
  tutor_join_url?: string;
  error?: string;
}

async function callMerithubCreateSession(params: {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  studentName: string;
  tutorName: string;
  bookingId: string;
}): Promise<{ sessionId: string; studentJoinUrl: string; tutorJoinUrl: string }> {
  const env = getServerEnv();

  const res = await fetch(`${env.MERITHUB_BASE_URL}/v1/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MERITHUB_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: params.title,
      scheduled_at: params.scheduledAt,
      duration_minutes: params.durationMinutes,
      student_name: params.studentName,
      tutor_name: params.tutorName,
      reference_id: params.bookingId,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Merithub API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as MerithubCreateSessionResponse;

  if (!data.id) {
    throw new Error("Merithub did not return a session ID");
  }

  const studentJoinUrl = data.student_join_url ?? data.student_url;
  const tutorJoinUrl = data.tutor_join_url ?? data.tutor_url;

  if (!studentJoinUrl || !tutorJoinUrl) {
    throw new Error("Merithub did not return join URLs");
  }

  return {
    sessionId: data.id,
    studentJoinUrl,
    tutorJoinUrl,
  };
}

// ─── Create Merithub session (triggered after payment confirmed) ───────────────
// Called by the Tap webhook after CAPTURED status for online bookings.
// Returns gracefully if session already exists (idempotent).

export async function createMerithubSessionAction(
  bookingId: string,
): Promise<ActionResult<MerithubSessionInfo>> {
  const admin = createAdminClient();

  // Fetch booking + participants — no auth required, called from webhook
  const { data: booking } = await admin
    .from("bookings")
    .select(`
      id, status, teaching_mode, scheduled_at,
      student:users!bookings_student_id_fkey ( full_name_ar ),
      tutor:users!bookings_tutor_id_fkey ( full_name_ar )
    `)
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "الحجز غير موجود" };

  type BookingWithParticipants = {
    id: string;
    status: string;
    teaching_mode: string;
    scheduled_at: string;
    student: { full_name_ar: string } | null;
    tutor: { full_name_ar: string } | null;
  };
  const b = booking as unknown as BookingWithParticipants;

  // Check idempotency — if session already exists, return it
  const { data: existing } = await admin
    .from("merithub_sessions")
    .select("id, merithub_session_id, student_join_url, tutor_join_url, recording_url, session_started_at, session_ended_at, created_at")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) {
    return {
      data: {
        sessionId: (existing as any).merithub_session_id,
        studentJoinUrl: (existing as any).student_join_url,
        tutorJoinUrl: (existing as any).tutor_join_url,
        recordingUrl: (existing as any).recording_url,
        sessionStartedAt: (existing as any).session_started_at,
        sessionEndedAt: (existing as any).session_ended_at,
        createdAt: (existing as any).created_at,
      },
    };
  }

  if (!["online", "both"].includes(b.teaching_mode)) {
    return { error: "هذا الحجز غير مخصص للتدريس عبر الإنترنت" };
  }

  let sessionData: { sessionId: string; studentJoinUrl: string; tutorJoinUrl: string };

  try {
    sessionData = await callMerithubCreateSession({
      title: `حصة درس — ${b.id}`,
      scheduledAt: b.scheduled_at,
      durationMinutes: 50,
      studentName: b.student?.full_name_ar ?? "طالب",
      tutorName: b.tutor?.full_name_ar ?? "مدرس",
      bookingId: b.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Merithub error";
    console.error("[createMerithubSession] API error:", msg);
    // Log failure but do NOT block booking flow
    return { error: "تعذّر إنشاء رابط الحصة. سيتم إعادة المحاولة." };
  }

  // Atomically store the session record via RPC
  const { data: rpcResult, error: rpcErr } = await admin.rpc("create_merithub_session_record", {
    p_booking_id: b.id,
    p_merithub_session_id: sessionData.sessionId,
    p_student_join_url: sessionData.studentJoinUrl,
    p_tutor_join_url: sessionData.tutorJoinUrl,
  });

  if (rpcErr) {
    console.error("[createMerithubSession] RPC error:", rpcErr.message);
    return { error: "تعذّر حفظ بيانات الحصة" };
  }

  const createdAt = new Date().toISOString();

  return {
    data: {
      sessionId: sessionData.sessionId,
      studentJoinUrl: sessionData.studentJoinUrl,
      tutorJoinUrl: sessionData.tutorJoinUrl,
      recordingUrl: null,
      sessionStartedAt: null,
      sessionEndedAt: null,
      createdAt,
    },
  };
}

// ─── Get Merithub session for a booking (participant access) ──────────────────

export async function getMerithubSessionAction(
  bookingId: string,
): Promise<ActionResult<MerithubSessionInfo | null>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  // Verify participant
  const { data: booking } = await admin
    .from("bookings")
    .select("id, student_id, tutor_id")
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "الحجز غير موجود" };

  const b = booking as { id: string; student_id: string; tutor_id: string };
  const isParticipant = b.student_id === user.id || b.tutor_id === user.id;
  const isAdmin = user.app_metadata?.role === "admin";

  if (!isParticipant && !isAdmin) return { error: "غير مصرح" };

  const { data } = await admin
    .from("merithub_sessions")
    .select("merithub_session_id, student_join_url, tutor_join_url, recording_url, session_started_at, session_ended_at, created_at")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (!data) return { data: null };

  const d = data as {
    merithub_session_id: string;
    student_join_url: string;
    tutor_join_url: string;
    recording_url: string | null;
    session_started_at: string | null;
    session_ended_at: string | null;
    created_at: string;
  };

  const isStudent = b.student_id === user.id;

  return {
    data: {
      sessionId: d.merithub_session_id,
      // Only expose the URL relevant to this participant
      studentJoinUrl: isStudent || isAdmin ? d.student_join_url : "",
      tutorJoinUrl: !isStudent || isAdmin ? d.tutor_join_url : "",
      recordingUrl: d.recording_url,
      sessionStartedAt: d.session_started_at,
      sessionEndedAt: d.session_ended_at,
      createdAt: d.created_at,
    },
  };
}
