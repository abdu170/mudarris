import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  verified?: boolean;
  className?: string;
}

const sizeMap = {
  sm:   { container: "w-8  h-8",  text: "text-xs",   ring: "ring-2",     imgSizes: "32px"  },
  md:   { container: "w-10 h-10", text: "text-sm",   ring: "ring-2",     imgSizes: "40px"  },
  lg:   { container: "w-14 h-14", text: "text-base", ring: "ring-2",     imgSizes: "56px"  },
  xl:   { container: "w-20 h-20", text: "text-xl",   ring: "ring-[3px]", imgSizes: "80px"  },
  "2xl":{ container: "w-28 h-28", text: "text-2xl",  ring: "ring-4",     imgSizes: "112px" },
};

export function Avatar({ src, name, size = "md", verified = false, className }: AvatarProps) {
  const { container, text, ring, imgSizes } = sizeMap[size];
  const initials = name ? getInitials(name) : "؟";

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "relative rounded-full overflow-hidden",
          container,
          verified
            ? `${ring} ring-[var(--color-brand-gold)] ring-offset-2`
            : `${ring} ring-[var(--color-outline-soft)] ring-offset-2`
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name ?? "صورة المستخدم"}
            fill
            className="object-cover"
            sizes={imgSizes}
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
