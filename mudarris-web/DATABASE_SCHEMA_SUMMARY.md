# DATABASE_SCHEMA_SUMMARY.md

## Mudarris — Database Schema Summary

Database: Supabase (PostgreSQL 15)
Schema completion date: 2026-05-28
Total migrations: 23

---

## Enums

| Enum | Values |
|---|---|
| `user_role` | student, tutor, admin |
| `tutor_status` | pending, approved, rejected, suspended |
| `booking_status` | requested, accepted, payment_pending, paid, confirmed, completed, cancelled, rejected, disputed |
| `payment_status` | pending, processing, succeeded, failed, refunded, partially_refunded |
| `withdrawal_status` | pending, approved, rejected, processing, completed |
| `teaching_mode` | online, in_person, both |
| `report_status` | no_report, pending, processing, completed, failed |
| `message_status` | sent, delivered, read |
| `user_report_status` | pending, reviewed, resolved, dismissed |

---

## Tables (23 total)

### Core User Tables

| Table | Key Columns | RLS |
|---|---|---|
| `users` | id (UUID), role, full_name_ar, is_active, phone, avatar_url | Own row + admin; approved tutor public |
| `students` | id→users, grade_level, guardian_*, recording_consent_given_at, ai_analysis_consent_given_at | Own + admin |
| `tutors` | id→users, status, display_name_ar, bio_ar, subjects[], teaching_modes[], hourly_rate, is_visible | Public (approved+visible); admin |
| `tutor_documents` | tutor_id→users, document_type, storage_path, mime_type, file_size | Owner + admin |

### Scheduling & Booking

| Table | Key Columns | RLS |
|---|---|---|
| `tutor_weekly_schedules` | tutor_id, day_of_week (0–6), start_time, end_time, teaching_mode, is_active | Tutor own; authenticated read |
| `tutor_unavailable_blocks` | tutor_id, starts_at, ends_at, reason | Tutor own; authenticated read |
| `bookings` | student_id, tutor_id, status, teaching_mode, scheduled_at, ends_at (50min fixed), tutor_rate, platform_fee, tutor_earning, recording_consent, ai_analysis_consent | Participants + admin; NO client write |

### Payment & Finance

| Table | Key Columns | RLS |
|---|---|---|
| `payments` | booking_id, student_id, amount, currency, status, tap_charge_id (UNIQUE), tap_checkout_url | Participants + admin; NO client write |
| `wallet_accounts` | tutor_id, available_balance (≥0), pending_balance (≥0), total_earned, total_withdrawn | Tutor own + admin; NO client write |
| `wallet_transactions` | wallet_id, booking_id, withdrawal_id, type, amount, balance_after | Tutor own + admin; INSERT only (immutable) |
| `withdrawal_requests` | tutor_id, wallet_id, amount (≥100), bank_name, iban, status, reviewed_by | Tutor own + admin |
| `platform_settings` | key (PK), value | Admin only |

### Chat & Moderation

| Table | Key Columns | RLS |
|---|---|---|
| `conversations` | booking_id, student_id, tutor_id, last_message_at, student_last_read_at, tutor_last_read_at | Participants + admin |
| `messages` | conversation_id, sender_id, content (1–2000 chars), is_flagged, hidden_by_admin, hidden_at, hidden_by | Participants (non-hidden, non-flagged) + admin |
| `message_violations` | message_id, reporter_id, violation_type, matched_pattern | Admin only; INSERT via service role |
| `user_reports` | reporter_id, reported_user_id, message_id, conversation_id, reason, status, admin_note | Reporter reads own; admin reads all |

### Online Sessions

| Table | Key Columns | RLS |
|---|---|---|
| `merithub_sessions` | booking_id (UNIQUE), merithub_session_id (UNIQUE), student_join_url, tutor_join_url, recording_url, session_started_at, session_ended_at, cancelled_at, cancel_reason | Participants + admin; NO client write |

### AI-Ready (Placeholder)

| Table | Key Columns | RLS |
|---|---|---|
| `session_recordings` | booking_id (UNIQUE), merithub_session_id, recording_url, duration_seconds, processing_status, consent_verified_at | Consent-gated (recording_consent=true) |
| `ai_session_reports` | booking_id (UNIQUE), recording_id, status, report_json, report_text_ar, generated_at, emailed_at | Consent-gated (ai_analysis_consent=true) |
| `lesson_curriculum_links` | booking_id (UNIQUE), curriculum_file_id, unit, lesson_title | Participants + admin |
| `curriculum_files` | admin_id, file_name, storage_path, mime_type, description, is_active | Authenticated read; admin write |

### Admin

| Table | Key Columns | RLS |
|---|---|---|
| `reviews` | booking_id (UNIQUE), student_id, tutor_id, rating (1–5), comment_ar | Public read (visible); NO client write |
| `admin_audit_logs` | admin_id, action_type, target_entity, target_entity_id, metadata | Admin read only; NO client write |

---

## Key Constraints

