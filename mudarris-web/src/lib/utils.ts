import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — use everywhere instead of clsx alone */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format QAR currency in Arabic */
export function formatQAR(amount: number): string {
  return `${amount.toLocaleString("ar-QA")} ر.ق`;
}

/** Format a date in Arabic locale */
export function formatDateAr(date: string | Date): string {
  return new Date(date).toLocaleDateString("ar-QA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format a time string (HH:MM) to 12-hour Arabic */
export function formatTimeAr(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "م" : "ص";
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Get initials from an Arabic or Latin name */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0] ?? "";
  return (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "");
}

/** Map booking status to Arabic label */
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  requested: "طلب جديد",
  accepted: "مقبول",
  payment_pending: "في انتظار الدفع",
  paid: "مدفوع",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
  rejected: "مرفوض",
  disputed: "متنازع عليه",
};

/** Map teaching mode to Arabic label */
export const TEACHING_MODE_LABELS: Record<string, string> = {
  online: "أونلاين",
  "in-person": "حضوري",
  in_person: "حضوري",
  both: "أونلاين وحضوري",
};

/** Format a UTC ISO timestamp as a date in Qatar timezone (Arabic locale) */
export function formatQatarDate(utcStr: string): string {
  return new Date(utcStr).toLocaleDateString("ar-QA", {
    timeZone: "Asia/Qatar",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format a UTC ISO timestamp as a time in Qatar timezone (Arabic locale) */
export function formatQatarTime(utcStr: string): string {
  return new Date(utcStr).toLocaleTimeString("ar-QA", {
    timeZone: "Asia/Qatar",
    hour: "2-digit",
    minute: "2-digit",
  });
}
