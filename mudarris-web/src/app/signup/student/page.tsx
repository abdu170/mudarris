"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { GRADE_LEVELS } from "@/lib/constants";
import { studentSignupAction } from "@/lib/actions/auth";

const CURRICULA = [
  { value: "qatar", label: "المنهج القطري" },
  { value: "igcse", label: "IGCSE" },
  { value: "ib",    label: "IB" },
  { value: "us",    label: "المنهج الأمريكي" },
];

export default function StudentSignupPage() {
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", password: "",
    grade: "", curriculum: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("fullName", form.fullName);
    fd.append("phone", form.phone);
    fd.append("email", form.email);
    fd.append("password", form.password);
    fd.append("grade", form.grade);

    const result = await studentSignupAction(fd);
    if (result?.error) {
      setError(result.error);
    } else if (result?.needsEmailVerification) {
      setEmailSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-cream)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-headline-md text-[var(--color-brand-primary)] font-bold">مُدرّس</span>
          </Link>
          <h1 className="text-headline-lg text-[var(--color-text-main)]">إنشاء حساب طالب</h1>
          <p className="text-body-md text-[var(--color-text-muted)] mt-1">
            ابدأ رحلة التعلم مع أفضل المدرسين في قطر
          </p>
        </div>

        <div className="card p-8">
          {emailSent ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[var(--color-brand-primary)] bg-opacity-10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-[var(--color-brand-primary)]" />
              </div>
              <h2 className="text-headline-sm text-[var(--color-text-main)]">تحقق من بريدك الإلكتروني</h2>
              <p className="text-body-md text-[var(--color-text-muted)]">
                أرسلنا رابط التفعيل إلى{" "}
                <span className="font-semibold">{form.email}</span>.
                افتح بريدك وانقر على الرابط لتفعيل حسابك.
              </p>
              <Link href="/login" className="text-label-md text-[var(--color-brand-primary)] hover:underline font-semibold">
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                {error && (
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-error-container)] text-[var(--color-error)] text-label-md">
                    {error}
                  </div>
                )}

                <Input
                  label="الاسم الكامل"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="محمد عبدالله"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="رقم الجوال"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+974 XXXX XXXX"
                    required
                  />
                  <Input
                    label="البريد الإلكتروني"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <Input
                  label="كلمة المرور"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="٨ أحرف على الأقل"
                  required
                  hint="يجب أن تكون ٨ أحرف على الأقل"
                />

                <Select
                  label="المرحلة الدراسية"
                  options={GRADE_LEVELS.map((g) => ({ value: g, label: g }))}
                  value={form.grade}
                  onChange={(e) => update("grade", e.target.value)}
                  placeholder="اختر المرحلة"
                  required
                />

                <Select
                  label="المنهج الدراسي"
                  options={CURRICULA}
                  value={form.curriculum}
                  onChange={(e) => update("curriculum", e.target.value)}
                  placeholder="اختر المنهج"
                  required
                />

                {/* Consent */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required className="mt-1 accent-[var(--color-brand-primary)]" />
                  <span className="text-label-md text-[var(--color-text-muted)] leading-relaxed">
                    أوافق على{" "}
                    <Link href="/terms" className="text-[var(--color-brand-primary)] hover:underline">شروط الخدمة</Link>
                    {" "}و{" "}
                    <Link href="/privacy" className="text-[var(--color-brand-primary)] hover:underline">سياسة الخصوصية</Link>
                  </span>
                </label>

                <Button type="submit" fullWidth loading={loading} size="lg">
                  إنشاء الحساب
                </Button>
              </form>

              <p className="mt-5 text-center text-label-md text-[var(--color-text-muted)]">
                لديك حساب بالفعل؟{" "}
                <Link href="/login" className="text-[var(--color-brand-primary)] font-semibold hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
