
# DATABASE.md

## Database Engine
- Supabase PostgreSQL

## Core Architecture
- Multi-role marketplace architecture
- Student / Tutor / Admin separation
- Escrow-ready payment lifecycle
- Full auditability
- Soft-delete strategy

## Core Tables

### users
Main identity table.

Fields:
- id
- role
- email
- phone
- password_hash
- is_verified
- created_at

### tutors
Tutor public + private profile.

Fields:
- user_id
- display_name
- real_name
- verification_status
- bio
- experience_years
- intro_call_enabled
- wallet_balance
- pending_balance
- rating_average

### students
Student profile.

Fields:
- user_id
- grade
- curriculum
- parent_name
- parent_phone

### bookings
Lesson bookings.

States:
- pending
- confirmed
- completed
- cancelled
- disputed

### payments
All payment transactions through Tap Payments.

States:
- pending
- paid
- failed
- refunded
- escrowed
- released

### escrow_transactions
Tracks held tutor funds.

### referrals
Tracks referral system.

### messages
Internal messaging system.

### violations
Policy violations.

### intro_calls
Daily.co call tracking.

### withdrawal_requests
Tutor payout requests.

## Security
- Supabase Row Level Security mandatory
- Role-based access policies
- Audit logs enabled

## Performance
- Indexed booking queries
- Indexed tutor search
- Indexed payments
- Full-text Arabic search support
