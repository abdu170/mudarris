-- ============================================================
-- Migration: 021_chat_enhancements
-- Description: Phase 6 chat additions:
--   1. Soft-delete fields on messages (admin hide, NOT physical delete)
--   2. Unread-tracking timestamps on conversations
--   3. user_report_status enum
--   4. user_reports table with RLS
--   5. Updated message RLS: hide admin-hidden + flagged messages from recipients
--
-- Soft-delete invariant:
--   hidden_by_admin = true → message preserved in DB for audit,
--   excluded from participant SELECT, visible to admin only.
--   Physical deletes NEVER happen on messages.
--
-- Reversible: YES — see ROLLBACK section
-- ============================================================

-- ─── 1. Soft-delete columns on messages ──────────────────────────────────────
ALTER TABLE messages
  ADD COLUMN hidden_by_admin BOOLEAN    NOT NULL DEFAULT false,
  ADD COLUMN hidden_at       TIMESTAMPTZ,
  ADD COLUMN hidden_by       UUID REFERENCES users(id);

COMMENT ON COLUMN messages.hidden_by_admin IS 'Set by admin to hide a message from participants. Audit trail preserved — never physically deleted.';
COMMENT ON COLUMN messages.hidden_at       IS 'Timestamp when admin hid the message.';
COMMENT ON COLUMN messages.hidden_by       IS 'Admin user who hid the message.';

CREATE INDEX idx_messages_hidden ON messages(conversation_id) WHERE hidden_by_admin = true;

-- ─── 2. Unread-tracking on conversations ─────────────────────────────────────
ALTER TABLE conversations
  ADD COLUMN student_last_read_at TIMESTAMPTZ,
  ADD COLUMN tutor_last_read_at   TIMESTAMPTZ;

COMMENT ON COLUMN conversations.student_last_read_at IS 'When student last marked conversation as read.';
COMMENT ON COLUMN conversations.tutor_last_read_at   IS 'When tutor last marked conversation as read.';

-- ─── 3. user_report_status enum ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 4. user_reports table ───────────────────────────────────────────────────
CREATE TABLE user_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  message_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  reason          TEXT NOT NULL CHECK (length(reason) >= 5 AND length(reason) <= 1000),
  status          user_report_status NOT NULL DEFAULT 'pending',
  admin_note      TEXT,
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_reports IS 'User-submitted reports of messages or conversations. Admin triages via status workflow.';

CREATE INDEX idx_user_reports_reporter  ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported  ON user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status    ON user_reports(status) WHERE status = 'pending';
CREATE INDEX idx_user_reports_created   ON user_reports(created_at DESC);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Reporter can read own reports; admin reads all
CREATE POLICY "user_reports_select"
  ON user_reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_admin());

-- Reporter can submit reports
CREATE POLICY "user_reports_insert"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ─── 5. Tighten messages RLS ─────────────────────────────────────────────────
-- Drop the existing participant SELECT policy and replace with one that
-- excludes hidden and flagged messages from non-admin participants.

DROP POLICY IF EXISTS "messages_select" ON messages;

CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (
    public.is_admin()
    OR (
      NOT hidden_by_admin
      AND NOT is_flagged
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
      )
    )
  );

-- ─── 6. Trigger: updated_at on user_reports ──────────────────────────────────
CREATE TRIGGER set_user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 7. Trigger: updated_at on conversations (if not already set) ────────────
-- conversations already has updated_at; ensure trigger exists.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_conversations_updated_at'
      AND tgrelid = 'conversations'::regclass
  ) THEN
    CREATE TRIGGER set_conversations_updated_at
      BEFORE UPDATE ON conversations
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ============================================================
-- ROLLBACK:
-- DROP TRIGGER IF EXISTS set_conversations_updated_at ON conversations;
-- DROP TRIGGER IF EXISTS set_user_reports_updated_at ON user_reports;
-- DROP POLICY IF EXISTS "messages_select" ON messages;
-- -- Restore original messages_select:
-- CREATE POLICY "messages_select" ON messages FOR SELECT
--   USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id
--     AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())) OR public.is_admin());
-- DROP POLICY IF EXISTS "user_reports_insert" ON user_reports;
-- DROP POLICY IF EXISTS "user_reports_select" ON user_reports;
-- ALTER TABLE user_reports DISABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS idx_user_reports_created;
-- DROP INDEX IF EXISTS idx_user_reports_status;
-- DROP INDEX IF EXISTS idx_user_reports_reported;
-- DROP INDEX IF EXISTS idx_user_reports_reporter;
-- DROP TABLE IF EXISTS user_reports;
-- DROP TYPE IF EXISTS user_report_status;
-- ALTER TABLE conversations DROP COLUMN IF EXISTS tutor_last_read_at;
-- ALTER TABLE conversations DROP COLUMN IF EXISTS student_last_read_at;
-- DROP INDEX IF EXISTS idx_messages_hidden;
-- ALTER TABLE messages DROP COLUMN IF EXISTS hidden_by;
-- ALTER TABLE messages DROP COLUMN IF EXISTS hidden_at;
-- ALTER TABLE messages DROP COLUMN IF EXISTS hidden_by_admin;
-- ============================================================
