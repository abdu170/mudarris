# PRODUCTION_CHECKLIST.md

## Mudarris — Production Readiness Checklist

Last updated: 2026-05-29

---

## Pre-Launch Checklist

### 1. Environment Variables

- [ ] All required env vars set in production hosting dashboard (see ENV_SETUP.md)
- [ ] `NEXT_PUBLIC_APP_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain (e.g., `https://mudarris.qa`)
- [ ] `TAP_SECRET_KEY` is live key (`sk_live_...`), not sandbox
- [ ] `TAP_PUBLISHABLE_KEY` is live key (`pk_live_...`), not sandbox
- [ ] `TAP_WEBHOOK_SECRET` matches the secret configured in Tap production dashboard
- [ ] `MERITHUB_WEBHOOK_SECRET` set for production webhook verification
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is from production Supabase project
- [ ] `SUPABASE_JWT_SECRET` is from production Supabase project
- [ ] `RESEND_API_KEY` is production key
- [ ] `RESEND_FROM_EMAIL` is verified in Resend dashboard

### 2. Supabase Setup

- [ ] Production Supabase project created (separate from dev/staging)
- [ ] All 23 migrations applied in order to production DB
- [ ] Email auth enabled in Supabase Auth settings
- [ ] Redirect URLs configured in Supabase Auth > URL Configuration:
  - Site URL: `https://mudarris.qa`
  - Redirect: `https://mudarris.qa/auth/callback`
- [ ] Email templates customized in Supabase Auth > Email Templates (Arabic)
- [ ] `app_metadata` included in JWT (verify in Supabase Auth settings)
- [ ] Storage buckets created (`avatars`, `tutor-documents`, `curriculum-files`)
- [ ] Point-in-time recovery enabled (Pro plan required)
- [ ] Database backups verified in Supabase dashboard

### 3. Tap Payments

- [ ] Tap production account active and verified
- [ ] Live API keys obtained and set
- [ ] Webhook URL registered in Tap dashboard: `https://mudarris.qa/api/webhooks/tap`
- [ ] Webhook events: charge (all statuses)
- [ ] Webhook secret copied to `TAP_WEBHOOK_SECRET`
- [ ] End-to-end payment test with real card (small amount)
- [ ] Webhook test: verify Tap can reach `https://mudarris.qa/api/webhooks/tap`
- [ ] Verify CAPTURED event correctly marks booking confirmed

### 4. Merithub

- [ ] Merithub production account active
- [ ] Production API key obtained and set in `MERITHUB_API_KEY`
- [ ] Production base URL set in `MERITHUB_BASE_URL`
- [ ] Webhook URL registered in Merithub dashboard: `https://mudarris.qa/api/webhooks/merithub`
- [ ] Webhook events: session.started, session.ended, recording.available
- [ ] Webhook secret set in `MERITHUB_WEBHOOK_SECRET`
- [ ] Test: create booking, confirm payment → Merithub session created
- [ ] Test: student URL accessible by student (not tutor)
- [ ] Test: tutor URL accessible by tutor (not student)
- [ ] Session duration: verify Merithub creates 50-minute sessions

### 5. Domain & DNS

- [ ] Production domain configured (e.g., `mudarris.qa`)
- [ ] SSL certificate active (HTTPS required — CSP `upgrade-insecure-requests` is set)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Supabase Auth site URL updated to production domain
- [ ] Supabase Auth SMTP configured for transactional emails

### 6. Security

