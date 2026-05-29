"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";
import { getServerEnv, publicEnv } from "@/lib/env";
import type { PaymentRow, PaymentStatus } from "@/lib/supabase/types";

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

export type PaymentSummary = {
  id: string;
  bookingId: string;
  studentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  tapChargeId: string | null;
  tapCheckoutUrl: string | null;
  createdAt: string;
};

// ─── Tap API helpers ──────────────────────────────────────────────────────────

const TAP_API_BASE = "https://api.tap.company";

interface TapChargeResponse {
  id: string;
  status: string;
  transaction?: {
    url?: string;
  };
  errors?: { code: string; description: string }[];
}

async function createTapCharge(params: {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  redirectUrl: string;
  postUrl: string;
  customerName: string;
}): Promise<{ chargeId: string; checkoutUrl: string }> {
  const env = getServerEnv();

  if (!env.TAP_SECRET_KEY) {
    throw new Error("Tap Payment integration is not configured yet (TAP_SECRET_KEY is missing).");
  }

  const body = {
    amount: params.amount,
    currency: params.currency,
    customer_initiated: true,
    threeDSecure: true,
    save_card: false,
    description: params.description,
    order: { id: params.orderId },
    redirect: { url: params.redirectUrl },
    post: { url: params.postUrl },
    source: { id: "src_all" },
    customer: { first_name: params.customerName },
  };

  const res = await fetch(`${TAP_API_BASE}/v2/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TAP_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as TapChargeResponse;

  if (!res.ok || !data.id) {
    const errMsg = data.errors?.[0]?.description ?? "Tap charge creation failed";
    throw new Error(errMsg);
  }

  const checkoutUrl = data.transaction?.url;
  if (!checkoutUrl) {
    throw new Error("Tap did not return a checkout URL");
  }

  return { chargeId: data.id, checkoutUrl };
}

// ─── Initiate payment (student) ───────────────────────────────────────────────
// Called when student clicks "ادفع الآن" on an accepted booking.
// Creates a Tap charge, stores a payment record, updates booking to payment_pending.
// Returns the checkout URL for redirect.

export async function initiatePaymentAction(
  bookingId: string,
): Promise<ActionResult<{ checkoutUrl: string }>> {
  const user = await requireAuth();
  const admin = createAdminClient();
  const env = getServerEnv();

  // Fetch booking — must be accepted and belong to this student
  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .select("id, student_id, tutor_id, status, tutor_rate, teaching_mode, scheduled_at")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) return { error: "الحجز غير موجود" };
  if (booking.student_id !== user.id) return { error: "غير مصرح" };
  if (booking.status !== "accepted") {
    return { error: "لا يمكن إتمام الدفع لحجز بهذه الحالة" };
  }

  // Check for existing non-failed payment
  const { data: existing } = await admin
    .from("payments")
    .select("id, status, tap_checkout_url")
    .eq("booking_id", bookingId)
    .single();

  if (existing && existing.status === "succeeded") {
    return { error: "تم الدفع لهذا الحجز بالفعل" };
  }

  // Reuse existing pending payment URL if available
  if (existing && existing.status === "pending" && existing.tap_checkout_url) {
    return { data: { checkoutUrl: existing.tap_checkout_url } };
  }

  // Fetch student name for Tap charge
  const { data: userProfile } = await admin
    .from("users")
    .select("full_name_ar")
    .eq("id", user.id)
    .single();

  const appUrl = publicEnv.NEXT_PUBLIC_APP_URL ?? "https://mudarris.qa";
  const redirectUrl = `${appUrl}/student/bookings?payment=done&bookingId=${bookingId}`;
  const postUrl = `${appUrl}/api/webhooks/tap`;

  let chargeId: string;
  let checkoutUrl: string;

  try {
    const result = await createTapCharge({
      amount: booking.tutor_rate,
      currency: "QAR",
      description: `حجز درس — ${bookingId}`,
      orderId: bookingId,
      redirectUrl,
      postUrl,
      customerName: userProfile?.full_name_ar ?? "طالب",
    });
    chargeId = result.chargeId;
    checkoutUrl = result.checkoutUrl;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ في إنشاء طلب الدفع";
    console.error("[initiatePayment] Tap API error:", msg);
    return { error: "تعذّر إنشاء طلب الدفع. يرجى المحاولة لاحقاً" };
  }

  // Delete any stale failed payment record for this booking
  if (existing && existing.status === "failed") {
    await admin.from("payments").delete().eq("id", existing.id);
  }

  // Insert new payment record
  const { data: payment, error: insertErr } = await admin
    .from("payments")
    .insert({
      booking_id: bookingId,
      student_id: user.id,
      amount: booking.tutor_rate,
      currency: "QAR",
      status: "pending",
      tap_charge_id: chargeId,
      tap_checkout_url: checkoutUrl,
    })
    .select("id")
    .single();

  if (insertErr || !payment) {
    console.error("[initiatePayment] insert payment:", insertErr?.message);
    return { error: "تعذّر تسجيل عملية الدفع" };
  }

  // Update booking to payment_pending
  await admin
    .from("bookings")
    .update({ status: "payment_pending", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  return { data: { checkoutUrl } };
}

// ─── Get payment for a booking (student) ─────────────────────────────────────

export async function getBookingPaymentAction(
  bookingId: string,
): Promise<ActionResult<PaymentSummary | null>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getBookingPayment]", error.message);
    return { error: "تعذّر تحميل بيانات الدفع" };
  }

  if (!data) return { data: null };

  return {
    data: {
      id: data.id,
      bookingId: data.booking_id,
      studentId: data.student_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      tapChargeId: data.tap_charge_id,
      tapCheckoutUrl: data.tap_checkout_url,
      createdAt: data.created_at,
    },
  };
}

// ─── Get student payment history ──────────────────────────────────────────────

export async function getStudentPaymentsAction(): Promise<ActionResult<PaymentSummary[]>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getStudentPayments]", error.message);
    return { error: "تعذّر تحميل سجل المدفوعات" };
  }

  const payments: PaymentSummary[] = (data ?? []).map((p: PaymentRow) => ({
    id: p.id,
    bookingId: p.booking_id,
    studentId: p.student_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    tapChargeId: p.tap_charge_id,
    tapCheckoutUrl: p.tap_checkout_url,
    createdAt: p.created_at,
  }));

  return { data: payments };
}

// ─── Admin: get all payments ──────────────────────────────────────────────────

export type AdminPaymentItem = {
  id: string;
  bookingId: string;
  studentId: string;
  studentName: string;
  tutorName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  tapChargeId: string | null;
  createdAt: string;
  webhookReceivedAt: string | null;
};

export async function getAdminAllPaymentsAction(): Promise<ActionResult<AdminPaymentItem[]>> {
  const user = await requireAuth();
  const role = user.app_metadata?.role as string | undefined;
  if (role !== "admin") return { error: "غير مصرح" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select(`
      id, booking_id, student_id, amount, currency, status,
      tap_charge_id, created_at, webhook_received_at,
      bookings!inner ( tutor_id,
        student:users!bookings_student_id_fkey ( full_name_ar ),
        tutor:users!bookings_tutor_id_fkey ( full_name_ar )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[getAdminAllPayments]", error.message);
    return { error: "تعذّر تحميل المدفوعات" };
  }

  const payments: AdminPaymentItem[] = (data ?? []).map((p: any) => ({
    id: p.id,
    bookingId: p.booking_id,
    studentId: p.student_id,
    studentName: p.bookings?.student?.full_name_ar ?? "—",
    tutorName: p.bookings?.tutor?.full_name_ar ?? "—",
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    tapChargeId: p.tap_charge_id,
    createdAt: p.created_at,
    webhookReceivedAt: p.webhook_received_at,
  }));

  return { data: payments };
}
