"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { GRADE_LEVELS } from "@/lib/constants";
import {
  updateStudentProfileAction,
  updateStudentPasswordAction,
} from "@/lib/actions/student";

interface InitialProfile {
  fullNameAr: string;
  email: string;
  phone: string | null;
  gradeLevel: string | null;
}

interface Props {
  initialProfile: InitialProfile;
}

export default function StudentSettingsClient({ initialProfile }: Props) {
  const [form, setForm] = useState({
    fullNameAr: initialProfile.fullNameAr,
    phone: initialProfile.phone ?? "",
    gradeLevel: initialProfile.gradeLevel ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    const fd = new FormData();
    fd.append("fullNameAr", form.fullNameAr);
    fd.append("phone", form.phone);
    fd.append("gradeLevel", form.gradeLevel);

    const result = await updateStudentProfileAction(fd);

    setProfileSaving(false);
    if (result.error) {
      setProfileError(result.error);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSaved(false);

    const fd = new FormData();
    fd.append("currentPassword", passwordForm.currentPassword);
    fd.append("newPassword", passwordForm.newPassword);
    fd.append("confirmPassword", passwordForm.confirmPassword);

    const result = await updateStudentPasswordAction(fd);

    setPasswordSaving(false);
    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSaved(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  }

  const gradeOptions = GRADE_LEVELS.map((g) => ({ value: g, label: g }));

  return (
    <div className="flex flex-col gap-7 max-w-2xl">
      <h1 className="text-headline-lg">الإعدادات</h1>

      {/* Profile section */}
      <section className="card p-6 flex flex-col gap-5">
        <h2 className="text-headline-sm">الملف الشخصي</h2>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <Input
            label="الاسم الكامل"
            value={form.fullNameAr}
            onChange={(e) => setForm((f) => ({ ...f, fullNameAr: e.target.value }))}
            required
          />
          <Input
            label="البريد الإلكتروني"
            type="email"
            value={initialProfile.email}
            disabled
          />
          <Input
            label="رقم الجوال"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Select
            label="المرحلة الدراسية"
            options={gradeOptions}
            value={form.gradeLevel}
            onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
            placeholder="اختر المرحلة الدراسية"
          />
          {profileError && (
            <p className="text-label-sm text-[var(--color-error)]">{profileError}</p>
          )}
          <Button type="submit" size="md" disabled={profileSaving}>
            {profileSaving ? "جاري الحفظ..." : profileSaved ? "✓ تم الحفظ" : "حفظ التغييرات"}
          </Button>
        </form>
      </section>

      {/* Password section */}
      <section className="card p-6 flex flex-col gap-5">
        <h2 className="text-headline-sm">تغيير كلمة المرور</h2>
        <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
          <Input
            label="كلمة المرور الحالية"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
            }
            placeholder="••••••••"
          />
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
            }
            placeholder="••••••••"
          />
          <Input
            label="تأكيد كلمة المرور الجديدة"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
            }
            placeholder="••••••••"
          />
          {passwordError && (
            <p className="text-label-sm text-[var(--color-error)]">{passwordError}</p>
          )}
          <Button type="submit" variant="secondary" size="md" disabled={passwordSaving}>
            {passwordSaving
              ? "جاري التحديث..."
              : passwordSaved
              ? "✓ تم التحديث"
              : "تغيير كلمة المرور"}
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
