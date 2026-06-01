"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";

export type StudentProfileResult = {
  error?: string;
  success?: boolean;
};

const updateProfileSchema = z.object({
  fullNameAr: z.string().min(2, "الاسم الكامل مطلوب"),
  phone: z.string().optional(),
  gradeLevel: z.string().optional(),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export async function updateStudentProfileAction(
  formData: FormData,
): Promise<StudentProfileResult> {
  const user = await requireAuth();

  const parsed = updateProfileSchema.safeParse({
    fullNameAr: (formData.get("fullNameAr") as string | null)?.trim(),
    phone: (formData.get("phone") as string | null)?.trim() || undefined,
    gradeLevel: (formData.get("gradeLevel") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullNameAr, phone, gradeLevel } = parsed.data;
  const supabase = await createClient();

  const { error: userError } = await supabase
    .from("users")
    .update({ full_name_ar: fullNameAr, phone: phone ?? null })
    .eq("id", user.id);

  if (userError) {
    return { error: "تعذّر تحديث الملف الشخصي. يرجى المحاولة مجدداً." };
  }

  const { error: studentError } = await supabase
    .from("students")
    .update({ grade_level: gradeLevel ?? null })
    .eq("id", user.id);

  if (studentError) {
    return { error: "تعذّر تحديث بيانات الطالب. يرجى المحاولة مجدداً." };
  }

  return { success: true };
}

export async function updateStudentPasswordAction(
  formData: FormData,
): Promise<StudentProfileResult> {
  const user = await requireAuth();

  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { currentPassword, newPassword } = parsed.data;
  const supabase = await createClient();

  // Verify old password before updating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "كلمة المرور الحالية غير صحيحة" };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

  if (updateError) {
    return { error: "تعذّر تحديث كلمة المرور. يرجى المحاولة مجدداً." };
  }

  return { success: true };
}
