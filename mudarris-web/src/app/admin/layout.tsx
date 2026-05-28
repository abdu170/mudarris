import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getSessionProfile } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  return (
    <DashboardLayout role="admin" userName={profile?.full_name_ar ?? undefined}>
      {children}
    </DashboardLayout>
  );
}
