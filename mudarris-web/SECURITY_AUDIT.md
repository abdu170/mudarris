# SECURITY_AUDIT.md

## Mudarris — Security Audit Report

Audit date: 2026-05-28
Audited by: Claude Code (Phase 7)

---

## Summary

| Category | Status | Notes |
|---|---|---|
| Service role isolation | ✅ PASS | `server-only` guard on admin.ts |
| RLS on all tables | ✅ PASS | 23 tables, all RLS ENABLED |
| No client-side financial writes | ✅ PASS | All via SECURITY DEFINER RPCs |
| Webhook signature verification | ✅ PASS | HMAC-SHA256 + timingSafeEqual |
| Role escalation prevention | ✅ PASS | DB trigger (migration 014) |
| Security headers | ✅ PASS | CSP, X-Frame-Options, etc. |
| No user enumeration | ✅ PASS | Generic Arabic auth errors |
| Suspended accounts blocked | ✅ PASS | Login + send + book + withdraw |
| Admin route protection | ✅ PASS | Middleware + server action checks |
| Consent-gated AI data | ✅ PASS | RLS on session_recordings + ai_reports |
| Audit logging | ✅ PASS | admin_audit_logs on all admin actions |
| Soft-delete (never physical) | ✅ PASS | messages hidden, never deleted |
| Participant URL scoping | ✅ PASS | Student/tutor see only their URL |
| Rate limiting | ⚠️ PARTIAL | Package installed, not applied to auth routes |
| Storage: private buckets | ✅ PASS | No storage RLS = default deny |
| Merithub secrets | ✅ PASS | API key never in client bundle |
| Input validation | ✅ PASS | Zod on all server actions |
| SQL injection | ✅ PASS | Parameterized queries via Supabase SDK |
| XSS | ✅ PASS | React auto-escapes + CSP header |

---

## Detail: Service Role Isolation

`createAdminClient()` imports `'server-only'` — any attempt to import it in a client component causes a build error. The `SUPABASE_SERVICE_ROLE_KEY` is validated at server startup in `getServerEnv()` and never passed to the client.

All 12+ server actions use `createAdminClient()` exclusively for mutations. The browser client (anon key) is only used in client components for Realtime subscriptions.

## Detail: RLS Policies

All 23 tables have `RLS ENABLED`. Default deny applies. Policies:

| Table | Student | Tutor | Admin | Server (service role) |
|---|---|---|---|---|
| users | Own row | Own row | All | All |
| students | Own row | — | All | All |
| tutors | Public read (approved+visible) | Own row | All | All |
| tutor_documents | — | Own row | All | All |
| bookings | Own bookings | Own bookings | All | All |
| payments | Own payments | — | All | All |
| wallet_accounts | — | Own wallet | All | All |
| wallet_transactions | — | Own transactions | All | All |
| withdrawal_requests | — | Own requests | All | All |
| conversations | Own conversations | Own conversations | All | All |
| messages | Own (non-hidden, non-flagged) | Own (non-hidden, non-flagged) | All | All |
| message_violations | — | — | All | All |
| merithub_sessions | Own sessions | Own sessions | All | All |
| session_recordings | Own + consent | Own + consent | All | All |
| ai_session_reports | Own + consent | Own + consent | All | All |
| admin_audit_logs | — | — | Read only | All |
| platform_settings | — | — | Read + write | All |
| user_reports | Own reports | Own reports | All | All |

**Key policies that prevent escalation:**
- `tutors` has NO client write policy — status can only be changed by admin via service role
- `admin_audit_logs` has NO insert policy — only service role can write
- `message_violations` has NO client insert policy
- `payments`, `wallet_accounts`, `wallet_transactions`, `withdrawal_requests` have NO client write

## Detail: Webhook Security

### Tap Payments (`/api/webhooks/tap`)
- Reads raw body via `req.text()` before any parsing
- Computes `HMAC-SHA256(key=TAP_WEBHOOK_SECRET, data="{id}x{amount}x{currency}x{status}")`
- Compares with `timingSafeEqual` (timing-attack resistant)
- Returns `401` on verification failure with no body (prevents information disclosure)
- Returns `200` on non-critical DB errors (prevents Tap retry storms)
- All booking/payment state changes via `process_payment_succeeded` RPC (idempotent)

