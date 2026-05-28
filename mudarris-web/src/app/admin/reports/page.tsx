import type { Metadata } from "next";
import AdminReportsClient from "./AdminReportsClient";
import { getAdminReportsAction } from "@/lib/actions/messages";

export const metadata: Metadata = { title: "البلاغات" };

export default async function AdminReportsPage() {
  const res = await getAdminReportsAction();

  if (res.error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-headline-lg">البلاغات</h1>
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{res.error}</p>
        </div>
      </div>
    );
  }

  return <AdminReportsClient initialReports={res.data ?? []} />;
}
