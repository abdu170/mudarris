"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Camera, Check, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SUBJECTS, GRADE_LEVELS, AREAS } from "@/lib/constants";
import { tutorSignupAction } from "@/lib/actions/auth";

const STEPS = [
  { label: "المعلومات الشخصية", number: 1 },
  { label: "معلومات التدريس",   number: 2 },
  { label: "الأسعار والتوفر",   number: 3 },
  { label: "الوثائق",          number: 4 },
];

function CheckboxGroup({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={cn(
            "px-3 py-1.5 rounded-full text-label-sm border transition-all duration-150",
            selected.includes(item)
              ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]"
              : "bg-white text-[var(--color-text-muted)] border-[var(--color-outline-soft)] hover:border-[var(--color-brand-primary)]"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

interface CertSlot {
  id: number;
  file: File | null;
}

export default function TutorSignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [form, setForm] = useState({
    fullName: "", displayName: "", phone: "", email: "", password: "",
    subjects: [] as string[], gradeLevels: [] as string[], experience: "",
    bio: "", teachingMode: "", areas: [] as string[], hourlyPrice: "",
    curriculum: [] as string[], documents: [] as File[],
  });

  const [docAvatarPhoto, setDocAvatarPhoto]   = useState<File | null>(null);
  const [docNationalId, setDocNationalId]     = useState<File | null>(null);
  const [docAcademicCert, setDocAcademicCert] = useState<File | null>(null);
  const [additionalCerts, setAdditionalCerts] = useState<CertSlot[]>([]);

  const refAvatarPhoto  = useRef<HTMLInputElement>(null);
  const refNationalId   = useRef<HTMLInputElement>(null);
  const refAcademicCert = useRef<HTMLInputElement>(null);
  const additionalCertRefs = useRef<(HTMLInputElement | null)[]>([]);
  const nextCertId = useRef(0);

  function update(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleItem(key: "subjects" | "gradeLevels" | "areas" | "curriculum", val: string) {
    setForm((f) => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  }

  function addCertSlot() {
    const id = nextCertId.current++;
    setAdditionalCerts((prev) => [...prev, { id, file: null }]);
  }

  function removeCertSlot(id: number) {
    setAdditionalCerts((prev) => prev.filter((c) => c.id !== id));
  }

  function setCertFile(id: number, file: File | null) {
    setAdditionalCerts((prev) => prev.map((c) => (c.id === id ? { ...c, file } : c)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 4) { setStep((s) => s + 1); return; }

    if (!docAcademicCert) {
      setError("يجب رفع الشهادة الأكاديمية");
      return;
    }

    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("fullName", form.fullName);
    fd.append("displayName", form.displayName);
    fd.append("phone", form.phone);
    fd.append("email", form.email);
    fd.append("password", form.password);
    fd.append("bio", form.bio);
    fd.append("experience", form.experience);
    fd.append("teachingMode", form.teachingMode === "in-person" ? "in_person" : form.teachingMode);
    fd.append("hourlyPrice", form.hourlyPrice);
    fd.append("subjects", form.subjects.join(","));
    fd.append("gradeLevels", form.gradeLevels.join(","));
    fd.append("areas", form.areas.join(","));

    if (docNationalId)   fd.append("doc_national_id", docNationalId);
    if (docAvatarPhoto)   fd.append("doc_avatar", docAvatarPhoto);
    if (docAcademicCert) fd.append("doc_academic_certificate", docAcademicCert);

    additionalCerts.forEach((cert, index) => {
      if (cert.file) fd.append(`doc_additional_certificate_${index}`, cert.file);
    });

    const result = await tutorSignupAction(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.needsEmailVerification) {
      setEmailSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-cream)] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-headline-md text-[var(--color-brand-primary)] font-bold">مُدرّس</span>
          </Link>
          <h1 className="text-headline-lg text-[var(--color-text-main)]">انضم كمدرس</h1>
          <p className="text-body-md text-[var(--color-text-muted)] mt-1">ستتم مراجعة طلبك من قِبل الإدارة قبل النشر</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-label-sm font-bold transition-all duration-200",
                    s.number < step  ? "bg-[var(--color-success)] text-white" :
                    s.number === step ? "bg-[var(--color-brand-primary)] text-white ring-4 ring-[var(--color-brand-primary)]/20" :
                    "bg-[var(--color-surface-high)] text-[var(--color-text-muted)]"
                  )}
                >
                  {s.number < step ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className={cn("text-[10px] text-center hidden sm:block", s.number === step ? "text-[var(--color-brand-primary)] font-semibold" : "text-[var(--color-text-muted)]")}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-2", s.number < step ? "bg-[var(--color-success)]" : "bg-[var(--color-surface-high)]")} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {emailSent ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-[var(--color-brand-primary)]" />
              </div>
              <h2 className="text-headline-sm text-[var(--color-text-main)]">تحقق من بريدك الإلكتروني</h2>
              <p className="text-body-md text-[var(--color-text-muted)]">
                أرسلنا رابط التفعيل إلى{" "}
                <span className="font-semibold">{form.email}</span>.
                افتح بريدك وانقر على الرابط لإكمال التسجيل.
              </p>
              <Link href="/login" className="text-label-md text-[var(--color-brand-primary)] hover:underline font-semibold">
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                {error && (
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-error-container)] text-[var(--color-error)] text-label-md">
                    {error}
                  </div>
                )}

                {/* Step 1: Personal */}
                {step === 1 && (
                  <>
                    <h2 className="text-headline-sm mb-1">المعلومات الشخصية</h2>

                    {/* Avatar photo upload */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--color-outline-soft)] hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer overflow-hidden flex items-center justify-center bg-[var(--color-surface-low)]"
                        onClick={() => refAvatarPhoto.current?.click()}
                      >
                        {docAvatarPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={URL.createObjectURL(docAvatarPhoto)}
                            alt="معاينة الصورة"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]">
                            <Camera className="w-7 h-7" />
                            <span className="text-[10px]">صورة شخصية</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={refAvatarPhoto}
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={(e) => setDocAvatarPhoto(e.target.files?.[0] ?? null)}
                      />
                      <p className="text-label-sm text-[var(--color-text-muted)]">
                        {docAvatarPhoto ? (
                          <button
                            type="button"
                            className="text-[var(--color-brand-primary)] hover:underline"
                            onClick={() => refAvatarPhoto.current?.click()}
                          >
                            تغيير الصورة
                          </button>
                        ) : (
                          "صورة شخصية للملف (اختياري)"
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="الاسم الكامل (سري)" type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="الاسم الحقيقي كاملاً" required />
                      <Input label="الاسم المعروض للطلاب" type="text" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="د. محمد أو أ. سارة" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="رقم الجوال" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+974 XXXX XXXX" required />
                      <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="example@email.com" required />
                    </div>
                    <Input label="كلمة المرور" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="٨ أحرف على الأقل" required hint="يجب أن تكون ٨ أحرف على الأقل" />
                  </>
                )}

                {/* Step 2: Teaching info */}
                {step === 2 && (
                  <>
                    <h2 className="text-headline-sm mb-1">معلومات التدريس</h2>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-md font-medium text-[var(--color-text-main)]">المواد الدراسية <span className="text-[var(--color-error)]">*</span></label>
                      <CheckboxGroup items={SUBJECTS} selected={form.subjects} onToggle={(v) => toggleItem("subjects", v)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-md font-medium text-[var(--color-text-main)]">المراحل الدراسية <span className="text-[var(--color-error)]">*</span></label>
                      <CheckboxGroup items={GRADE_LEVELS} selected={form.gradeLevels} onToggle={(v) => toggleItem("gradeLevels", v)} />
                    </div>
                    <Input label="سنوات الخبرة" type="number" value={form.experience} onChange={(e) => update("experience", e.target.value)} placeholder="٥" required />
                    <Textarea label="نبذة عن نفسك" value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="اكتب نبذة قصيرة عن خبرتك وأسلوبك في التدريس..." showCount maxCount={500} required />
                  </>
                )}

                {/* Step 3: Pricing & availability */}
                {step === 3 && (
                  <>
                    <h2 className="text-headline-sm mb-1">الأسعار والتوفر</h2>
                    <Select
                      label="نوع التدريس"
                      options={[
                        { value: "online",     label: "أونلاين فقط" },
                        { value: "in-person",  label: "حضوري فقط" },
                        { value: "both",       label: "أونلاين وحضوري" },
                      ]}
                      value={form.teachingMode}
                      onChange={(e) => update("teachingMode", e.target.value)}
                      placeholder="اختر نوع التدريس"
                      required
                    />
                    {form.teachingMode !== "online" && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-medium text-[var(--color-text-main)]">المناطق المتاحة</label>
                        <CheckboxGroup items={AREAS.filter((a) => a !== "أونلاين فقط")} selected={form.areas} onToggle={(v) => toggleItem("areas", v)} />
                      </div>
                    )}
                    <Input label="سعر الساعة (ر.ق)" type="number" value={form.hourlyPrice} onChange={(e) => update("hourlyPrice", e.target.value)} placeholder="٢٠٠" required hint="مدة الحصة ٥٠ دقيقة — يُحسب السعر بالساعة" />
                    <p className="text-label-sm text-[var(--color-text-muted)] bg-[var(--color-surface-container)] p-3 rounded-[var(--radius-sm)]">
                      💡 ستتمكن من ضبط أوقات إتاحتك بالتفصيل من لوحة التحكم بعد قبول طلبك
                    </p>
                  </>
                )}

                {/* Step 4: Documents */}
                {step === 4 && (
                  <>
                    <h2 className="text-headline-sm mb-1">الوثائق المطلوبة</h2>
                    <p className="text-body-md text-[var(--color-text-muted)]">
                      ارفع الوثائق التالية للمراجعة. ستبقى سرية ولن تُعرض للطلاب.
                    </p>

                    {/* National ID */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-md font-medium text-[var(--color-text-main)]">
                        صورة الهوية الوطنية أو الإقامة
                      </label>
                      <div
                        className="border-2 border-dashed border-[var(--color-outline-soft)] rounded-[var(--radius-md)] p-6 text-center hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
                        onClick={() => refNationalId.current?.click()}
                      >
                        {docNationalId ? (
                          <p className="text-label-md text-[var(--color-brand-primary)] font-medium">{docNationalId.name}</p>
                        ) : (
                          <>
                            <p className="text-label-md text-[var(--color-text-muted)]">اسحب الملف هنا أو انقر للاختيار</p>
                            <p className="text-label-sm text-[var(--color-text-muted)] mt-1">صورة واضحة من الوجهين</p>
                          </>
                        )}
                        <input
                          ref={refNationalId}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => setDocNationalId(e.target.files?.[0] ?? null)}
                        />
                      </div>
                    </div>

                    {/* Primary academic certificate (required) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-md font-medium text-[var(--color-text-main)]">
                        الشهادة الأكاديمية <span className="text-[var(--color-error)]">*</span>
                      </label>
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-[var(--radius-md)] p-6 text-center transition-colors cursor-pointer",
                          docAcademicCert
                            ? "border-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]"
                            : "border-[var(--color-outline-soft)] hover:border-[var(--color-brand-primary)]"
                        )}
                        onClick={() => refAcademicCert.current?.click()}
                      >
                        {docAcademicCert ? (
                          <p className="text-label-md text-[var(--color-brand-primary)] font-medium">{docAcademicCert.name}</p>
                        ) : (
                          <>
                            <p className="text-label-md text-[var(--color-text-muted)]">اسحب الملف هنا أو انقر للاختيار</p>
                            <p className="text-label-sm text-[var(--color-text-muted)] mt-1">أعلى شهادة حصلت عليها</p>
                          </>
                        )}
                        <input
                          ref={refAcademicCert}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => setDocAcademicCert(e.target.files?.[0] ?? null)}
                        />
                      </div>
                    </div>

                    {/* Dynamic additional certificates */}
                    {additionalCerts.map((cert, index) => (
                      <div key={cert.id} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-label-md font-medium text-[var(--color-text-main)]">
                            شهادة إضافية {index + 1}
                          </label>
                          <button
                            type="button"
                            onClick={() => removeCertSlot(cert.id)}
                            className="flex items-center gap-1 text-label-sm text-[var(--color-error)] hover:underline"
                          >
                            <X className="w-3.5 h-3.5" />
                            حذف
                          </button>
                        </div>
                        <div
                          className="border-2 border-dashed border-[var(--color-outline-soft)] rounded-[var(--radius-md)] p-6 text-center hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
                          onClick={() => additionalCertRefs.current[index]?.click()}
                        >
                          {cert.file ? (
                            <p className="text-label-md text-[var(--color-brand-primary)] font-medium">{cert.file.name}</p>
                          ) : (
                            <>
                              <p className="text-label-md text-[var(--color-text-muted)]">اسحب الملف هنا أو انقر للاختيار</p>
                              <p className="text-label-sm text-[var(--color-text-muted)] mt-1">PDF أو صورة</p>
                            </>
                          )}
                          <input
                            ref={(el) => { additionalCertRefs.current[index] = el; }}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => setCertFile(cert.id, e.target.files?.[0] ?? null)}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add certificate button */}
                    <button
                      type="button"
                      onClick={addCertSlot}
                      className="flex items-center gap-2 text-label-md text-[var(--color-brand-primary)] hover:underline self-start"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة شهادة أخرى
                    </button>

                    <label className="flex items-start gap-3 cursor-pointer mt-2">
                      <input type="checkbox" required className="mt-1 accent-[var(--color-brand-primary)]" />
                      <span className="text-label-md text-[var(--color-text-muted)] leading-relaxed">
                        أوافق على{" "}
                        <Link href="/terms" className="text-[var(--color-brand-primary)] hover:underline">شروط الخدمة</Link>
                        {" "}و{" "}
                        <Link href="/privacy" className="text-[var(--color-brand-primary)] hover:underline">سياسة الخصوصية</Link>
                      </span>
                    </label>
                  </>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-2">
                  {step > 1 && (
                    <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} className="flex-1">
                      السابق
                    </Button>
                  )}
                  <Button type="submit" loading={loading} className="flex-1" size="md">
                    {step < 4 ? "التالي" : "إرسال الطلب للمراجعة"}
                  </Button>
                </div>
              </form>

              <p className="mt-5 text-center text-label-md text-[var(--color-text-muted)]">
                لديك حساب بالفعل؟{" "}
                <Link href="/login" className="text-[var(--color-brand-primary)] font-semibold hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
