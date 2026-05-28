import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FeaturedTutorsSection } from "@/components/home/FeaturedTutorsSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { CTASection } from "@/components/home/CTASection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مُدرّس — أفضل مدرسين خصوصيين في قطر",
  description:
    "ابحث عن مدرسك المثالي في قطر. رياضيات، فيزياء، إنجليزي وأكثر. دروس أونلاين وحضورية مع أفضل المدرسين الموثوقين.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturedTutorsSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
