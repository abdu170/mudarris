-- ============================================================
-- Migration: 008_tables_merithub
-- Description: Merithub online session records
--
-- Rules:
--   - Created server-side ONLY after payment confirmed (booking.status = 'paid')
--   - Online bookings only — in-person bookings do NOT get Merithub sessions
--   - Merithub credentials never exposed to frontend
--   - recording_url populated after session ends (only retrieved with consent)
--   - Merithub creation failure does NOT block booking confirmation
-- Reversible: YES
-- ============================================================

CREATE TABLE merithub_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL UNIQUE REFERENCES bookings(id),
  merithub_session_id TEXT NOT NULL UNIQUE,
  student_join_url    TEXT NOT NULL,
  tutor_join_url      TEXT NOT NULL,
  recording_url       TEXT,
  session_started_at  TIMESTAMPTZ,
  session_ended_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  merithub_sessions IS 'Online session records from Merithub API. Created server-side after payment. Never exposed to frontend directly.';
COMMENT ON COLUMN merithub_sessions.recording_url IS 'Populated after session ends. Retrieved only when booking.recording_consent = true.';
COMMENT ON COLUMN merithub_sessions.student_join_url IS 'Returned to student via protected server action. Not stored in public DB fields.';

CREATE INDEX idx_merithub_booking_id ON merithub_sessions(booking_id);

-- ============================================================
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_merithub_booking_id;
-- DROP TABLE IF EXISTS merithub_sessions;
-- ============================================================
