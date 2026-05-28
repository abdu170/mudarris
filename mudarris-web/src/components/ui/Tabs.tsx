"use client";

import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-[var(--color-outline-soft)] pb-0",
        "scrollbar-hide",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-label-md whitespace-nowrap transition-all duration-150 border-b-2 -mb-px",
              isActive
                ? "border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:border-[var(--color-outline-soft)]"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-[var(--color-brand-primary)] text-white"
                    : "bg-[var(--color-surface-high)] text-[var(--color-text-muted)]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
