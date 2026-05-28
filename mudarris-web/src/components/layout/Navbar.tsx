"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/tutors", label: "ابحث عن مدرس" },
  { href: "/signup/tutor", label: "درّس معنا" },
  { href: "/signup/student", label: "انضم كطالب" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup/student">ابدأ الآن</Link>
            </Button>
          </div>

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
            <div className="border-t border-[var(--color-outline-soft)] mt-2 pt-3 flex flex-col gap-2">
              <Button variant="secondary" fullWidth asChild>
                <Link href="/login">تسجيل الدخول</Link>
              </Button>
              <Button fullWidth asChild>
                <Link href="/signup/student">ابدأ الآن</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
