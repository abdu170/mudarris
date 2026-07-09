import { Search, CheckCircle2, CreditCard, BookOpen } from "lucide-react";

const steps = [
  {
    step: "١",
    icon: <Search className="w-6 h-6" />,
    title: "ابحث عن مدرس",
    description: "تصفح مئات المدرسين الموثوقين وقارن بينهم حسب المادة والسعر والمنطقة",
  },
  {
    step: "٢",
    icon: <BookOpen className="w-6 h-6" />,
    title: "احجز موعداً",
    description: "اختر الوقت المناسب من جدول المدرس واطلب الحصة بسهولة",
  },
  {
    step: "٣",
    icon: <CreditCard className="w-6 h-6" />,
    title: "ادفع بأمان",
    description: "بعد موافقة المدرس، ادفع عبر بوابة Tap الآمنة — مال محمي حتى إتمام الدرس",
  },
  {
    step: "٤",
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "تعلم وتقدم",
    description: "احضر الدرس أونلاين أو حضورياً واحصل على تقرير AI بعد كل حصة",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-[var(--color-surface-low)]">
      <div className="container-page">
        <div className="text-center mb-12">
          <h2 className="text-headline-lg text-[var(--color-text-main)] mb-3">
            كيف تعمل المنصة؟
          </h2>
          <p className="text-body-lg text-[var(--color-text-muted)] max-w-lg mx-auto">
            أربع خطوات بسيطة للبدء في رحلة التعلم
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.step} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-0 w-full h-px bg-[var(--color-outline-soft)] z-0" />
              )}

              <div className="relative z-10 flex flex-col items-start gap-4 p-6 h-full bg-white rounded-[var(--radius-lg)] border border-[var(--color-outline-soft)]/60 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 transition-all duration-200">
                {/* Step number + icon */}
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] text-white shadow-[var(--shadow-btn)] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-display text-[var(--color-brand-primary)]/10 font-bold leading-none select-none mr-auto" aria-hidden="true">
                    {step.step}
                  </span>
                </div>

                <div>
                  <h3 className="text-headline-sm text-[var(--color-text-main)] mb-1">{step.title}</h3>
                  <p className="text-body-md text-[var(--color-text-muted)] leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
