-- ============================================================
-- Migration: 014_role_escalation_protection
-- Description: Database-level block on self-modification of role and is_active.
--
-- Problem: The RLS UPDATE policy on users allows users to update their own row,
-- which technically permits a motivated attacker to submit an UPDATE with
-- role='admin' or is_active=false via the Supabase client directly.
--
-- Solution: A BEFORE UPDATE trigger that raises an exception if:
--   - The calling PostgreSQL role is NOT service_role
--   - AND the UPDATE attempts to change the `role` or `is_active` column
--
-- How role assignment works correctly:
--   - server action calls createAdminClient() (service role)
--   - admin client runs as 'service_role' PostgreSQL role
--   - trigger detects service_role → allows the change
--   - any other caller (authenticated, anon) → blocked by exception
--
-- Note: SECURITY INVOKER (default) is intentional so CURRENT_USER
-- reflects the PostgREST caller role, not the function owner.
-- Reversible: YES
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- service_role (admin client), postgres, and supabase_admin are permitted
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'permission_denied: role is immutable for end users. Admin action required.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'permission_denied: is_active is immutable for end users. Admin action required.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Only fires when an UPDATE explicitly includes role or is_active in the SET clause
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE OF role, is_active ON users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ============================================================
-- ROLLBACK:
-- DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON users;
-- DROP FUNCTION IF EXISTS public.prevent_role_escalation();
-- ============================================================
