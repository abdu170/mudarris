# SYSTEM_FLOW.md

## Purpose

This file defines the user flow, marketplace loading strategy, page behavior, and system interaction flow for the "مُدرّس" platform.

The goal is to prevent overbuilding, overfetching, slow pages, and inconsistent user journeys.

---

## Core Principles

- Build MVP flows only.
- Keep loading fast and predictable.
- Avoid loading unnecessary data.
- Use pagination instead of infinite scroll in MVP.
- Each dashboard widget should load independently.
- A failed widget must not break the full page.
- Use clear empty states and loading states.
- Do not invent extra flows.

---

# 1. Public Website Flow

## Landing Page

Route:
- /

Initial load should include:
- Hero section
- Search area
- How it works
- 6 featured tutors only
- Benefits section
- CTA section
- Footer

Rules:
- Do not load the full tutor database on homepage.
- Featured tutors should be limited to 6.
- Homepage search should redirect to /tutors with query parameters.
- Promo/marketing content should load before tutor data.
- Tutor data failure should not break the homepage.

---

# 2. Tutors Listing Flow

Route:
- /tutors

## Tutor Cards Per Page

Default:
- 12 tutor cards per page

Pagination:
- Use pagination in MVP.
- Do not use infinite scroll in MVP.

Why:
- Better performance
- Easier SEO
- Easier debugging
- Lower database pressure
- Better mobile stability

## Loading Behavior

Initial page load:
- Load filters
- Load first 12 tutor cards
- Show skeleton cards while loading

Tutor cards should include:
- Tutor image
- Display name
- Verification badge
- Rating
- Subjects
- Grade levels
- Teaching mode
- Areas
- Hourly price
- Availability preview
- CTA button

## Filters

Filters:
- Subject
- Grade level
- Price range
- Area
- Teaching mode: online / in-person / both
- Tutor gender
- Rating

Behavior:
- Filters update results without full page refresh.
- Filter changes reset pagination to page 1.
- Search parameters should be reflected in URL query params.
- No filter should reload the entire app shell.

## Sorting

Sorting options:
- Highest rated
- Lowest price
- Newest

Default sorting:
- Recommended

Recommended ranking can use:
- Approved tutors only
- Profile completion
- Rating
- Availability
- Recent activity

Do not build complex AI ranking in MVP.

---

# 3. Tutor Profile Flow

Route:
- /tutor/:id

Load:
- Tutor profile
- Availability preview
- Reviews summary
- CTA actions

Actions:
- Message tutor
- Request booking
- Select online lesson
- Select in-person lesson

Rules:
- Show only approved and visible tutors publicly.
- If tutor is unavailable, show clear unavailable state.
- Do not expose tutor private data or documents.

---

# 4. Booking Flow

## Final Booking Decisions

- Lesson duration: 50 minutes
- Tutor sets hourly price during registration
- Student requests booking first
- Tutor accepts or rejects
- Payment happens only after tutor accepts
- Online lessons use Merithub
- In-person lessons do not generate Merithub link

## Booking Steps

1. Student selects tutor.
2. Student selects available time slot.
3. Student selects teaching mode:
   - online
   - in-person
4. Student submits booking request.
5. Tutor receives request.
6. Tutor accepts or rejects.
7. If accepted, student receives payment request.
8. Student pays via Tap Payments.
9. Booking becomes confirmed.
10. If online, Merithub session is created.
11. After lesson, completion flow starts.
12. AI Lite report is generated only for online recorded sessions with consent.

## Concurrency Rules

Before creating booking request:
- Tutor must be approved.
- Tutor must be visible.
- Selected slot must be inside availability.
- Selected slot must not already be booked.
- Selected slot must match teaching mode.

Before accepting booking:
- Slot must still be available.
- No conflicting accepted/confirmed booking exists.

Before payment:
- Booking must be accepted.
- Payment must not already exist.

After successful payment:
- Booking becomes confirmed.
- Slot becomes locked.

---

# 5. Availability Calendar Flow

Route:
- /tutor/availability

## Tutor View

Calendar:
- Weekly grid
- Days as columns
- Time as rows
- Qatar timezone only
- 30-minute increments
- Minimum lesson duration: 50 minutes

Actions:
- Create availability slot
- Resize slot
- Delete slot
- Mark slot as:
  - online
  - in-person
  - both

Loading:
- Load current week first.
- Do not preload full availability history.
- Save changes after action or with explicit save button.

## Student View

Student should see:
- Available slots only
- Booked slots hidden or disabled
- Online/in-person availability clearly labeled

Rules:
- Student cannot select unavailable slots.
- Student cannot select past slots.
- Student cannot book conflicting slots.

---

# 6. Student Dashboard Flow

Route:
- /student/dashboard

Widgets:
- Upcoming lessons
- Recent bookings
- Wallet/credits
- Referral link
- Latest AI lesson report if available

