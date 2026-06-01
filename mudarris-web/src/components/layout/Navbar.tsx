"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/browser";

type NavUser = { role: string; dashboardHref: string; dashboardLabel: string } | null;

const navLinks = [
  { href: "/tutors", label: "ابحث عن مدرس" },
  { href: "/signup/tutor", label: "درّس معنا" },
  { href: "/signup/student", label: "انضم كطالب" },
];

function resolveNavUser(role: string | undefined): NavUser {
  if (role === "admin") return { role, dashboardHref: "/admin", dashboardLabel: "لوحة الإدارة" };
  if (role === "tutor") return { role, dashboardHref: "/tutor/dashboard", dashboardLabel: "لوحتي" };
  if (role === "student") return { role, dashboardHref: "/student/dashboard", dashboardLabel: "لوحتي" };
  return null;
}

function DesktopAuthLinks({ navUser }: { navUser: NavUser | undefined }) {
  // undefined = still loading; render nothing to avoid flash
  if (navUser === undefined) return <div className="hidden md:flex w-40" />;

  if (navUser) {
    return (
      <div className="hidden md:flex items-center gap-3">
        <Button size="sm" asChild>
          <Link href={navUser.dashboardHref}>{navUser.dashboardLabel}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">تسجيل الدخول</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/signup/student">ابدأ الآن</Link>
      </Button>
    </div>
  );
}

function MobileAuthLinks({ navUser, onClose }: { navUser: NavUser | undefined; onClose: () => void }) {
  if (navUser === undefined) return null;

  if (navUser) {
    return (
      <div className="border-t border-[var(--color-outline-soft)] mt-2 pt-3 flex flex-col gap-2">
        <Button fullWidth asChild>
          <Link href={navUser.dashboardHref} onClick={onClose}>{navUser.dashboardLabel}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--color-outline-soft)] mt-2 pt-3 flex flex-col gap-2">
      <Button variant="secondary" fullWidth asChild>
        <Link href="/login" onClick={onClose}>تسجيل الدخول</Link>
      </Button>
      <Button fullWidth asChild>
        <Link href="/signup/student" onClick={onClose}>ابدأ الآن</Link>
      </Button>
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // undefined = not yet resolved; null = logged out; object = logged in
  const [navUser, setNavUser] = useState<NavUser | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setNavUser(resolveNavUser(session?.user?.app_metadata?.role as string | undefined));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setNavUser(resolveNavUser(session?.user?.app_metadata?.role as string | undefined));
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface-white)] border-b border-[var(--color-outline-soft)] shadow-[var(--shadow-nav)]">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo — right side in RTL */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-brand-primary)] flex items-center justify-center transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-headline-sm text-[var(--color-brand-primary)] font-bold tracking-tight">
              مُدرّس
            </span>
          </Link>

          {/* Desktop nav — center */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-label-md text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons — left side in RTL */}
          <DesktopAuthLinks navUser={navUser} />

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-low)] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="القائمة"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-outline-soft)] bg-white">
          <nav className="container-page py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 text-body-md text-[var(--color-text-main)] hover:bg-[var(--color-surface-low)] rounded-[var(--radius-sm)] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <MobileAuthLinks navUser={navUser} onClose={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  );
}
