"use client";

import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateCommissionAction } from "@/lib/actions/admin";

interface Props {
  initialCommission: number;
}

export default function AdminSettingsClient({ initialCommission }: Props) {
  const [pct, setPct] = useState(String(initialCommission));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setSaved(false);
    const val = Number(pct);
    if (isNaN(val) || val < 0 || val > 50) {
      setSaving(false);
      setErr("يجب أن تكون النسبة بين 0 و 50%");
      return;
    }
    const res = await updateCommissionAction(val);
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">الإعدادات</h1>

      <div className="card p-6 max-w-md">
        <h2 className="text-headline-sm mb-1">عمولة المنصة</h2>
        <p className="text-label-sm text-[var(--color-text-muted)] mb-5">
          النسبة المخصومة من كل حجز. تُحتسب عند إنشاء الحجز ولا تُطبق بأثر رجعي.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="نسبة العمولة (%)"
                type="number"
                min={0}
                max={50}
                step={1}
                value={pct}
                onChange={(e) => { setPct(e.target.value); setSaved(false); }}
                required
              />
            </div>
            <p className="text-headline-sm text-[var(--color-text-muted)] pb-2.5">%</p>
          </div>

          <p className="text-label-sm text-[var(--color-text-muted)]">
            مثال: عند نسبة {pct || "0"}%، من كل 100 ر.ق تحصل المنصة على {pct || "0"} ر.ق ويحصل المدرس على {100 - Number(pct || 0)} ر.ق.
          </p>

          {err && <p className="text-label-sm text-[var(--color-error)]">{err}</p>}
          {saved && (
            <p className="flex items-center gap-1 text-label-sm text-[var(--color-success)]">
              <CheckCircle className="w-4 h-4" />تم حفظ الإعدادات
            </p>
          )}

          <Button type="submit" loading={saving} className="w-fit">
            <Save className="w-4 h-4" />حفظ
          </Button>
        </form>
      </div>
    </div>
  );
}
