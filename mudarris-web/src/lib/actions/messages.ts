"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";
import { checkModeration, MODERATION_WARNINGS } from "@/lib/moderation";
import { z } from "zod";
import type { UserReportStatus } from "@/lib/supabase/types";

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

// ─── Shared types ─────────────────────────────────────────────────────────────

export type ConversationSummary = {
  id: string;
  bookingId: string | null;
  studentId: string;
  tutorId: string;
  studentName: string;
  tutorName: string;
  studentAvatar: string | null;
  tutorAvatar: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  studentLastReadAt: string | null;
  tutorLastReadAt: string | null;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  status: string;
  isFlagged: boolean;
  hiddenByAdmin: boolean;
  hiddenAt: string | null;
  createdAt: string;
};

export type AdminConversationItem = {
  id: string;
  bookingId: string | null;
  studentId: string;
  tutorId: string;
  studentName: string;
  tutorName: string;
  lastMessageAt: string | null;
  flaggedMessageCount: number;
};

export type UserReportItem = {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string | null;
  reportedUserName: string | null;
  messageId: string | null;
  conversationId: string | null;
  reason: string;
  status: UserReportStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

// ─── Create or get conversation for a booking ────────────────────────────────

export async function createConversationAction(
  bookingId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  // Verify booking exists and user is a participant
  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("id, student_id, tutor_id, status")
    .eq("id", bookingId)
    .single();

  if (bErr || !booking) return { error: "الحجز غير موجود" };
  if (booking.student_id !== user.id && booking.tutor_id !== user.id) {
    return { error: "غير مصرح" };
  }
  // Only allow chat for accepted+ bookings
  const allowedStatuses = ["accepted", "payment_pending", "paid", "confirmed", "completed"];
  if (!allowedStatuses.includes(booking.status)) {
    return { error: "لا يمكن فتح محادثة لهذا الحجز" };
  }

  // Upsert conversation (booking_id is UNIQUE)
  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) return { data: { conversationId: existing.id } };

  const { data: conv, error: insertErr } = await admin
    .from("conversations")
    .insert({
      booking_id: bookingId,
      student_id: booking.student_id,
      tutor_id: booking.tutor_id,
    })
    .select("id")
    .single();

  if (insertErr || !conv) {
    console.error("[createConversation]", insertErr?.message);
    return { error: "تعذّر إنشاء المحادثة" };
  }

  return { data: { conversationId: conv.id } };
}

// ─── List conversations for current user ─────────────────────────────────────

export async function getConversationsAction(): Promise<ActionResult<ConversationSummary[]>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("conversations")
    .select(`
      id, booking_id, student_id, tutor_id, last_message_at,
      student_last_read_at, tutor_last_read_at,
      student:users!conversations_student_id_fkey ( full_name_ar, avatar_url ),
      tutor:users!conversations_tutor_id_fkey ( full_name_ar, avatar_url )
    `)
    .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[getConversations]", error.message);
    return { error: "تعذّر تحميل المحادثات" };
  }

  const isStudent = (c: { student_id: string }) => c.student_id === user.id;

  // Fetch unread counts per conversation
  const convIds = (data ?? []).map((c: { id: string }) => c.id);
  let unreadMap: Record<string, number> = {};

  if (convIds.length > 0) {
    const { data: unreadRows } = await admin
      .from("messages")
      .select("conversation_id, created_at")
      .in("conversation_id", convIds)
      .eq("is_flagged", false)
      .eq("hidden_by_admin", false)
      .neq("sender_id", user.id);

    // Count messages after user's last read per conversation
    const conversations = (data ?? []) as Array<{
      id: string;
      student_id: string;
      student_last_read_at: string | null;
      tutor_last_read_at: string | null;
    }>;

    const lastReadMap: Record<string, string | null> = {};
    for (const c of conversations) {
      lastReadMap[c.id] = isStudent(c) ? c.student_last_read_at : c.tutor_last_read_at;
    }

    for (const row of (unreadRows ?? []) as Array<{ conversation_id: string; created_at: string }>) {
      const lastRead = lastReadMap[row.conversation_id];
      if (!lastRead || row.created_at > lastRead) {
        unreadMap[row.conversation_id] = (unreadMap[row.conversation_id] ?? 0) + 1;
      }
    }
  }

  // Fetch last message preview per conversation
  let previewMap: Record<string, string> = {};
  if (convIds.length > 0) {
    for (const cId of convIds) {
      const { data: lastMsg } = await admin
        .from("messages")
        .select("content")
        .eq("conversation_id", cId)
        .eq("is_flagged", false)
        .eq("hidden_by_admin", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastMsg) {
        previewMap[cId] = (lastMsg as { content: string }).content.slice(0, 80);
      }
    }
  }

  type ConvRow = {
    id: string;
    booking_id: string | null;
    student_id: string;
    tutor_id: string;
    last_message_at: string | null;
    student_last_read_at: string | null;
    tutor_last_read_at: string | null;
    student: { full_name_ar: string; avatar_url: string | null } | null;
    tutor: { full_name_ar: string; avatar_url: string | null } | null;
  };
  const summaries: ConversationSummary[] = ((data ?? []) as unknown as ConvRow[]).map((c) => ({
    id: c.id,
    bookingId: c.booking_id,
    studentId: c.student_id,
    tutorId: c.tutor_id,
    studentName: c.student?.full_name_ar ?? "—",
    tutorName: c.tutor?.full_name_ar ?? "—",
    studentAvatar: c.student?.avatar_url ?? null,
    tutorAvatar: c.tutor?.avatar_url ?? null,
    lastMessageAt: c.last_message_at,
    lastMessagePreview: previewMap[c.id] ?? null,
    unreadCount: unreadMap[c.id] ?? 0,
    studentLastReadAt: c.student_last_read_at,
    tutorLastReadAt: c.tutor_last_read_at,
  }));

  return { data: summaries };
}

