# BACKEND_IMPLEMENTATION_SUMMARY.md

## Mudarris — Backend Implementation Summary

Completed by: Claude Code (claude-sonnet-4-6)
Final completion date: 2026-05-28
Phases implemented: 1 through 7

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Server Components) |
| Language | TypeScript 5.x |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email/password, JWT) |
| Realtime | Supabase Realtime (`postgres_changes`) |
| Storage | Supabase Storage (3 buckets) |
| Payments | Tap Payments (external checkout + webhook) |
| Video Sessions | Merithub (online sessions, recording references) |
| Email | Resend (future — AI report delivery) |
| Rate Limiting | Upstash Redis + @upstash/ratelimit (optional) |
| Validation | Zod v4 |
| Styling | Tailwind CSS v4 |

---

## Architecture Decisions

### Authority Model
All financial state, booking state, wallet state, and role assignments are **server-side only**. The service role key (`SUPABASE_SERVICE_ROLE_KEY`) never reaches the client. All server actions use `createAdminClient()` which is guarded by `import 'server-only'`.

### RLS Strategy
Every table has RLS ENABLED. The service role bypasses RLS (used in all server actions). Client-side Supabase calls only happen for realtime subscriptions, which use the anon key with JWT-authenticated sessions.

### Financial Integrity
All financial mutations go through atomic SECURITY DEFINER RPCs with `SELECT FOR UPDATE` row locking. The `wallet_transactions` table is append-only (INSERT-only, never UPDATE or DELETE). Balances are non-negative at the DB constraint level.

### Realtime Strategy
DB is the source of truth. Supabase Realtime is a live enhancement — not required for correctness. If the WebSocket connection drops, `loadMessages()` is called on reconnect, fetching any missed messages from the DB.

---

## Phase Summary

### Phase 1 — Foundation & Infrastructure ✅
- `src/lib/env.ts` — Zod env validation with local/staging/production separation
- `src/lib/supabase/browser.ts` / `server.ts` / `admin.ts` — Client helpers
- `src/middleware.ts` — Protected route middleware with role-based redirects
- `.env.example` — All required env vars documented

### Phase 2 — Database Schema & RLS ✅
- 13 migration files (001–013)
- 20 tables, 8 enums, RLS on all tables, 2 RPCs, 16 triggers
- Consent-gated RLS on AI tables (`session_recordings`, `ai_session_reports`)
- Financial constraints: non-negative balances, 50-min booking duration, commission fee check

### Phase 3 — Auth System ✅
- 3 additional migrations (014–016)
- Login, student signup, tutor signup, logout, forgot password
- Email verification flow, role-based redirects
- DB trigger blocks direct role/is_active escalation (migration 014)
- Private storage buckets: no storage RLS (default deny, service role only)

### Phase 4 — Replace Mock Data + Booking Engine ✅
- 2 additional migrations (017–018)
- Weekly recurring schedule model (not manual slots)
- Conflict prevention: DB exclusion constraint + RPC SELECT FOR UPDATE + unique index
- Full booking lifecycle: requested → accepted → payment_pending → confirmed → completed
- `get_tutor_available_slots` RPC — slots computed server-side, raw schedule never exposed

### Phase 5 — Tap Payments, Wallet & Withdrawals ✅
- 2 additional migrations (019–020)
- Tap Payments: POST /v2/charges, external checkout, HMAC-SHA256 webhook verification
- Wallet ledger: immutable `wallet_transactions`, pending → available earnings release
- Withdrawal: min 100 QAR, admin approve/reject, atomic balance deduction
- Commission: configurable via `platform_settings` table (not hardcoded)

### Phase 6 — Chat, Moderation & Merithub ✅
- 2 additional migrations (021–022)
- Realtime chat with offline recovery
- Regex moderation (phone, email, WhatsApp, Telegram, external payment)
- Soft-delete audit trail (never physical delete)
- User reports: pending → reviewed → resolved/dismissed
- Suspension: `is_active=false` blocks send/book/withdraw
- Merithub session creation: triggered post-payment, idempotent, best-effort (non-blocking)
- Participant URL scoping: student/tutor each see only their join URL

### Phase 7 — Production Hardening ✅
- 1 additional migration (023)
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- `/auth/update-password` page (password reset completion flow)
- Suspension check in `requestBookingAction` and `create_withdrawal_request` RPC
- Merithub cancellation tracking: `cancelled_at` + `cancel_reason` columns
- Merithub webhook handler: session lifecycle + recording reference storage
- Performance indexes: 12 new composite indexes for high-frequency query paths
- Optional env vars: `MERITHUB_WEBHOOK_SECRET`, `GEMINI_API_KEY` (AI-ready)

---

## Key Files

