-- ============================================================
-- Migration: 020_payment_wallet_rpcs
-- Description: Atomic RPCs for all payment/wallet financial operations
--
-- All RPCs use SECURITY DEFINER + explicit row locking (SELECT FOR UPDATE)
-- to guarantee consistency and prevent race conditions.
--
-- RPCs:
--   1. ensure_wallet_exists(p_tutor_id)         → UUID (wallet_id)
--   2. process_payment_succeeded(...)            → void
--   3. complete_booking_release_earnings(...)    → void
--   4. create_withdrawal_request(...)            → UUID (withdrawal_id)
--   5. admin_approve_withdrawal(...)             → void
--   6. admin_reject_withdrawal(...)              → void
--
-- Financial invariants:
--   - wallet_transactions: INSERT only, never UPDATE or DELETE
--   - available_balance >= 0 enforced by DB constraint (see migration 005)
--   - pending_balance >= 0 enforced by DB constraint
--   - Withdrawal deducts available_balance atomically with row lock
-- ============================================================

-- ─── 1. ensure_wallet_exists ─────────────────────────────────────────────────
-- Creates a wallet_account for a tutor if one doesn't exist yet.
-- Idempotent — safe to call multiple times.
-- Returns the wallet_id.

CREATE OR REPLACE FUNCTION public.ensure_wallet_exists(
  p_tutor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  SELECT id INTO v_wallet_id
  FROM wallet_accounts
  WHERE tutor_id = p_tutor_id;

  IF v_wallet_id IS NULL THEN
    INSERT INTO wallet_accounts (tutor_id, available_balance, pending_balance, total_earned, total_withdrawn)
    VALUES (p_tutor_id, 0, 0, 0, 0)
    ON CONFLICT (tutor_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_wallet_id;
  END IF;

  RETURN v_wallet_id;
END;
$$;

COMMENT ON FUNCTION public.ensure_wallet_exists IS
  'Creates wallet_account for tutor if missing. Idempotent. Returns wallet_id.';

-- ─── 2. process_payment_succeeded ────────────────────────────────────────────
-- Called by webhook handler after Tap confirms a CAPTURED charge.
-- Atomically:
--   - Marks payment as succeeded
--   - Marks booking as confirmed
--   - Creates/ensures tutor wallet
--   - Credits pending_balance with tutor_earning
--   - Inserts immutable wallet_transaction (credit_pending)
--
-- Idempotent: if payment already succeeded, does nothing (returns normally).

CREATE OR REPLACE FUNCTION public.process_payment_succeeded(
  p_payment_id      UUID,
  p_tap_charge_id   TEXT,
  p_tap_payload     JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_payment        RECORD;
  v_booking        RECORD;
  v_wallet_id      UUID;
  v_new_pending    NUMERIC;
BEGIN
  -- Lock the payment row to prevent concurrent webhook replays
  SELECT p.id, p.booking_id, p.status, p.amount, p.student_id
  INTO v_payment
  FROM payments p
  WHERE p.id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  -- Idempotency: already processed
  IF v_payment.status = 'succeeded' THEN
    RETURN;
  END IF;

  -- Only process from pending/processing states
  IF v_payment.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Cannot process payment in status: %', v_payment.status;
  END IF;

  -- Fetch booking
  SELECT b.id, b.tutor_id, b.tutor_earning, b.status
  INTO v_booking
  FROM bookings b
  WHERE b.id = v_payment.booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found for payment: %', p_payment_id;
  END IF;

  -- Update payment record
  UPDATE payments
  SET
    status              = 'succeeded',
    tap_charge_id       = p_tap_charge_id,
    webhook_received_at = now(),
    metadata            = p_tap_payload,
    updated_at          = now()
  WHERE id = p_payment_id;

  -- Update booking status to confirmed
  UPDATE bookings
  SET status = 'confirmed', updated_at = now()
  WHERE id = v_booking.id
    AND status IN ('payment_pending', 'paid', 'accepted');

  -- Ensure wallet exists for this tutor
  v_wallet_id := public.ensure_wallet_exists(v_booking.tutor_id);

  -- Lock wallet row and update balances
  UPDATE wallet_accounts
  SET
    pending_balance = pending_balance + v_booking.tutor_earning,
    total_earned    = total_earned    + v_booking.tutor_earning,
    updated_at      = now()
  WHERE id = v_wallet_id
  RETURNING pending_balance INTO v_new_pending;

  -- Insert immutable ledger entry
  INSERT INTO wallet_transactions (
    wallet_id, booking_id, withdrawal_id, type, amount, balance_after, description
  ) VALUES (
    v_wallet_id,
    v_booking.id,
    NULL,
    'credit_pending',
    v_booking.tutor_earning,
    v_new_pending,
    'مستحقات درس معلقة — في انتظار اكتمال الحصة'
  );
END;
$$;

COMMENT ON FUNCTION public.process_payment_succeeded IS
  'Atomic: marks payment succeeded, booking confirmed, credits tutor pending_balance. Idempotent.';

-- ─── 3. complete_booking_release_earnings ────────────────────────────────────
-- Called when admin marks a booking as completed.
-- Atomically:
--   - Marks booking as completed
--   - Moves tutor_earning from pending_balance → available_balance
--   - Inserts immutable wallet_transaction (credit_available)
--
-- Idempotent: if already completed, does nothing.

CREATE OR REPLACE FUNCTION public.complete_booking_release_earnings(
  p_booking_id UUID,
  p_admin_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_booking    RECORD;
  v_wallet_id  UUID;
  v_new_avail  NUMERIC;
BEGIN
  -- Lock booking row
  SELECT b.id, b.tutor_id, b.tutor_earning, b.status
  INTO v_booking
  FROM bookings b
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- Idempotency
  IF v_booking.status = 'completed' THEN
    RETURN;
  END IF;

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'Booking must be confirmed to complete. Current status: %', v_booking.status;
  END IF;

  -- Mark booking completed
  UPDATE bookings
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_booking_id;

  -- Get wallet (must exist — was created at payment time)
  SELECT id INTO v_wallet_id
  FROM wallet_accounts
  WHERE tutor_id = v_booking.tutor_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for tutor: %', v_booking.tutor_id;
  END IF;

  -- Lock wallet and release earnings: pending → available
  UPDATE wallet_accounts
  SET
    pending_balance   = GREATEST(0, pending_balance - v_booking.tutor_earning),
    available_balance = available_balance + v_booking.tutor_earning,
    updated_at        = now()
  WHERE id = v_wallet_id
  RETURNING available_balance INTO v_new_avail;

  -- Insert immutable ledger entry
  INSERT INTO wallet_transactions (
    wallet_id, booking_id, withdrawal_id, type, amount, balance_after, description
  ) VALUES (
    v_wallet_id,
    p_booking_id,
    NULL,
    'credit_available',
    v_booking.tutor_earning,
    v_new_avail,
    'مستحقات محررة — اكتملت الحصة'
  );

  -- Audit log
  INSERT INTO admin_audit_logs (admin_id, action_type, target_entity, target_entity_id)
  VALUES (p_admin_id, 'complete_booking', 'bookings', p_booking_id);
END;
$$;

COMMENT ON FUNCTION public.complete_booking_release_earnings IS
  'Atomic: marks booking completed, releases tutor earnings from pending to available. Idempotent.';

-- ─── 4. create_withdrawal_request ────────────────────────────────────────────
-- Called when a tutor requests a withdrawal.
-- Validates available_balance >= amount using SELECT FOR UPDATE.
-- Creates the withdrawal_request (status = pending).
-- Does NOT deduct balance yet — deduction happens at admin approval.
-- Returns the new withdrawal_id.

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
  v_wallet       RECORD;
  v_withdrawal_id UUID;
  v_pending_total NUMERIC;
BEGIN
  -- Validate amount
  IF p_amount < 100 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is 100 QAR';
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
  'Creates withdrawal request after verifying sufficient balance (including other pending requests). Returns withdrawal_id.';

-- ─── 5. admin_approve_withdrawal ─────────────────────────────────────────────
-- Called by admin to approve a withdrawal.
-- Atomically:
--   - Verifies still pending
--   - Verifies available_balance >= amount (re-check with lock)
--   - Deducts available_balance
--   - Updates total_withdrawn
--   - Marks withdrawal as approved
--   - Inserts immutable wallet_transaction (debit_withdrawal)
--   - Inserts admin audit log

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id      UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_withdrawal RECORD;
  v_wallet     RECORD;
  v_new_avail  NUMERIC;
BEGIN
  -- Lock withdrawal row
  SELECT id, tutor_id, wallet_id, amount, status
  INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found: %', p_withdrawal_id;
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal is not pending. Current status: %', v_withdrawal.status;
  END IF;

  -- Lock wallet row and verify balance
  SELECT id, available_balance
  INTO v_wallet
  FROM wallet_accounts
  WHERE id = v_withdrawal.wallet_id
  FOR UPDATE;

  IF v_wallet.available_balance < v_withdrawal.amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal. Available: %, Requested: %',
      v_wallet.available_balance, v_withdrawal.amount;
  END IF;

  -- Deduct balance
  UPDATE wallet_accounts
  SET
    available_balance = available_balance - v_withdrawal.amount,
    total_withdrawn   = total_withdrawn   + v_withdrawal.amount,
    updated_at        = now()
  WHERE id = v_wallet.id
  RETURNING available_balance INTO v_new_avail;

  -- Approve withdrawal
  UPDATE withdrawal_requests
  SET
    status      = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = now(),
    updated_at  = now()
  WHERE id = p_withdrawal_id;

  -- Insert immutable ledger entry
  INSERT INTO wallet_transactions (
    wallet_id, booking_id, withdrawal_id, type, amount, balance_after, description
  ) VALUES (
    v_wallet.id,
    NULL,
    p_withdrawal_id,
    'debit_withdrawal',
    v_withdrawal.amount,
    v_new_avail,
    'سحب رصيد معتمد'
  );

  -- Audit log
  INSERT INTO admin_audit_logs (admin_id, action_type, target_entity, target_entity_id)
  VALUES (p_admin_id, 'approve_withdrawal', 'withdrawal_requests', p_withdrawal_id);
END;
$$;

COMMENT ON FUNCTION public.admin_approve_withdrawal IS
  'Atomic: verifies balance, deducts available_balance, marks withdrawal approved, inserts ledger entry.';

-- ─── 6. admin_reject_withdrawal ──────────────────────────────────────────────
-- Called by admin to reject a withdrawal.
-- No balance change — the balance was never deducted on request creation.
-- Updates withdrawal status and logs admin action.

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id      UUID,
  p_note          TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  SELECT id, status INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found: %', p_withdrawal_id;
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal is not pending. Current status: %', v_withdrawal.status;
  END IF;

  UPDATE withdrawal_requests
  SET
    status      = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = now(),
    admin_note  = p_note,
    updated_at  = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO admin_audit_logs (admin_id, action_type, target_entity, target_entity_id)
  VALUES (p_admin_id, 'reject_withdrawal', 'withdrawal_requests', p_withdrawal_id);
END;
$$;

COMMENT ON FUNCTION public.admin_reject_withdrawal IS
  'Rejects a pending withdrawal. No balance change (balance was not pre-deducted).';

-- ============================================================
-- ROLLBACK:
-- DROP FUNCTION IF EXISTS public.admin_reject_withdrawal(UUID, UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.admin_approve_withdrawal(UUID, UUID);
-- DROP FUNCTION IF EXISTS public.create_withdrawal_request(UUID, NUMERIC, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.complete_booking_release_earnings(UUID, UUID);
-- DROP FUNCTION IF EXISTS public.process_payment_succeeded(UUID, TEXT, JSONB);
-- DROP FUNCTION IF EXISTS public.ensure_wallet_exists(UUID);
-- ============================================================