// ─── Get messages in a conversation ──────────────────────────────────────────

export async function getMessagesAction(
  conversationId: string,
): Promise<ActionResult<MessageItem[]>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  // Verify participant
  const { data: conv } = await admin
    .from("conversations")
    .select("id, student_id, tutor_id")
    .eq("id", conversationId)
    .single();

  if (!conv) return { error: "المحادثة غير موجودة" };
  const isParticipant = conv.student_id === user.id || conv.tutor_id === user.id;
  const isAdmin = (await admin.auth.admin.getUserById(user.id)).data.user?.app_metadata?.role === "admin";

  if (!isParticipant && !isAdmin) return { error: "غير مصرح" };

  const { data, error } = await admin
    .from("messages")
    .select(`
      id, conversation_id, sender_id, content, status,
      is_flagged, hidden_by_admin, hidden_at, created_at,
      sender:users!messages_sender_id_fkey ( full_name_ar )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[getMessages]", error.message);
    return { error: "تعذّر تحميل الرسائل" };
  }

  type MsgRow = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    status: string;
    is_flagged: boolean;
    hidden_by_admin: boolean;
    hidden_at: string | null;
    created_at: string;
    sender: { full_name_ar: string } | null;
  };
  const messages: MessageItem[] = ((data ?? []) as unknown as MsgRow[])
    .filter((m) => isAdmin || (!m.is_flagged && !m.hidden_by_admin))
    .map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: m.sender?.full_name_ar ?? "—",
      content: m.content,
      status: m.status,
      isFlagged: m.is_flagged,
      hiddenByAdmin: m.hidden_by_admin,
      hiddenAt: m.hidden_at,
      createdAt: m.created_at,
    }));

  return { data: messages };
}

// ─── Send a message ───────────────────────────────────────────────────────────

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export async function sendMessageAction(
  formData: FormData,
): Promise<ActionResult<{ messageId: string }>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const parsed = SendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: "بيانات غير صالحة" };

  const { conversationId, content } = parsed.data;

  // Verify participant
  const { data: conv } = await admin
    .from("conversations")
    .select("id, student_id, tutor_id")
    .eq("id", conversationId)
    .single();

  if (!conv) return { error: "المحادثة غير موجودة" };
  if (conv.student_id !== user.id && conv.tutor_id !== user.id) {
    return { error: "غير مصرح" };
  }

  // Check sender suspension
  const { data: userRow } = await admin
    .from("users")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (!userRow?.is_active) {
    return { error: "حسابك موقوف. لا يمكنك إرسال رسائل." };
  }

  // Content moderation
  const modResult = checkModeration(content);

  if (modResult.blocked) {
    // Insert flagged message for audit trail
    const { data: flaggedMsg } = await admin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        is_flagged: true,
      })
      .select("id")
      .single();

    if (flaggedMsg) {
      await admin.from("message_violations").insert({
        message_id: flaggedMsg.id,
        conversation_id: conversationId,
        sender_id: user.id,
        violation_type: modResult.violationType,
        matched_pattern: modResult.matchedPattern,
      });
    }

    return { error: MODERATION_WARNINGS[modResult.violationType] };
  }

  // Insert clean message
  const { data: msg, error: insertErr } = await admin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })
    .select("id")
    .single();

  if (insertErr || !msg) {
    console.error("[sendMessage] insert:", insertErr?.message);
    return { error: "تعذّر إرسال الرسالة" };
  }

  // Update conversation last_message_at
  await admin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { data: { messageId: msg.id } };
}

// ─── Mark conversation as read ────────────────────────────────────────────────

export async function markConversationReadAction(
  conversationId: string,
): Promise<ActionResult<void>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data: conv } = await admin
    .from("conversations")
    .select("id, student_id, tutor_id")
    .eq("id", conversationId)
    .single();

  if (!conv) return { error: "المحادثة غير موجودة" };

  const now = new Date().toISOString();
  const isStudent = conv.student_id === user.id;
  const isTutor = conv.tutor_id === user.id;

  if (!isStudent && !isTutor) return { error: "غير مصرح" };

  await admin
    .from("conversations")
    .update(
      isStudent
        ? { student_last_read_at: now }
        : { tutor_last_read_at: now },
    )
    .eq("id", conversationId);

  return { data: undefined };
}

// ─── Admin: hide a message (soft delete) ─────────────────────────────────────

export async function adminHideMessageAction(
  messageId: string,
  reason: string,
): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.app_metadata?.role !== "admin") return { error: "غير مصرح" };

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("messages")
    .update({
      hidden_by_admin: true,
      hidden_at: now,
      hidden_by: user.id,
    })
    .eq("id", messageId)
    .eq("hidden_by_admin", false); // idempotency guard

  if (error) {
    console.error("[adminHideMessage]", error.message);
    return { error: "تعذّر إخفاء الرسالة" };
  }

  // Audit log
  await admin.from("admin_audit_logs").insert({
    admin_id: user.id,
    action_type: "hide_message",
    target_entity: "messages",
    target_entity_id: messageId,
    metadata: { reason },
  });

  return { data: undefined };
}

// ─── Admin: get all conversations with flagged messages ───────────────────────

export async function getAdminConversationsAction(): Promise<
  ActionResult<AdminConversationItem[]>
> {
  const user = await requireAuth();
  if (user.app_metadata?.role !== "admin") return { error: "غير مصرح" };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("conversations")
    .select(`
      id, booking_id, student_id, tutor_id, last_message_at,
      student:users!conversations_student_id_fkey ( full_name_ar ),
      tutor:users!conversations_tutor_id_fkey ( full_name_ar )
    `)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    console.error("[getAdminConversations]", error.message);
    return { error: "تعذّر تحميل المحادثات" };
  }

  // Count flagged messages per conversation
  const convIds = ((data ?? []) as Array<{ id: string }>).map((c) => c.id);
  let flaggedMap: Record<string, number> = {};

  if (convIds.length > 0) {
    const { data: flagged } = await admin
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .eq("is_flagged", true);

    for (const row of (flagged ?? []) as Array<{ conversation_id: string }>) {
      flaggedMap[row.conversation_id] = (flaggedMap[row.conversation_id] ?? 0) + 1;
    }
  }

  type AdminConvRow = {
    id: string;
    booking_id: string | null;
    student_id: string;
    tutor_id: string;
    last_message_at: string | null;
    student: { full_name_ar: string } | null;
    tutor: { full_name_ar: string } | null;
  };
  const items: AdminConversationItem[] = ((data ?? []) as unknown as AdminConvRow[]).map((c) => ({
    id: c.id,
    bookingId: c.booking_id,
    studentId: c.student_id,
    tutorId: c.tutor_id,
    studentName: c.student?.full_name_ar ?? "—",
    tutorName: c.tutor?.full_name_ar ?? "—",
    lastMessageAt: c.last_message_at,
    flaggedMessageCount: flaggedMap[c.id] ?? 0,
  }));

  return { data: items };
}

// ─── Submit a user report ─────────────────────────────────────────────────────

const ReportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  reason: z.string().min(5).max(1000),
});

export async function submitReportAction(
  formData: FormData,
): Promise<ActionResult<void>> {
  const user = await requireAuth();

  const parsed = ReportSchema.safeParse({
    reportedUserId: formData.get("reportedUserId") || undefined,
    messageId: formData.get("messageId") || undefined,
    conversationId: formData.get("conversationId") || undefined,
    reason: formData.get("reason"),
  });

  if (!parsed.success) return { error: "بيانات التقرير غير صالحة" };

  const admin = createAdminClient();

  const { error } = await admin.from("user_reports").insert({
    reporter_id: user.id,
    reported_user_id: parsed.data.reportedUserId ?? null,
    message_id: parsed.data.messageId ?? null,
    conversation_id: parsed.data.conversationId ?? null,
    reason: parsed.data.reason,
  });

  if (error) {
    console.error("[submitReport]", error.message);
    return { error: "تعذّر إرسال البلاغ" };
  }

  return { data: undefined };
}

// ─── Admin: get all user reports ──────────────────────────────────────────────

export async function getAdminReportsAction(): Promise<ActionResult<UserReportItem[]>> {
  const user = await requireAuth();
  if (user.app_metadata?.role !== "admin") return { error: "غير مصرح" };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("user_reports")
    .select(`
      id, reporter_id, reported_user_id, message_id, conversation_id,
      reason, status, admin_note, reviewed_by, reviewed_at, created_at,
      reporter:users!user_reports_reporter_id_fkey ( full_name_ar ),
      reported:users!user_reports_reported_user_id_fkey ( full_name_ar )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[getAdminReports]", error.message);
    return { error: "تعذّر تحميل البلاغات" };
  }

  type ReportRow = {
    id: string;
    reporter_id: string;
    reported_user_id: string | null;
    message_id: string | null;
    conversation_id: string | null;
    reason: string;
    status: UserReportStatus;
    admin_note: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    reporter: { full_name_ar: string } | null;
    reported: { full_name_ar: string } | null;
  };
  const items: UserReportItem[] = ((data ?? []) as unknown as ReportRow[]).map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    reporterName: r.reporter?.full_name_ar ?? "—",
    reportedUserId: r.reported_user_id,
    reportedUserName: r.reported?.full_name_ar ?? null,
    messageId: r.message_id,
    conversationId: r.conversation_id,
    reason: r.reason,
    status: r.status,
    adminNote: r.admin_note,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    createdAt: r.created_at,
  }));

  return { data: items };
}

