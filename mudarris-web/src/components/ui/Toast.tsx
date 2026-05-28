"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

/* ── Singleton store (lightweight, no external library) ── */
type Listener = (toasts: ToastData[]) => void;
let toasts: ToastData[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export const toast = {
  success: (message: string) => add("success", message),
  error:   (message: string) => add("error",   message),
  warning: (message: string) => add("warning", message),
  info:    (message: string) => add("info",    message),
};

function add(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, type, message }];
  notify();
  setTimeout(() => remove(id), 4000);
}

function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

/* ── Icons & Colors ── */
const toastStyles: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-[var(--color-success-container)] border-[var(--color-success)]",
    icon: <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />,
  },
  error: {
    bg: "bg-[var(--color-error-container)] border-[var(--color-error)]",
    icon: <AlertCircle className="w-5 h-5 text-[var(--color-error)]" />,
  },
  warning: {
    bg: "bg-[var(--color-warning-container)] border-[var(--color-warning)]",
    icon: <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />,
  },
  info: {
    bg: "bg-[var(--color-info-container)] border-[var(--color-info)]",
    icon: <Info className="w-5 h-5 text-[var(--color-info)]" />,
  },
};

/* ── ToastProvider — place once in root layout ── */
export function ToastProvider() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
    >
      {items.map((t) => {
        const style = toastStyles[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)] border",
              "bg-white shadow-[var(--shadow-card-hover)] pointer-events-auto",
              "animate-[slideDown_0.2s_ease]"
            )}
            style={{ animationName: "slideDown", animationDuration: "0.2s", animationFillMode: "both" }}
          >
            {style.icon}
            <p className="flex-1 text-label-md text-[var(--color-text-main)] leading-snug">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
