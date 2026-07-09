import Link from "next/link";
import { BookOpen, Clock, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/lib/actions/auth";
import { getSessionProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "طلبك قيد المراجعة — مُدرّس" };

export default async function TutorPendingPage() {
  const profile = await getSessionProfile();
  const admin = createAdminClient();

  let tutorStatus: string = "pending";
  if (profile) {
    const { data } = await admin
      .from("tutors")
      .select("status, rejection_reason")
      .eq("id", profile.id)
      .single();
    if (data) tutorStatus = data.status;

    // Approved tutors who somehow reach this page get redirected
    if (tutorStatus === "approved") {
      const { redirect } = await import("next/navigation");
      redirect("/tutor/dashboard");
    }
  }

  const isRejected = tutorStatus === "rejected";

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
        </div>

        <div className="card p-8 text-center flex flex-col items-center gap-5">
          {isRejected ? (
            <>
              <div className="w-16 h-16 rounded-full bg-[var(--color-error-container)] flex items-center justify-center">
                <Mail className="w-8 h-8 text-[var(--color-error)]" />
              </div>
              <div>
                <h1 className="text-headline-md text-[var(--color-text-main)] mb-2">
                  لم يتم قبول الطلب
                </h1>
                <p className="text-body-md text-[var(--color-text-muted)]">
                  نأسف، لم يتم قبول طلبك في هذه المرة. سيتواصل معك فريقنا على بريدك الإلكتروني لمزيد من التفاصيل.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-[var(--color-brand-primary)]" />
              </div>
              <div>
                <h1 className="text-headline-md text-[var(--color-text-main)] mb-2">
                  طلبك قيد المراجعة
                </h1>
                <p className="text-body-md text-[var(--color-text-muted)]">
                  شكراً لتسجيلك كمدرس في منصة مُدرّس. يراجع فريقنا طلبك الآن وسيتواصل معك خلال 1–3 أيام عمل.
                </p>
              </div>

              <div className="w-full bg-[var(--color-surface-low)] rounded-[var(--radius-md)] p-4 text-right flex flex-col gap-3">
                {[
                  "مراجعة وثائقك وشهاداتك",
                  "التحقق من بياناتك الشخصية",
                  "إعداد ملفك الشخصي للنشر",
                ].map((step) => (
                  <div key={step} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
                    <span className="text-label-md text-[var(--color-text-muted)]">{step}</span>
                  </div>
                ))}
              </div>

              <p className="text-label-sm text-[var(--color-text-muted)]">
                ستصلك رسالة بريد إلكتروني عند الموافقة على طلبك.
              </p>
            </>
          )}

          <form action={logoutAction} className="w-full">
            <Button type="submit" variant="secondary" fullWidth>
              تسجيل الخروج
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
