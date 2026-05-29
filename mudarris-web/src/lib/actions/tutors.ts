"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

// ─── Public-facing tutor types ──────────────────────────────────────────────

export type TutorListItem = {
  id: string;
  displayName: string;
  avatar: string | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
  teachingMode: "online" | "in-person" | "both";
  hourlyPrice: number;
  subjects: string[];
  gradeLevels: string[];
  areas: string[];
  availableToday: boolean;
};

export type TutorProfile = TutorListItem & {
  bio: string;
  experience: number;
  curriculum: string[];
};

// ─── Derive display teaching mode ───────────────────────────────────────────

function derivePrimaryMode(modes: string[]): "online" | "in-person" | "both" {
  if (!modes || modes.length === 0) return "online";
  if (modes.includes("both") || (modes.includes("online") && modes.includes("in_person"))) return "both";
  if (modes.includes("in_person")) return "in-person";
  return "online";
}

// ─── Get tutor listing ──────────────────────────────────────────────────────

export interface TutorFilters {
  subject?: string;
  gradeLevel?: string;
  area?: string;
  teachingMode?: string;
  gender?: string;
  sortBy?: string;
}

export async function getTutorsAction(
  filters: TutorFilters = {},
): Promise<ActionResult<TutorListItem[]>> {
  const admin = createAdminClient();

  let query = admin
    .from("tutors")
    .select(`
      id,
      display_name_ar,
      subjects,
      grade_levels,
      teaching_modes,
      areas,
      hourly_rate,
      rating,
      review_count,
      users!tutors_id_fkey!inner ( full_name_ar, avatar_url )
    `)
    .eq("status", "approved")
    .eq("is_visible", true);

  if (filters.subject) query = query.contains("subjects", [filters.subject]);
  if (filters.gradeLevel) query = query.contains("grade_levels", [filters.gradeLevel]);
  if (filters.area) query = query.contains("areas", [filters.area]);

  if (filters.sortBy === "rating") query = query.order("rating", { ascending: false });
  else if (filters.sortBy === "price_asc") query = query.order("hourly_rate", { ascending: true });
  else query = query.order("review_count", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[getTutors]", error.message);
    return { error: "تعذّر تحميل قائمة المدرسين" };
  }

  const items: TutorListItem[] = (data ?? []).map((t: any) => {
    const mode = derivePrimaryMode(t.teaching_modes ?? []);
    return {
      id: t.id,
      displayName: t.display_name_ar ?? t.users?.full_name_ar ?? "—",
      avatar: t.users?.avatar_url ?? null,
      verified: true,
      rating: t.rating ?? 0,
      reviewCount: t.review_count ?? 0,
      teachingMode: mode,
      hourlyPrice: t.hourly_rate ?? 0,
      subjects: t.subjects ?? [],
      gradeLevels: t.grade_levels ?? [],
      areas: t.areas ?? [],
      availableToday: false,
    };
  });

  // Client-side teaching mode filter (DB stores array, filter is for display mode)
  const filtered = filters.teachingMode
    ? items.filter((t) => {
        const m = filters.teachingMode!;
        if (m === "online") return t.teachingMode === "online" || t.teachingMode === "both";
        if (m === "in-person") return t.teachingMode === "in-person" || t.teachingMode === "both";
        if (m === "both") return t.teachingMode === "both";
        return true;
      })
    : items;

  return { data: filtered };
}

// ─── Get single tutor profile ───────────────────────────────────────────────

export async function getTutorProfileAction(
  tutorId: string,
): Promise<ActionResult<TutorProfile | null>> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("tutors")
    .select(`
      id,
      display_name_ar,
      bio_ar,
      subjects,
      grade_levels,
      teaching_modes,
      areas,
      hourly_rate,
      rating,
      review_count,
      years_experience,
      users!tutors_id_fkey!inner ( full_name_ar, avatar_url )
    `)
    .eq("id", tutorId)
    .eq("status", "approved")
    .eq("is_visible", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { data: null };
    console.error("[getTutorProfile]", error.message);
    return { error: "تعذّر تحميل ملف المدرس" };
  }

  if (!data) return { data: null };

  const t = data as any;
  const mode = derivePrimaryMode(t.teaching_modes ?? []);

  return {
    data: {
      id: t.id,
      displayName: t.display_name_ar ?? t.users?.full_name_ar ?? "—",
      avatar: t.users?.avatar_url ?? null,
      verified: true,
      rating: t.rating ?? 0,
      reviewCount: t.review_count ?? 0,
      teachingMode: mode,
      hourlyPrice: t.hourly_rate ?? 0,
      subjects: t.subjects ?? [],
      gradeLevels: t.grade_levels ?? [],
      areas: t.areas ?? [],
      availableToday: false,
      bio: t.bio_ar ?? "",
      experience: t.years_experience ?? 0,
      curriculum: [],
    },
  };
}
