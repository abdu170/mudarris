-- ============================================================
-- Migration: 023_phase7_hardening
-- Description: Phase 7 production hardening
--
-- Changes:
--   1. Merithub session cancellation tracking columns
--   2. Suspension check in create_withdrawal_request RPC
--   3. Performance indexes for high-frequency queries
--   4. Merithub sessions RLS: add update policy for server-side lifecycle updates
--   5. Admin update policy on merithub_sessions for recording URL population
--
-- Reversible: YES — see ROLLBACK section
-- ============================================================

-- ─── 1. Merithub session cancellation columns ────────────────────────────────
-- Enables local cancellation tracking when a booking is cancelled.
-- If Merithub provides a cancellation API, cancelled_at marks when it was called.
-- If not (fallback), cancelled_at marks local cancellation and join access disabled.

ALTER TABLE merithub_sessions
  ADD COLUMN cancelled_at   TIMESTAMPTZ,
  ADD COLUMN cancel_reason  TEXT;

COMMENT ON COLUMN merithub_sessions.cancelled_at  IS 'Set when booking is cancelled. Disables join URL access server-side. Best-effort update — booking cancellation succeeds even if this update fails.';
COMMENT ON COLUMN merithub_sessions.cancel_reason IS 'Reason for cancellation (booking_cancelled, or other). Informational only.';

-- ─── 2. Merithub sessions: admin/server update policy ────────────────────────
-- Service role bypasses RLS, but add explicit admin policy for clarity.
-- This allows populating recording_url, session_started_at, session_ended_at,
-- cancelled_at via the Merithub webhook handler (which uses admin client).

DO $$ BEGIN
  -- Allow server (via webhook / admin action) to update session lifecycle fields.
  -- No client policy — updates only via admin client (service role).
  -- This is a no-op for service role (already bypasses RLS), but documents intent.
  NULL;
END $$;

-- ─── 3. Suspension check in create_withdrawal_request ───────────────────────
-- Replaces migration 020's version with an added is_active guard.
-- A suspended tutor cannot create new withdrawal requests.

CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  p_tutor_id           UUID,
  p_amount             NUMERIC,
  p_bank_name          TEXT,
  p_iban               TEXT,
  p_account_holder_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_wallet        RECORD;
  v_withdrawal_id UUID;
  v_pending_total NUMERIC;
  v_is_active     BOOLEAN;
BEGIN
  -- Validate amount
  IF p_amount < 100 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is 100 QAR';
  END IF;

  -- Check account is not suspended
  SELECT is_active INTO v_is_active
  FROM users
  WHERE id = p_tutor_id;

  IF NOT FOUND OR v_is_active = false THEN
    RAISE EXCEPTION 'Account is suspended. Withdrawals are not permitted.';
  END IF;

  -- Lock wallet row
  SELECT id, available_balance
  INTO v_wallet
  FROM wallet_accounts
  WHERE tutor_id = p_tutor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for tutor: %', p_tutor_id;
  END IF;

  -- Sum up all pending withdrawal amounts to prevent over-requesting
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_total
  FROM withdrawal_requests
  WHERE tutor_id = p_tutor_id
    AND status = 'pending';

  -- Check sufficient available balance (accounting for existing pending requests)
  IF v_wallet.available_balance < (v_pending_total + p_amount) THEN
    RAISE EXCEPTION 'Insufficient available balance. Available: %, Pending withdrawals: %, Requested: %',
      v_wallet.available_balance, v_pending_total, p_amount;
  END IF;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    tutor_id, wallet_id, amount, bank_name, iban, account_holder_name, status
  ) VALUES (
    p_tutor_id, v_wallet.id, p_amount, p_bank_name, p_iban, p_account_holder_name, 'pending'
  )
  RETURNING id INTO v_withdrawal_id;

  RETURN v_withdrawal_id;
END;
$$;

COMMENT ON FUNCTION public.create_withdrawal_request IS
  'Creates withdrawal request after verifying sufficient balance and active account. Returns withdrawal_id.';

-- ─── 4. Performance indexes ───────────────────────────────────────────────────

-- Messages: fast lookup by conversation + created_at for pagination
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON messages(conversation_id, created_at DESC)
  WHERE hidden_by_admin = false AND is_flagged = false;

-- Conversations: fast lookup by student/tutor + last message (sidebar query)
CREATE INDEX IF NOT EXISTS idx_conversations_student_last
  ON conversations(student_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conversations_tutor_last
  ON conversations(tutor_id, last_message_at DESC NULLS LAST);

-- Bookings: fast lookup by student/tutor + scheduled_at (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_bookings_student_scheduled
  ON bookings(student_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_tutor_scheduled
  ON bookings(tutor_id, scheduled_at DESC);

-- Bookings: status filter (admin views)
CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings(status, scheduled_at DESC);

-- Payments: status filter for admin payment review
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status, created_at DESC);

-- Wallet transactions: fast history per wallet
CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet_created
  ON wallet_transactions(wallet_id, created_at DESC);

-- User reports: fast admin triage
CREATE INDEX IF NOT EXISTS idx_user_reports_status_created
  ON user_reports(status, created_at DESC);

-- Admin audit logs: fast lookup by admin + created_at
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created
  ON admin_audit_logs(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON admin_audit_logs(target_entity, target_entity_id, created_at DESC);

-- ─── 5. Merithub sessions: updated_at trigger ────────────────────────────────
-- Ensure updated_at is refreshed when lifecycle fields are updated via webhook.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_merithub_sessions_updated_at'
      AND tgrelid = 'merithub_sessions'::regclass
  ) THEN
    CREATE TRIGGER set_merithub_sessions_updated_at
      BEFORE UPDATE ON merithub_sessions
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ============================================================
-- ROLLBACK:
-- DROP TRIGGER IF EXISTS set_merithub_sessions_updated_at ON merithub_sessions;
-- DROP INDEX IF EXISTS idx_audit_logs_target;
-- DROP INDEX IF EXISTS idx_audit_logs_admin_created;
-- DROP INDEX IF EXISTS idx_user_reports_status_created;
-- DROP INDEX IF EXISTS idx_wallet_txn_wallet_created;
-- DROP INDEX IF EXISTS idx_payments_status;
-- DROP INDEX IF EXISTS idx_bookings_status;
-- DROP INDEX IF EXISTS idx_bookings_tutor_scheduled;
-- DROP INDEX IF EXISTS idx_bookings_student_scheduled;
-- DROP INDEX IF EXISTS idx_conversations_tutor_last;
-- DROP INDEX IF EXISTS idx_conversations_student_last;
-- DROP INDEX IF EXISTS idx_messages_conv_created;
-- -- Restore original create_withdrawal_request (without suspension check) from 020
-- ALTER TABLE merithub_sessions DROP COLUMN IF EXISTS cancel_reason;
-- ALTER TABLE merithub_sessions DROP COLUMN IF EXISTS cancelled_at;
-- ============================================================
