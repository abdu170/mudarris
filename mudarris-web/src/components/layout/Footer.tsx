import Link from "next/link";
import { BookOpen } from "lucide-react";

const footerLinks = {
  "للطلاب": [
    { href: "/tutors",         label: "ابحث عن مدرس" },
    { href: "/signup/student", label: "إنشاء حساب" },
    { href: "/login",          label: "تسجيل الدخول" },
  ],
  "للمدرسين": [
    { href: "/signup/tutor",   label: "انضم كمدرس" },
    { href: "/login",          label: "دخول المدرسين" },
  ],
  "المنصة": [
    { href: "/terms",          label: "شروط الخدمة" },
    { href: "/privacy",        label: "سياسة الخصوصية" },
    { href: "/refund-policy",  label: "سياسة الاسترداد" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface-low)] border-t border-[var(--color-outline-soft)]">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] shadow-[var(--shadow-btn)] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-headline-sm text-[var(--color-brand-primary)] font-bold">
                مُدرّس
              </span>
            </Link>
            <p className="text-label-md text-[var(--color-text-muted)] max-w-[200px] leading-relaxed">
              منصة الدروس الخصوصية الموثوقة في قطر
            </p>
            <p className="text-label-sm text-[var(--color-text-muted)]">
              الدوحة، قطر 🇶🇦
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="flex flex-col gap-3">
              <h4 className="text-label-md font-semibold text-[var(--color-text-main)]">
                {section}
              </h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-label-md text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-outline-soft)] mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-label-sm text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} مُدرّس. جميع الحقوق محفوظة.
          </p>
          <p className="text-label-sm text-[var(--color-text-muted)]">
            منصة تعليمية للتدريس الخاص في دولة قطر
          </p>
        </div>
      </div>
    </footer>
  );
}
