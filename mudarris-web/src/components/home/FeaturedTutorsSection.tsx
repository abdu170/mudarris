import Link from "next/link";
import { TutorCard } from "@/components/tutors/TutorCard";
import { getTutorsAction } from "@/lib/actions/tutors";
import { Button } from "@/components/ui/Button";

export async function FeaturedTutorsSection() {
  const res = await getTutorsAction({});
  const featured = (res.data ?? []).slice(0, 6);

  return (
    <section className="py-20 bg-[var(--color-brand-cream)]">
      <div className="container-page">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-headline-lg text-[var(--color-text-main)] mb-2">
              مدرسون مميزون
            </h2>
            <p className="text-body-lg text-[var(--color-text-muted)]">
              من أكثر المدرسين تقييماً على المنصة
            </p>
          </div>
          <Button variant="secondary" size="sm" asChild className="shrink-0">
            <Link href="/tutors">عرض الكل</Link>
          </Button>
        </div>

        {featured.length === 0 ? (
          <p className="text-body-md text-[var(--color-text-muted)] text-center py-8">
            لا يوجد مدرسون معتمدون حالياً
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
