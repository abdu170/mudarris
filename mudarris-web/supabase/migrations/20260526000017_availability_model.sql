-- ============================================================
-- Migration: 017_availability_model
-- Description: Replace manual slot system with weekly recurring schedule
--
-- Changes:
--   - DROP tutor_availability_slots (manual slot model)
--   - REMOVE bookings.slot_id column + FK
--   - CREATE tutor_weekly_schedules (recurring base availability)
--   - CREATE tutor_unavailable_blocks (one-time exception blocks)
--   - ADD btree_gist exclusion constraint to prevent tutor overlap
--   - ADD partial unique index to prevent student duplicate requests
--   - REPLACE check_booking_conflict RPC (slot-free version)
--   - ADD get_tutor_available_slots RPC (computed available windows)
--
-- Reversible: YES — see ROLLBACK section
-- ============================================================

-- Enable btree_gist for GiST-based UUID equality in exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ─── Remove old slot system ───────────────────────────────────────────────────

-- Drop FK + index on bookings.slot_id first
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_slot_id_fkey;
DROP INDEX  IF EXISTS bookings_one_active_per_slot;
DROP INDEX  IF EXISTS idx_bookings_slot_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS slot_id;

-- Drop old tutor_availability_slots table (+ its indexes cascade automatically)
DROP TABLE IF EXISTS tutor_availability_slots;

-- ─── Tutor weekly base schedule ──────────────────────────────────────────────
-- Represents recurring weekly availability windows.
-- day_of_week: 0=Sunday … 6=Saturday (Qatar week starts Sunday)
-- start_time / end_time: local Asia/Qatar times stored as TIME
-- A tutor may have multiple rows per day (e.g., 08:00-12:00 and 16:00-22:00)

CREATE TABLE tutor_weekly_schedules (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID      NOT NULL REFERENCES tutors(id)   ON DELETE CASCADE,
  day_of_week   SMALLINT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME      NOT NULL,
  end_time      TIME      NOT NULL,
  teaching_mode teaching_mode NOT NULL DEFAULT 'online',
  is_active     BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT schedule_end_after_start  CHECK (end_time > start_time),
  -- Prevent identical duplicate rows
  CONSTRAINT schedule_unique_window    UNIQUE (tutor_id, day_of_week, start_time, end_time)
);

COMMENT ON TABLE  tutor_weekly_schedules IS 'Recurring weekly availability windows. Stored as local Asia/Qatar times.';
COMMENT ON COLUMN tutor_weekly_schedules.day_of_week IS '0=Sunday, 1=Monday … 6=Saturday';
COMMENT ON COLUMN tutor_weekly_schedules.start_time  IS 'Local Asia/Qatar time. Expand to UTC when computing slots.';
COMMENT ON COLUMN tutor_weekly_schedules.end_time    IS 'Local Asia/Qatar time. Slots must end by this time.';

CREATE INDEX idx_weekly_schedules_tutor ON tutor_weekly_schedules(tutor_id) WHERE is_active = TRUE;

-- ─── Tutor unavailable blocks ─────────────────────────────────────────────────
-- One-time exception blocks (vacation days, blocked hours, etc.)
-- Stored as UTC TIMESTAMPTZ to avoid any timezone ambiguity.

CREATE TABLE tutor_unavailable_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id   UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT block_end_after_start CHECK (ends_at > starts_at)
);

COMMENT ON TABLE tutor_unavailable_blocks IS 'One-time exception blocks that override the weekly schedule.';
COMMENT ON COLUMN tutor_unavailable_blocks.starts_at IS 'UTC. Use AT TIME ZONE ''Asia/Qatar'' when displaying.';

CREATE INDEX idx_unavailable_blocks_tutor      ON tutor_unavailable_blocks(tutor_id);
CREATE INDEX idx_unavailable_blocks_time_range ON tutor_unavailable_blocks(tutor_id, starts_at, ends_at);

-- ─── Booking conflict constraints ─────────────────────────────────────────────

-- LAYER 1 (database-level, Option B):
-- Exclusion constraint using btree_gist + tstzrange.
-- Prevents any two bookings for the same tutor from having overlapping time ranges,
-- but only for active blocking statuses (accepted/payment_pending/paid/confirmed).
-- Does NOT block 'requested' — multiple students may request the same slot;
-- first to be accepted wins.
ALTER TABLE bookings ADD CONSTRAINT bookings_no_tutor_overlap
  EXCLUDE USING gist (
    tutor_id                              WITH =,
    tstzrange(scheduled_at, ends_at, '[)') WITH &&
  )
  WHERE (status IN ('accepted', 'payment_pending', 'paid', 'confirmed'));

-- LAYER 2 (application-level via RPC):
-- Prevent same student from making duplicate pending requests for same tutor+time.
CREATE UNIQUE INDEX bookings_no_duplicate_requests
  ON bookings (student_id, tutor_id, scheduled_at)
  WHERE status = 'requested';

CREATE INDEX idx_bookings_tutor_active_range
  ON bookings (tutor_id, scheduled_at, ends_at)
  WHERE status IN ('accepted', 'payment_pending', 'paid', 'confirmed');

-- ─── Updated RPC: check_booking_conflict ─────────────────────────────────────
-- Slot-free version. Checks for time-range overlap with active bookings.
-- SELECT FOR UPDATE locks conflicting rows to prevent race conditions.
-- Returns TRUE = conflict, FALSE = safe to proceed.
-- The DB exclusion constraint is the final safety net; this is the application gate.

CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_tutor_id     UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_ends_at      TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_overlap_count
  FROM bookings
  WHERE tutor_id = p_tutor_id
    AND status IN ('accepted', 'payment_pending', 'paid', 'confirmed')
    AND tstzrange(scheduled_at, ends_at, '[)') && tstzrange(p_scheduled_at, p_ends_at, '[)')
  FOR UPDATE;

  RETURN v_overlap_count > 0;
