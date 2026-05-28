# HANDOFF_TO_CLAUDE_CODE.md

## Status

Frontend MVP completed by Antigravity.

Claude Code is now responsible for backend integration, database, security, payments, Merithub, Gemini AI Lite reports, and production readiness.

---

## Implementation Progress

### Phase 1 — Foundation & Infrastructure ✅ COMPLETED (2026-05-26)

**Decision:** Next.js 16.2.6 kept (no downgrade needed — `@supabase/ssr` has no Next.js version constraint and standard middleware APIs are intact). Tailwind v4 kept (CSS-only, no backend conflict).

**Packages installed:**
- `@supabase/supabase-js` — Supabase JS client
- `@supabase/ssr` — SSR-safe Supabase helpers for Next.js
- `zod` — server-side validation
- `resend` — transactional email
- `server-only` — prevents server modules being imported on client
- `@upstash/redis` — Redis client for rate limiting
- `@upstash/ratelimit` — Upstash rate limiter

**Files created:**
- `src/lib/env.ts` — Zod-validated env vars, local/staging/production separation, typed exports
- `src/lib/supabase/browser.ts` — browser Supabase client (anon key)
- `src/lib/supabase/server.ts` — async server Supabase client (cookies, SSR-safe, Next.js 16 async cookies() pattern)
- `src/lib/supabase/admin.ts` — service role client with `server-only` import guard
- `src/lib/supabase/types.ts` — Database type scaffold (populated in Phase 2)
- `src/middleware.ts` — route protection for /student/*, /tutor/*, /admin/*; role check for /admin/*
- `.env.example` — all required vars with local/staging/production notes

**Architecture decisions:**
- `cookies()` in Next.js 16 returns a Promise — server client is `async`
- Admin role is verified from `user.app_metadata.role` in JWT (cannot be forged by client)
- Upstash Redis is optional for local dev — env vars can be omitted; rate limiting activates when configured
- Middleware uses `supabase.auth.getUser()` (not `getSession()`) for server-side auth — more secure, validates JWT server-side

**Security decisions:**
- Service role key never touched by any client-side code (guarded by `server-only`)
- Middleware redirects unauthenticated users to `/login?next=<intended-path>` preserving destination
- Admin routes: authenticated non-admin users redirected to their own dashboard (not 403) to avoid role enumeration
- TypeScript confirmed 0 errors across all new files

**Known issue noted:**
- PostCSS bundled inside Next.js 16 has a moderate CVE. `npm audit fix --force` would downgrade Next.js to v9 (wrong). Left as-is — this is inside Next.js's own bundle, not exploitable through our code.

### Phase 2 — Database Schema & RLS ✅ COMPLETED (2026-05-26)

13 migration files created in `mudarris-web/supabase/migrations/`. 20 tables, 8 enums, RLS enabled on all tables, 2 RPCs, 16 triggers, 4 helper functions. Full TypeScript types in `src/lib/supabase/types.ts`. 0 TypeScript errors. See PROJECT_PROGRESS.md for full table-by-table breakdown.

### Phase 3 — Auth System ✅ COMPLETED (2026-05-26)

3 new migrations (014 role escalation trigger, 015 storage buckets, 016 display_name_ar). Full auth system: login, student signup, tutor signup, logout, forgot password, email verification callback. Middleware extended with pending tutor redirect. All 3 dashboards layouts connected to real session. `<ToastProvider />` added to root layout. Auth QA checklist passed. `npx tsc --noEmit`: 0 errors. See PROJECT_PROGRESS.md for full QA results.

**Key fix:** All Database row types must be `type` (not `interface`) — TypeScript 5.x `interface` types don't satisfy `Record<string, unknown>` required by Supabase `GenericTable`. Tables must also include `Relationships: []`.

---

### Phase 4 — Replace Mock Data ⏳ AWAITING APPROVAL

Read this file together with:

- CLAUDE_BACKEND_RULES.md
- DATABASE.md
- SECURITY.md
- PAYMENTS.md
- API_RULES.md
- ROLE_PERMISSIONS.md
- BOOKING_LOGIC.md
- SYSTEM_FLOW.md
- AI_SESSION_REPORTS.md
- CURRICULUM_SYSTEM.md
- MOBILE_APP_READINESS.md
- ENV_STRUCTURE.md

---

## Project Location

```bash
c:\Users\Pc\Desktop\mudarris\mudarris-web\
```

Start dev server:

```bash
cd mudarris-web
npm run dev
```

Local URL:

```txt
http://localhost:3000
```

---

## Current Frontend Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Cairo + Tajawal Arabic fonts
- lucide-react icons
- Static mock data
- RTL-native layout

Important:
Do not change the frontend stack unless there is a blocking technical issue.

---

## Frontend Completion Summary

Antigravity completed:

### Public Pages
- `/`
- `/tutors`
- `/tutors/[id]`
- `/login`
- `/forgot-password`
- `/signup/student`
- `/signup/tutor`
- `/terms`
- `/privacy`
- `/refund-policy`
- Arabic 404 page

### Student Pages
- `/student/dashboard`
- `/student/bookings`
- `/student/messages`
- `/student/wallet`
- `/student/settings`

### Tutor Pages
- `/tutor/dashboard`
- `/tutor/bookings`
- `/tutor/availability`
- `/tutor/messages`
- `/tutor/wallet`
- `/tutor/profile/edit`
- `/tutor/settings`

### Admin Pages
- `/admin`
- `/admin/tutors`
- `/admin/bookings`
- `/admin/payments`
- `/admin/withdrawals`
- `/admin/reports`

---

## Important Frontend Decisions

- RTL is already configured.
- DashboardLayout is shared across student/tutor/admin roles.
- Tutor availability calendar uses click-to-create slots for MVP.
- Public tutor route uses `/tutors/[id]`.
- Mock interfaces are intended to mirror future Supabase records.
- Bottom mobile nav is for authenticated dashboard pages only.
- Public pages use public navigation/footer.

---

## Do Not Redesign

Claude Code must not redesign:

- colors
- typography
- spacing
- page layouts
- tutor cards
- dashboards
- buttons
- cards
- RTL structure
- design tokens
- Stitch-inspired sections

Allowed UI changes:
- connect real data
- add missing loading states
- add error boundaries
- add route guards
- fix bugs
- improve accessibility
- add validation messages

---

## Mock Data To Replace

Mock files:

```txt
src/lib/mock/tutors.ts
src/lib/mock/data.ts
```

Replace mock data with Supabase queries and server actions.

Mock areas:
- tutor data
- booking data
- wallet data
- messages
- availability slots
- admin tables
- payments
- withdrawal requests
- AI report states

---

## Claude Code Backend Tasks

### 1. Environment Setup

Create/update `.env.example`.

Required variables are listed in `ENV_STRUCTURE.md`.

---

### 2. Supabase Database

Create schema for:

- users
- students
- tutors
- tutor_documents
- tutor_availability_slots
- bookings
- payments
- wallet_accounts
- wallet_transactions
- withdrawal_requests
- conversations
- messages
- message_violations
- reviews
- curriculum_files
- merithub_sessions
- session_recordings
- ai_session_reports
- admin_audit_logs

Enable RLS on all protected tables.

---

### 3. Supabase Auth

Implement:

- login
- signup student
- signup tutor
- email verification if needed
- phone OTP if enabled
- role-based redirects
- session handling
- protected route middleware

Protected routes:

```txt
/student/*
/tutor/*
/admin/*
```

Admin routes must require admin role server-side.

---

### 4. Tutor Approval

Rules:

- tutor signs up
- tutor profile is inactive
- admin reviews tutor
- admin approves/rejects
- only approved + visible tutors show publicly
- tutor documents remain private

---

### 5. Availability

Persist tutor availability slots.

Rules:

- Qatar timezone only
- 30-minute slot increments
- 50-minute lesson duration
- teaching mode per slot:
  - online
  - in_person
  - both
- no double booking
- booked slots become unavailable

---

### 6. Booking Engine

Booking flow:

1. Student selects tutor.
2. Student selects available slot.
3. Student selects teaching mode.
4. Booking created as `requested`.
5. Tutor accepts or rejects.
6. If accepted, student receives payment request.
7. Student pays through Tap Payments.
8. Booking becomes confirmed after webhook verification.
9. If online, Merithub session is created.
10. Lesson completion updates wallet state.
11. AI Lite report starts after online session if consent exists.

Booking statuses:

- requested
- accepted
- payment_pending
- paid
- confirmed
- completed
- cancelled
- rejected
- disputed

---

### 7. Tap Payments

Payment provider:

- Tap Payments only

Rules:

- external checkout link
- payment after tutor accepts
- webhook verification required
- server-side payment status only
- no Stripe
- no PayPal
- no cash
- no Apple In-App Purchases

Flow:

1. Backend creates Tap charge.
2. Backend stores payment record.
3. Student opens Tap checkout URL.
4. Tap sends webhook.
5. Backend verifies webhook.
6. Booking/payment state updates.
7. Wallet ledger updates server-side.

---

### 8. Wallet and Withdrawals

Build:

- wallet_accounts
- wallet_transactions
- withdrawal_requests
- minimum withdrawal: 100 QAR
- admin approval/rejection
- transaction history

Rules:

- no frontend-only wallet updates
- no negative balances
- all financial updates server-side
- all payment changes logged

---

### 9. Merithub

Use Merithub for online lessons.

Rules:

- create Merithub session only after confirmed payment
- store session ID and join links
- do not expose Merithub credentials frontend
- retrieve recordings only when consent exists
- in-person bookings do not create Merithub sessions

---

### 10. Gemini AI Lite Reports

AI Lite is included in MVP.

Build:

- recording retrieval after Merithub session
- upload recording to Gemini
- generate Arabic report
- save report JSON
- save Arabic report text
- send report by Resend email
- display report in dashboards

Report status:

- pending
- processing
- completed
- failed

Rules:

- consent required
- no RAG
- no embeddings
- no vector DB
- no psychological/medical diagnosis
- constructive educational language only

---

### 11. Chat and Message Safety

Build:

- conversations
- messages
- realtime updates
- participant access rules
- blocked contact-sharing detection
- violation logging

Block:

- phone numbers
- emails
- WhatsApp links
- Telegram usernames
- external payment wording

---

### 12. Curriculum Uploads

Admin can upload curriculum files.

Rules:

- admin only
- files are private
- metadata saved
- AI Lite may reference metadata only
- no curriculum RAG in MVP

---

### 13. Reviews

Rules:

- only students with completed paid lessons can review
- one review per completed booking
- no anonymous reviews
- tutor rating average updates automatically

---

## Known Frontend Gaps To Fix

Claude Code should review these during backend integration:

- Add ToastProvider to root layout if not already added.
- Add route-level error boundaries.
- Add route-level loading states for admin pages.
- Verify Avatar component image parent positioning.
- Convert duplicated messages pages into shared role-aware component if needed.
- Connect tutor signup file upload to secure storage.
- Replace all mock data with real queries.
- Add server-side validation to all forms.

---

## Security Requirements

Claude Code must implement:

- Supabase RLS
- server-side role checks
- webhook signature verification
- admin audit logs
- input validation
- rate limiting where appropriate
- secure file access
- private tutor documents
- protected AI reports
- protected recordings
- server-only service role key
- environment validation

---

## Mobile Readiness Requirements

Keep backend mobile-ready.

- Tap payment uses external checkout URLs.
- Future iOS can open payment URL.
- Payment state is server-side.
- Reports saved in database.
- Merithub links stored in backend.
- No browser-only business logic.
- Deep links can be added later.

---

## What Claude Code Must Not Build

Do not build:

- lesson packages
- subscriptions
- loyalty points
- ambassador levels
- Daily.co
- intro calls
- complex escrow marketplace system
- advanced RAG
- vector database
- long-term AI memory
- Google Calendar sync
- recurring bookings
- full redesign

---

## Recommended Claude Code Implementation Order

1. Audit current frontend and dependencies.
2. Add `.env.example` and env validation.
3. Create Supabase client/server helpers.
4. Create database schema/migrations.
5. Add RLS policies.
6. Add auth flows and middleware.
7. Replace tutor mock data.
8. Replace dashboard mock data.
9. Add tutor approval logic.
10. Add availability persistence.
11. Add booking RPCs and conflict validation.
12. Add Tap Payments charge creation.
13. Add Tap webhook.
14. Add wallet ledger.
15. Add withdrawals.
16. Add Merithub session creation.
17. Add chat realtime and filtering.
18. Add Gemini AI Lite reporting.
19. Add admin backend actions.
20. Run security audit.
21. Create backend summary files.

---

## Required Claude Code Final Deliverables

At completion, create:

- BACKEND_IMPLEMENTATION_SUMMARY.md
- DATABASE_SCHEMA_SUMMARY.md
- SECURITY_AUDIT.md
- ENV_SETUP.md
- PRODUCTION_CHECKLIST.md

---

## Smoke Test URLs

```txt
http://localhost:3000
http://localhost:3000/tutors
http://localhost:3000/tutors/t1
http://localhost:3000/login
http://localhost:3000/signup/tutor
http://localhost:3000/student/dashboard
http://localhost:3000/tutor/availability
http://localhost:3000/admin
http://localhost:3000/nonexistent
```

---

## Final Instruction To Claude Code

Continue from the current project state.

Preserve the frontend.

Connect real backend systems.

Prioritize:
1. Security
2. Correctness
3. Payment safety
4. RLS correctness
5. Maintainability
