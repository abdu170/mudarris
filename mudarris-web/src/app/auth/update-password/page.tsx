"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updatePasswordAction } from "@/lib/actions/auth";

export default function UpdatePasswordPage() {
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("password", password);
    fd.append("confirmPassword", confirm);

    const result = await updatePasswordAction(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-cream)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">مدرّس</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">تعيين كلمة مرور جديدة</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">أدخل كلمة المرور الجديدة لحسابك</p>
        </div>

        <div className="bg-white rounded-[var(--radius-lg)] p-8 shadow-sm border border-[var(--color-border)]">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                تم تحديث كلمة المرور
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
              </p>
              <Link href="/login">
                <Button className="w-full">تسجيل الدخول</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-700 text-sm text-right">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1 text-right">
                  كلمة المرور الجديدة
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  required
                  minLength={8}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1 text-right">
                  تأكيد كلمة المرور
                </label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  minLength={8}
                  dir="ltr"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-[var(--color-brand-primary)] hover:underline">
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
