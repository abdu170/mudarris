import Link from "next/link";
import { Shield, Award, Clock, HeadphonesIcon, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

const benefits = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "مدرسون موثوقون",
    description: "كل مدرس يجتاز مراجعة وثائق دقيقة قبل الظهور في المنصة",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "تقارير AI بعد كل حصة",
    description: "تقرير عربي تفصيلي عن أداء طفلك يُرسل تلقائياً بعد كل درس أونلاين",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "مرونة تامة في المواعيد",
    description: "احجز الوقت الذي يناسبك من جدول المدرس أونلاين وحضورياً",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "دفع آمن ومحمي",
    description: "لا تُحوَّل الأموال للمدرس إلا بعد إتمام الدرس بنجاح",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "مرتبط بالمنهج القطري",
    description: "المدرسون على دراية تامة بمناهج وزارة التعليم القطرية",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "تتبع التقدم",
    description: "راقب تقدم طفلك في كل مادة عبر لوحة تحكم واضحة",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20">
      <div className="container-page">
        <div className="text-center mb-12">
          <h2 className="text-headline-lg text-[var(--color-text-main)] mb-3">
            لماذا تختار مُدرّس؟
          </h2>
          <p className="text-body-lg text-[var(--color-text-muted)] max-w-lg mx-auto">
            منصة مصممة خصيصاً لاحتياجات التعليم في قطر
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex gap-4 p-5 bg-white rounded-[var(--radius-lg)] border border-[var(--color-outline-soft)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] bg-opacity-10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                {b.icon}
              </div>
              <div>
                <h3 className="text-headline-sm text-[var(--color-text-main)] mb-1">{b.title}</h3>
                <p className="text-body-md text-[var(--color-text-muted)]">{b.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup/student">ابدأ رحلة التعلم</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/signup/tutor">انضم كمدرس</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
