import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { cloneElement, isValidElement } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  /** Render as child element (e.g. Link) */
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand-primary)] text-white shadow-[var(--shadow-btn)] hover:bg-[var(--color-brand-container)] hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98] active:shadow-[var(--shadow-xs)]",
  secondary:
    "bg-white border border-[var(--color-brand-primary)]/35 text-[var(--color-brand-primary)] shadow-[var(--shadow-xs)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 active:scale-[0.98]",
  danger:
    "bg-[var(--color-error)] text-white shadow-[var(--shadow-xs)] hover:opacity-90 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-[var(--radius-sm)]",
  md: "h-11 px-5 text-base rounded-[var(--radius-md)]",
  lg: "h-12 px-7 text-lg rounded-[var(--radius-md)]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  asChild = false,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 select-none whitespace-nowrap",
    "focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary)] focus-visible:outline-offset-2",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    isDisabled && "opacity-60 cursor-not-allowed pointer-events-none shadow-none",
    className
  );

  /* asChild — merge classes into the child element (e.g. <Link>) */
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn(classes, (children as React.ReactElement<{ className?: string }>).props.className),
    });
  }

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={classes}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
