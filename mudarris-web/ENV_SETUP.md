# ENV_SETUP.md

## Mudarris — Environment Variable Setup Guide

---

## Files

| File | Purpose |
|---|---|
| `.env.local` | Local development — gitignored, never committed |
| `.env.example` | Template with all required vars — committed to repo |
| Vercel / hosting dashboard | Production/staging vars — set per deployment environment |

---

## Full Variable Reference

### Public Variables (safe for client bundle)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://xyz.supabase.co` | From Supabase project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `eyJ...` | Anon/public key from Supabase |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` | Full URL including protocol, no trailing slash |
| `NEXT_PUBLIC_APP_ENV` | ✅ | `local` / `staging` / `production` | Controls env-specific behavior |

### Server-Only Variables (never in client bundle)

#### Supabase
| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — bypasses RLS. Never expose to client. |
| `SUPABASE_JWT_SECRET` | ✅ | Used for JWT verification. From Supabase project Settings > API. |

#### Tap Payments
| Variable | Required | Notes |
|---|---|---|
| `TAP_SECRET_KEY` | ✅ | Tap API secret key. Sandbox: `sk_test_...`. Production: `sk_live_...`. |
| `TAP_PUBLISHABLE_KEY` | ✅ | Tap publishable key (for future client-side Tap SDK if needed). |
| `TAP_WEBHOOK_SECRET` | ✅ | Used for HMAC-SHA256 webhook verification. Set in Tap dashboard. |

#### Resend (Email)
| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | ✅ | Resend API key from resend.com dashboard. |
| `RESEND_FROM_EMAIL` | ✅ | Verified sender email. Must be verified in Resend. |

#### Merithub
| Variable | Required | Notes |
|---|---|---|
| `MERITHUB_API_KEY` | ✅ | Merithub API key for session creation. |
| `MERITHUB_BASE_URL` | ✅ | Merithub API base URL, e.g. `https://api.merithub.com`. |
| `MERITHUB_WEBHOOK_SECRET` | Optional | Used for webhook signature verification. Set in production to enforce signature check. Omit or set to placeholder in sandbox. |

#### AI (Future Phase)
| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key. Not used until AI phase is approved. Add now to prepare. |

#### Rate Limiting (Optional)
| Variable | Required | Notes |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis REST URL. Rate limiting activates when set. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST token. |

---

## Environment-Specific Values

### Local Development (`.env.local`)

```env
# Public
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local

# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Tap (sandbox)
TAP_SECRET_KEY=sk_test_...
TAP_PUBLISHABLE_KEY=pk_test_...
TAP_WEBHOOK_SECRET=your-tap-webhook-secret

# Resend (use test API key or skip for local)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Merithub (sandbox)
MERITHUB_API_KEY=your-merithub-key
MERITHUB_BASE_URL=https://api.merithub.com
# MERITHUB_WEBHOOK_SECRET=optional-for-sandbox

# AI (optional)
# GEMINI_API_KEY=your-gemini-key
```

### Production (Vercel or hosting dashboard)

All variables above, plus:
- `NEXT_PUBLIC_APP_URL=https://mudarris.qa` (your production domain)
- `NEXT_PUBLIC_APP_ENV=production`
- `TAP_SECRET_KEY=sk_live_...` (live key, not sandbox)
- `TAP_PUBLISHABLE_KEY=pk_live_...`
- `MERITHUB_WEBHOOK_SECRET=your-production-secret` (required in production)
- All Resend vars with production API key and verified domain

---

## Supabase Setup Steps

1. **Create project** at [supabase.com](https://supabase.com)
2. **Run migrations** in order:
   ```bash
   cd mudarris-web
   npx supabase db push
   ```
   Or apply each migration file manually via Supabase Studio SQL editor.
3. **Enable email auth** in Supabase Auth settings
4. **Set redirect URLs** in Supabase Auth > URL Configuration:
   - Site URL: `https://yourdomain.com`
   - Additional redirect: `http://localhost:3000` (for local dev)
5. **Verify app_metadata in JWT**: Ensure your Supabase project includes `app_metadata` in the JWT claims (default behavior — verify in Auth settings).
6. **Storage buckets**: Created by migration 015. Verify in Storage dashboard.

---

## Tap Payments Setup Steps

1. Create account at [tap.company](https://tap.company)
2. Get sandbox keys from Tap dashboard > API Keys
3. Configure webhook URL in Tap dashboard:
   - URL: `https://yourdomain.com/api/webhooks/tap`
   - Events: charge (all statuses)
4. Copy the webhook secret to `TAP_WEBHOOK_SECRET`
5. Before production: switch to live keys and update `TAP_WEBHOOK_SECRET`

---

## Merithub Setup Steps

1. Obtain Merithub API credentials
2. Configure webhook URL in Merithub dashboard:
   - URL: `https://yourdomain.com/api/webhooks/merithub`
   - Events: session.started, session.ended, recording.available
3. Copy the webhook secret to `MERITHUB_WEBHOOK_SECRET`

---

## Validation

The app validates all env vars at startup via `src/lib/env.ts`. Missing required vars will:
- In development: throw an error on first server action call
- In production: throw an error during server startup

Run locally to test env setup:
```bash
cd mudarris-web
npm run dev
```

If you see `❌ Invalid server environment variables`, check the specific field listed in the error.
