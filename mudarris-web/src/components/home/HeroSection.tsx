"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { SUBJECTS, GRADE_LEVELS } from "@/lib/mock/tutors";
import { Button } from "@/components/ui/Button";

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
    <section className="relative overflow-hidden bg-[var(--color-brand-cream)] pt-16 pb-24">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[var(--color-brand-primary)] opacity-[0.04] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[var(--color-brand-gold)] opacity-[0.06] -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container-page relative">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-primary)] bg-opacity-10 border border-[var(--color-brand-primary)] border-opacity-20 text-label-sm text-[var(--color-brand-primary)] font-semibold">
            🇶🇦 منصة تعليمية في قطر
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-display text-center text-[var(--color-text-main)] max-w-3xl mx-auto mb-5">
          ابحث عن أفضل{" "}
          <span className="text-[var(--color-brand-primary)]">مدرس خصوصي</span>
          {" "}في قطر
        </h1>

        <p className="text-body-lg text-center text-[var(--color-text-muted)] max-w-xl mx-auto mb-10">
          أكثر من ٤٠٠ مدرس موثوق في جميع المواد — دروس أونلاين وحضورية بأسعار مناسبة
        </p>

        {/* Search card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-card-hover)] p-4 border border-[var(--color-outline-soft)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {/* Subject */}
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-3 pl-8 rounded-[var(--radius-sm)] appearance-none bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-label-md text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand-primary)] cursor-pointer"
                >
                  <option value="">المادة الدراسية</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              </div>

              {/* Grade */}
              <div className="relative">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full h-11 px-3 pl-8 rounded-[var(--radius-sm)] appearance-none bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-label-md text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand-primary)] cursor-pointer"
                >
                  <option value="">المرحلة الدراسية</option>
                  {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              </div>

              {/* Mode */}
              <div className="relative">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full h-11 px-3 pl-8 rounded-[var(--radius-sm)] appearance-none bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-label-md text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand-primary)] cursor-pointer"
                >
                  <option value="">نوع الدرس</option>
                  <option value="online">أونلاين</option>
                  <option value="in-person">حضوري</option>
                  <option value="both">أونلاين وحضوري</option>
                </select>
                <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
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
                className="px-3 py-1 rounded-full bg-white border border-[var(--color-outline-soft)] text-label-sm text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-12">
          {[
            { value: "+٤٠٠", label: "مدرس موثوق" },
            { value: "+٣٠٠٠", label: "طالب راضٍ" },
            { value: "٤.٨★", label: "متوسط التقييم" },
            { value: "٢٤/٧",  label: "دعم مستمر" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-headline-md text-[var(--color-brand-primary)] font-bold">{stat.value}</p>
              <p className="text-label-md text-[var(--color-text-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