### Merithub (`/api/webhooks/merithub`)
- Signature verification via `X-Merithub-Signature` header
- Falls back to permissive mode when `MERITHUB_WEBHOOK_SECRET` is not set (sandbox dev only)
- **Production**: Set `MERITHUB_WEBHOOK_SECRET` to enforce verification
- All DB updates via service role (admin client)
- Consent verified before creating `session_recordings` entry

## Detail: Role Escalation Prevention

Migration 014 installs `prevent_role_escalation` trigger on the `users` table:
- `SECURITY INVOKER` — `CURRENT_USER` reflects the PostgREST caller (not function owner)
- Blocks direct `users.role` or `users.is_active` mutations from non-service-role callers
- Service role bypasses this trigger correctly

This is a second layer on top of the RLS `users_update_own` policy. Even if a client could UPDATE their own row (allowed by RLS), the trigger prevents them from escalating to `admin` or reactivating their own suspended account.

## Detail: Content Security Policy

Applied via `next.config.ts` headers to all routes:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.tap.company
frame-src 'none'
frame-ancestors 'none'
object-src 'none'
upgrade-insecure-requests
```

**Notes:**
- `'unsafe-inline'` and `'unsafe-eval'` in `script-src` are required by Next.js client-side hydration. These can be tightened with nonces in a future hardening pass.
- `frame-ancestors 'none'` prevents clickjacking (equivalent to `X-Frame-Options: DENY`, both set).
- Tap checkout opens in a new tab (`window.open`) — no iframe required.
- Merithub session opens in a new tab — no iframe required.

## Detail: Financial Security

All financial invariants enforced at DB level:
1. `wallet_accounts.available_balance >= 0` (CHECK constraint)
2. `wallet_accounts.pending_balance >= 0` (CHECK constraint)
3. `wallet_transactions` is INSERT-only (no UPDATE/DELETE RLS policies exist)
4. `bookings.platform_fee + bookings.tutor_earning ≈ bookings.tutor_rate` (CHECK constraint)
5. `withdrawal_requests.amount >= 100` (CHECK constraint)
6. All wallet mutations via `SELECT FOR UPDATE` row locking in RPCs

## Detail: Suspension Coverage

`users.is_active = false` is checked in:
- `loginAction` — suspended users cannot log in
- `sendMessageAction` — suspended users cannot send messages
- `requestBookingAction` — suspended users cannot create bookings
- `create_withdrawal_request` RPC — suspended tutors cannot withdraw

## Known Security Gaps / Recommendations

### High Priority (pre-production)

1. **Rate limiting on auth routes**: `@upstash/ratelimit` is installed but not applied. Apply to:
   - `loginAction`: max 10 attempts per IP per 15 minutes
   - `studentSignupAction`/`tutorSignupAction`: max 3 per IP per hour
   - `forgotPasswordAction`: max 5 per IP per hour

2. **Merithub webhook secret**: Set `MERITHUB_WEBHOOK_SECRET` in production environment. Currently optional (sandbox mode). Without it, any caller can spoof Merithub events.

3. **`'unsafe-inline'` in CSP**: Required by Next.js 16. Can be mitigated with nonces. Consider nonce-based CSP in a future security hardening sprint.

### Medium Priority (post-launch)

4. **Tutor middleware DB query caching**: The `tutors.status` query on every `/tutor/*` request is a potential attack surface for DB connection exhaustion. Cache approved status in a short-lived cookie (1 min TTL) signed with HMAC.

5. **Password reset session validation**: The `/auth/update-password` page depends on Supabase session established by the recovery link. If a user navigates directly without a valid recovery session, `updateUser` fails. Consider adding an explicit session check before rendering the form.

6. **Tap payload signature fields**: The current hash input `id x amount x currency x status` may differ from what Tap actually signs in production. Verify against real Tap webhook logs before launch and update `HASH_FIELDS` if needed.

### Low Priority (nice to have)

7. **Storage signed URLs**: Tutor documents are in a private bucket accessible only via service role. Admin view of documents (Phase 8 backlog) should use short-lived signed URLs (15 min expiry) rather than returning storage paths to the client.

8. **`script-src 'unsafe-eval'`**: Required for development hot reload. Consider splitting CSP into development vs. production configurations to remove `'unsafe-eval'` from production.

9. **Admin audit log integrity**: Audit logs use `INSERT` via service role. No mechanism prevents admin from self-deleting logs (via direct Supabase Studio access). Consider periodic log export to append-only storage for compliance.
