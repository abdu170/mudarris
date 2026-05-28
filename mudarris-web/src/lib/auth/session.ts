import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export async function getServerUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  return user;
}

// Returns full_name_ar from the users table for the current session user.
// Used by dashboard layouts to show the real user name.
export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("full_name_ar, role, is_active")
    .eq("id", user.id)
    .single();

  if (!data) return null;
  return { id: user.id, ...data, role: data.role as UserRole };
}

// Returns the current user's role from JWT app_metadata.
// More reliable than querying the users table for role checks.
export async function getSessionRole(): Promise<UserRole | null> {
  const user = await getServerUser();
  if (!user) return null;
  return (user.app_metadata?.role as UserRole) ?? null;
}
