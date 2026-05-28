import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الاسترداد | مُدرّس",
};

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-brand-cream)]">
        <div className="container-page py-12 max-w-3xl mx-auto">
          <h1 className="text-headline-lg text-[var(--color-text-main)] mb-8">سياسة الاسترداد</h1>
          <div className="card p-8 flex flex-col gap-6 text-body-md text-[var(--color-text-muted)] leading-relaxed">
            <div className="bg-[var(--color-success-container)] border border-[var(--color-success)] rounded-[var(--radius-md)] p-4">
              <p className="text-body-md text-[var(--color-success)] font-semibold">
                ✓ نهجنا: حماية أموالك حتى إتمام الدرس بنجاح
              </p>
            </div>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">الإلغاء قبل ٢٤ ساعة</h2>
              <p>استرداد كامل ١٠٠٪ من قيمة الدرس دون أي رسوم.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">الإلغاء بين ٢٤ وساعة واحدة قبل الدرس</h2>
              <p>استرداد ٥٠٪ من قيمة الدرس.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">الإلغاء في آخر ساعة</h2>
              <p>لا يُسترد المبلغ إلا في حالات القوة القاهرة الموثقة.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">غياب المدرس</h2>
              <p>في حال عدم حضور المدرس، يُسترد المبلغ كاملاً خلال ٢٤ ساعة.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">النزاعات</h2>
              <p>يمكنك فتح نزاع خلال ٤٨ ساعة من انتهاء الدرس. تراجع الإدارة النزاع وتصدر قراراً خلال ٣ أيام عمل.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
