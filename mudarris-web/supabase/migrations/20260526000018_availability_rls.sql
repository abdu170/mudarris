-- ============================================================
-- Migration: 018_availability_rls
-- Description: RLS policies for tutor_weekly_schedules and tutor_unavailable_blocks
--
-- Design principles:
--   - Students NEVER directly read raw schedule or unavailability data
--   - Computed availability is served via get_tutor_available_slots() SECURITY DEFINER RPC
--   - Tutors manage their own schedule + blocks
--   - Admins can read all (for support/moderation)
--   - All writes are tutor-owned only (no admin override needed for MVP)
--
-- Reversible: YES
-- ============================================================

ALTER TABLE tutor_weekly_schedules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_unavailable_blocks ENABLE ROW LEVEL SECURITY;

-- ─── tutor_weekly_schedules ───────────────────────────────────────────────────

-- Tutors read their own schedule
CREATE POLICY "weekly_schedule_own_select"
  ON tutor_weekly_schedules FOR SELECT
  USING (tutor_id = auth.uid() OR public.is_admin());

-- Tutors insert their own schedule rows
CREATE POLICY "weekly_schedule_own_insert"
  ON tutor_weekly_schedules FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

-- Tutors update their own schedule rows
CREATE POLICY "weekly_schedule_own_update"
  ON tutor_weekly_schedules FOR UPDATE
  USING  (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Tutors delete their own schedule rows
CREATE POLICY "weekly_schedule_own_delete"
  ON tutor_weekly_schedules FOR DELETE
  USING (tutor_id = auth.uid());

-- ─── tutor_unavailable_blocks ─────────────────────────────────────────────────

-- Tutors read their own blocks
CREATE POLICY "unavailable_blocks_own_select"
  ON tutor_unavailable_blocks FOR SELECT
  USING (tutor_id = auth.uid() OR public.is_admin());

-- Tutors insert their own blocks
CREATE POLICY "unavailable_blocks_own_insert"
  ON tutor_unavailable_blocks FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

-- Tutors update their own blocks
CREATE POLICY "unavailable_blocks_own_update"
  ON tutor_unavailable_blocks FOR UPDATE
  USING  (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Tutors delete their own blocks
CREATE POLICY "unavailable_blocks_own_delete"
  ON tutor_unavailable_blocks FOR DELETE
  USING (tutor_id = auth.uid());

-- ─── bookings: add student request INSERT policy ──────────────────────────────
-- Students can insert bookings with 'requested' status only.
-- Financial fields are validated in the server action before this INSERT.
-- Tutor/admin status changes (accept/reject) are server-side only.
CREATE POLICY "bookings_student_insert"
  ON bookings FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'requested'
  );

-- Students and tutors can read their own bookings
CREATE POLICY "bookings_participant_select"
  ON bookings FOR SELECT
  USING (
    student_id = auth.uid()
    OR tutor_id = auth.uid()
    OR public.is_admin()
  );

-- ============================================================
-- ROLLBACK:
-- DROP POLICY IF EXISTS "bookings_participant_select"         ON bookings;
-- DROP POLICY IF EXISTS "bookings_student_insert"            ON bookings;
-- DROP POLICY IF EXISTS "unavailable_blocks_own_delete"      ON tutor_unavailable_blocks;
-- DROP POLICY IF EXISTS "unavailable_blocks_own_update"      ON tutor_unavailable_blocks;
-- DROP POLICY IF EXISTS "unavailable_blocks_own_insert"      ON tutor_unavailable_blocks;
-- DROP POLICY IF EXISTS "unavailable_blocks_own_select"      ON tutor_unavailable_blocks;
-- DROP POLICY IF EXISTS "weekly_schedule_own_delete"         ON tutor_weekly_schedules;
-- DROP POLICY IF EXISTS "weekly_schedule_own_update"         ON tutor_weekly_schedules;
-- DROP POLICY IF EXISTS "weekly_schedule_own_insert"         ON tutor_weekly_schedules;
-- DROP POLICY IF EXISTS "weekly_schedule_own_select"         ON tutor_weekly_schedules;
-- ALTER TABLE tutor_unavailable_blocks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tutor_weekly_schedules   DISABLE ROW LEVEL SECURITY;
-- ============================================================
