-- ============================================================
-- Migration: 011_functions_triggers
-- Description: Shared utility functions and database triggers
-- Reversible: YES — see ROLLBACK section at bottom
-- ============================================================

-- ---------------------
-- Helper: set updated_at on every UPDATE
-- Applied to all tables with an updated_at column.
-- ---------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'students',
    'tutors',
    'curriculum_files',
    'tutor_availability_slots',
    'bookings',
    'payments',
    'wallet_accounts',
    'withdrawal_requests',
    'conversations',
    'merithub_sessions',
    'session_recordings',
    'ai_session_reports'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t
    );
  END LOOP;
END $$;

-- ---------------------
-- Helper: recalculate tutor rating when a review is inserted or deleted
-- Excludes hidden reviews (is_visible = false) from the average.
-- ---------------------
CREATE OR REPLACE FUNCTION public.refresh_tutor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_tutor_id UUID;
BEGIN
  v_tutor_id := COALESCE(NEW.tutor_id, OLD.tutor_id);

  UPDATE tutors
  SET
    rating       = COALESCE((
      SELECT ROUND(AVG(rating::NUMERIC), 2)
      FROM reviews
      WHERE tutor_id = v_tutor_id AND is_visible = true
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE tutor_id = v_tutor_id AND is_visible = true
    )
  WHERE id = v_tutor_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_refresh_tutor_rating
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_tutor_rating();

-- ---------------------
-- Helper: role helpers for RLS policies
-- Reads role from JWT app_metadata (set server-side, cannot be forged by client).
-- ---------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    'student'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER AS $$
  SELECT public.current_user_role() = 'admin';
$$;

-- ---------------------
-- Helper: update conversations.last_message_at when a new message is inserted
-- ---------------------
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_conv_last_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================================
-- ROLLBACK:
-- DROP TRIGGER IF EXISTS trg_update_conv_last_message ON messages;
-- DROP FUNCTION IF EXISTS public.update_conversation_last_message();
-- DROP FUNCTION IF EXISTS public.is_admin();
-- DROP FUNCTION IF EXISTS public.current_user_role();
-- DROP TRIGGER IF EXISTS trg_refresh_tutor_rating ON reviews;
-- DROP FUNCTION IF EXISTS public.refresh_tutor_rating();
-- DO $$ DECLARE t TEXT; BEGIN
--   FOREACH t IN ARRAY ARRAY[
--     'users','students','tutors','curriculum_files',
--     'tutor_availability_slots','bookings','payments',
--     'wallet_accounts','withdrawal_requests','conversations',
--     'merithub_sessions','session_recordings','ai_session_reports'
--   ] LOOP
--     EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', t);
--   END LOOP;
-- END $$;
-- DROP FUNCTION IF EXISTS public.set_updated_at();
-- ============================================================
