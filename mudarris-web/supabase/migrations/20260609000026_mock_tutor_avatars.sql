-- ============================================================
-- Migration: 026_mock_tutor_avatars
-- Description: Set avatar_url for mock seed tutors
-- Reversible: YES
-- ============================================================

UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/men/32.jpg'   WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/women/44.jpg' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/men/67.jpg'   WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/women/23.jpg' WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/men/15.jpg'   WHERE id = 'a1000000-0000-0000-0000-000000000005';

-- ============================================================
-- ROLLBACK:
-- UPDATE users SET avatar_url = NULL
-- WHERE id IN (
--   'a1000000-0000-0000-0000-000000000001',
--   'a1000000-0000-0000-0000-000000000002',
--   'a1000000-0000-0000-0000-000000000003',
--   'a1000000-0000-0000-0000-000000000004',
--   'a1000000-0000-0000-0000-000000000005'
-- );
-- ============================================================
