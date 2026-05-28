import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شروط الخدمة | مُدرّس",
  description: "اقرأ شروط وأحكام استخدام منصة مُدرّس للتعليم الخصوصي في قطر",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-brand-cream)]">
        <div className="container-page py-12 max-w-3xl mx-auto">
          <h1 className="text-headline-lg text-[var(--color-text-main)] mb-8">شروط الخدمة</h1>
          <div className="card p-8 flex flex-col gap-6 text-body-md text-[var(--color-text-muted)] leading-relaxed">
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">١. قبول الشروط</h2>
              <p>باستخدامك لمنصة مُدرّس، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام المنصة.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٢. الخدمات المقدمة</h2>
              <p>مُدرّس هي منصة وسيطة تربط المدرسين الخصوصيين بالطلاب في دولة قطر. المنصة مسؤولة عن تسهيل التواصل والحجز والمدفوعات فحسب.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٣. متطلبات التسجيل</h2>
              <p>يجب أن يكون عمر المستخدم ١٨ عاماً أو أكثر. المعلومات المقدمة يجب أن تكون صحيحة ودقيقة. المدرسون ملزمون بتقديم وثائق تثبت مؤهلاتهم.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٤. سياسة الحجز والإلغاء</h2>
              <p>يمكن إلغاء الحجز قبل ٢٤ ساعة من موعد الدرس لاسترداد كامل. الإلغاء بعد ٢٤ ساعة يخضع لسياسة الاسترداد المفصلة في وثيقة سياسة الاسترداد.</p>
            </section>
            <section>
              <h2 className="text-headline-sm text-[var(--color-text-main)] mb-3">٥. الخصوصية وحماية البيانات</h2>
              <p>نلتزم بالحفاظ على خصوصية بياناتك وفقاً لقوانين حماية البيانات المعمول بها في دولة قطر. لمزيد من التفاصيل، اقرأ سياسة الخصوصية الخاصة بنا.</p>
            </section>
            <p className="text-label-sm border-t border-[var(--color-outline-soft)] pt-4">
              آخر تحديث: مايو ٢٠٢٦. للاستفسار: <a href="mailto:legal@mudarris.qa" className="text-[var(--color-brand-primary)] hover:underline">legal@mudarris.qa</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
