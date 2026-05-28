-- ============================================================
-- Migration: 022_merithub_rpc
-- Description: Atomic RPC to store a Merithub session record after
--              confirmed payment for an online booking.
--
-- Guards:
--   - Booking must exist and belong to tutor (called server-side, so
--     auth check is in the server action; RPC validates booking state)
--   - booking.teaching_mode must be 'online' or 'both'
--   - booking.status must be 'confirmed' (payment already completed)
--   - Idempotent: if session already exists, returns existing record (no error)
--
-- Security: SECURITY DEFINER, search_path = public
-- Reversible: YES
-- ============================================================

CREATE OR REPLACE FUNCTION create_merithub_session_record(
  p_booking_id         UUID,
  p_merithub_session_id TEXT,
  p_student_join_url   TEXT,
  p_tutor_join_url     TEXT
)
RETURNS TABLE (
  session_id   UUID,
  already_existed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking     bookings%ROWTYPE;
  v_session_id  UUID;
  v_existed     BOOLEAN := false;
BEGIN
  -- Lock the booking row to prevent concurrent Merithub session creation
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_booking.teaching_mode NOT IN ('online', 'both') THEN
    RAISE EXCEPTION 'booking_not_online';
  END IF;

  IF v_booking.status NOT IN ('confirmed', 'completed') THEN
    RAISE EXCEPTION 'booking_not_confirmed: status=%', v_booking.status;
  END IF;

  -- Idempotency: return existing session if already created
  SELECT id INTO v_session_id
  FROM merithub_sessions
  WHERE booking_id = p_booking_id;

  IF FOUND THEN
    RETURN QUERY SELECT v_session_id, true;
    RETURN;
  END IF;

  -- Insert new session record
  INSERT INTO merithub_sessions (
    booking_id,
    merithub_session_id,
    student_join_url,
    tutor_join_url
  ) VALUES (
    p_booking_id,
    p_merithub_session_id,
    p_student_join_url,
    p_tutor_join_url
  )
  RETURNING id INTO v_session_id;

  RETURN QUERY SELECT v_session_id, false;
END;
$$;

COMMENT ON FUNCTION create_merithub_session_record IS
  'Atomically stores a Merithub session after confirmed payment. Idempotent — safe to retry.';

-- ============================================================
-- ROLLBACK:
-- DROP FUNCTION IF EXISTS create_merithub_session_record(UUID, TEXT, TEXT, TEXT);
-- ============================================================
