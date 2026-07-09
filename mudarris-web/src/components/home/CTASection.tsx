import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="py-20 surface-brand-deep">
      <div className="container-page text-center">
        {/* Decorative shapes */}
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-[var(--color-brand-gold)]/10 -translate-y-1/2" />
          </div>

          <div className="relative z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-label-sm font-semibold mb-6">
              ابدأ اليوم مجاناً
            </span>

            <h2 className="text-headline-lg text-white mb-4 max-w-2xl mx-auto">
              هل أنت مستعد للتميز الدراسي؟
            </h2>

            <p className="text-body-lg text-white/80 max-w-md mx-auto mb-10">
              انضم إلى طلاب قطر الذين يتعلمون مع أفضل المدرسين الموثوقين
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[var(--color-brand-primary)] shadow-none hover:bg-[var(--color-brand-cream)] sm:min-w-44"
                asChild
              >
                <Link href="/signup/student">ابدأ كطالب</Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="bg-transparent border-white/60 text-white shadow-none hover:bg-white/10 hover:border-white sm:min-w-44"
                asChild
              >
                <Link href="/signup/tutor">انضم كمدرس</Link>
              </Button>
            </div>

            <p className="mt-6 text-label-sm text-white/60">
              التسجيل مجاني · لا توجد رسوم شهرية · ادفع فقط عند الحجز
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
