import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-[var(--color-brand-cream)] flex items-center justify-center px-4">
        <div className="text-center flex flex-col items-center gap-6">
          {/* Big decorative 404 */}
          <div className="relative">
            <p className="text-[8rem] font-bold text-[var(--color-surface-high)] leading-none select-none">
              ٤٠٤
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-primary)] flex items-center justify-center text-white text-3xl">
                📚
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-w-sm">
            <h1 className="text-headline-lg text-[var(--color-text-main)]">الصفحة غير موجودة</h1>
            <p className="text-body-lg text-[var(--color-text-muted)]">
              يبدو أن الصفحة التي تبحث عنها لا وجود لها أو تم نقلها
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild>
              <Link href="/">العودة للرئيسية</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/tutors">ابحث عن مدرس</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
