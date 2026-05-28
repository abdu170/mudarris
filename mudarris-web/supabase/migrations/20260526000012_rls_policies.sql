-- ============================================================
-- Migration: 012_rls_policies
-- Description: Row Level Security for all protected tables
--
-- Strategy:
--   - All tables: RLS ENABLED (default deny)
--   - Service role bypasses RLS entirely (used in admin.ts)
--   - Sensitive writes (payments, wallets, bookings, tutors, docs,
--     audit logs, AI tables) have NO client write policies —
--     all mutations via service role in server actions
--   - Tutor status/visibility: admin-only via service role
--   - Enrollment patterns: no "email already exists" exposure
--   - Consent-gated: session_recordings and ai_session_reports require
--     booking.recording_consent = true or booking.ai_analysis_consent = true
--
-- Reversible: YES — see ROLLBACK section at bottom
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_files         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_violations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE merithub_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recordings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_session_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_curriculum_links  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS
-- ============================================================
-- Users read own row; admins read all; approved visible tutor profiles are public
-- (public tutor read intentionally exposed for marketplace listing)
CREATE POLICY "users_select"
  ON users FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = users.id
        AND tutors.status = 'approved'
        AND tutors.is_visible = true
    )
  );

-- Users update own safe fields (role/is_active only changed via service role in server actions)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE POLICY "students_select"
  ON students FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "students_update_own"
  ON students FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TUTORS
-- All tutor mutations (including self-updates) via server action + service role.
-- This prevents a tutor from escalating their own status to 'approved'.
-- ============================================================
CREATE POLICY "tutors_select"
  ON tutors FOR SELECT
  USING (
    (status = 'approved' AND is_visible = true)
    OR auth.uid() = id
    OR public.is_admin()
  );

-- No INSERT/UPDATE/DELETE from client — all via service role in server actions

-- ============================================================
-- TUTOR_DOCUMENTS
-- Private. Owner and admin only. No public access.
-- ============================================================
CREATE POLICY "tutor_documents_select"
  ON tutor_documents FOR SELECT
  USING (auth.uid() = tutor_id OR public.is_admin());

-- No client INSERT/UPDATE (server action validates MIME + size, uses service role)

-- ============================================================
-- CURRICULUM_FILES
-- Active files readable by all authenticated users (tutors/students see metadata for booking).
-- Full management via service role (admin server actions only).
-- ============================================================
CREATE POLICY "curriculum_files_select"
  ON curriculum_files FOR SELECT
  USING (
    (is_active = true AND auth.uid() IS NOT NULL)
    OR public.is_admin()
  );

-- ============================================================
-- TUTOR_AVAILABILITY_SLOTS
-- Active unbooked slots readable by all authenticated users (for booking flow).
-- All slots readable by owning tutor and admins.
-- Tutor can INSERT/UPDATE/DELETE own non-booked slots.
-- ============================================================
CREATE POLICY "slots_select"
  ON tutor_availability_slots FOR SELECT
  USING (
    (is_active = true AND auth.uid() IS NOT NULL)
    OR auth.uid() = tutor_id
    OR public.is_admin()
  );

CREATE POLICY "slots_insert_own"
  ON tutor_availability_slots FOR INSERT
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "slots_update_own"
  ON tutor_availability_slots FOR UPDATE
  USING (auth.uid() = tutor_id AND is_booked = false)
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "slots_delete_own"
  ON tutor_availability_slots FOR DELETE
  USING (auth.uid() = tutor_id AND is_booked = false);

-- ============================================================
-- BOOKINGS
-- Participants (student + assigned tutor) and admins can read.
-- All writes via RPC / server action (service role). No direct client writes.
-- ============================================================
CREATE POLICY "bookings_select"
  ON bookings FOR SELECT
  USING (
    auth.uid() = student_id
    OR auth.uid() = tutor_id
    OR public.is_admin()
  );

-- ============================================================
-- PAYMENTS
-- Student sees own; tutor sees payments for bookings assigned to them; admin sees all.
-- No client writes — service role only.
-- ============================================================
CREATE POLICY "payments_select"
  ON payments FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
        AND bookings.tutor_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ============================================================
