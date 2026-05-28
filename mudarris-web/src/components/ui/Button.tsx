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
    "bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-container)] active:scale-[0.98]",
  secondary:
    "bg-transparent border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-low)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-low)] active:scale-[0.98]",
  danger:
    "bg-[var(--color-error)] text-white hover:opacity-90 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
  md: "h-10 px-5 text-base rounded-[var(--radius-sm)]",
  lg: "h-12 px-7 text-lg rounded-[var(--radius-sm)]",
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
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none",
    "focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary)] focus-visible:outline-offset-2",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
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
