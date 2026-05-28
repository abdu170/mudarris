"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function TutorSettingsPage() {
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-7 max-w-2xl">
      <h1 className="text-headline-lg">الإعدادات</h1>

      {/* Password section */}
      <section className="card p-6 flex flex-col gap-5">
        <h2 className="text-headline-sm">تغيير كلمة المرور</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="كلمة المرور الحالية" type="password" placeholder="••••••••" />
          <Input label="كلمة المرور الجديدة" type="password" placeholder="••••••••" />
          <Input label="تأكيد كلمة المرور" type="password" placeholder="••••••••" />
          <Button type="submit" variant="secondary" size="md">
            {saved ? "✓ تم التغيير" : "تغيير كلمة المرور"}
          </Button>
        </form>
      </section>

      {/* Notifications */}
      <section className="card p-6 flex flex-col gap-4">
        <h2 className="text-headline-sm">تفضيلات الإشعارات</h2>
        {[
          "إشعارات الحجوزات الجديدة",
          "تذكيرات الحصص",
          "إشعارات الدفع",
          "طلبات السحب",
          "رسائل الطلاب",
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

      {/* Account actions */}
      <section className="card p-6 flex flex-col gap-4">
        <h2 className="text-headline-sm text-[var(--color-error)]">منطقة الخطر</h2>
        <p className="text-body-md text-[var(--color-text-muted)]">
          تعطيل حسابك يعني أن طلابك لن يتمكنوا من حجز دروس جديدة. يمكنك إعادة التفعيل في أي وقت.
        </p>
        <Button variant="danger" size="sm" className="w-fit">تعطيل حسابي مؤقتاً</Button>
      </section>
    </div>
  );
}
