# WORK_SPLIT.md

## Build Strategy

This project uses a ONE-TIME HANDOFF strategy.

- Antigravity builds the full frontend MVP and simple UI structure first.
- After Antigravity finishes, it creates ONE handoff file.
- Claude Code then takes over once and completes the complex backend, integrations, security, and production logic.

Do NOT move back and forth between Antigravity and Claude Code.

---

# Antigravity Scope

Antigravity must build:

## 1. Project Foundation
- React project structure
- Tailwind CSS
- Arabic RTL layout
- Theme tokens
- Routing
- Shared layout
- Navbar
- Footer

## 2. Public Pages
- Landing page
- Tutors listing page
- Tutor profile page
- Login page
- Student signup page
- Tutor signup page
- Forgot password page

## 3. Student Pages
- Student dashboard
- Student bookings
- Student messages
- Student wallet
- Student settings

## 4. Tutor Pages
- Tutor dashboard
- Tutor bookings
- Tutor messages
- Tutor wallet
- Tutor profile edit
- Tutor settings
- Tutor availability calendar UI

## 5. Admin Pages
- Admin dashboard
- Tutor approval page
- Booking management page
- Payment management page
- Withdrawal requests page
- Reports/messages review page

## 6. Reusable Components
- Button
- Input
- Select
- Textarea
- Modal
- Tabs
- Toast
- TutorCard
- BookingCard
- DashboardCard
- WalletCard
- AvailabilityCalendar
- EmptyState
- LoadingState

## 7. Availability Calendar UI
Build a calendar-style weekly grid:
- Days as columns
- Time as rows
- Click/drag to create slots
- Resize slots
- Delete slots
- Mark slot as online / in-person / both
- Qatar timezone only

Important:
Antigravity builds UI only. Claude Code handles persistence and validation.

---

# Antigravity Must NOT Build

Antigravity must NOT build:
- Tap Payments real integration
- Payment webhooks
- Wallet calculations
- Refund logic
- Supabase RLS
- Complex database migrations
- Merithub API integration
- Booking conflict validation
- Withdrawal processing
- Admin permission security
- Financial audit logs

Antigravity may use clearly labeled mock data only.

---

# Claude Code Scope

Claude Code receives the project once after Antigravity finishes.

Claude Code must build:

## 1. Supabase Backend
- Database schema
- Tables
- Enums
- Indexes
- Relationships
- RLS policies
- Triggers
- Audit logs

## 2. Authentication
- Supabase Auth
- Email login
- OTP verification
- Role-based redirects
- Protected routes
- Admin-only access

## 3. Booking System
- Booking lifecycle
- Tutor approval check
- Availability validation
- Double-booking prevention
- Cancellation logic
- Booking status transitions

## 4. Tap Payments
- Payment creation
- Payment verification
- Webhooks
- Refunds
- Wallet updates
- Withdrawal requests
- Admin approval flow

## 5. Merithub
- Online lesson session creation
- Merithub links
- Booking-to-session connection
- Error handling

## 6. Chat Security
- Internal messaging storage
- Block phone numbers
- Block emails
- Block WhatsApp/Telegram links
- Violation tracking

## 7. Admin Logic
- Tutor approval
- Booking management
- Payment review
- Withdrawal approval
- User suspension

## 8. Production Readiness
- Security audit
- RLS audit
- Payment audit
- Environment variable validation
- Deployment checks

---

# Final Rule

Antigravity completes all assigned frontend work first.

Then Claude Code takes over once.

No repeated back-and-forth handoffs.
