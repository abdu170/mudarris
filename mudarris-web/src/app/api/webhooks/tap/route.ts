import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";
import { createMerithubSessionAction } from "@/lib/actions/merithub";
import type { Json } from "@/lib/supabase/types";
import type { NextRequest } from "next/server";

// ─── Tap webhook handler ───────────────────────────────────────────────────────
//
// Tap Payments sends a POST webhook on charge status changes.
//
// Signature verification:
//   Tap includes a `hashstring` field in the payload computed as:
//   HMAC-SHA256(key=TAP_WEBHOOK_SECRET, data="{id}x{amount}x{currency}x{status}")
//
//   NOTE: verify this concatenation against your Tap sandbox webhook logs.
//   The exact fields and separator depend on the Tap API version and event type.
//   If verification fails in sandbox, inspect the raw webhook body and adjust
//   HASH_FIELDS accordingly. The important invariant is that verification
//   uses timingSafeEqual (resistant to timing attacks).
//
// Idempotency:
//   - Payment lookup by tap_charge_id (UNIQUE in payments table)
//   - process_payment_succeeded RPC is itself idempotent (noop if already succeeded)
//
// Security:
//   - Raw body read before any parsing
//   - timingSafeEqual prevents timing oracle
//   - 401 on verification failure (no body revealing why)
//   - All DB mutations via service role
//   - Returns 200 to Tap on all non-critical errors (prevents retry storms)

interface TapChargePayload {
  id: string;
  object: string;
  status: string;
  amount: number;
  currency: string;
  merchant_id?: string;
  reference?: {
    order?: string;
    transaction?: string;
  };
  redirect?: { url?: string };
  hashstring?: string;
}

function verifyTapSignature(payload: TapChargePayload, secret: string): boolean {
  const provided = payload.hashstring;
  if (!provided) return false;

  // Build the hash string from the fields Tap signs.
  // If your sandbox delivers a different format, update HASH_FIELDS to match.
  const hashInput = [
    payload.id,
    String(payload.amount),
    payload.currency,
    payload.status,
  ].join("x");

  const computed = createHmac("sha256", secret).update(hashInput).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(computed.toLowerCase()),
      Buffer.from(provided.toLowerCase()),
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  let rawText: string;
  let payload: TapChargePayload;

  try {
    rawText = await req.text();
    payload = JSON.parse(rawText) as TapChargePayload;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Only process charge objects
  if (payload.object !== "charge") {
    return new Response("OK", { status: 200 });
  }

  // Verify signature
  const env = getServerEnv();
  if (!verifyTapSignature(payload, env.TAP_WEBHOOK_SECRET)) {
    console.warn("[TapWebhook] Signature verification failed for charge:", payload.id);
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // Lookup payment by tap_charge_id
  const { data: payment, error: lookupErr } = await admin
    .from("payments")
    .select("id, booking_id, status")
    .eq("tap_charge_id", payload.id)
    .maybeSingle();

  if (lookupErr) {
    console.error("[TapWebhook] DB lookup error:", lookupErr.message);
    // Return 200 to prevent Tap retry — DB error is not Tap's fault
    return new Response("OK", { status: 200 });
  }

  if (!payment) {
    console.warn("[TapWebhook] No payment record for charge:", payload.id);
    // Return 200 — could be a test event or a charge not tracked by us
    return new Response("OK", { status: 200 });
  }

  // Handle CAPTURED (successful payment)
  if (payload.status === "CAPTURED") {
    const { error: rpcErr } = await admin.rpc("process_payment_succeeded", {
      p_payment_id: payment.id,
      p_tap_charge_id: payload.id,
      p_tap_payload: payload as unknown as Json,
    });

    if (rpcErr) {
      console.error("[TapWebhook] process_payment_succeeded error:", rpcErr.message);
      return new Response("OK", { status: 200 });
    }

    // Trigger Merithub session creation for online bookings (best-effort, non-blocking)
    // Failure here does NOT block the payment success — the booking is already confirmed.
    const { data: booking } = await admin
      .from("bookings")
      .select("id, teaching_mode")
      .eq("id", payment.booking_id)
      .single();

    if (booking && ["online", "both"].includes((booking as { id: string; teaching_mode: string }).teaching_mode)) {
      createMerithubSessionAction(payment.booking_id).catch((err: unknown) => {
        console.error("[TapWebhook] Merithub session creation failed:", err);
      });
    }

    return new Response("OK", { status: 200 });
  }

  // Handle FAILED / DECLINED / CANCELLED
  if (["FAILED", "DECLINED", "CANCELLED", "VOID"].includes(payload.status)) {
    await admin
      .from("payments")
      .update({
        status: "failed",
        webhook_received_at: new Date().toISOString(),
        metadata: payload as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "pending"); // Only update if still pending (idempotency)

    return new Response("OK", { status: 200 });
  }

  // All other statuses — acknowledge receipt
  return new Response("OK", { status: 200 });
}
