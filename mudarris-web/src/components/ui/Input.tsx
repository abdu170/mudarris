import { cn } from "@/lib/utils";
import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, fullWidth = true, className, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const inputId = id || generatedId;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-md text-[var(--color-text-main)] font-medium"
          >
            {label}
            {props.required && (
              <span className="text-[var(--color-error)] mr-1">*</span>
            )}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              "w-full h-11 px-3.5 rounded-[var(--radius-md)]",
              "bg-white border border-[var(--color-outline-soft)] shadow-[var(--shadow-xs)]",
              "text-body-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]/70",
              "transition-all duration-150",
              "hover:border-[var(--color-outline)]",
              "focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/15",
              error && "border-[var(--color-error)] focus:ring-[var(--color-error)]/15 focus:border-[var(--color-error)]",
              props.disabled && "opacity-60 cursor-not-allowed bg-[var(--color-surface-high)] shadow-none",
              isPassword && "pl-10",
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

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
    );
  }
);

Input.displayName = "Input";