-- WALLET_ACCOUNTS
-- Tutor reads own wallet; admin reads all. No client writes.
-- ============================================================
CREATE POLICY "wallet_accounts_select"
  ON wallet_accounts FOR SELECT
  USING (auth.uid() = tutor_id OR public.is_admin());

-- ============================================================
-- WALLET_TRANSACTIONS
-- Tutor reads own transactions (via wallet join); admin reads all.
-- Immutable ledger — no client writes.
-- ============================================================
CREATE POLICY "wallet_transactions_select"
  ON wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wallet_accounts
      WHERE wallet_accounts.id = wallet_transactions.wallet_id
        AND wallet_accounts.tutor_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ============================================================
-- WITHDRAWAL_REQUESTS
-- Tutor reads/inserts own requests. Admin reads all.
-- Status updates (approve/reject) via service role in admin server actions.
-- ============================================================
CREATE POLICY "withdrawals_select"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = tutor_id OR public.is_admin());

-- Tutor can submit own withdrawal (amount >= 100 enforced by DB constraint)
CREATE POLICY "withdrawals_insert_own"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = tutor_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE POLICY "conversations_select"
  ON conversations FOR SELECT
  USING (
    auth.uid() = student_id
    OR auth.uid() = tutor_id
    OR public.is_admin()
  );

CREATE POLICY "conversations_insert"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = student_id OR auth.uid() = tutor_id
  );

-- ============================================================
-- MESSAGES
-- Only conversation participants can read and send.
-- Content passes through server-side safety filter before insert.
-- ============================================================
CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
    )
    OR public.is_admin()
  );

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- ============================================================
-- MESSAGE_VIOLATIONS
-- Admin only. Server-side safety filter inserts via service role.
-- ============================================================
CREATE POLICY "message_violations_select"
  ON message_violations FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- REVIEWS
-- Public read for visible reviews (marketplace).
-- No direct client insert — server action validates completed booking.
-- ============================================================
CREATE POLICY "reviews_select"
  ON reviews FOR SELECT
  USING (is_visible = true OR auth.uid() = student_id OR public.is_admin());

-- ============================================================
-- MERITHUB_SESSIONS
-- Booking participants can read their session details.
-- No client writes — service role only.
-- ============================================================
CREATE POLICY "merithub_sessions_select"
  ON merithub_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = merithub_sessions.booking_id
        AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
    )
    OR public.is_admin()
  );

-- ============================================================
-- SESSION_RECORDINGS
-- Consent-gated: readable only when booking.recording_consent = true.
-- No client writes — service role only.
-- ============================================================
CREATE POLICY "session_recordings_select"
  ON session_recordings FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = session_recordings.booking_id
        AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
        AND b.recording_consent = true
    )
  );

-- ============================================================
-- AI_SESSION_REPORTS
-- Consent-gated: readable only when booking.ai_analysis_consent = true.
-- Status field (no_report/pending/processing/completed/failed) readable for dashboard.
-- No client writes — service role only.
-- ============================================================
CREATE POLICY "ai_session_reports_select"
  ON ai_session_reports FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = ai_session_reports.booking_id
        AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
        AND b.ai_analysis_consent = true
    )
  );

-- ============================================================
-- LESSON_CURRICULUM_LINKS
-- Booking participants and admins can read.
-- ============================================================
CREATE POLICY "curriculum_links_select"
  ON lesson_curriculum_links FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = lesson_curriculum_links.booking_id
        AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
    )
  );

-- ============================================================
-- ADMIN_AUDIT_LOGS
-- Admin read only. Service role inserts. No UPDATE, no DELETE.
-- ============================================================
CREATE POLICY "audit_logs_select"
  ON admin_audit_logs FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- ROLLBACK:
-- -- Disable RLS on all tables:
-- ALTER TABLE admin_audit_logs         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE lesson_curriculum_links  DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_session_reports       DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE session_recordings       DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE merithub_sessions        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews                  DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE message_violations       DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages                 DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations            DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE withdrawal_requests      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallet_transactions      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallet_accounts          DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments                 DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings                 DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tutor_availability_slots DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE curriculum_files         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tutor_documents          DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tutors                   DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE students                 DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users                    DISABLE ROW LEVEL SECURITY;
-- -- Drop all policies (use DROP POLICY "name" ON table; for each)
-- ============================================================