Loading:
- Each widget loads independently.
- Show skeleton per widget.
- Failed widget shows local error state only.

Primary actions:
- Browse tutors
- View bookings
- Open messages
- View report
- Copy referral link

---

# 7. Tutor Dashboard Flow

Route:
- /tutor/dashboard

Widgets:
- Pending booking requests
- Upcoming lessons
- Earnings
- Wallet balance
- Rating
- Profile completion
- Latest AI lesson report summary if available

Loading:
- Each widget loads independently.
- Pending booking requests should load first.
- Financial widgets should be server-validated.

Primary actions:
- Accept/reject booking
- Open availability calendar
- Request withdrawal
- Edit profile
- Open messages

---

# 8. Admin Dashboard Flow

Route:
- /admin

Widgets:
- Pending tutor approvals
- Bookings overview
- Payments overview
- Withdrawal requests
- Reports/messages review
- Curriculum uploads

Loading:
- Admin widgets load independently.
- Use pagination for all admin tables.

Default admin table page size:
- 20 rows

Rules:
- Admin actions must be server-side protected.
- Admin pages must never rely only on frontend guards.

---

# 9. Chat Flow

Routes:
- /student/messages
- /tutor/messages

Initial load:
- Conversation list
- Last 20 messages of selected conversation

Pagination:
- Load older messages on scroll.
- Do not load full chat history initially.

Message rules:
- Block phone numbers
- Block emails
- Block WhatsApp links
- Block Telegram usernames
- Block external payment requests

If blocked:
- Do not send message.
- Show Arabic warning.
- Log violation.

---

# 10. Payment Flow

Provider:
- Tap Payments only

Flow:
1. Tutor accepts booking.
2. Student receives payment request.
3. Student pays through Tap.
4. Tap webhook confirms payment.
5. Booking becomes confirmed.
6. Wallet/ledger is updated server-side.

Rules:
- Never trust client payment success alone.
- Webhook verification is required.
- Payment status must be server-side.
- Prevent duplicate payment records.
- No cash payment.
- No PayPal.
- No Stripe.

---

# 11. Merithub Online Lesson Flow

Used only for online bookings.

Flow:
1. Booking is confirmed after Tap payment.
2. System creates Merithub session.
3. Store Merithub session ID and join links.
4. Student and tutor see join button.
5. After session ends, recording may be retrieved if consent exists.
6. Recording can be sent to Gemini for AI Lite report.

Rules:
- Do not create Merithub session before payment.
- Do not expose Merithub API keys to frontend.
- In-person bookings do not use Merithub.

---

# 12. AI Lite Report Flow

AI Lite is included in MVP.

Applies only to:
- Online Merithub sessions
- Recorded sessions
- Sessions with consent

Flow:
1. Session ends.
2. Recording becomes available.
3. Backend retrieves recording.
4. Recording is uploaded to Gemini.
5. Gemini generates Arabic report.
6. Report is saved.
7. Report is emailed to parent/student/tutor.
8. Report appears in dashboards.

Loading behavior:
- Report generation should be asynchronous.
- Booking page should show status:
  - pending
  - processing
  - completed
  - failed

Rules:
- Do not block booking completion while report generates.
- Do not build advanced RAG in MVP.
- Do not use curriculum semantic analysis in MVP.
- Use constructive educational language only.

---

# 13. Curriculum Flow

Route:
- /admin/curriculum

MVP:
- Admin uploads curriculum files.
- Admin assigns subject and grade.
- Files are stored securely.
- Files are not publicly accessible.

Usage:
- AI Lite may reference metadata only.
- Advanced curriculum comparison is future work.

---

# 14. Wallet and Withdrawal Flow

Tutor wallet:
- Available balance
- Pending balance
- Withdrawal requests
- Transaction history

Withdrawal:
1. Tutor requests withdrawal.
2. Minimum amount must be 100 QAR.
3. Admin reviews request.
4. Admin approves or rejects.
5. Transaction is logged.

Rules:
- Financial calculations must be server-side.
- No frontend-only wallet updates.
- Do not allow negative balances.

---

# 15. Error and Empty States

Every major page must include:
- Loading state
- Empty state
- Error state
- Retry action where appropriate

Examples:
- No tutors found
- No bookings yet
- No messages yet
- No withdrawal requests
- No AI reports yet

---

# 16. Performance Rules

- Do not load full datasets.
- Use pagination.
- Use lazy loading where appropriate.
- Use parallel widget loading in dashboards.
- Use skeleton loaders.
- Avoid blocking UI with non-critical API calls.
- AI report processing must be async.

---

# 17. MVP Excluded Flow Complexity

Do not build:
- Infinite scroll
- Advanced AI ranking
- Google Calendar sync
- Recurring bookings
- Complex package purchases
- Long-term AI memory
- Vector database curriculum search
- Advanced analytics dashboards
- Multi-country timezone logic

Timezone:
- Qatar only
