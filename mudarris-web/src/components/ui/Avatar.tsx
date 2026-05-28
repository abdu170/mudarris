import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  verified?: boolean;
  className?: string;
}

const sizeMap = {
  sm:  { container: "w-8  h-8",  text: "text-xs",  ring: "ring-2" },
  md:  { container: "w-10 h-10", text: "text-sm",  ring: "ring-2" },
  lg:  { container: "w-14 h-14", text: "text-base",ring: "ring-2" },
  xl:  { container: "w-20 h-20", text: "text-xl",  ring: "ring-[3px]" },
};

export function Avatar({ src, name, size = "md", verified = false, className }: AvatarProps) {
  const { container, text, ring } = sizeMap[size];
  const initials = name ? getInitials(name) : "؟";

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden",
          container,
          verified
            ? `${ring} ring-[var(--color-brand-gold)] ring-offset-1`
            : `${ring} ring-[var(--color-outline-soft)]`
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name ?? "صورة المستخدم"}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center",
              "bg-[var(--color-surface-high)] text-[var(--color-text-muted)] font-semibold",
              text
            )}
          >
            {initials}
          </div>
        )}
      </div>

      {verified && (
        <span
          className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[var(--color-brand-gold)] text-white flex items-center justify-center text-[9px] font-bold ring-1 ring-white"
          aria-label="موثق"
        >
          ✓
        </span>
      )}
    </div>
  );
}
