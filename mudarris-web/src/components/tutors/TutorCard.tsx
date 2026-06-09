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
    <div className={cn("card card-hover flex flex-col overflow-hidden", className)}>
      {/* Banner */}
      <div className="h-24 bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-container)] shrink-0" />

      {/* Body */}
      <div className="flex flex-col items-center gap-3 px-5 pb-5 -mt-14">
        {/* Avatar */}
        <Avatar
          src={tutor.avatar}
          name={tutor.displayName}
          size="2xl"
          verified={tutor.verified}
        />

        {/* Name + verified */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h3 className="text-headline-sm text-[var(--color-text-main)]">
              {tutor.displayName}
            </h3>
            {tutor.verified && <VerifiedBadge />}
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" />
            <span className="text-label-md font-semibold text-[var(--color-text-main)]">
              {tutor.rating.toFixed(1)}
            </span>
            <span className="text-label-sm text-[var(--color-text-muted)]">
              ({tutor.reviewCount} تقييم)
            </span>
          </div>
        </div>

        {/* Price + teaching mode */}
        <div className="flex items-center justify-between w-full">
          <TeachingModeBadge mode={tutor.teachingMode} />
          <div className="text-left">
            <p className="text-headline-sm text-[var(--color-brand-primary)] font-bold leading-tight">
              {formatQAR(tutor.hourlyPrice)}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)]">/ ساعة</p>
          </div>
        </div>

        {/* Subjects */}
        <div className="flex flex-wrap gap-1.5 w-full">
          {tutor.subjects.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
          {tutor.gradeLevels.slice(0, 2).map((g) => (
            <Chip key={g} className="text-[11px]">{g}</Chip>
          ))}
        </div>

        {/* Area + availability */}
        <div className="flex items-center justify-between gap-2 text-label-sm text-[var(--color-text-muted)] w-full">
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
    </div>
  );
}
