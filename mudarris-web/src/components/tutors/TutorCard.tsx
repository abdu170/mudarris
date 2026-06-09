import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import type { TutorListItem } from "@/lib/actions/tutors";
import { Badge, Chip, VerifiedBadge, TeachingModeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatQAR, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TutorCardProps {
  tutor: TutorListItem;
  className?: string;
}

export function TutorCard({ tutor, className }: TutorCardProps) {
  return (
    <div className={cn("card card-hover flex flex-col overflow-hidden", className)}>
      {/* Full-width photo */}
      <div className="relative h-48 shrink-0 bg-[var(--color-surface-high)]">
        {tutor.avatar ? (
          <Image
            src={tutor.avatar}
            alt={tutor.displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--color-text-muted)]">
            {getInitials(tutor.displayName)}
          </div>
        )}
        {tutor.id.startsWith("a1000000") && (
          <div className="absolute top-3 start-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white tracking-wide">
              بيانات وهمية
            </span>
          </div>
        )}
        {tutor.availableToday && (
          <div className="absolute top-3 end-3">
            <Badge variant="success">متاح اليوم</Badge>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 p-4">
        {/* Name + verified + rating */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-headline-sm text-[var(--color-text-main)]">
              {tutor.displayName}
            </h3>
            {tutor.verified && <VerifiedBadge />}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
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
        <div className="flex items-center justify-between">
          <TeachingModeBadge mode={tutor.teachingMode} />
          <div className="text-left">
            <p className="text-headline-sm text-[var(--color-brand-primary)] font-bold leading-tight">
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

        {/* Area */}
        <div className="flex items-center gap-1 text-label-sm text-[var(--color-text-muted)] truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{tutor.areas.slice(0, 2).join("، ")}</span>
        </div>

        {/* CTA */}
        <Button variant="primary" size="sm" fullWidth asChild>
          <Link href={`/tutors/${tutor.id}`}>عرض الملف</Link>
        </Button>
      </div>
    </div>
  );
}
