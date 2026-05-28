import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { TutorListItem } from "@/lib/actions/tutors";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, Chip, VerifiedBadge, TeachingModeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatQAR } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TutorCardProps {
  tutor: TutorListItem;
  className?: string;
}

export function TutorCard({ tutor, className }: TutorCardProps) {
  return (
    <div className={cn("card card-hover p-5 flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          src={tutor.avatar}
          name={tutor.displayName}
          size="lg"
          verified={tutor.verified}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-headline-sm text-[var(--color-text-main)] truncate">
              {tutor.displayName}
            </h3>
            {tutor.verified && <VerifiedBadge />}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" />
            <span className="text-label-md font-semibold text-[var(--color-text-main)]">
              {tutor.rating.toFixed(1)}
            </span>
            <span className="text-label-sm text-[var(--color-text-muted)]">
              ({tutor.reviewCount} تقييم)
            </span>
          </div>

          {/* Teaching mode */}
          <div className="mt-1">
            <TeachingModeBadge mode={tutor.teachingMode} />
          </div>
        </div>

        {/* Price */}
        <div className="text-left shrink-0">
          <p className="text-headline-sm text-[var(--color-brand-primary)] font-bold">
            {formatQAR(tutor.hourlyPrice)}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">/ ساعة</p>
        </div>
      </div>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5">
        {tutor.subjects.map((s) => (
          <Chip key={s}>{s}</Chip>
        ))}
        {tutor.gradeLevels.slice(0, 2).map((g) => (
          <Chip key={g} className="text-[11px]">{g}</Chip>
        ))}
      </div>

      {/* Area + availability */}
      <div className="flex items-center justify-between gap-2 text-label-sm text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{tutor.areas.slice(0, 2).join("، ")}</span>
        </div>
        {tutor.availableToday && (
          <Badge variant="success" className="shrink-0">متاح اليوم</Badge>
        )}
      </div>

      {/* CTA */}
      <Button variant="primary" size="sm" fullWidth asChild>
        <Link href={`/tutors/${tutor.id}`}>عرض الملف</Link>
      </Button>
    </div>
  );
}
