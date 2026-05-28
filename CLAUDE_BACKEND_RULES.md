# CLAUDE_BACKEND_RULES.md

## Purpose

This file defines the rules Claude Code must follow when taking over the Mudarris project after the Antigravity frontend MVP stage.

Claude Code is responsible for backend, integrations, security, database, and production readiness.

Claude Code must NOT redesign or rebuild the frontend.

---

## Project Context

Mudarris is an Arabic RTL tutoring marketplace for Qatar.

Current stage:
- Antigravity completed the frontend MVP.
- Claude Code must now connect the UI to real backend systems.

Main systems:
- Supabase Auth
- Supabase PostgreSQL
- Supabase RLS
- Tap Payments
- Merithub online sessions
- Gemini AI Lite reports
- Resend emails
- Twilio OTP
- Uploadthing or Supabase Storage for files

---

## Absolute Rules

Claude Code must:

1. Continue from the existing project.
2. Do not rebuild the frontend from scratch.
3. Do not redesign the UI.
4. Do not change the visual identity.
5. Do not change routes unless required for security.
6. Do not replace the design system.
7. Do not remove RTL behavior.
8. Do not introduce unrelated features.
9. Do not build packages, loyalty, ambassador levels, or Phase 2 gamification.
10. Keep the project mobile-app-ready.

---

## Frontend Protection Rules

Do not change:
- Colors
- Typography
- Layout spacing
- Card styling
- Button styling
- RTL direction
- Dashboard visual structure
- Tutor card design
- Availability calendar visual structure
- Public page visual identity

Allowed frontend changes:
- Add missing loading states
- Add error states
- Connect forms to backend
- Add real data bindings
- Add route guards
- Fix bugs
- Add accessibility improvements
- Add server-driven state

---

## Backend Scope

Claude Code must build:

### Supabase
- database schema
- enums
- indexes
- relationships
- RLS policies
- triggers
- RPC functions
- audit logs

### Auth
- email/password login
- student signup
- tutor signup
- role-based redirects
- protected route middleware
- admin-only access
- OTP verification where required

### Tutor Approval
- tutor starts inactive
- admin approves/rejects tutor
- only approved visible tutors appear publicly
- tutor documents are private

### Booking
- lesson duration fixed at 50 minutes
- student requests booking
- tutor accepts/rejects booking
- payment happens after tutor acceptance
- no double booking
- online lessons use Merithub
- in-person lessons do not use Merithub

### Availability
- persist tutor availability slots
- Qatar timezone only
- 30-minute slot increments
- 50-minute lesson duration
- validate conflicts server-side

### Payments
- Tap Payments only
- external checkout link flow
- webhook verification required
- never trust client payment state
- payment status is server-side only
- wallet ledger must be server-side only

### Wallets and Withdrawals
- available balance
- pending balance
- withdrawal requests
- minimum withdrawal: 100 QAR
- admin approve/reject flow
- transaction ledger

### Merithub
- create online session only after payment confirmation
- store session ID and join links
- do not expose Merithub secrets to frontend
- retrieve recording only if consent exists

### Gemini AI Lite Reports
- AI Lite is part of MVP
- applies only to online Merithub sessions
- requires consent
- retrieve recording
- upload to Gemini
- generate Arabic educational report
- save report JSON and Arabic text
- email report to parent/student/tutor
- expose report in dashboards

### Chat
- real-time messages
- block phone numbers
- block emails
- block WhatsApp links
- block Telegram usernames
- block external payment requests
- log violations

### Admin
- tutor approval
- booking management
- payment review
- withdrawal approval
- curriculum upload
- AI report monitoring
- user suspension
- audit logs

---

## Supabase Schema Requirements

Claude Code must create or verify tables for:

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
- messages
- conversations
- message_violations
- reviews
- curriculum_files
- merithub_sessions
- session_recordings
- ai_session_reports
- admin_audit_logs

Use enums for:
- user_role
- tutor_status
- booking_status
- payment_status
- withdrawal_status
- teaching_mode
- report_status
- message_status

---

## RLS Requirements

RLS must be enabled on all user-owned tables.

Rules:
- Students can read/update only own profile.
- Tutors can read/update only own profile.
- Approved tutor profiles can be publicly listed.
- Tutor documents are admin-only plus owner.
- Students can access only own bookings.
- Tutors can access bookings assigned to them.
- Messages visible only to conversation participants and admins when needed.
- Admins can access all operational records.
- Payment writes happen server-side only.
- Wallet writes happen server-side only.
- AI report access limited to related student, parent, tutor, and admin.

---

## Payment Rules

Payment provider:
- Tap Payments only

Flow:
1. Tutor accepts booking.
2. Backend creates Tap charge.
3. Backend returns external checkout URL.
4. Student opens Tap checkout.
5. Tap webhook confirms payment.
6. Backend verifies webhook signature.
7. Booking becomes confirmed.
8. If online, backend creates Merithub session.
9. Wallet ledger updates only after valid payment state.

Do not:
- add Stripe
- add PayPal
- add cash payments
- add Apple In-App Purchases
- trust frontend payment redirect alone

---

## Booking Rules

Statuses:
- requested
- accepted
- payment_pending
- paid
- confirmed
- completed
- cancelled
- rejected
- disputed

Validation:
- tutor must be approved
- tutor must be visible
- selected slot must exist
- selected slot must match teaching mode
- selected slot must not conflict
- booking duration is 50 minutes
- payment only after accepted booking

---

## AI Report Rules

AI Lite report is included in MVP.

Do not build:
- vector DB
- embeddings
- RAG
- long-term AI memory
- psychological diagnosis
- behavior scoring
- AI grading system

Build:
- recording retrieval
- Gemini upload
- Arabic report generation
- async processing
- report status tracking
- email delivery
- dashboard visibility

Safety:
- constructive educational language only
- no medical or psychological labels
- no harmful labels
- consent required

---

## Mobile App Readiness

Keep backend reusable for future iOS app.

Rules:
- payment returns must support web URLs now and deep links later
- business logic must not live only in React
- all important states must be server-side
- AI reports saved in database, not email-only
- Merithub links stored in backend

---

## Environment Variables

Claude Code must create/update `.env.example` with the variables in ENV_STRUCTURE.md.

Never commit real secrets.

---

## Implementation Order

Claude Code should work in this order:

1. Audit existing frontend structure.
2. Add environment validation.
3. Create Supabase schema and migrations.
4. Add RLS policies.
5. Add auth and middleware.
6. Replace mock data with Supabase queries.
7. Implement tutor approval.
8. Implement availability persistence.
9. Implement booking RPCs and conflict validation.
10. Implement Tap Payments and webhooks.
11. Implement wallet ledger and withdrawals.
12. Implement Merithub session creation.
13. Implement chat and filtering.
14. Implement Gemini AI Lite reports.
15. Implement admin backend actions.
16. Add error boundaries/loading routes.
17. Run security audit.
18. Update handoff/progress report.

---

## Required Output From Claude Code

At the end, Claude Code must create:

- BACKEND_IMPLEMENTATION_SUMMARY.md
- SECURITY_AUDIT.md
- ENV_SETUP.md
- DATABASE_SCHEMA_SUMMARY.md
- PRODUCTION_CHECKLIST.md

---

## Final Rule

Claude Code completes the production backend and integrations.

Claude Code must preserve the Antigravity frontend UI.

Backend correctness, security, and financial safety are more important than speed.
