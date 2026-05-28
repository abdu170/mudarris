import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";
import type { NextRequest } from "next/server";

// ─── Merithub webhook handler ──────────────────────────────────────────────────
//
// Merithub sends POST webhooks for session lifecycle events:
//   - session.started    → update session_started_at
//   - session.ended      → update session_ended_at, trigger recording retrieval
//   - recording.available → update recording_url in merithub_sessions
//
// Signature verification:
//   Merithub includes X-Merithub-Signature header (HMAC-SHA256 of raw body).
//   Computed as: HMAC-SHA256(key=MERITHUB_WEBHOOK_SECRET, data=rawBody)
//   Falls back to permissive mode if MERITHUB_WEBHOOK_SECRET is not configured
//   (useful for sandbox testing before production credentials are available).
//
// Idempotency:
//   - All updates use .eq("merithub_session_id") so replays are safe
//   - recording_url update is a SET — idempotent
//
// Security:
//   - Raw body read before parsing
//   - timingSafeEqual prevents timing oracle
//   - 401 on verification failure
//   - Returns 200 on all non-critical errors (prevents Merithub retry storms)
//   - Service role used for all DB mutations

interface MerithubWebhookPayload {
  event: string;
  session_id: string;
  recording_url?: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  [key: string]: unknown;
}

function verifyMerithubSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(`sha256=${computed}`),
      Buffer.from(signature),
    );
  } catch {
    // Signature length mismatch
    try {
      return timingSafeEqual(
        Buffer.from(computed.toLowerCase()),
        Buffer.from(signature.toLowerCase()),
      );
    } catch {
      return false;
    }
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  let rawBody: string;
  let payload: MerithubWebhookPayload;

  try {
    rawBody = await req.text();
    payload = JSON.parse(rawBody) as MerithubWebhookPayload;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const env = getServerEnv();
  const signature = req.headers.get("x-merithub-signature");

  // Verify signature only when secret is configured
  // In sandbox/dev, MERITHUB_WEBHOOK_SECRET may be a placeholder
  const webhookSecret = env.MERITHUB_WEBHOOK_SECRET;
  if (webhookSecret && webhookSecret !== "placeholder") {
    if (!verifyMerithubSignature(rawBody, signature, webhookSecret)) {
      console.warn("[MerithubWebhook] Signature verification failed for event:", payload.event);
      return new Response("Unauthorized", { status: 401 });
    }
  }

  if (!payload.session_id) {
    return new Response("OK", { status: 200 });
  }

  const admin = createAdminClient();

  switch (payload.event) {
    case "session.started": {
      const startedAt = payload.started_at ?? new Date().toISOString();

      const { error } = await admin
        .from("merithub_sessions")
        .update({ session_started_at: startedAt, updated_at: new Date().toISOString() })
        .eq("merithub_session_id", payload.session_id);

      if (error) {
        console.error("[MerithubWebhook] session.started update error:", error.message);
      }
      break;
    }

    case "session.ended": {
      const endedAt = payload.ended_at ?? new Date().toISOString();

      const { error } = await admin
        .from("merithub_sessions")
        .update({ session_ended_at: endedAt, updated_at: new Date().toISOString() })
        .eq("merithub_session_id", payload.session_id);

      if (error) {
        console.error("[MerithubWebhook] session.ended update error:", error.message);
      }
      break;
    }

    case "recording.available": {
      if (!payload.recording_url) {
        console.warn("[MerithubWebhook] recording.available missing recording_url for:", payload.session_id);
        break;
      }

      // Update merithub_sessions recording_url
      const { data: sessionRow, error: sessionErr } = await admin
        .from("merithub_sessions")
        .update({
          recording_url: payload.recording_url,
          session_ended_at: payload.ended_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("merithub_session_id", payload.session_id)
        .select("booking_id")
        .single();

      if (sessionErr || !sessionRow) {
        console.error("[MerithubWebhook] recording.available session update error:", sessionErr?.message);
        break;
      }

      const bookingId = (sessionRow as { booking_id: string }).booking_id;

      // Check consent before creating/updating session_recordings entry
      const { data: booking } = await admin
        .from("bookings")
        .select("recording_consent, ai_analysis_consent")
        .eq("id", bookingId)
        .single();

      const b = booking as { recording_consent: boolean; ai_analysis_consent: boolean } | null;

      if (b?.recording_consent) {
        // Get linked merithub_sessions.id for FK
        const { data: ms } = await admin
          .from("merithub_sessions")
          .select("id")
          .eq("merithub_session_id", payload.session_id)
          .single();

        const msId = ms ? (ms as { id: string }).id : null;

        // Upsert session_recordings row (idempotent)
        const { error: recErr } = await admin
          .from("session_recordings")
          .upsert(
            {
              booking_id: bookingId,
              merithub_session_id: msId,
              recording_url: payload.recording_url,
              duration_seconds: payload.duration_seconds ?? null,
              processing_status: "pending",
              consent_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "booking_id" },
          );

        if (recErr) {
          console.error("[MerithubWebhook] session_recordings upsert error:", recErr.message);
        } else {
          console.log("[MerithubWebhook] Recording reference stored for booking:", bookingId);
        }
      } else {
        console.log("[MerithubWebhook] Recording available but consent not given for booking:", bookingId);
      }
      break;
    }

    default:
      // Unknown event — acknowledge and ignore
      console.log("[MerithubWebhook] Unknown event type:", payload.event);
      break;
  }

  return new Response("OK", { status: 200 });
}
