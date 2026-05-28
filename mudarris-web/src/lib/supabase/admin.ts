import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

// Service role client — bypasses RLS. Never expose to frontend.
// Only import this file in server actions, API routes, and webhook handlers.
export function createAdminClient() {
  const serverEnv = getServerEnv();

  return createSupabaseClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