// ─── Admin: update report status ──────────────────────────────────────────────

export async function updateReportStatusAction(
  reportId: string,
  status: UserReportStatus,
  note?: string,
): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.app_metadata?.role !== "admin") return { error: "غير مصرح" };

  const admin = createAdminClient();

  const { error } = await admin
    .from("user_reports")
    .update({
      status,
      admin_note: note ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    console.error("[updateReportStatus]", error.message);
    return { error: "تعذّر تحديث البلاغ" };
  }

  // Audit log
  await admin.from("admin_audit_logs").insert({
    admin_id: user.id,
    action_type: "update_report_status",
    target_entity: "user_reports",
    target_entity_id: reportId,
    metadata: { status, note: note ?? null },
  });

  return { data: undefined };
}

// ─── Admin: suspend a user ────────────────────────────────────────────────────

export async function suspendUserAction(
  userId: string,
  reason: string,
): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.app_metadata?.role !== "admin") return { error: "غير مصرح" };
  if (userId === user.id) return { error: "لا يمكنك إيقاف حسابك الخاص" };

  const admin = createAdminClient();

  // Set is_active = false — immediately blocks messages, bookings, withdrawals
  const { error } = await admin
    .from("users")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    console.error("[suspendUser]", error.message);
    return { error: "تعذّر إيقاف الحساب" };
  }

  // Audit log
  await admin.from("admin_audit_logs").insert({
    admin_id: user.id,
    action_type: "suspend_user",
    target_entity: "users",
    target_entity_id: userId,
    metadata: { reason },
  });

  return { data: undefined };
}

// ─── Admin: reactivate a user ─────────────────────────────────────────────────

export async function reactivateUserAction(
  userId: string,
  reason: string,
): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.app_metadata?.role !== "admin") return { error: "غير مصرح" };

  const admin = createAdminClient();

  const { error } = await admin
    .from("users")
    .update({ is_active: true })
    .eq("id", userId);

  if (error) {
    console.error("[reactivateUser]", error.message);
    return { error: "تعذّر تفعيل الحساب" };
  }

  await admin.from("admin_audit_logs").insert({
    admin_id: user.id,
    action_type: "reactivate_user",
    target_entity: "users",
    target_entity_id: userId,
    metadata: { reason },
  });

  return { data: undefined };
}
