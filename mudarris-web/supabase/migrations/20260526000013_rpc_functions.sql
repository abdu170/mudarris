-- ============================================================
-- Migration: 013_rpc_functions
-- Description: Server-callable RPC functions for atomic operations
--
-- Functions:
--   - check_booking_conflict: atomic slot locking + overlap detection
--   - get_admin_stats: aggregate stats for admin dashboard
--
-- All functions use SECURITY DEFINER to run with elevated privileges.
-- Callers must validate permissions in the server action before calling.
-- Reversible: YES
-- ============================================================

-- ---------------------
-- RPC: check_booking_conflict
-- Atomically checks if a slot is free for a new booking.
-- Uses SELECT FOR UPDATE to lock the slot row and prevent race conditions.
--
-- Returns: TRUE  = conflict exists (slot taken or time overlap)
--          FALSE = slot is free, safe to proceed
--
-- Raises: exception 'slot_not_found' if slot doesn't belong to the given tutor.
-- ---------------------
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_tutor_id     UUID,
  p_slot_id      UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_ends_at      TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_slot_booked   BOOLEAN;
  v_overlap_count INTEGER;
BEGIN
  -- Lock the slot row to prevent concurrent booking attempts
  SELECT is_booked INTO v_slot_booked
  FROM tutor_availability_slots
  WHERE id = p_slot_id AND tutor_id = p_tutor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot_not_found: slot % not found for tutor %', p_slot_id, p_tutor_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Slot is already marked as booked
  IF v_slot_booked THEN
    RETURN true;
  END IF;

  -- Check for time-range overlap with active bookings
  -- A conflict exists when: existing.starts_at < new.ends_at AND existing.ends_at > new.starts_at
  SELECT COUNT(*) INTO v_overlap_count
  FROM bookings
  WHERE tutor_id = p_tutor_id
    AND status IN ('accepted', 'payment_pending', 'paid', 'confirmed')
    AND scheduled_at < p_ends_at
    AND ends_at > p_scheduled_at;

  RETURN v_overlap_count > 0;
END;
$$;

COMMENT ON FUNCTION public.check_booking_conflict IS
  'Atomically checks slot availability. SELECT FOR UPDATE prevents concurrent double-booking. Call from server action only. Returns true=conflict.';

-- ---------------------
-- RPC: get_admin_stats
-- Returns aggregate platform stats for the admin dashboard.
-- Called only from admin server action (role check enforced there).
-- ---------------------
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_tutors',           (SELECT COUNT(*) FROM tutors),
    'pending_approvals',      (SELECT COUNT(*) FROM tutors WHERE status = 'pending'),
    'approved_tutors',        (SELECT COUNT(*) FROM tutors WHERE status = 'approved'),
    'total_students',         (SELECT COUNT(*) FROM students),
    'total_bookings',         (SELECT COUNT(*) FROM bookings),
    'confirmed_bookings',     (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'),
    'completed_bookings',     (SELECT COUNT(*) FROM bookings WHERE status = 'completed'),
    'total_payments_qar',     (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'succeeded'),
    'pending_withdrawals',    (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'),
    'pending_withdrawal_qar', (SELECT COALESCE(SUM(amount), 0) FROM withdrawal_requests WHERE status = 'pending')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_stats IS
  'Admin dashboard aggregate stats. Permission check must be enforced in the calling server action.';

-- ============================================================
-- ROLLBACK:
-- DROP FUNCTION IF EXISTS public.get_admin_stats();
-- DROP FUNCTION IF EXISTS public.check_booking_conflict(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ);
-- ============================================================
