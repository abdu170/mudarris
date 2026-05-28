-- ============================================================
-- Migration: 015_storage_buckets
-- Description: Supabase Storage bucket declarations and RLS policies
--
-- Buckets:
--   avatars          — public (profile images, resized server-side before upload)
--   tutor-documents  — private (verification docs; signed URLs only, service role)
--   curriculum-files — private (admin uploads; signed URLs only, admin server action)
--
-- File validation enforced in server actions (MIME type, extension, size).
-- DB constraints on tutor_documents and curriculum_files provide second layer.
-- Reversible: YES
-- ============================================================

-- avatars: public, max 2MB profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- tutor-documents: private, max 10MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutor-documents',
  'tutor-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- curriculum-files: private, max 50MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'curriculum-files',
  'curriculum-files',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── Storage RLS ──────────────────────────────────────────────────────────────

-- avatars: owner can upload/update/delete own avatar; public read
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() = owner
  );

CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() = owner
  );

-- tutor-documents: private — service role only for read and write
-- Authenticated users cannot read directly; server action generates signed URLs.
-- No RLS policies here = default deny for all non-service-role callers.
-- Service role bypasses RLS entirely.

-- curriculum-files: private — service role only for read and write
-- Same pattern as tutor-documents.

-- ============================================================
-- ROLLBACK:
-- DELETE FROM storage.buckets WHERE id IN ('avatars', 'tutor-documents', 'curriculum-files');
-- DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
-- DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
-- DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
-- ============================================================
