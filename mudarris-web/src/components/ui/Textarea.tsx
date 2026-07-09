import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxCount?: number;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, hint, showCount, maxCount, fullWidth = true, className, id, value, ...props },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-label-md text-[var(--color-text-main)] font-medium"
          >
            {label}
            {props.required && (
              <span className="text-[var(--color-error)] mr-1">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-[var(--radius-md)] resize-none",
            "bg-white border border-[var(--color-outline-soft)] shadow-[var(--shadow-xs)]",
            "text-body-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]/70",
            "transition-all duration-150 min-h-[100px]",
            "hover:border-[var(--color-outline)]",
            "focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/15",
            error && "border-[var(--color-error)] focus:ring-[var(--color-error)]/15",
            props.disabled && "opacity-60 cursor-not-allowed shadow-none",
            className
          )}
          maxLength={maxCount}
          {...props}
        />

        <div className="flex items-start justify-between gap-2">
          <div>
            {error && (
              <p className="flex items-center gap-1 text-label-sm text-[var(--color-error)]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}
            {hint && !error && (
              <p className="text-label-sm text-[var(--color-text-muted)]">{hint}</p>
            )}
          </div>
          {showCount && maxCount && (
            <span className="text-label-sm text-[var(--color-text-muted)] shrink-0">
              {currentLength}/{maxCount}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
