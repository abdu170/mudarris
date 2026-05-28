-- ============================================================
-- Migration: 016_add_tutor_display_name
-- Description: Add public display name to tutors table
--
-- Tutors have two names:
--   users.full_name_ar   — private legal name (not shown to students)
--   tutors.display_name_ar — public display name shown in listings
--
-- This field is collected in the tutor signup wizard Step 1 as
-- "الاسم المعروض للطلاب" (e.g. "د. محمد أو أ. سارة")
-- Reversible: YES
-- ============================================================

ALTER TABLE tutors ADD COLUMN IF NOT EXISTS display_name_ar TEXT;

COMMENT ON COLUMN tutors.display_name_ar IS 'Public name shown to students (e.g. "د. محمد"). Different from users.full_name_ar which is the private legal name.';

-- ============================================================
-- ROLLBACK:
-- ALTER TABLE tutors DROP COLUMN IF EXISTS display_name_ar;
-- ============================================================
