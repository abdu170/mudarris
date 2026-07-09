import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, fullWidth = true, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-label-md text-[var(--color-text-main)] font-medium"
          >
            {label}
            {props.required && (
              <span className="text-[var(--color-error)] mr-1">*</span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-11 px-3.5 pl-9 rounded-[var(--radius-md)] appearance-none",
              "bg-white border border-[var(--color-outline-soft)] shadow-[var(--shadow-xs)]",
              "text-body-md text-[var(--color-text-main)]",
              "transition-all duration-150 cursor-pointer",
              "hover:border-[var(--color-outline)]",
              "focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/15",
              error && "border-[var(--color-error)] focus:ring-[var(--color-error)]/15",
              props.disabled && "opacity-60 cursor-not-allowed shadow-none",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
        </div>

        {error && (
          <p className="flex items-center gap-1 text-label-sm text-[var(--color-error)]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
