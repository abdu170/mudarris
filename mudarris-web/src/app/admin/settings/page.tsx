import type { Metadata } from "next";
import { getCommissionSettingAction } from "@/lib/actions/admin";
import AdminSettingsClient from "./AdminSettingsClient";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function AdminSettingsPage() {
  const res = await getCommissionSettingAction();

  if (res.error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-headline-lg">الإعدادات</h1>
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{res.error}</p>
        </div>
      </div>
    );
  }

  return <AdminSettingsClient initialCommission={res.data ?? 15} />;
}
