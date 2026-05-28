-- ============================================================
-- Migration: 003_tables_curriculum
-- Description: Admin-uploaded curriculum files (AI-ready foundation)
-- Note: Created before bookings because bookings FK-reference curriculum_files.
--
-- Storage: private Supabase Storage bucket 'curriculum-files'
-- Access: admin only. Signed URLs generated server-side.
-- AI pipeline: NOT implemented. Tables are schema-ready for future AI phase.
-- Reversible: YES
-- ============================================================

CREATE TABLE curriculum_files (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by_admin_id UUID NOT NULL REFERENCES users(id),
  title                TEXT NOT NULL,
  subject              TEXT NOT NULL,
  grade_level          TEXT NOT NULL,
  curriculum           TEXT NOT NULL,
  term                 TEXT NOT NULL,
  unit                 TEXT NOT NULL,
  lesson_title         TEXT NOT NULL,
  storage_path         TEXT NOT NULL,
  file_type            TEXT NOT NULL,
  file_size            BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 52428800),
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT curriculum_allowed_mime CHECK (
    file_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
  )
);

COMMENT ON TABLE  curriculum_files IS 'Admin-uploaded curriculum files. Stored in private bucket curriculum-files. AI Lite pipeline deferred.';
COMMENT ON COLUMN curriculum_files.storage_path IS 'Path inside curriculum-files Supabase Storage bucket. Signed URL generated server-side.';
COMMENT ON COLUMN curriculum_files.curriculum IS 'Curriculum name, e.g. Qatar National Curriculum, IB, Cambridge.';
COMMENT ON COLUMN curriculum_files.file_size IS 'Bytes. Max 50MB (52428800 bytes).';

CREATE INDEX idx_curriculum_subject  ON curriculum_files(subject);
CREATE INDEX idx_curriculum_grade    ON curriculum_files(grade_level);
CREATE INDEX idx_curriculum_active   ON curriculum_files(is_active) WHERE is_active = true;
CREATE INDEX idx_curriculum_admin    ON curriculum_files(uploaded_by_admin_id);

-- ============================================================
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_curriculum_admin;
-- DROP INDEX IF EXISTS idx_curriculum_active;
-- DROP INDEX IF EXISTS idx_curriculum_grade;
-- DROP INDEX IF EXISTS idx_curriculum_subject;
-- DROP TABLE IF EXISTS curriculum_files;
-- ============================================================
