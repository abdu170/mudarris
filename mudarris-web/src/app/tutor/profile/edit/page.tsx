"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SUBJECTS, GRADE_LEVELS, AREAS } from "@/lib/constants";

export default function TutorProfileEditPage() {
  const [saved, setSaved] = useState(false);
  const [bio, setBio]     = useState("مدرس متخصص في الرياضيات والفيزياء مع خبرة 10 سنوات في مساعدة الطلاب على تحقيق التفوق الدراسي.");

  const [subjects, setSubjects]     = useState<string[]>(["رياضيات", "فيزياء"]);
  const [gradeLevels, setGradeLevels] = useState<string[]>(["الصف العاشر", "الصف الحادي عشر", "الصف الثاني عشر"]);

  function toggleItem(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  }

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO (Claude Code): persist to Supabase
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-headline-lg">تعديل الملف الشخصي</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Basic info */}
        <section className="card p-6 flex flex-col gap-4">
          <h2 className="text-headline-sm">المعلومات الأساسية</h2>
          <Input label="الاسم المعروض" defaultValue="د. طارق محمود" required />
          <Input label="رقم الجوال" type="tel" defaultValue="+974 5555 9876" />
          <Textarea
            label="نبذة عن نفسك"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            showCount
            maxCount={500}
            required
          />
        </section>

        {/* Teaching details */}
        <section className="card p-6 flex flex-col gap-5">
          <h2 className="text-headline-sm">معلومات التدريس</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-medium text-[var(--color-text-main)]">المواد الدراسية</label>
            <CheckboxGroup
              items={SUBJECTS}
              selected={subjects}
              onToggle={(v) => toggleItem(subjects, setSubjects, v)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-medium text-[var(--color-text-main)]">المراحل الدراسية</label>
            <CheckboxGroup
              items={GRADE_LEVELS}
              selected={gradeLevels}
              onToggle={(v) => toggleItem(gradeLevels, setGradeLevels, v)}
            />
          </div>
          <Select
            label="نوع التدريس"
            options={[
              { value: "online",    label: "أونلاين فقط" },
              { value: "in-person", label: "حضوري فقط" },
              { value: "both",      label: "أونلاين وحضوري" },
            ]}
            defaultValue="both"
          />
          <Input label="سعر الساعة (ر.ق)" type="number" defaultValue="250" required hint="مدة الحصة ٥٠ دقيقة" />
          <Input label="سنوات الخبرة" type="number" defaultValue="10" required />
        </section>

        <Button type="submit" size="lg" fullWidth>
          {saved ? "✓ تم حفظ الملف" : "حفظ التغييرات"}
        </Button>
      </form>
    </div>
  );
}