| Constraint | Table | Rule |
|---|---|---|
| `booking_duration_50min` | bookings | `ends_at = scheduled_at + 3000 seconds` |
| `bookings_no_tutor_overlap` | bookings | Exclusion: tutor + time range overlap (active statuses) |
| `bookings_no_duplicate_requests` | bookings | Unique: student + tutor + scheduled_at WHERE status='requested' |
| `booking_fee_check` | bookings | `platform_fee + tutor_earning ≈ tutor_rate` (±0.01 tolerance) |
| `message_content_length` | messages | `1 ≤ length(content) ≤ 2000` |
| `wallet_balance_nonneg` | wallet_accounts | `available_balance >= 0`, `pending_balance >= 0` |
| `withdrawal_min_100` | withdrawal_requests | `amount >= 100` |
| `doc_allowed_mime` | tutor_documents | pdf, jpeg, png, webp only |
| `curriculum_allowed_mime` | curriculum_files | pdf, jpeg, png, docx, pptx only |
| `booking_consent` | bookings | FK to students table for consent fields |

---

## RPCs (SECURITY DEFINER)

| Function | Description |
|---|---|
| `check_booking_conflict(tutor_id, scheduled_at, ends_at)` | SELECT FOR UPDATE — returns boolean; called before booking create/accept |
| `get_tutor_available_slots(tutor_id, week_start)` | Computes available 50-min slots from weekly schedule; never exposes raw schedule |
| `get_admin_stats()` | Returns JSON aggregate of platform metrics |
| `get_commission_pct()` | Returns commission as decimal (0.15) from platform_settings |
| `ensure_wallet_exists(tutor_id)` | Creates wallet if missing; idempotent; returns wallet_id |
| `process_payment_succeeded(payment_id, tap_charge_id, payload)` | Atomic: payment→succeeded, booking→confirmed, wallet credit |
| `complete_booking_release_earnings(booking_id, admin_id)` | Atomic: booking→completed, pending→available balance |
| `create_withdrawal_request(tutor_id, amount, bank, iban, name)` | Validates suspension + balance; creates withdrawal record |
| `admin_approve_withdrawal(withdrawal_id, admin_id)` | Atomic: deducts balance, marks approved, audit log |
| `admin_reject_withdrawal(withdrawal_id, admin_id, note)` | Marks rejected, audit log |
| `create_merithub_session_record(booking_id, session_id, student_url, tutor_url)` | Idempotent; validates online+confirmed booking |

---

## Triggers

| Trigger | Table | Function |
|---|---|---|
| `on_auth_user_created` | auth.users | `handle_new_auth_user()` — creates users row |
| `trg_set_updated_at_*` | 13+ tables | `set_updated_at()` — auto-updated_at |
| `trg_refresh_tutor_rating` | reviews | `refresh_tutor_rating()` — recalculates avg rating |
| `trg_update_conv_last_message` | messages | `update_conversation_last_message()` — updates conversations.last_message_at |
| `prevent_role_escalation` | users | Blocks direct role/is_active mutations from non-service-role |
| `set_merithub_sessions_updated_at` | merithub_sessions | `set_updated_at()` — updated on lifecycle events |

---

## Storage Buckets

| Bucket | Access | Max Size | Allowed MIME |
|---|---|---|---|
| `avatars` | Public | 2 MB | image/jpeg, image/png, image/webp, image/gif |
| `tutor-documents` | Private | 10 MB | pdf, jpeg, png, webp |
| `curriculum-files` | Private | 50 MB | pdf, jpeg, png, docx, pptx |

Private buckets have **no storage RLS policies** — default deny for all non-service-role. Access only via `createAdminClient()`.

---

## Backup & Recovery

### Critical Tables (irreplaceable financial data)
Priority 1 — must be backed up before any destructive operations:
- `wallet_transactions` — immutable ledger
- `payments` — Tap charge records
- `withdrawal_requests` — payout records
- `bookings` — booking history and financial snapshots
- `admin_audit_logs` — compliance trail

Priority 2 — user data:
- `users`, `students`, `tutors` — account data
- `tutor_documents` — verification documents (storage backup separately)

Priority 3 — operational data:
- `conversations`, `messages`, `message_violations` — chat history
- `merithub_sessions` — session records
- `session_recordings`, `ai_session_reports` — AI pipeline data

### Supabase Backup Strategy
- **Point-in-time recovery**: Available on Pro plan and above. Enable in Supabase dashboard > Database > Backups.
- **Daily backups**: Supabase automatically creates daily snapshots on Pro plan.
- **Pre-migration backup**: Always run `pg_dump` before applying new migrations in production:
  ```bash
  pg_dump -Fc "postgresql://postgres:[password]@[host]/postgres" > backup_$(date +%Y%m%d).dump
  ```
- **Storage backup**: Supabase Storage is backed up separately from the database. Tutor documents and curriculum files should be periodically synced to a secondary storage provider (e.g., AWS S3) for redundancy.

### Recovery Priority Order
1. Restore `wallet_accounts` from `wallet_transactions` ledger (can be recomputed)
2. Restore `bookings` and `payments`
3. Restore user accounts
4. Restore `merithub_sessions` and `session_recordings`
5. Restore chat history
