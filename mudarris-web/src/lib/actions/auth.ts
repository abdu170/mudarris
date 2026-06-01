"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeachingMode } from "@/lib/supabase/types";

export type AuthActionResult = {
  error?: string;
  needsEmailVerification?: boolean;
};

const ALLOWED_DOC_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic message — never distinguish "user not found" from "wrong password"
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "حدث خطأ. يرجى المحاولة مجدداً" };

  // Check is_active (suspended accounts)
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "هذا الحساب موقوف. يرجى التواصل مع الدعم." };
  }

  const role = user.app_metadata?.role as string | undefined;

  if (role === "admin") redirect("/admin");

  if (role === "tutor") {
    const { data: tutor } = await admin
      .from("tutors")
      .select("status")
      .eq("id", user.id)
      .single();

    if (tutor?.status === "approved") redirect("/tutor/dashboard");
    redirect("/tutor/pending");
  }

  redirect("/student/dashboard");
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Student Signup ───────────────────────────────────────────────────────────

const studentSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الجوال مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  grade: z.string().optional(),
});

export async function studentSignupAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = studentSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: (formData.get("email") as string | null)?.trim(),
    password: formData.get("password"),
    grade: formData.get("grade"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullName, phone, email, password, grade } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name_ar: fullName } },
  });

  if (signUpError || !authData.user) {
    return { error: "حدث خطأ في إنشاء الحساب. يرجى المحاولة مجدداً." };
  }

  const userId = authData.user.id;
  const admin = createAdminClient();

  // Role assigned server-side only (cannot be forged by client)
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "student" },
  });

  await admin.from("users").update({ role: "student", full_name_ar: fullName, phone }).eq("id", userId);

  const { error: profileError } = await admin.from("students").insert({
    id: userId,
    grade_level: grade ?? null,
  });

  if (profileError) {
    console.error("[studentSignup] students insert:", profileError.message);
    return { error: "حدث خطأ في إنشاء الملف الشخصي. يرجى المحاولة مجدداً." };
  }

  if (!authData.session) {
    return { needsEmailVerification: true };
  }

  redirect("/student/dashboard");
}

// ─── Tutor Signup ─────────────────────────────────────────────────────────────

const tutorSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل مطلوب"),
  displayName: z.string().min(2, "الاسم المعروض مطلوب"),
  phone: z.string().min(8, "رقم الجوال مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  bio: z.string().optional(),
  experience: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) || null : null)),
  teachingMode: z.enum(["online", "in_person", "both"]),
  hourlyPrice: z
    .string()
    .min(1, "السعر مطلوب")
    .transform((v) => parseFloat(v) || 0),
});

