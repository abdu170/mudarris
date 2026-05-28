-- ============================================================
-- Migration: 004_tables_booking_core
-- Description: Tutor availability slots and bookings
--
-- Key rules:
--   - Availability slot duration: 30 minutes (selection granularity)
--   - Lesson duration: exactly 50 minutes (DB constraint enforced)
--   - All timestamps stored UTC; Qatar timezone (Asia/Qatar, UTC+3) in app layer
--   - One active booking per slot (unique partial index)
--   - Booking conflict check via RPC (check_booking_conflict) — defined in migration 013
--   - AI consent fields included on bookings (pipeline deferred)
--   - Curriculum linking fields included (pipeline deferred)
-- Reversible: YES
-- ============================================================

-- ---------------------
-- tutor_availability_slots
-- Specific date+time slots created by tutors.
-- Slot = 30-minute window of availability.
-- Lesson = 50 minutes starting from slot start_at.
-- ---------------------
CREATE TABLE tutor_availability_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  teaching_mode teaching_mode NOT NULL DEFAULT 'both',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_booked     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT slot_end_after_start CHECK (end_at > start_at),
  CONSTRAINT slot_duration_30min  CHECK (
    EXTRACT(EPOCH FROM (end_at - start_at)) = 1800
  )
);

COMMENT ON TABLE  tutor_availability_slots IS '30-minute windows of tutor availability. Lesson duration is 50 min from start_at.';
COMMENT ON COLUMN tutor_availability_slots.start_at IS 'UTC. Application displays in Asia/Qatar (UTC+3).';
COMMENT ON COLUMN tutor_availability_slots.is_booked IS 'Set to true atomically when booking is confirmed. Prevents double-booking.';

CREATE INDEX idx_slots_tutor_id  ON tutor_availability_slots(tutor_id);
CREATE INDEX idx_slots_start_at  ON tutor_availability_slots(start_at);
CREATE INDEX idx_slots_available ON tutor_availability_slots(tutor_id, start_at)
  WHERE is_active = true AND is_booked = false;

-- ---------------------
-- bookings
-- One booking = one 50-minute lesson.
-- All financial fields are snapshots taken at booking creation time (immutable).
-- ---------------------
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES students(id),
  tutor_id            UUID NOT NULL REFERENCES tutors(id),
  slot_id             UUID REFERENCES tutor_availability_slots(id) ON DELETE SET NULL,
  status              booking_status NOT NULL DEFAULT 'requested',
  teaching_mode       teaching_mode NOT NULL,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  notes               TEXT,

  -- Financial snapshot — immutable after creation, stored for audit trail
  tutor_rate          NUMERIC(10,2) NOT NULL CHECK (tutor_rate > 0),
  platform_fee        NUMERIC(10,2) NOT NULL CHECK (platform_fee >= 0),
  tutor_earning       NUMERIC(10,2) NOT NULL CHECK (tutor_earning >= 0),

  -- In-person specifics
  in_person_area      TEXT,

  -- Consent fields (AI-ready — recording/AI pipeline not implemented in MVP)
  recording_consent   BOOLEAN NOT NULL DEFAULT false,
  ai_analysis_consent BOOLEAN NOT NULL DEFAULT false,

  -- Curriculum linking (AI-ready — used in future AI phase for context retrieval)
  curriculum_file_id  UUID REFERENCES curriculum_files(id) ON DELETE SET NULL,
  lesson_unit         TEXT,
  lesson_title_ref    TEXT,

  -- Lifecycle tracking
  accepted_at         TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  rejected_at         TIMESTAMPTZ,
  rejected_reason     TEXT,
  completed_at        TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT booking_ends_after_start CHECK (ends_at > scheduled_at),
  CONSTRAINT booking_duration_50min   CHECK (
    EXTRACT(EPOCH FROM (ends_at - scheduled_at)) = 3000
  ),
  CONSTRAINT booking_fee_check        CHECK (
    ABS((platform_fee + tutor_earning) - tutor_rate) < 0.01
  )
);

COMMENT ON TABLE  bookings IS 'One booking = one 50-minute lesson. Duration enforced by DB constraint.';
COMMENT ON COLUMN bookings.tutor_rate IS 'Snapshot of tutors.hourly_rate at booking creation. Immutable audit record.';
COMMENT ON COLUMN bookings.platform_fee IS '15% of tutor_rate. Server-calculated.';
COMMENT ON COLUMN bookings.tutor_earning IS '85% of tutor_rate. Server-calculated.';
COMMENT ON COLUMN bookings.recording_consent IS 'AI-ready: student agreed to have session recorded. Checked before recording retrieval.';
COMMENT ON COLUMN bookings.ai_analysis_consent IS 'AI-ready: student agreed to AI analysis. Checked before report generation.';
COMMENT ON COLUMN bookings.curriculum_file_id IS 'AI-ready: optional link to uploaded curriculum file for lesson context.';

-- Prevent multiple active booking requests per slot (race condition protection layer 1)
-- Layer 2 is the check_booking_conflict RPC with SELECT FOR UPDATE
CREATE UNIQUE INDEX bookings_one_active_per_slot
  ON bookings(slot_id)
  WHERE status IN ('requested', 'accepted', 'payment_pending', 'paid', 'confirmed')
    AND slot_id IS NOT NULL;

CREATE INDEX idx_bookings_student_id   ON bookings(student_id);
CREATE INDEX idx_bookings_tutor_id     ON bookings(tutor_id);
CREATE INDEX idx_bookings_status       ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_slot_id      ON bookings(slot_id) WHERE slot_id IS NOT NULL;
CREATE INDEX idx_bookings_curriculum   ON bookings(curriculum_file_id)
  WHERE curriculum_file_id IS NOT NULL;

-- ============================================================
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_bookings_curriculum;
-- DROP INDEX IF EXISTS idx_bookings_slot_id;
-- DROP INDEX IF EXISTS idx_bookings_scheduled_at;
-- DROP INDEX IF EXISTS idx_bookings_status;
-- DROP INDEX IF EXISTS idx_bookings_tutor_id;
-- DROP INDEX IF EXISTS idx_bookings_student_id;
-- DROP INDEX IF EXISTS bookings_one_active_per_slot;
-- DROP TABLE IF EXISTS bookings;
-- DROP INDEX IF EXISTS idx_slots_available;
-- DROP INDEX IF EXISTS idx_slots_start_at;
-- DROP INDEX IF EXISTS idx_slots_tutor_id;
-- DROP TABLE IF EXISTS tutor_availability_slots;
-- ============================================================