- [ ] Security headers verified in browser (check Network tab > Response Headers)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy` present
- [ ] Rate limiting configured (Upstash Redis) on auth routes
- [ ] `MERITHUB_WEBHOOK_SECRET` enforced (not placeholder)
- [ ] No `.env.local` or `.env` files committed to git
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not in any client bundle (verify with `npm run build`)
- [ ] Run `npm audit` and review critical/high severity vulnerabilities

### 7. Next.js 16 File Conventions

- [x] `src/proxy.ts` exists (NOT `src/middleware.ts`) — **required for Vercel routing to work in Next.js 16**
  - Next.js 16 renamed the middleware file convention to `proxy`. Using the old `middleware.ts` causes Vercel to generate a malformed routing manifest even when the build succeeds (all routes return 404).
  - Export must be `export function proxy(request: NextRequest)` (not `export function middleware`)
  - Fixed in commit `c1b4f37` — this must remain `proxy.ts` for all future deployments

### 8. Performance

- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] Bundle size reviewed — no unintended large imports in client components
- [ ] All realtime subscriptions have cleanup on unmount (verified in MessagesClient)
- [ ] Admin queries have reasonable limits (≤500 rows)
- [ ] Database indexes applied (migration 023)

### 8. QA Sign-off

#### End-to-End Booking Flow
- [ ] Student signs up → email verified → login works
- [ ] Tutor signs up → documents uploaded → admin approval flow
- [ ] Admin approves tutor → tutor dashboard accessible
- [ ] Student finds tutor → selects slot → booking created (requested)
- [ ] Tutor accepts booking → student sees payment button
- [ ] Student initiates payment → Tap checkout opens
- [ ] Payment captured → booking confirmed → wallet credited (pending)
- [ ] Admin marks booking complete → wallet balance moves to available
- [ ] Tutor requests withdrawal → admin approves → balance deducted

#### Online Lesson (Merithub) Flow
- [ ] Online booking confirmed → Merithub session created automatically
- [ ] Student sees student join URL only
- [ ] Tutor sees tutor join URL only
- [ ] In-person booking has no Merithub session
- [ ] Duplicate CAPTURED webhook does NOT create duplicate session
- [ ] Cancelled booking → Merithub session marked cancelled locally

#### Chat & Moderation Flow
- [ ] Student sends message → tutor sees it in realtime
- [ ] Phone number blocked → Arabic warning shown → not visible to recipient
- [ ] Admin can hide message → audit log created
- [ ] User can report message → admin sees it in reports
- [ ] Admin suspends user → user cannot send messages or create bookings
- [ ] Admin reactivates user → user can act normally again

#### Security Checks
- [ ] Unauthenticated user on `/student/*` → redirected to `/login`
- [ ] Non-admin on `/admin/*` → redirected to own dashboard
- [ ] Student cannot access tutor's join URL
- [ ] Suspended user cannot log in
- [ ] Third party cannot read another user's messages

---

## Staging vs Production Separation

| Concern | Staging | Production |
|---|---|---|
| Supabase project | Separate project | Separate project |
| Tap keys | `sk_test_...` | `sk_live_...` |
| NEXT_PUBLIC_APP_ENV | `staging` | `production` |
| Domain | `staging.mudarris.qa` | `mudarris.qa` |
| Data | Test data only | Real user data |
| Backups | Optional | Required |

---

## Post-Launch Monitoring

- [ ] Set up uptime monitoring on `https://mudarris.qa/api/health` (create a simple health endpoint)
- [ ] Monitor Supabase dashboard for slow queries (> 1s)
- [ ] Monitor Tap webhook delivery failures in Tap dashboard
- [ ] Monitor Merithub webhook delivery in Merithub dashboard
- [ ] Review `admin_audit_logs` weekly for unusual admin actions
- [ ] Monitor `message_violations` for moderation effectiveness
- [ ] Review `user_reports` pending queue weekly

---

## Rollback Plan

If a critical issue is found post-launch:
1. Revert to previous Vercel deployment (instant rollback via Vercel dashboard)
2. If DB migration was applied: use Supabase Point-in-Time Recovery to restore to pre-migration state
3. Tap webhooks: pause webhook delivery in Tap dashboard while investigating
4. Merithub: contact Merithub support to pause webhook delivery

---

## Future AI Phase Prerequisites

Before approving the AI pipeline phase, verify:
- [ ] `session_recordings` table populated by Merithub webhook (recording.available event)
- [ ] `booking.recording_consent` and `booking.ai_analysis_consent` consent flow functional
- [ ] `consent_verified_at` set correctly in session_recordings
- [ ] `GEMINI_API_KEY` obtained and set in env
- [ ] AI report placeholder status visible in dashboards (no_report state)
- [ ] Resend email delivery tested with production credentials
