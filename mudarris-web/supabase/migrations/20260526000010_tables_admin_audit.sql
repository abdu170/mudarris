-- ============================================================
-- Migration: 010_tables_admin_audit
-- Description: Immutable admin action audit log
--
-- Rules:
--   - INSERT only (via service role in server actions)
--   - No UPDATE, no DELETE — ever
--   - SELECT for admins only
--   - Every admin action must produce one audit log row
-- Reversible: YES
-- ============================================================

CREATE TABLE admin_audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id         UUID NOT NULL REFERENCES users(id),
  action_type      TEXT NOT NULL,
  target_entity    TEXT NOT NULL,
  target_entity_id UUID NOT NULL,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  admin_audit_logs IS 'Immutable audit trail for all admin actions. INSERT via service role only. No UPDATE, no DELETE.';
COMMENT ON COLUMN admin_audit_logs.action_type IS 'Action performed. Examples: approve_tutor, reject_tutor, suspend_user, approve_withdrawal, reject_withdrawal, upload_curriculum, verify_document, hide_review.';
COMMENT ON COLUMN admin_audit_logs.target_entity IS 'Table name of affected row, e.g. tutors, users, withdrawal_requests, reviews.';
COMMENT ON COLUMN admin_audit_logs.target_entity_id IS 'Primary key of the affected row.';
COMMENT ON COLUMN admin_audit_logs.metadata IS 'Optional JSON context: e.g. {"old_status": "pending", "new_status": "approved", "reason": "..."}.';

CREATE INDEX idx_audit_admin_id      ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_target        ON admin_audit_logs(target_entity, target_entity_id);
CREATE INDEX idx_audit_created_at    ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_action_type   ON admin_audit_logs(action_type);

-- ============================================================
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_audit_action_type;
-- DROP INDEX IF EXISTS idx_audit_created_at;
-- DROP INDEX IF EXISTS idx_audit_target;
-- DROP INDEX IF EXISTS idx_audit_admin_id;
-- DROP TABLE IF EXISTS admin_audit_logs;
-- ============================================================
