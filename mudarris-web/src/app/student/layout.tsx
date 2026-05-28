import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getSessionProfile } from "@/lib/auth/session";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  return (
    <DashboardLayout role="student" userName={profile?.full_name_ar ?? undefined}>
      {children}
    </DashboardLayout>
  );
}
