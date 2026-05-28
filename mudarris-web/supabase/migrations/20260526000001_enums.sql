-- ============================================================
-- Migration: 001_enums
-- Description: All application enums
-- Reversible: YES — see ROLLBACK section at bottom
-- ============================================================

-- user_role: determines dashboard access and JWT app_metadata.role
CREATE TYPE user_role AS ENUM ('student', 'tutor', 'admin');

-- tutor_status: admin-controlled approval state
-- pending → approved | rejected; approved → suspended
CREATE TYPE tutor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- booking_status: full lesson lifecycle
-- requested → accepted → payment_pending → paid → confirmed → completed
--           └→ rejected        └→ cancelled              └→ disputed
CREATE TYPE booking_status AS ENUM (
  'requested',
  'accepted',
  'payment_pending',
  'paid',
  'confirmed',
  'completed',
  'cancelled',
  'rejected',
  'disputed'
);

-- payment_status: Tap Payments charge lifecycle
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded'
);

-- withdrawal_status: tutor withdrawal request lifecycle
CREATE TYPE withdrawal_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'processing',
  'completed'
);

-- teaching_mode: per availability slot and per booking
CREATE TYPE teaching_mode AS ENUM ('online', 'in_person', 'both');

-- report_status: AI Lite session report lifecycle (pipeline deferred to Phase 2+)
-- Dashboards show these placeholder states now; actual AI generation comes later.
CREATE TYPE report_status AS ENUM (
  'no_report',
  'pending',
  'processing',
  'completed',
  'failed'
);

-- message_status: chat message delivery state
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- ============================================================
-- ROLLBACK:
-- DROP TYPE IF EXISTS message_status;
-- DROP TYPE IF EXISTS report_status;
-- DROP TYPE IF EXISTS teaching_mode;
-- DROP TYPE IF EXISTS withdrawal_status;
-- DROP TYPE IF EXISTS payment_status;
-- DROP TYPE IF EXISTS booking_status;
-- DROP TYPE IF EXISTS tutor_status;
-- DROP TYPE IF EXISTS user_role;
-- ============================================================
