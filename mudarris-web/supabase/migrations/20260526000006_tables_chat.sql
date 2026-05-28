-- ============================================================
-- Migration: 006_tables_chat
-- Description: Conversations, messages, message violations
--
-- Safety filter (enforced in server action, not DB):
--   Blocks: phone numbers, email addresses, WhatsApp links,
--           Telegram usernames, external payment wording
--   Violations are logged in message_violations (immutable).
--
-- Content limit: 2000 characters per message.
-- Reversible: YES
-- ============================================================

-- ---------------------
-- conversations
-- One conversation per student-tutor pair (optionally per booking).
-- ---------------------
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  student_id      UUID NOT NULL REFERENCES students(id),
  tutor_id        UUID NOT NULL REFERENCES tutors(id),
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE conversations IS 'One conversation per student-tutor pair. Optionally linked to a booking.';

CREATE INDEX idx_conv_student_id ON conversations(student_id);
CREATE INDEX idx_conv_tutor_id   ON conversations(tutor_id);
CREATE INDEX idx_conv_last_msg   ON conversations(last_message_at DESC NULLS LAST);

-- ---------------------
-- messages
-- Content moderated server-side before insert.
-- No UPDATE or DELETE from client (messages are immutable once sent).
-- ---------------------
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL CHECK (
    length(content) >= 1 AND length(content) <= 2000
  ),
  status          message_status NOT NULL DEFAULT 'sent',
  is_flagged      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  messages IS 'Chat messages. Content safety filter runs server-side before insert. Immutable once sent.';
COMMENT ON COLUMN messages.is_flagged IS 'True when safety filter detected a violation. Violation details in message_violations.';

CREATE INDEX idx_messages_conv_time  ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id  ON messages(sender_id);
CREATE INDEX idx_messages_flagged    ON messages(conversation_id) WHERE is_flagged = true;

-- ---------------------
-- message_violations
-- Immutable log of safety filter violations.
-- INSERT via server action only. No UPDATE, no DELETE.
-- ---------------------
CREATE TABLE message_violations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id),
  violation_type  TEXT NOT NULL CHECK (
    violation_type IN ('phone_number', 'email', 'whatsapp', 'telegram', 'external_payment')
  ),
  matched_pattern TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  message_violations IS 'Immutable safety violation log. Admin-only read. Server-side insert only.';
COMMENT ON COLUMN message_violations.matched_pattern IS 'The substring or pattern that triggered the filter.';

CREATE INDEX idx_violations_sender_id ON message_violations(sender_id);
CREATE INDEX idx_violations_conv_id   ON message_violations(conversation_id);
CREATE INDEX idx_violations_created   ON message_violations(created_at DESC);

-- ============================================================
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_violations_created;
-- DROP INDEX IF EXISTS idx_violations_conv_id;
-- DROP INDEX IF EXISTS idx_violations_sender_id;
-- DROP TABLE IF EXISTS message_violations;
-- DROP INDEX IF EXISTS idx_messages_flagged;
-- DROP INDEX IF EXISTS idx_messages_sender_id;
-- DROP INDEX IF EXISTS idx_messages_conv_time;
-- DROP TABLE IF EXISTS messages;
-- DROP INDEX IF EXISTS idx_conv_last_msg;
-- DROP INDEX IF EXISTS idx_conv_tutor_id;
-- DROP INDEX IF EXISTS idx_conv_student_id;
-- DROP TABLE IF EXISTS conversations;
-- ============================================================