### Server Actions
| File | Exports |
|---|---|
| `src/lib/actions/auth.ts` | `loginAction`, `logoutAction`, `studentSignupAction`, `tutorSignupAction`, `forgotPasswordAction`, `updatePasswordAction` |
| `src/lib/actions/bookings.ts` | `requestBookingAction`, `respondToBookingAction`, `cancelBookingAction`, `getStudentBookingsAction`, `getTutorBookingsAction`, `completeBookingAction` |
| `src/lib/actions/availability.ts` | Schedule management: `getTutorScheduleManagementAction`, `addScheduleWindowAction`, `deleteScheduleWindowAction`, `addUnavailableBlockAction`, `deleteUnavailableBlockAction`, `getTutorAvailableSlotsAction` |
| `src/lib/actions/payments.ts` | `initiatePaymentAction`, `getStudentPaymentsAction` |
| `src/lib/actions/wallet.ts` | `getTutorWalletAction`, `requestWithdrawalAction` |
| `src/lib/actions/messages.ts` | `createConversationAction`, `getConversationsAction`, `getMessagesAction`, `sendMessageAction`, `markConversationReadAction`, `adminHideMessageAction`, `getAdminConversationsAction`, `submitReportAction`, `getAdminReportsAction`, `updateReportStatusAction`, `suspendUserAction`, `reactivateUserAction` |
| `src/lib/actions/merithub.ts` | `createMerithubSessionAction`, `getMerithubSessionAction` |
| `src/lib/actions/admin.ts` | `getAdminStatsAction`, `getAdminTutorsAction`, `approveTutorAction`, `rejectTutorAction`, `suspendTutorAction`, `getAdminBookingsAction`, `getAdminWithdrawalsAction`, `approveWithdrawalAction`, `rejectWithdrawalAction`, `completeBookingAction` |
| `src/lib/actions/tutors.ts` | `getTutorsAction`, `getTutorByIdAction`, `updateTutorProfileAction` |

### Webhook Handlers
| Route | Purpose |
|---|---|
| `src/app/api/webhooks/tap/route.ts` | Tap Payments: HMAC-SHA256 verification, CAPTURED/FAILED handling, Merithub trigger |
| `src/app/api/webhooks/merithub/route.ts` | Merithub: session lifecycle events, recording reference storage |

### Infrastructure
| File | Purpose |
|---|---|
| `src/lib/env.ts` | Zod env validation — server env never exposed to client |
| `src/lib/moderation.ts` | Regex content filter with Arabic-Indic digit normalization |
| `src/lib/auth/session.ts` | `requireAuth()`, `getSessionProfile()`, `getSessionRole()` |
| `src/lib/supabase/admin.ts` | Service role client (server-only guard) |
| `src/middleware.ts` | Route protection + role checks + pending tutor redirect |
| `next.config.ts` | Security headers (CSP, X-Frame-Options, etc.) |

### Migrations (23 total)
| Range | Description |
|---|---|
| 001–013 | Phase 2: full schema, RLS, triggers, RPCs |
| 014–016 | Phase 3: role escalation trigger, storage buckets, display_name_ar |
| 017–018 | Phase 4: availability model, availability RLS |
| 019–020 | Phase 5: platform_settings, payment/wallet RPCs |
| 021–022 | Phase 6: chat enhancements, Merithub RPC |
| 023 | Phase 7: hardening (cancellation, suspension, indexes) |

---

## AI Readiness

The following tables and fields are schema-ready for the future AI pipeline (NOT implemented):

| Table | Purpose |
|---|---|
| `session_recordings` | Recording metadata + consent verification timestamp |
| `ai_session_reports` | Report lifecycle (status, JSON, Arabic text, email timestamp) |
| `lesson_curriculum_links` | Booking → curriculum file mapping for AI context |

Future AI pipeline entry point:
```sql
SELECT sr.* FROM session_recordings sr
JOIN bookings b ON b.id = sr.booking_id
WHERE sr.processing_status = 'pending'
  AND b.recording_consent = true
  AND b.ai_analysis_consent = true;
```

The Merithub webhook (`recording.available` event) automatically populates `session_recordings` when consent is given. The `GEMINI_API_KEY` is already in the env schema (optional).

---

## Known Limitations

1. **Merithub cancellation API**: If Merithub provides a cancel endpoint, it is not yet called. Local cancellation is tracked in `merithub_sessions.cancelled_at` but the Merithub room may still be accessible via the stored URL until session expiry.

2. **`/auth/update-password`**: Password reset works only if the user follows the reset email link (which sets a recovery session). If they navigate directly to this URL without a valid recovery session, Supabase's `updateUser` will fail.

3. **Email delivery (Resend)**: Not yet wired to any user-facing flows. `RESEND_API_KEY` is validated in env but no emails are sent in MVP.

4. **Tutor middleware DB query**: One `tutors.status` query per `/tutor/*` request. Acceptable for MVP. Can be cached with a short-lived cookie in a future optimization pass.

5. **Rate limiting**: `@upstash/ratelimit` is installed but not applied to routes in the current implementation. Applying it to auth routes is recommended before production launch.