END;
$$;

COMMENT ON FUNCTION public.check_booking_conflict(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
  'Application-level overlap check with SELECT FOR UPDATE. DB exclusion constraint (bookings_no_tutor_overlap) is the final safety net.';

-- ─── New RPC: get_tutor_available_slots ──────────────────────────────────────
-- Computes available 50-minute booking slots for a given tutor and week.
-- Input:
--   p_tutor_id  — the tutor's user ID
--   p_week_start — DATE of the first day of the desired week (Sunday, Qatar calendar)
--                  Client should pass the Sunday date in Asia/Qatar local date
-- Output:
--   slot_start, slot_end (UTC), teaching_mode
--
-- Slot granularity: starts every 30 minutes within schedule windows
-- Filters out: past times, unavailable blocks, active bookings
-- Does NOT expose raw schedule or unavailable block data to callers.

CREATE OR REPLACE FUNCTION public.get_tutor_available_slots(
  p_tutor_id   UUID,
  p_week_start DATE
)
RETURNS TABLE (
  slot_start    TIMESTAMPTZ,
  slot_end      TIMESTAMPTZ,
  teaching_mode teaching_mode
)
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Expand weekly schedule windows into UTC timestamps for this specific week.
  -- (p_week_start + day_of_week days + time) AT TIME ZONE 'Asia/Qatar'
  -- converts Asia/Qatar local time → UTC.
  schedule_windows AS (
    SELECT
      (p_week_start + (s.day_of_week || ' days')::INTERVAL + s.start_time) AT TIME ZONE 'Asia/Qatar' AS win_start,
      (p_week_start + (s.day_of_week || ' days')::INTERVAL + s.end_time)   AT TIME ZONE 'Asia/Qatar' AS win_end,
      s.teaching_mode
    FROM tutor_weekly_schedules s
    WHERE s.tutor_id = p_tutor_id
      AND s.is_active = TRUE
  ),
  -- Generate individual 50-min slot starts at 30-min granularity within each window.
  -- A slot is valid only if it (+ 50 min) fits entirely within the window.
  all_slots AS (
    SELECT
      gs                           AS s_start,
      gs + INTERVAL '50 minutes'   AS s_end,
      sw.teaching_mode
    FROM schedule_windows sw,
    LATERAL generate_series(
      sw.win_start,
      sw.win_end - INTERVAL '50 minutes',
      INTERVAL '30 minutes'
    ) AS gs
  ),
  -- Active bookings that block this tutor during the requested week
  blocked_bookings AS (
    SELECT scheduled_at, ends_at
    FROM bookings
    WHERE tutor_id = p_tutor_id
      AND status IN ('accepted', 'payment_pending', 'paid', 'confirmed')
      AND scheduled_at < (p_week_start + INTERVAL '7 days') AT TIME ZONE 'Asia/Qatar'
      AND ends_at > p_week_start AT TIME ZONE 'Asia/Qatar'
  ),
  -- Unavailable blocks during the requested week
  blocked_unavail AS (
    SELECT starts_at, ends_at
    FROM tutor_unavailable_blocks
    WHERE tutor_id = p_tutor_id
      AND starts_at < (p_week_start + INTERVAL '7 days') AT TIME ZONE 'Asia/Qatar'
      AND ends_at > p_week_start AT TIME ZONE 'Asia/Qatar'
  )
  SELECT sl.s_start, sl.s_end, sl.teaching_mode
  FROM all_slots sl
  WHERE
    -- Not in the past (with 5-min buffer so near-future slots remain visible briefly)
    sl.s_start > NOW() - INTERVAL '5 minutes'
    -- Does not overlap any active booking
    AND NOT EXISTS (
      SELECT 1 FROM blocked_bookings b
      WHERE tstzrange(sl.s_start, sl.s_end, '[)') && tstzrange(b.scheduled_at, b.ends_at, '[)')
    )
    -- Does not overlap any unavailability block
    AND NOT EXISTS (
      SELECT 1 FROM blocked_unavail u
      WHERE tstzrange(sl.s_start, sl.s_end, '[)') && tstzrange(u.starts_at, u.ends_at, '[)')
    )
  ORDER BY sl.s_start;
END;
$$;

COMMENT ON FUNCTION public.get_tutor_available_slots IS
  'Returns computed available 50-min slot starts for a tutor and week. Safe for student queries — raw schedule/unavailability not exposed.';

-- ─── Apply updated_at trigger to new tables ───────────────────────────────────
CREATE TRIGGER trg_set_updated_at_weekly_schedules
  BEFORE UPDATE ON tutor_weekly_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_set_updated_at_unavailable_blocks
  BEFORE UPDATE ON tutor_unavailable_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROLLBACK:
-- DROP TRIGGER IF EXISTS trg_set_updated_at_unavailable_blocks ON tutor_unavailable_blocks;
-- DROP TRIGGER IF EXISTS trg_set_updated_at_weekly_schedules   ON tutor_weekly_schedules;
-- DROP FUNCTION IF EXISTS public.get_tutor_available_slots(UUID, DATE);
-- DROP FUNCTION IF EXISTS public.check_booking_conflict(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
-- DROP INDEX  IF EXISTS idx_bookings_tutor_active_range;
-- DROP INDEX  IF EXISTS bookings_no_duplicate_requests;
-- ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_tutor_overlap;
-- DROP TABLE IF EXISTS tutor_unavailable_blocks;
-- DROP TABLE IF EXISTS tutor_weekly_schedules;
-- DROP EXTENSION IF EXISTS btree_gist;
-- ============================================================
