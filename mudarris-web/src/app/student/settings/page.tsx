"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export default function StudentSettingsPage() {
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO (Claude Code): save to Supabase
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-7 max-w-2xl">
      <h1 className="text-headline-lg">الإعدادات</h1>

      {/* Profile section */}
      <section className="card p-6 flex flex-col gap-5">
        <h2 className="text-headline-sm">الملف الشخصي</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="الاسم الكامل" defaultValue="أحمد الكعبي" required />
          <Input label="البريد الإلكتروني" type="email" defaultValue="ahmed@email.com" required />
          <Input label="رقم الجوال" type="tel" defaultValue="+974 5555 1234" />
          <Select
            label="المرحلة الدراسية"
            options={[
              { value: "grade10", label: "الصف العاشر" },
              { value: "grade11", label: "الصف الحادي عشر" },
              { value: "grade12", label: "الصف الثاني عشر" },
            ]}
            defaultValue="grade11"
          />
          <Button type="submit" size="md">
            {saved ? "✓ تم الحفظ" : "حفظ التغييرات"}
          </Button>
        </form>
      </section>

      {/* Password section */}
      <section className="card p-6 flex flex-col gap-5">
        <h2 className="text-headline-sm">تغيير كلمة المرور</h2>
        <form className="flex flex-col gap-4">
          <Input label="كلمة المرور الحالية" type="password" placeholder="••••••••" />
          <Input label="كلمة المرور الجديدة" type="password" placeholder="••••••••" />
          <Input label="تأكيد كلمة المرور الجديدة" type="password" placeholder="••••••••" />
          <Button type="submit" variant="secondary" size="md">تغيير كلمة المرور</Button>
        </form>
      </section>

      {/* Notifications */}
      <section className="card p-6 flex flex-col gap-4">
        <h2 className="text-headline-sm">تفضيلات الإشعارات</h2>
        {[
          "إشعارات الحجوزات الجديدة",
          "تذكيرات الحصص",
          "إشعارات الدفع",
          "إشعارات التقارير",
          "الرسائل الجديدة",
        ].map((pref) => (
          <label key={pref} className="flex items-center justify-between py-1 cursor-pointer">
            <span className="text-body-md text-[var(--color-text-main)]">{pref}</span>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 accent-[var(--color-brand-primary)] cursor-pointer"
            />
          </label>
        ))}
      </section>
    </div>
  );
}
