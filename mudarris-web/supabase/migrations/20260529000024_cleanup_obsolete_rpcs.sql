-- Migration: 20260529000024_cleanup_obsolete_rpcs
-- Description: Drop obsolete 4-parameter check_booking_conflict function from migration 013

DROP FUNCTION IF EXISTS public.check_booking_conflict(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ);
