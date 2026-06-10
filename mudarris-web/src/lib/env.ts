import { z } from "zod";

const appEnvValues = ["local", "staging", "production"] as const;

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_APP_ENV: z.enum(appEnvValues).default("local"),

  // PostHog analytics — optional so the app still runs without it configured
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  
  // Optional until integration is configured
  SUPABASE_JWT_SECRET: z.string().optional(),

  TAP_SECRET_KEY: z.string().optional(),
  TAP_PUBLISHABLE_KEY: z.string().optional(),
  TAP_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),

  MERITHUB_API_KEY: z.string().optional(),
  MERITHUB_BASE_URL: z.string().optional(),
  MERITHUB_WEBHOOK_SECRET: z.string().optional(),

  // AI-ready: Gemini API key (optional — not used until AI phase is approved)
  GEMINI_API_KEY: z.string().optional(),

  // Rate limiting (src/lib/security/rate-limit.ts). Optional so local dev
  // works without Redis, but REQUIRED in production — see docs/RATE_LIMITING.md.
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

function validatePublicEnv() {
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  if (!result.success) {
    console.error("❌ Invalid public environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid public environment variables. Check .env.local");
  }

  return result.data;
}

function validateServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("Server env must not be accessed on the client.");
  }

  const result = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    TAP_SECRET_KEY: process.env.TAP_SECRET_KEY,
    TAP_PUBLISHABLE_KEY: process.env.TAP_PUBLISHABLE_KEY,
    TAP_WEBHOOK_SECRET: process.env.TAP_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    MERITHUB_API_KEY: process.env.MERITHUB_API_KEY,
    MERITHUB_BASE_URL: process.env.MERITHUB_BASE_URL,
    MERITHUB_WEBHOOK_SECRET: process.env.MERITHUB_WEBHOOK_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (!result.success) {
    console.error("❌ Invalid server environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables. Check .env.local");
  }

  return result.data;
}

// Public env — safe to call anywhere (including client components)
export const publicEnv = validatePublicEnv();

// Server env — lazy-validated to avoid client-side errors during build
let _serverEnv: z.infer<typeof serverSchema> | null = null;
export function getServerEnv() {
  if (!_serverEnv) {
    _serverEnv = validateServerEnv();
  }
  return _serverEnv;
}

export type AppEnv = (typeof appEnvValues)[number];
export const appEnv: AppEnv = publicEnv.NEXT_PUBLIC_APP_ENV;
export const isProduction = appEnv === "production";
export const isStaging = appEnv === "staging";
export const isLocal = appEnv === "local";
