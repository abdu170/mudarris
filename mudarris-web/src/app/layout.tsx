import type { Metadata } from "next";
import { Cairo, Tajawal, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مُدرّس — منصة الدروس الخصوصية في قطر",
    template: "%s | مُدرّس",
  },
  description:
    "ابحث عن أفضل المدرسين الخصوصيين في قطر. دروس أونلاين وحضورية في جميع المواد الدراسية.",
  keywords: ["مدرس خصوصي", "دروس خصوصية", "قطر", "تعليم", "مدرسين"],
  openGraph: {
    type: "website",
    locale: "ar_QA",
    siteName: "مُدرّس",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-[var(--color-brand-cream)] text-[var(--color-text-main)] antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
