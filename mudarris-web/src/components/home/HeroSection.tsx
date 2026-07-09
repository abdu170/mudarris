"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ShieldCheck, Star, Clock } from "lucide-react";
import { SUBJECTS, GRADE_LEVELS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

const selectClasses =
  "w-full h-11 px-3.5 pl-9 rounded-[var(--radius-md)] appearance-none bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-label-md text-[var(--color-text-main)] transition-all duration-150 hover:border-[var(--color-outline)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/15 cursor-pointer";

export function HeroSection() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [mode, setMode] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (grade)   params.set("grade", grade);
    if (mode)    params.set("mode", mode);
    router.push(`/tutors?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden bg-[var(--color-brand-cream)] pt-16 pb-20 sm:pt-20 sm:pb-24">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[var(--color-brand-primary)] opacity-[0.04] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[var(--color-brand-gold)] opacity-[0.06] -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container-page relative">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-primary)]/5 border border-[var(--color-brand-primary)]/15 text-label-sm text-[var(--color-brand-primary)] font-semibold">
            🇶🇦 منصة الدروس الخصوصية الموثوقة في قطر
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-display text-center text-[var(--color-text-main)] max-w-3xl mx-auto mb-5 text-balance">
          احصل على{" "}
          <span className="text-[var(--color-brand-primary)]">مدرسك المناسب</span>
          {" "}خلال دقائق
        </h1>

        <p className="text-body-lg text-center text-[var(--color-text-muted)] max-w-xl mx-auto mb-8">
          مدرسون موثوقون في جميع المواد الدراسية — دروس أونلاين وحضورية بأسعار واضحة ودفع آمن
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Button size="lg" asChild className="sm:min-w-44">
            <Link href="/signup/student">ابدأ الآن</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild className="sm:min-w-44">
            <Link href="/tutors">تصفح المدرسين</Link>
          </Button>
        </div>

        {/* Search card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-card-hover)] p-4 sm:p-5 border border-[var(--color-outline-soft)]/60">
            <p className="text-label-md font-semibold text-[var(--color-text-main)] mb-3">
              أو ابحث مباشرة عن مدرس
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {/* Subject */}
              <div className="relative">
                <label htmlFor="hero-subject" className="sr-only">المادة الدراسية</label>
                <select
                  id="hero-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">المادة الدراسية</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              </div>

              {/* Grade */}
              <div className="relative">
                <label htmlFor="hero-grade" className="sr-only">المرحلة الدراسية</label>
                <select
                  id="hero-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">المرحلة الدراسية</option>
                  {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              </div>

              {/* Mode */}
              <div className="relative">
                <label htmlFor="hero-mode" className="sr-only">نوع الدرس</label>
                <select
                  id="hero-mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">نوع الدرس</option>
                  <option value="online">أونلاين</option>
                  <option value="in-person">حضوري</option>
                  <option value="both">أونلاين وحضوري</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handleSearch}>
              <Search className="w-5 h-5" />
              ابحث عن مدرس
            </Button>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["رياضيات", "فيزياء", "كيمياء", "إنجليزي", "عربي"].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  router.push(`/tutors?subject=${encodeURIComponent(tag)}`);
                }}
                className="px-3.5 py-1.5 min-h-[36px] rounded-full bg-white border border-[var(--color-outline-soft)] text-label-sm text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12">
          {[
            { icon: <ShieldCheck className="w-4 h-4" />, label: "مدرسون موثوقون بوثائق مُراجعة" },
            { icon: <Star className="w-4 h-4" />,        label: "تقييمات حقيقية من الطلاب" },
            { icon: <Clock className="w-4 h-4" />,       label: "دفع آمن — لا يُحوَّل إلا بعد الدرس" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-label-md text-[var(--color-text-muted)]">
              <span className="text-[var(--color-brand-gold)]" aria-hidden="true">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
