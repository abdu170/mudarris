"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, MessageSquare, Wallet,
  Settings, Users, CreditCard, LogOut, ChevronLeft,
  Calendar, FileText, BookMarked, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";

/* ── Nav item definition ──────────────────────────────── */
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/* ── Role-based nav maps ──────────────────────────────── */
const studentNav: NavItem[] = [
  { href: "/student/dashboard", label: "لوحة التحكم",  icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/student/bookings",  label: "حجوزاتي",      icon: <BookOpen className="w-5 h-5" /> },
  { href: "/student/messages",  label: "الرسائل",      icon: <MessageSquare className="w-5 h-5" /> },
  { href: "/student/wallet",    label: "المحفظة",      icon: <Wallet className="w-5 h-5" /> },
  { href: "/student/settings",  label: "الإعدادات",    icon: <Settings className="w-5 h-5" /> },
];

const tutorNav: NavItem[] = [
  { href: "/tutor/dashboard",    label: "لوحة التحكم",  icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/tutor/bookings",     label: "الحجوزات",     icon: <BookOpen className="w-5 h-5" /> },
  { href: "/tutor/availability", label: "الأوقات",      icon: <Calendar className="w-5 h-5" /> },
  { href: "/tutor/messages",     label: "الرسائل",      icon: <MessageSquare className="w-5 h-5" /> },
  { href: "/tutor/wallet",       label: "المحفظة",      icon: <Wallet className="w-5 h-5" /> },
  { href: "/tutor/profile/edit", label: "الملف الشخصي", icon: <FileText className="w-5 h-5" /> },
  { href: "/tutor/settings",     label: "الإعدادات",    icon: <Settings className="w-5 h-5" /> },
];

const adminNav: NavItem[] = [
  { href: "/admin",              label: "لوحة التحكم",    icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/admin/tutors",       label: "المدرسون",        icon: <UserCheck className="w-5 h-5" /> },
  { href: "/admin/bookings",     label: "الحجوزات",        icon: <BookMarked className="w-5 h-5" /> },
  { href: "/admin/payments",     label: "المدفوعات",       icon: <CreditCard className="w-5 h-5" /> },
  { href: "/admin/withdrawals",  label: "طلبات السحب",     icon: <Wallet className="w-5 h-5" /> },
  { href: "/admin/reports",      label: "البلاغات",        icon: <FileText className="w-5 h-5" /> },
];

const roleConfig = {
  student: { nav: studentNav, label: "الطالب", color: "var(--color-mode-online)" },
  tutor:   { nav: tutorNav,   label: "المدرس", color: "var(--color-brand-primary)" },
  admin:   { nav: adminNav,   label: "الإدارة", color: "var(--color-mode-inperson)" },
};

/* ── NavItem component ────────────────────────────────── */
function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-150",
        "text-label-md group",
        isActive
          ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-bold"
          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-main)]"
      )}
    >
      {/* Active indicator bar — logical start edge (RTL-aware) */}
      {isActive && (
        <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-[var(--color-brand-primary)]" />
      )}
      <span className={cn("shrink-0", isActive ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)]")}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

/* ── DashboardSidebar ─────────────────────────────────── */
interface DashboardSidebarProps {
  role: "student" | "tutor" | "admin";
  userName?: string;
}

export function DashboardSidebar({ role, userName = "المستخدم" }: DashboardSidebarProps) {
  const { nav, label } = roleConfig[role];

  return (
    <aside className="flex flex-col h-full bg-[var(--color-surface-white)] border-l border-[var(--color-outline-soft)] w-60 shrink-0">
      {/* Brand header */}
      <div className="px-4 py-4 border-b border-[var(--color-outline-soft)]/60">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-brand-primary)] shadow-[var(--shadow-btn)] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[var(--color-brand-primary)] text-base">مُدرّس</span>
        </Link>

        {/* User pill */}
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)]/50">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {userName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--color-text-main)] truncate">{userName}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {nav.map((item) => (
          <SidebarNavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-[var(--color-outline-soft)] flex flex-col gap-1">
        <Link
          href="/tutors"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-label-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-main)] transition-colors"
        >
          <Users className="w-5 h-5" />
          استعراض المدرسين
        </Link>
        <button
          onClick={() => logoutAction()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-label-md text-[var(--color-error)] hover:bg-[var(--color-error-container)] transition-colors w-full text-right"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

/* ── Mobile Bottom Nav ────────────────────────────────── */
export function MobileNav({ role }: { role: "student" | "tutor" | "admin" }) {
  const pathname = usePathname();
  const { nav } = roleConfig[role];
  // Show only first 4 items on mobile
  const mobileItems = nav.slice(0, 4);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[var(--color-outline-soft)]/60 shadow-[0_-4px_16px_rgba(27,28,26,0.06)] safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-1 flex-1 py-2 min-h-[44px] transition-colors"
            >
              <span
                className={cn(
                  "flex items-center justify-center px-3.5 py-0.5 rounded-full transition-colors",
                  isActive ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"
                )}
              >
                {item.icon}
              </span>
              <span className={cn("text-[10px]", isActive ? "font-bold text-[var(--color-brand-primary)]" : "font-medium text-[var(--color-text-muted)]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
