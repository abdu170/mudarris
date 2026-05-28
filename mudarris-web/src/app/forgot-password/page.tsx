"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO (Claude Code): implement Supabase password reset email
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-cream)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-headline-md text-[var(--color-brand-primary)] font-bold">مُدرّس</span>
          </Link>
          <h1 className="text-headline-lg text-[var(--color-text-main)]">استعادة كلمة المرور</h1>
          <p className="text-body-md text-[var(--color-text-muted)] mt-1 max-w-xs mx-auto">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--color-success-container)] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[var(--color-success)]" />
              </div>
              <h2 className="text-headline-sm">تم الإرسال!</h2>
              <p className="text-body-md text-[var(--color-text-muted)]">
                تفقد بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور
              </p>
              <Link href="/login" className="text-label-md text-[var(--color-brand-primary)] hover:underline font-semibold">
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                autoComplete="email"
              />
              <Button type="submit" fullWidth loading={loading} size="lg">
                إرسال رابط الاستعادة
              </Button>
              <Link
                href="/login"
                className="text-label-md text-[var(--color-text-muted)] text-center hover:text-[var(--color-brand-primary)] transition-colors"
              >
                العودة لتسجيل الدخول
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
