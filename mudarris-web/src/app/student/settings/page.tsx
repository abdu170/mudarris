import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import StudentSettingsClient from "./StudentSettingsClient";

export default async function StudentSettingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: userRow }, { data: studentRow }] = await Promise.all([
    supabase.from("users").select("full_name_ar, phone").eq("id", user.id).single(),
    supabase.from("students").select("grade_level").eq("id", user.id).single(),
  ]);

  return (
    <StudentSettingsClient
      initialProfile={{
        fullNameAr: userRow?.full_name_ar ?? "",
        email: user.email ?? "",
        phone: userRow?.phone ?? null,
        gradeLevel: studentRow?.grade_level ?? null,
      }}
    />
  );
}
