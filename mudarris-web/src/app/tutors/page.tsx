"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TutorCard } from "@/components/tutors/TutorCard";
import { TutorCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Badge";
import { SUBJECTS, GRADE_LEVELS, AREAS } from "@/lib/mock/tutors";
import { getTutorsAction, type TutorListItem } from "@/lib/actions/tutors";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "recommended", label: "الأكثر توصية" },
  { value: "rating",      label: "الأعلى تقييماً" },
  { value: "price_asc",   label: "الأقل سعراً" },
  { value: "newest",      label: "الأحدث" },
];

const MODE_OPTIONS = [
  { value: "", label: "كل أنواع التدريس" },
  { value: "online", label: "أونلاين" },
  { value: "in-person", label: "حضوري" },
  { value: "both", label: "أونلاين وحضوري" },
];

const GENDER_OPTIONS = [
  { value: "", label: "الجنس" },
  { value: "male", label: "مدرس" },
  { value: "female", label: "مدرسة" },
];

export default function TutorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allTutors, setAllTutors] = useState<TutorListItem[]>([]);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Filters state */
  const [subject,  setSubject]  = useState(searchParams.get("subject")  ?? "");
  const [grade,    setGrade]    = useState(searchParams.get("grade")    ?? "");
  const [mode,     setMode]     = useState(searchParams.get("mode")     ?? "");
  const [gender,   setGender]   = useState(searchParams.get("gender")   ?? "");
  const [area,     setArea]     = useState(searchParams.get("area")     ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [sort,     setSort]     = useState(searchParams.get("sort")     ?? "recommended");

  useEffect(() => {
    setLoading(true);
    getTutorsAction({ subject: subject || undefined, gradeLevel: grade || undefined, area: area || undefined, teachingMode: mode || undefined, sortBy: sort })
      .then((res) => { setAllTutors(res.data ?? []); setLoading(false); });
  }, [subject, grade, mode, area, sort]);

  /* Client-side filter refinement */
  const filtered = allTutors
    .filter((t) => !minPrice || t.hourlyPrice >= Number(minPrice))
    .filter((t) => !maxPrice || t.hourlyPrice <= Number(maxPrice));

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const visible    = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function resetFilters() {
    setSubject(""); setGrade(""); setMode(""); setGender(""); setArea("");
    setMinPrice(""); setMaxPrice(""); setSort("recommended"); setPage(1);
    setAllTutors([]);
  }

  const hasFilters = subject || grade || mode || gender || area || minPrice || maxPrice;

  /* Filter panel — shared between desktop sidebar and mobile drawer */
  const FilterPanel = () => (
    <div className="flex flex-col gap-5">
      <Select
        label="المادة الدراسية"
        options={[{ value: "", label: "الكل" }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]}
        value={subject}
        onChange={(e) => { setSubject(e.target.value); setPage(1); }}
      />
      <Select
        label="المرحلة الدراسية"
        options={[{ value: "", label: "الكل" }, ...GRADE_LEVELS.map((g) => ({ value: g, label: g }))]}
        value={grade}
        onChange={(e) => { setGrade(e.target.value); setPage(1); }}
      />
      <Select
        label="نوع التدريس"
        options={MODE_OPTIONS}
        value={mode}
        onChange={(e) => { setMode(e.target.value); setPage(1); }}
      />
      <Select
        label="المنطقة"
        options={[{ value: "", label: "الكل" }, ...AREAS.map((a) => ({ value: a, label: a }))]}
        value={area}
        onChange={(e) => { setArea(e.target.value); setPage(1); }}
      />
      <Select
        label="الجنس"
        options={GENDER_OPTIONS}
        value={gender}
        onChange={(e) => { setGender(e.target.value); setPage(1); }}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-label-md text-[var(--color-text-main)] font-medium">نطاق السعر (ر.ق)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="الأدنى"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            className="flex-1 h-11 px-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-label-md focus:outline-none focus:border-[var(--color-brand-primary)]"
          />
          <span className="text-[var(--color-text-muted)]">—</span>
          <input
            type="number"
            placeholder="الأقصى"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            className="flex-1 h-11 px-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)] text-label-md focus:outline-none focus:border-[var(--color-brand-primary)]"
          />
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} fullWidth>
          <X className="w-4 h-4" />
          مسح الفلاتر
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-brand-cream)]">
        {/* Header */}
        <div className="bg-white border-b border-[var(--color-outline-soft)]">
          <div className="container-page py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-headline-md text-[var(--color-text-main)]">ابحث عن مدرس</h1>
                <p className="text-label-md text-[var(--color-text-muted)]">
                  {loading ? "جاري التحميل..." : `${filtered.length} مدرس متاح`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort — desktop */}
                <div className="hidden sm:block w-44">
                  <Select
                    options={SORT_OPTIONS}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  />
                </div>

                {/* Filters toggle — mobile */}
                <button
                  className="lg:hidden flex items-center gap-2 px-3 h-10 rounded-[var(--radius-sm)] border border-[var(--color-outline-soft)] text-label-md text-[var(--color-text-main)] bg-white"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  فلاتر
                  {hasFilters && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-brand-primary)] text-white text-[10px] flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container-page py-6">
          <div className="flex gap-6">
            {/* Desktop sidebar filters */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 card p-5">
                <h2 className="text-headline-sm mb-4">الفلاتر</h2>
                <FilterPanel />
              </div>
            </aside>

            {/* Results grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TutorCardSkeleton key={i} />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <EmptyState
                  title="لم يتم العثور على مدرسين"
                  description="جرب تغيير الفلاتر أو البحث بمعايير مختلفة"
                  actionLabel="مسح الفلاتر"
                  onAction={resetFilters}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                    {visible.map((tutor) => (
                      <TutorCard key={tutor.id} tutor={tutor} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        السابق
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            "w-9 h-9 rounded-[var(--radius-sm)] text-label-md font-medium transition-colors",
                            p === page
                              ? "bg-[var(--color-brand-primary)] text-white"
                              : "bg-white border border-[var(--color-outline-soft)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]"
                          )}
                        >
                          {p}
                        </button>
                      ))}

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        التالي
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[var(--radius-xl)] p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-headline-sm">الفلاتر</h2>
              <button onClick={() => setFiltersOpen(false)}>
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>
            <FilterPanel />
            <div className="mt-4">
              <Button fullWidth onClick={() => setFiltersOpen(false)}>
                عرض النتائج ({filtered.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
