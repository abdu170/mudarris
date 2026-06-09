import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { Chip, TeachingModeBadge, VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Star, MapPin, Clock, Award, MessageSquare } from "lucide-react";
import { formatQAR } from "@/lib/utils";
import { WeeklyCalendar } from "@/components/booking/WeeklyCalendar";
import { getTutorProfileAction, getTutorReviewsAction } from "@/lib/actions/tutors";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await getTutorProfileAction(id);
  if (!res.data) return { title: "مدرس غير موجود" };
  return {
    title: res.data.displayName,
    description: res.data.bio,
  };
}

function formatDateAr(iso: string) {
  return new Intl.DateTimeFormat("ar-QA", { year: "numeric", month: "long" }).format(new Date(iso));
}

export default async function TutorProfilePage({ params }: Props) {
  const { id } = await params;
  const [res, reviewsRes] = await Promise.all([
    getTutorProfileAction(id),
    getTutorReviewsAction(id),
  ]);

  if (!res.data) notFound();
  const tutor = res.data;
  const reviews = reviewsRes.data ?? [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-brand-cream)]">
        <div className="container-page py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Main column ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Profile header card */}
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row gap-5">
                  <Avatar
                    src={tutor.avatar}
                    name={tutor.displayName}
                    size="xl"
                    verified={tutor.verified}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h1 className="text-headline-lg text-[var(--color-text-main)]">
                        {tutor.displayName}
                      </h1>
                      {tutor.verified && <VerifiedBadge />}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.round(tutor.rating) ? "fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" : "text-[var(--color-surface-high)]"}`}
                          />
                        ))}
                      </div>
                      <span className="text-label-md font-semibold">{tutor.rating.toFixed(1)}</span>
                      <span className="text-label-sm text-[var(--color-text-muted)]">
                        ({tutor.reviewCount} تقييم)
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-3 text-label-sm text-[var(--color-text-muted)]">
                      {tutor.experience > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {tutor.experience} سنة خبرة
                        </span>
                      )}
                      {tutor.areas.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {tutor.areas.join("، ")}
                        </span>
                      )}
                      <TeachingModeBadge mode={tutor.teachingMode} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {tutor.bio && (
                <div className="card p-6">
                  <h2 className="text-headline-sm mb-3">نبذة عن المدرس</h2>
                  <p className="text-body-lg text-[var(--color-text-muted)] leading-relaxed">
                    {tutor.bio}
                  </p>
                </div>
              )}

              {/* Subjects & Grades */}
              <div className="card p-6">
                <h2 className="text-headline-sm mb-4">المواد والمراحل الدراسية</h2>
                <div className="flex flex-col gap-4">
                  {tutor.subjects.length > 0 && (
                    <div>
                      <p className="text-label-md text-[var(--color-text-muted)] mb-2">المواد</p>
                      <div className="flex flex-wrap gap-2">
                        {tutor.subjects.map((s) => (
                          <Chip key={s} className="bg-[var(--color-brand-primary)] bg-opacity-10 text-[var(--color-brand-primary)]">
                            {s}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  {tutor.gradeLevels.length > 0 && (
                    <div>
                      <p className="text-label-md text-[var(--color-text-muted)] mb-2">المراحل</p>
                      <div className="flex flex-wrap gap-2">
                        {tutor.gradeLevels.map((g) => (
                          <Chip key={g}>{g}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-headline-sm">تقييمات الطلاب</h2>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" />
                      <span className="text-headline-sm font-bold">{tutor.rating.toFixed(1)}</span>
                      <span className="text-label-sm text-[var(--color-text-muted)]">/ ٥</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex gap-3 pb-4 border-b border-[var(--color-outline-soft)] last:border-0 last:pb-0">
                        <Avatar name={review.studentName} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-label-md font-semibold">{review.studentName}</p>
                            <p className="text-label-sm text-[var(--color-text-muted)]">{formatDateAr(review.createdAt)}</p>
                          </div>
                          <div className="flex gap-0.5 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < review.rating ? "fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" : "text-[var(--color-surface-high)]"}`}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-body-md text-[var(--color-text-muted)]">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking calendar */}
              <div className="card p-6" id="booking-calendar">
                <h2 className="text-headline-sm mb-4">المواعيد المتاحة</h2>
                <WeeklyCalendar
                  tutorId={tutor.id}
                  tutorName={tutor.displayName}
                  tutorRate={tutor.hourlyPrice}
                />
              </div>
            </div>

            {/* ── Booking sidebar ── */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <div className="text-center mb-5">
                  <p className="text-label-sm text-[var(--color-text-muted)] mb-1">سعر الحصة</p>
                  <p className="text-display text-[var(--color-brand-primary)] font-bold">
                    {formatQAR(tutor.hourlyPrice)}
                  </p>
                  <p className="text-label-sm text-[var(--color-text-muted)]">لكل ساعة · مدة الحصة ٥٠ دقيقة</p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button fullWidth size="lg" asChild>
                    <a href="#booking-calendar">احجز حصة الآن</a>
                  </Button>
                  <Button fullWidth size="lg" variant="secondary" asChild>
                    <a href="/login">
                      <MessageSquare className="w-4 h-4" />
                      راسل المدرس
                    </a>
                  </Button>
                </div>

                <div className="mt-5 pt-5 border-t border-[var(--color-outline-soft)] flex flex-col gap-3">
                  {[
                    { icon: <Award className="w-4 h-4" />, text: "مدرس موثق" },
                    ...(tutor.experience > 0 ? [{ icon: <Clock className="w-4 h-4" />, text: `خبرة ${tutor.experience} سنوات` }] : []),
                    ...(tutor.areas[0] ? [{ icon: <MapPin className="w-4 h-4" />, text: tutor.areas[0] }] : []),
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 text-label-sm text-[var(--color-text-muted)]">
                      <span className="text-[var(--color-brand-primary)]">{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-4 leading-relaxed">
                  يجب إنشاء حساب للحجز · لا تُحوَّل الأموال إلا بعد إتمام الحصة
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--color-outline-soft)] px-4 py-3 flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" asChild>
          <a href="/login">
            <MessageSquare className="w-4 h-4" />
            راسل
          </a>
        </Button>
        <Button size="md" className="flex-1" asChild>
          <a href="#booking-calendar">احجز الآن · {formatQAR(tutor.hourlyPrice)}</a>
        </Button>
      </div>

      <Footer />
    </>
  );
}