export async function tutorSignupAction(formData: FormData): Promise<AuthActionResult> {
  // Arrays are sent as comma-separated strings from the client
  const subjectsRaw = (formData.get("subjects") as string | null) ?? "";
  const gradeLevelsRaw = (formData.get("gradeLevels") as string | null) ?? "";
  const areasRaw = (formData.get("areas") as string | null) ?? "";
  const subjects = subjectsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const gradeLevels = gradeLevelsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const areas = areasRaw.split(",").map((s) => s.trim()).filter(Boolean);

  const parsed = tutorSchema.safeParse({
    fullName: formData.get("fullName"),
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    email: (formData.get("email") as string | null)?.trim(),
    password: formData.get("password"),
    bio: formData.get("bio"),
    experience: formData.get("experience"),
    teachingMode: formData.get("teachingMode"),
    hourlyPrice: formData.get("hourlyPrice"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (subjects.length === 0) return { error: "يرجى اختيار مادة دراسية واحدة على الأقل" };
  if (gradeLevels.length === 0) return { error: "يرجى اختيار مرحلة دراسية واحدة على الأقل" };

  // Require at least one academic certificate before creating the account
  const primaryAcademicCert = formData.get("doc_academic_certificate") as File | null;
  if (!primaryAcademicCert || primaryAcademicCert.size === 0) {
    return { error: "الشهادة الأكاديمية مطلوبة" };
  }

  const d = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: { data: { full_name_ar: d.fullName } },
  });

  if (signUpError || !authData.user) {
    return { error: "حدث خطأ في إنشاء الحساب. يرجى المحاولة مجدداً." };
  }

  const userId = authData.user.id;
  const admin = createAdminClient();

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "tutor" },
  });

  await admin
    .from("users")
    .update({ role: "tutor", full_name_ar: d.fullName, phone: d.phone })
    .eq("id", userId);

  const teachingModes: TeachingMode[] =
    d.teachingMode === "both" ? ["online", "in_person"] : [d.teachingMode];

  const { error: tutorError } = await admin.from("tutors").insert({
    id: userId,
    status: "pending",
    is_visible: false,
    display_name_ar: d.displayName,
    bio_ar: d.bio ?? null,
    subjects,
    grade_levels: gradeLevels,
    teaching_modes: teachingModes,
    areas,
    hourly_rate: d.hourlyPrice,
    years_experience: d.experience,
  });

  if (tutorError) {
    console.error("[tutorSignup] tutors insert:", tutorError.message);
    return { error: "حدث خطأ في إنشاء الملف الشخصي. يرجى المحاولة مجدداً." };
  }

  // Document uploads (server-side validation: MIME + size)
  const docFields: Array<{ key: string; type: string }> = [
    { key: "doc_national_id", type: "national_id" },
    { key: "doc_academic_certificate", type: "academic_certificate" },
  ];
  // Additional certificates uploaded via the dynamic "+ إضافة شهادة أخرى" UI
  for (let i = 0; i < 10; i++) {
    const key = `doc_additional_certificate_${i}`;
    const file = formData.get(key) as File | null;
    if (!file || file.size === 0) break;
    docFields.push({ key, type: "additional_certificate" });
  }

  for (const { key, type } of docFields) {
    const file = formData.get(key) as File | null;
    if (!file || file.size === 0) continue;

    if (!ALLOWED_DOC_MIMES.has(file.type)) {
      console.warn(`[tutorSignup] Skipping ${type}: invalid MIME ${file.type}`);
      continue;
    }
    if (file.size > MAX_DOC_BYTES) {
      console.warn(`[tutorSignup] Skipping ${type}: exceeds 10MB`);
      continue;
    }

    const extMap: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = extMap[file.type] ?? "bin";
    const storagePath = `${userId}/${type}_${Date.now()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const { error: storageError } = await admin.storage
      .from("tutor-documents")
      .upload(storagePath, bytes, { contentType: file.type });

    if (storageError) {
      console.error(`[tutorSignup] Storage error for ${type}:`, storageError.message);
      continue;
    }

    await admin.from("tutor_documents").insert({
      tutor_id: userId,
      document_type: type,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    });
  }

  if (!authData.session) {
    return { needsEmailVerification: true };
  }

  redirect("/tutor/pending");
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!email) return { error: "البريد الإلكتروني مطلوب" };

  const supabase = await createClient();
  const { publicEnv } = await import("@/lib/env");

  // Always return success — no enumeration of registered emails
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  });

  return {};
}

// ─── Update Password (password reset completion) ──────────────────────────────
// Called from /auth/update-password after user follows reset email link.
// Supabase's auth/callback handler exchanges the recovery code for a session
// before this action is reached.

export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const password = (formData.get("password") as string | null) ?? "";
  const confirm  = (formData.get("confirmPassword") as string | null) ?? "";

  if (!password || password.length < 8) {
    return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
  }
  if (password !== confirm) {
    return { error: "كلمتا المرور غير متطابقتين" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "تعذّر تحديث كلمة المرور. يرجى المحاولة مجدداً." };
  }

  redirect("/login?message=password_updated");
}
