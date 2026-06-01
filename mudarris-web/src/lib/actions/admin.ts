"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";
import type { Json, TutorStatus, WithdrawalStatus, BookingStatus, TeachingMode } from "@/lib/supabase/types";

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await requireAuth();
  const role = user.app_metadata?.role as string | undefined;
  if (role !== "admin") throw new Error("Unauthorized");
  return { id: user.id };
}

async function logAdminAction(
  adminId: string,
  actionType: string,
  targetEntity: string,
  targetEntityId: string,
  metadata?: Record<string, Json>,
) {
  const admin = createAdminClient();
  await admin.from("admin_audit_logs").insert({
    admin_id: adminId,
    action_type: actionType,
    target_entity: targetEntity,
    target_entity_id: targetEntityId,
    metadata: (metadata ?? null) as Json | null,
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalTutors: number;
  pendingApprovals: number;
  approvedTutors: number;
  totalStudents: number;
  totalBookings: number;
  completedBookings: number;
  totalPaymentsQar: number;
  pendingWithdrawals: number;
  pendingWithdrawalQar: number;
};

export async function getAdminStatsAction(): Promise<ActionResult<AdminStats>> {
  try { await requireAdmin(); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_admin_stats");

  if (error) {
    console.error("[getAdminStats]", error.message);
    return { error: "تعذّر تحميل الإحصائيات" };
  }

  const raw = (data ?? {}) as Record<string, number>;
  return {
    data: {
      totalTutors: raw.total_tutors ?? 0,
      pendingApprovals: raw.pending_approvals ?? 0,
      approvedTutors: raw.approved_tutors ?? 0,
      totalStudents: raw.total_students ?? 0,
      totalBookings: raw.total_bookings ?? 0,
      completedBookings: raw.completed_bookings ?? 0,
      totalPaymentsQar: raw.total_payments_qar ?? 0,
      pendingWithdrawals: raw.pending_withdrawals ?? 0,
      pendingWithdrawalQar: raw.pending_withdrawal_qar ?? 0,
    },
  };
}

// ─── Tutors ───────────────────────────────────────────────────────────────────

export type AdminTutorItem = {
  id: string;
  displayName: string;
  avatar: string | null;
  subjects: string[];
  status: TutorStatus;
  isVisible: boolean;
  rating: number;
  createdAt: string;
};

export async function getAdminTutorsAction(
  status?: TutorStatus,
): Promise<ActionResult<AdminTutorItem[]>> {
  try { await requireAdmin(); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const base = admin
    .from("tutors")
    .select(`id, status, subjects, is_visible, rating, created_at, users!tutors_id_fkey!inner ( full_name_ar, avatar_url )`)
    .order("created_at", { ascending: false });

  const { data, error } = await (status ? base.eq("status", status) : base);

  if (error) {
    console.error("[getAdminTutors]", error.message);
    return { error: "تعذّر تحميل المدرسين" };
  }

  const tutors: AdminTutorItem[] = (data ?? []).map((t: any) => ({
    id: t.id,
    displayName: t.users?.full_name_ar ?? "—",
    avatar: t.users?.avatar_url ?? null,
    subjects: t.subjects ?? [],
    status: t.status,
    isVisible: t.is_visible,
    rating: t.rating,
    createdAt: t.created_at,
  }));

  return { data: tutors };
}

export type AdminTutorDocument = {
  id: string;
  fileName: string;
  documentType: string;
  signedUrl: string;
};

export async function getAdminTutorDocumentsAction(
  tutorId: string,
): Promise<ActionResult<AdminTutorDocument[]>> {
  try { await requireAdmin(); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tutor_documents")
    .select("id, file_name, document_type, storage_path")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getAdminTutorDocuments]", error.message);
    return { error: "تعذّر تحميل وثائق المدرس" };
  }

  const docs: AdminTutorDocument[] = [];
  for (const doc of data ?? []) {
    const { data: urlData } = await admin.storage
      .from("tutor-documents")
      .createSignedUrl((doc as any).storage_path, 3600);
    docs.push({
      id: (doc as any).id,
      fileName: (doc as any).file_name,
      documentType: (doc as any).document_type,
      signedUrl: urlData?.signedUrl ?? "",
    });
  }

  return { data: docs };
}

export async function approveTutorAction(tutorId: string): Promise<ActionResult> {
  let adminId: string;
  try { ({ id: adminId } = await requireAdmin()); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tutors")
    .update({ status: "approved", is_visible: true, approved_at: new Date().toISOString(), approved_by: adminId })
    .eq("id", tutorId);

  if (error) { console.error("[approveTutor]", error.message); return { error: "تعذّر قبول المدرس" }; }

  await logAdminAction(adminId, "approve_tutor", "tutors", tutorId);
  return { data: undefined };
}

export async function rejectTutorAction(tutorId: string, reason?: string): Promise<ActionResult> {
  let adminId: string;
  try { ({ id: adminId } = await requireAdmin()); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tutors")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), rejection_reason: reason ?? null })
    .eq("id", tutorId);

  if (error) { console.error("[rejectTutor]", error.message); return { error: "تعذّر رفض المدرس" }; }

  await logAdminAction(adminId, "reject_tutor", "tutors", tutorId, reason ? { reason } : undefined);
  return { data: undefined };
}

export async function suspendTutorAction(tutorId: string): Promise<ActionResult> {
  let adminId: string;
  try { ({ id: adminId } = await requireAdmin()); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tutors")
    .update({ status: "suspended", is_visible: false })
    .eq("id", tutorId);

  if (error) { console.error("[suspendTutor]", error.message); return { error: "تعذّر تعليق المدرس" }; }

  await logAdminAction(adminId, "suspend_tutor", "tutors", tutorId);
  return { data: undefined };
}

// ─── Bookings (admin view) ────────────────────────────────────────────────────

export type AdminBookingItem = {
  id: string;
  studentName: string;
  tutorName: string;
  scheduledAt: string;
  teachingMode: TeachingMode;
  tutorRate: number;
  status: BookingStatus;
};

export async function getAdminBookingsAction(): Promise<ActionResult<AdminBookingItem[]>> {
  try { await requireAdmin(); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .select(`
      id, scheduled_at, teaching_mode, tutor_rate, status,
      student:users!bookings_student_id_fkey ( full_name_ar ),
      tutor:users!bookings_tutor_id_fkey ( full_name_ar )
    `)
    .order("scheduled_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getAdminBookings]", error.message);
    return { error: "تعذّر تحميل الحجوزات" };
  }

  const bookings: AdminBookingItem[] = (data ?? []).map((b: any) => ({
    id: b.id,
    studentName: b.student?.full_name_ar ?? "—",
    tutorName: b.tutor?.full_name_ar ?? "—",
    scheduledAt: b.scheduled_at,
    teachingMode: b.teaching_mode,
    tutorRate: b.tutor_rate,
    status: b.status,
  }));

  return { data: bookings };
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export type AdminWithdrawalItem = {
  id: string;
  tutorId: string;
  tutorName: string;
  amount: number;
  bankName: string;
  iban: string;
  accountHolderName: string;
  status: WithdrawalStatus;
  adminNote: string | null;
  createdAt: string;
};

export async function getAdminWithdrawalsAction(): Promise<ActionResult<AdminWithdrawalItem[]>> {
  try { await requireAdmin(); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("withdrawal_requests")
    .select("id, tutor_id, amount, bank_name, iban, account_holder_name, status, admin_note, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAdminWithdrawals]", error.message);
    return { error: "تعذّر تحميل طلبات السحب" };
  }

  const tutorIds = [...new Set((data ?? []).map((w: any) => w.tutor_id as string))];
  let nameMap: Record<string, string> = {};
  if (tutorIds.length > 0) {
    const { data: users } = await admin.from("users").select("id, full_name_ar").in("id", tutorIds);
    nameMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u.full_name_ar as string]));
  }

  const withdrawals: AdminWithdrawalItem[] = (data ?? []).map((w: any) => ({
    id: w.id,
    tutorId: w.tutor_id,
    tutorName: nameMap[w.tutor_id] ?? "—",
    amount: w.amount,
    bankName: w.bank_name,
    iban: w.iban,
    accountHolderName: w.account_holder_name,
    status: w.status,
    adminNote: w.admin_note,
    createdAt: w.created_at,
  }));

  return { data: withdrawals };
}

export async function approveWithdrawalAction(withdrawalId: string): Promise<ActionResult> {
  let adminId: string;
  try { ({ id: adminId } = await requireAdmin()); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  // Uses admin_approve_withdrawal RPC: atomically deducts available_balance + updates status + inserts ledger entry
  const { error } = await admin.rpc("admin_approve_withdrawal", {
    p_withdrawal_id: withdrawalId,
    p_admin_id: adminId,
  });

  if (error) {
    console.error("[approveWithdrawal]", error.message);
    if (error.message.includes("Insufficient")) return { error: "الرصيد غير كافٍ لإتمام السحب" };
    if (error.message.includes("not pending")) return { error: "طلب السحب ليس في حالة معلقة" };
    return { error: "تعذّر الموافقة على طلب السحب" };
  }

  return { data: undefined };
}

export async function rejectWithdrawalAction(withdrawalId: string, note?: string): Promise<ActionResult> {
  let adminId: string;
  try { ({ id: adminId } = await requireAdmin()); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  // Uses admin_reject_withdrawal RPC: no balance change (balance was not pre-deducted on request)
  const { error } = await admin.rpc("admin_reject_withdrawal", {
    p_withdrawal_id: withdrawalId,
    p_admin_id: adminId,
    p_note: note,
  });

  if (error) {
    console.error("[rejectWithdrawal]", error.message);
    if (error.message.includes("not pending")) return { error: "طلب السحب ليس في حالة معلقة" };
    return { error: "تعذّر رفض طلب السحب" };
  }

  return { data: undefined };
}

// ─── Commission settings ──────────────────────────────────────────────────────

export async function getCommissionSettingAction(): Promise<ActionResult<number>> {
  try { await requireAdmin(); } catch { return { error: "غير مصرح" }; }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "commission_pct")
    .single();

  if (error || !data) {
    console.error("[getCommissionSetting]", error?.message);
    return { error: "تعذّر تحميل إعدادات العمولة" };
  }

  return { data: Number(data.value) };
}

export async function updateCommissionAction(pct: number): Promise<ActionResult> {
  let adminId: string;
  try { ({ id: adminId } = await requireAdmin()); } catch { return { error: "غير مصرح" }; }

  if (pct < 0 || pct > 50) return { error: "نسبة العمولة يجب أن تكون بين 0 و 50%" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({ value: String(Math.round(pct)), updated_by: adminId, updated_at: new Date().toISOString() })
    .eq("key", "commission_pct");

  if (error) {
    console.error("[updateCommission]", error.message);
    return { error: "تعذّر تحديث نسبة العمولة" };
  }

  await logAdminAction(adminId, "update_commission", "platform_settings", "commission_pct", { new_pct: pct } as any);
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

