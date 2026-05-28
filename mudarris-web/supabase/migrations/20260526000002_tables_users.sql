-- ============================================================
-- Migration: 002_tables_users
-- Description: Core user tables — users, students, tutors, tutor_documents
-- Reversible: YES — see ROLLBACK section at bottom
--
-- Security notes:
--   - users.role mirrors app_metadata.role in the JWT (set server-side only)
--   - Admin role is never set via public signup — managed via service role only
--   - Tutor status starts as 'pending'; is_visible starts as false
--   - Tutor documents stored in private Supabase Storage bucket ('tutor-documents')
--   - Email/phone verification tracked for auth gate enforcement
--   - Guardian fields included for students under 18
--   - No user enumeration: do not expose "email already exists" errors to clients
-- ============================================================

-- ---------------------
-- users
-- One row per registered user. Linked to auth.users via FK.
-- Role is authoritative here and in app_metadata.role (JWT).
-- ---------------------
CREATE TABLE users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role             user_role NOT NULL DEFAULT 'student',
  full_name_ar     TEXT NOT NULL DEFAULT '',
  full_name_en     TEXT,
  phone            TEXT,
  avatar_url       TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  -- Verification tracking (Supabase Auth is authoritative; these are convenience mirrors)
  email_verified_at  TIMESTAMPTZ,
  phone_verified_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  users IS 'Application user profiles. Linked to Supabase auth.users.';
COMMENT ON COLUMN users.role IS 'Mirrors app_metadata.role in the JWT. Set server-side only — never trusted from client.';
COMMENT ON COLUMN users.is_active IS 'Admin-controlled. Suspended users cannot log in (enforced in middleware).';
COMMENT ON COLUMN users.email_verified_at IS 'Set by server action after Supabase confirms email. Gate-checked before booking.';
COMMENT ON COLUMN users.phone_verified_at IS 'Set by server action after OTP confirmation. Required for tutors.';

-- ---------------------
-- students
-- Profile for student users. Extended data beyond users table.
-- ---------------------
CREATE TABLE students (
  id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth    DATE,
  grade_level      TEXT,
  -- Guardian fields (required if date_of_birth indicates age < 18 at account creation)
  guardian_name    TEXT,
  guardian_phone   TEXT,
  guardian_email   TEXT,
  guardian_relation TEXT,
  -- Consent-ready fields for AI features
  recording_consent_given_at    TIMESTAMPTZ,
  ai_analysis_consent_given_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  students IS 'Student profile data. Guardian fields required for users under 18.';
COMMENT ON COLUMN students.guardian_name IS 'Required when date_of_birth indicates student is under 18 at signup.';
COMMENT ON COLUMN students.recording_consent_given_at IS 'AI-ready: timestamp when student consented to session recording.';
COMMENT ON COLUMN students.ai_analysis_consent_given_at IS 'AI-ready: timestamp when student consented to AI analysis.';

-- ---------------------
-- tutors
-- Profile for tutor users. Admin-controlled status and visibility.
-- ---------------------
CREATE TABLE tutors (
  id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status           tutor_status NOT NULL DEFAULT 'pending',
  bio_ar           TEXT,
  subjects         TEXT[] NOT NULL DEFAULT '{}',
  grade_levels     TEXT[] NOT NULL DEFAULT '{}',
  teaching_modes   teaching_mode[] NOT NULL DEFAULT '{}',
  areas            TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  rating           NUMERIC(3,2)  NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count     INTEGER       NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  is_visible       BOOLEAN       NOT NULL DEFAULT false,
  years_experience INTEGER CHECK (years_experience >= 0),
  education        TEXT,
  -- Rejection tracking
  rejection_reason TEXT,
  rejected_at      TIMESTAMPTZ,
  approved_at      TIMESTAMPTZ,
  approved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  tutors IS 'Tutor profiles. status=pending until admin approval. is_visible=false until explicitly enabled by admin.';
COMMENT ON COLUMN tutors.status IS 'Admin-controlled. pending→approved|rejected. approved→suspended. Never client-writable.';
COMMENT ON COLUMN tutors.is_visible IS 'Admin-controlled. Tutor must be both approved AND visible to appear in public listings.';
COMMENT ON COLUMN tutors.hourly_rate IS 'Rate per 50-minute lesson (not per hour). Named hourly_rate for business clarity.';

CREATE INDEX idx_tutors_status_visible ON tutors(status, is_visible);
CREATE INDEX idx_tutors_subjects       ON tutors USING GIN(subjects);
CREATE INDEX idx_tutors_grade_levels   ON tutors USING GIN(grade_levels);
CREATE INDEX idx_tutors_teaching_modes ON tutors USING GIN(teaching_modes);
CREATE INDEX idx_tutors_status         ON tutors(status);

-- ---------------------
-- tutor_documents
-- Private. Stored in Supabase Storage bucket: 'tutor-documents' (private, no public URL).
-- Access via signed URLs generated server-side only.
-- File validation (MIME type, extension, size) enforced in server action before upload.
-- ---------------------
CREATE TABLE tutor_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id       UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  document_type  TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  file_size      BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  is_verified    BOOLEAN NOT NULL DEFAULT false,
  verified_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT doc_allowed_mime CHECK (
    mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    )
  )
);

COMMENT ON TABLE  tutor_documents IS 'Private tutor verification documents. Max 10MB. Stored in private Supabase Storage bucket tutor-documents.';
COMMENT ON COLUMN tutor_documents.storage_path IS 'Path inside the tutor-documents Supabase Storage bucket. Never expose raw URL to client.';
COMMENT ON COLUMN tutor_documents.mime_type IS 'Validated in server action before upload. Constrained to: pdf, jpeg, png, webp.';
COMMENT ON COLUMN tutor_documents.file_size IS 'Bytes. Max 10MB (10485760 bytes) enforced in server action and DB constraint.';

CREATE INDEX idx_tutor_documents_tutor_id ON tutor_documents(tutor_id);

-- ---------------------
-- Trigger: create users row when auth.users gets a new signup
-- Security: SECURITY DEFINER, minimal trusted data from raw_user_meta_data
-- Role is NOT set from metadata (prevents client role escalation).
-- Server action sets role via service role after signup completes.
-- ---------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name_ar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name_ar', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- ROLLBACK:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_auth_user();
-- DROP INDEX IF EXISTS idx_tutor_documents_tutor_id;
-- DROP TABLE IF EXISTS tutor_documents;
-- DROP INDEX IF EXISTS idx_tutors_status;
-- DROP INDEX IF EXISTS idx_tutors_teaching_modes;
-- DROP INDEX IF EXISTS idx_tutors_grade_levels;
-- DROP INDEX IF EXISTS idx_tutors_subjects;
-- DROP INDEX IF EXISTS idx_tutors_status_visible;
-- DROP TABLE IF EXISTS tutors;
-- DROP TABLE IF EXISTS students;
-- DROP TABLE IF EXISTS users;
-- ============================================================
