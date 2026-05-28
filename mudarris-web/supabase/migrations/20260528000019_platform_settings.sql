-- ============================================================
-- Migration: 019_platform_settings
-- Description: Configurable platform settings (commission rate, etc.)
--
-- Design:
--   - Simple key/value table
--   - commission_pct stored as integer string (e.g. '15' = 15%)
--   - Admin-only RLS (read + update)
--   - No client writes ever
--
-- Reversible: YES — see ROLLBACK section
-- ============================================================

CREATE TABLE platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  platform_settings IS 'Configurable platform settings. Writes via admin server action only.';
COMMENT ON COLUMN platform_settings.key   IS 'Setting name. Known keys: commission_pct (integer percent, e.g. 15).';
COMMENT ON COLUMN platform_settings.value IS 'Setting value as text. Parse according to key semantics.';

-- Seed default commission
INSERT INTO platform_settings (key, value)
VALUES ('commission_pct', '15');

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read all settings
CREATE POLICY "settings_admin_select"
  ON platform_settings FOR SELECT
  USING (public.is_admin());

-- Admins can update settings
CREATE POLICY "settings_admin_update"
  ON platform_settings FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Helper function: get_commission_pct ────────────────────────────────────
-- Returns current commission as a decimal multiplier (e.g. 0.15).
-- SECURITY DEFINER so it bypasses RLS — can be called from any context.
-- Used by booking creation RPCs and server actions.

CREATE OR REPLACE FUNCTION public.get_commission_pct()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_pct NUMERIC;
BEGIN
  SELECT value::NUMERIC INTO v_pct
  FROM platform_settings
  WHERE key = 'commission_pct';

  RETURN COALESCE(v_pct, 15) / 100.0;
END;
$$;

COMMENT ON FUNCTION public.get_commission_pct IS
  'Returns platform commission as decimal (e.g. 0.15). Falls back to 0.15 if setting missing.';

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE TRIGGER trg_set_updated_at_platform_settings
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROLLBACK:
-- DROP TRIGGER  IF EXISTS trg_set_updated_at_platform_settings ON platform_settings;
-- DROP FUNCTION IF EXISTS public.get_commission_pct();
-- DROP POLICY   IF EXISTS "settings_admin_update" ON platform_settings;
-- DROP POLICY   IF EXISTS "settings_admin_select" ON platform_settings;
-- DROP TABLE    IF EXISTS platform_settings;
-- ============================================================
