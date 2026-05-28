import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | مُدرّس",
  description: "كيف تحمي منصة مُدرّس بياناتك الشخصية",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-brand-cream)]">
        <div className="container-page py-12 max-w-3xl mx-auto">
          <h1 className="text-headline-lg text-[var(--color-text-main)] mb-8">سياسة الخصوصية</h1>
          <div className="card p-8 flex flex-col gap-6 text-body-md text-[var(--color-text-muted)] leading-relaxed">
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">١. المعلومات التي نجمعها</h2>
              <p>نجمع المعلومات التي تقدمها عند التسجيل (الاسم، البريد الإلكتروني، رقم الهاتف)، ومعلومات الدفع، وبيانات الاستخدام والتصفح.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٢. كيف نستخدم بياناتك</h2>
              <p>نستخدم بياناتك لتقديم خدماتنا، وتحسين تجربتك، وإرسال الإشعارات المتعلقة بحجوزاتك، والتحقق من هوية المدرسين.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٣. مشاركة البيانات</h2>
              <p>لا نبيع بياناتك لأي طرف ثالث. نشارك البيانات الضرورية فقط مع مزودي الخدمة (مثل بوابة الدفع Tap ومنصة Merithub) لإتمام المعاملات.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٤. حقوقك</h2>
              <p>يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها. يمكنك التواصل معنا عبر البريد الإلكتروني لممارسة هذه الحقوق.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٥. الأمان</h2>
              <p>نستخدم تشفير SSL لجميع البيانات المنقولة، وتُخزن البيانات الحساسة مشفرة في قواعد بياناتنا الآمنة.</p>
            </section>
            <p className="text-label-sm border-t border-[var(--color-outline-soft)] pt-4">
              آخر تحديث: مايو ٢٠٢٦. للاستفسار: <a href="mailto:privacy@mudarris.qa" className="text-[var(--color-brand-primary)] hover:underline">privacy@mudarris.qa</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
