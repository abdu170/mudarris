import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getSessionProfile } from "@/lib/auth/session";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  return (
    <DashboardLayout role="tutor" userName={profile?.full_name_ar ?? undefined}>
      {children}
    </DashboardLayout>
  );
}
