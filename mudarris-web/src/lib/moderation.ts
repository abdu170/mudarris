import type { ViolationType } from "@/lib/supabase/types";

// ─── Content moderation: detect contact-sharing attempts ──────────────────────
//
// Lightweight regex-based only — no external API, no heavy AI.
// Runs server-side before every message INSERT.
// Blocks: phone numbers, emails, WhatsApp, Telegram, external payment wording.
//
// Arabic-aware: checks Arabic digits ٠١٢٣٤٥٦٧٨٩ alongside ASCII 0-9.
// Does NOT block messages that are clean.
//
// Returns null if message is safe, or the first detected violation.
// ─────────────────────────────────────────────────────────────────────────────

export type ModerationResult = {
  blocked: true;
  violationType: ViolationType;
  matchedPattern: string;
} | {
  blocked: false;
};

// Normalize Arabic-Indic digits → ASCII so patterns stay simple
function normalizeDigits(text: string): string {
  return text.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

interface PatternRule {
  type: ViolationType;
  pattern: RegExp;
  label: string;
}

const RULES: PatternRule[] = [
  // ── Phone numbers ──────────────────────────────────────────────────────────
  // Qatar: +974 or 974 or local 7/6/5/3 digit starts, 8 digits
  {
    type: "phone_number",
    label: "رقم هاتف",
    pattern: /(?:\+?974[\s\-.]?)?\b[3567]\d{7}\b/,
  },
  // International format: +XX followed by 6+ digits (with optional separators)
  {
    type: "phone_number",
    label: "رقم هاتف دولي",
    pattern: /\+\d{1,3}[\s\-.]?\d[\d\s\-.]{5,}/,
  },
  // Generic 8-12 digit sequences (catches obfuscated numbers)
  {
    type: "phone_number",
    label: "رقم هاتف",
    pattern: /\b\d[\d\s\-.]{7,11}\d\b/,
  },

  // ── Email addresses ───────────────────────────────────────────────────────
  {
    type: "email",
    label: "بريد إلكتروني",
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  },
  // Obfuscated "at": "user [at] domain"
  {
    type: "email",
    label: "بريد إلكتروني",
    pattern: /\w[\w.+\-]*\s*[\[(]?\s*(?:at|@|آت)\s*[\])]?\s*\w[\w\-]*\s*[\[(]?\s*(?:dot|\.)\s*[\])]?\s*\w{2,}/i,
  },

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  {
    type: "whatsapp",
    label: "واتساب",
    pattern: /whatsapp|whats\s*app|واتس\s*اب|واتساب|wa\.me/i,
  },

  // ── Telegram ─────────────────────────────────────────────────────────────
  {
    type: "telegram",
    label: "تيليغرام",
    pattern: /telegram|تيليغرام|تليغرام|تيليجرام|t\.me\/[a-zA-Z]/i,
  },

  // ── External payment wording ──────────────────────────────────────────────
  {
    type: "external_payment",
    label: "طلب دفع خارجي",
    pattern: /(?:paypal|pyypl|stc\s*pay|apple\s*pay|google\s*pay|transfer\s*money|bank\s*transfer|حوالة\s*بنكية|تحويل\s*مباشر|ادفع\s*(?:لي|خارج)|دفع\s*خاص|نقدي\s*خارج|نقداً?\s*خارج)/i,
  },
];

export function checkModeration(content: string): ModerationResult {
  const normalized = normalizeDigits(content);

  for (const rule of RULES) {
    const match = rule.pattern.exec(normalized);
    if (match) {
      return {
        blocked: true,
        violationType: rule.type,
        matchedPattern: match[0].trim(),
      };
    }
  }

  return { blocked: false };
}

// Arabic warning messages returned to sender per violation type
export const MODERATION_WARNINGS: Record<ViolationType, string> = {
  phone_number:
    "لا يمكنك مشاركة أرقام الهاتف في المحادثات. يرجى التواصل عبر المنصة فقط.",
  email:
    "لا يمكنك مشاركة عناوين البريد الإلكتروني في المحادثات. يرجى التواصل عبر المنصة فقط.",
  whatsapp:
    "لا يمكنك مشاركة معلومات تواصل خارجية. يرجى التواصل عبر المنصة فقط.",
  telegram:
    "لا يمكنك مشاركة معلومات تواصل خارجية. يرجى التواصل عبر المنصة فقط.",
  external_payment:
    "جميع المدفوعات تتم عبر المنصة حصراً. لا يمكن طلب الدفع بطرق خارجية.",
};
