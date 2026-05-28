"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginAction } from "@/lib/actions/auth";

function LoginForm() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);

    const result = await loginAction(fd);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="card p-8">
      {(error || callbackError) && (
        <div className="mb-4 p-3 rounded-[var(--radius-sm)] bg-[var(--color-error-container)] text-[var(--color-error)] text-label-md">
          {error ?? "حدث خطأ. يرجى تسجيل الدخول مجدداً."}
        </div>
      )}

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

        <div className="flex flex-col gap-1">
          <Input
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <div className="flex justify-start mt-1">
            <Link href="/forgot-password" className="text-label-sm text-[var(--color-brand-primary)] hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">
          تسجيل الدخول
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--color-outline-soft)] flex flex-col gap-2 text-center">
        <p className="text-label-md text-[var(--color-text-muted)]">
          ليس لديك حساب؟{" "}
          <Link href="/signup/student" className="text-[var(--color-brand-primary)] font-semibold hover:underline">
            سجّل كطالب
          </Link>
        </p>
        <p className="text-label-md text-[var(--color-text-muted)]">
          تريد التدريس؟{" "}
          <Link href="/signup/tutor" className="text-[var(--color-brand-primary)] font-semibold hover:underline">
            انضم كمدرس
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--color-brand-cream)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-headline-md text-[var(--color-brand-primary)] font-bold">مُدرّس</span>
          </Link>
          <h1 className="text-headline-lg text-[var(--color-text-main)]">مرحباً بعودتك</h1>
          <p className="text-body-md text-[var(--color-text-muted)] mt-1">سجّل دخولك للمتابعة</p>
        </div>

        <Suspense fallback={
          <div className="card p-8 flex items-center justify-center min-h-[300px]">
            <span className="text-body-md text-[var(--color-text-muted)]">جاري التحميل...</span>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

