import { cn } from "@/lib/utils";
import { forwardRef } from "react";
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
    const textareaId = id || label;
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
            "w-full px-3 py-2.5 rounded-[var(--radius-sm)] resize-none",
            "bg-[var(--color-surface-low)] border border-[var(--color-outline-soft)]",
            "text-body-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]",
            "transition-all duration-150 min-h-[100px]",
            "focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]",
            error && "border-[var(--color-error)] focus:ring-[var(--color-error)]",
            props.disabled && "opacity-50 cursor-not-allowed",
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
