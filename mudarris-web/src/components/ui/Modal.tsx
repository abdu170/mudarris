"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Prevent closing by clicking backdrop */
  persistent?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ open, onClose, title, children, size = "md", persistent = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !persistent) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, persistent]);

  /* Trap scroll */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={persistent ? undefined : onClose}
      />

      {/* Panel — bottom sheet on mobile, centered on sm+ */}
      <div
        ref={dialogRef}
        className={cn(
          "relative z-10 w-full bg-white shadow-[var(--shadow-modal)]",
          "rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-lg)]",
          "animate-[slide-up_0.2s_ease]",
          sizeStyles[size]
        )}
        style={{
          animationName: "slideUp",
          animationDuration: "0.2s",
          animationFillMode: "both",
        }}
      >
        {/* Header */}
        {(title || !persistent) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-outline-soft)]">
            {title && (
              <h2 id="modal-title" className="text-headline-sm">
                {title}
              </h2>
            )}
            {!persistent && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[var(--color-surface-low)] transition-colors text-[var(--color-text-muted)] mr-auto"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
