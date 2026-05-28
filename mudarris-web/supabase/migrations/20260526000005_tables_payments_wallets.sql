-- ============================================================
-- Migration: 005_tables_payments_wallets
-- Description: Payments, wallet accounts, transactions, withdrawal requests
--
-- Security:
--   - ALL write operations (INSERT/UPDATE) via service role only
--   - RLS default-deny on writes — no client can write directly
--   - Wallet transactions are immutable (no UPDATE/DELETE)
--   - Minimum withdrawal enforced by DB constraint: 100 QAR
--   - tap_charge_id has UNIQUE constraint for idempotency
-- Reversible: YES
-- ============================================================

-- ---------------------
-- payments
-- One payment record per booking. Tap Payments integration.
-- ---------------------
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL UNIQUE REFERENCES bookings(id),
  student_id          UUID NOT NULL REFERENCES students(id),
  amount              NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency            TEXT NOT NULL DEFAULT 'QAR',
  status              payment_status NOT NULL DEFAULT 'pending',
  tap_charge_id       TEXT UNIQUE,
  tap_checkout_url    TEXT,
  webhook_received_at TIMESTAMPTZ,
  refund_amount       NUMERIC(10,2) CHECK (refund_amount >= 0),
  refunded_at         TIMESTAMPTZ,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  payments IS 'Tap Payments charge records. All writes via service role only. Client cannot mutate.';
COMMENT ON COLUMN payments.tap_charge_id IS 'Unique Tap charge ID. UNIQUE constraint prevents duplicate webhook processing.';
COMMENT ON COLUMN payments.metadata IS 'Raw Tap webhook payload stored for audit. Never exposed to client.';

CREATE INDEX idx_payments_booking_id    ON payments(booking_id);
CREATE INDEX idx_payments_student_id    ON payments(student_id);
CREATE INDEX idx_payments_status        ON payments(status);
CREATE INDEX idx_payments_tap_charge_id ON payments(tap_charge_id) WHERE tap_charge_id IS NOT NULL;

-- ---------------------
-- wallet_accounts
-- One wallet per tutor. Balances updated server-side only via RPCs.
-- ---------------------
CREATE TABLE wallet_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id          UUID NOT NULL UNIQUE REFERENCES tutors(id) ON DELETE CASCADE,
  available_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_withdrawn   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  wallet_accounts IS 'Tutor wallet. Balances updated only by server-side RPCs. Client cannot write.';
COMMENT ON COLUMN wallet_accounts.available_balance IS 'Withdrawable balance. Never negative (DB constraint).';
COMMENT ON COLUMN wallet_accounts.pending_balance IS 'Held while lesson not yet completed. Released on booking completion.';

CREATE INDEX idx_wallet_tutor_id ON wallet_accounts(tutor_id);

-- ---------------------
-- withdrawal_requests
-- Tutor-initiated. Admin approves/rejects. Minimum 100 QAR.
-- ---------------------
CREATE TABLE withdrawal_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id            UUID NOT NULL REFERENCES tutors(id),
  wallet_id           UUID NOT NULL REFERENCES wallet_accounts(id),
  amount              NUMERIC(10,2) NOT NULL CHECK (amount >= 100),
  status              withdrawal_status NOT NULL DEFAULT 'pending',
  bank_name           TEXT NOT NULL,
  iban                TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  admin_note          TEXT,
  reviewed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  withdrawal_requests IS 'Tutor withdrawal requests. Minimum 100 QAR per request. Admin approves/rejects.';
COMMENT ON COLUMN withdrawal_requests.iban IS 'Stored plaintext for MVP. Encrypt at rest in production.';

CREATE INDEX idx_withdrawal_tutor_id ON withdrawal_requests(tutor_id);
CREATE INDEX idx_withdrawal_status   ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_wallet   ON withdrawal_requests(wallet_id);

-- ---------------------
-- wallet_transactions
-- Immutable financial ledger. No UPDATE. No DELETE.
-- Every balance change produces one row here.
-- ---------------------
CREATE TABLE wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     UUID NOT NULL REFERENCES wallet_accounts(id),
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  withdrawal_id UUID REFERENCES withdrawal_requests(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (
    type IN ('credit_pending', 'credit_available', 'debit_withdrawal', 'debit_refund')
  ),
  amount        NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  wallet_transactions IS 'Immutable ledger. INSERT only (service role). No UPDATE or DELETE ever.';
COMMENT ON COLUMN wallet_transactions.type IS 'credit_pending: tutor earning held. credit_available: released after completion. debit_withdrawal: withdrawal approved. debit_refund: refund processed.';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Snapshot of available_balance after this transaction.';

CREATE INDEX idx_wallet_tx_wallet_id  ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_tx_booking_id ON wallet_transactions(booking_id) WHERE booking_id IS NOT NULL;

-- ============================================================
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_wallet_tx_booking_id;
-- DROP INDEX IF EXISTS idx_wallet_tx_created_at;
-- DROP INDEX IF EXISTS idx_wallet_tx_wallet_id;
-- DROP TABLE IF EXISTS wallet_transactions;
-- DROP INDEX IF EXISTS idx_withdrawal_wallet;
-- DROP INDEX IF EXISTS idx_withdrawal_status;
-- DROP INDEX IF EXISTS idx_withdrawal_tutor_id;
-- DROP TABLE IF EXISTS withdrawal_requests;
-- DROP INDEX IF EXISTS idx_wallet_tutor_id;
-- DROP TABLE IF EXISTS wallet_accounts;
-- DROP INDEX IF EXISTS idx_payments_tap_charge_id;
-- DROP INDEX IF EXISTS idx_payments_status;
-- DROP INDEX IF EXISTS idx_payments_student_id;
-- DROP INDEX IF EXISTS idx_payments_booking_id;
-- DROP TABLE IF EXISTS payments;
-- ============================================================
