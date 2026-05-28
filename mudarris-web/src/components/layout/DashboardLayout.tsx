import { DashboardSidebar, MobileNav } from "./DashboardSidebar";

interface DashboardLayoutProps {
  role: "student" | "tutor" | "admin";
  userName?: string;
  children: React.ReactNode;
}

export function DashboardLayout({ role, userName, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[var(--color-brand-cream)]">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex h-screen sticky top-0">
        <DashboardSidebar role={role} userName={userName} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <MobileNav role={role} />
    </div>
  );
}
