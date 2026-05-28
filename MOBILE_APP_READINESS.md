# MOBILE_APP_READINESS.md

## Purpose

This file ensures the web MVP is built with a future iOS app in mind.

Current product:
- Web MVP first

Future product:
- iOS app later

The current web architecture must not block or complicate future mobile app development.

---

## Core Principle

Build the platform as:

```txt
Web MVP now, mobile-app-ready architecture later.
```

Do not build logic that only works inside a web browser.

Important backend logic must be reusable by:
- Web app
- Future iOS app
- Future Android app if needed

---

## Architecture Rules

Keep these systems backend-driven:

- Authentication
- User roles
- Tutor approval
- Booking lifecycle
- Payment status
- Wallet balances
- Withdrawal requests
- Merithub session creation
- Gemini AI reports
- Curriculum files
- Chat rules
- Admin permissions

Do not place critical business rules only in React components.

---

## API Readiness

All important data flows should be accessible through clean backend/API logic.

Future mobile app should be able to:
- Login
- Register
- Browse tutors
- View tutor profile
- Request booking
- Pay through external link
- View booking status
- Join Merithub lesson
- Read AI reports
- Send messages
- View wallet
- Request withdrawal if tutor

---

## iOS Payment Strategy

The future iOS app will use external payment links.

Rules:
- Do not implement Apple In-App Purchases for tutoring payments.
- Payments happen through external Tap Payments checkout flow.
- iOS app opens secure external Tap payment page.
- Payment status returns to backend after completion.
- Wallet, booking, and payment states must remain server-side.
- The app must not depend on web-only payment state.

Architecture must support:
- deep links
- payment return URLs
- mobile browser checkout flow
- future native wrapper
- future React Native app if needed

Important:
Do not tightly couple payment flow to browser-only assumptions.

---

## Tap Payments Mobile Rules

Payment flow should support:

1. Backend creates Tap payment.
2. Backend returns checkout URL.
3. Web or future iOS app opens checkout URL.
4. Tap redirects to success/failure return URL.
5. Backend verifies payment through Tap webhook.
6. Booking/payment status updates server-side.
7. App refreshes booking/payment status from backend.

Never rely only on frontend redirect result.

Webhook verification is mandatory.

---

## Deep Link Readiness

Future iOS app should support return links such as:

```txt
mudarris://payment/success
mudarris://payment/failed
mudarris://booking/:id
mudarris://lesson/:id
mudarris://report/:id
```

For web MVP, use normal web URLs first.

Do not hardcode logic that prevents deep links later.

---

## Merithub Mobile Readiness

Online lessons use Merithub.

Rules:
- Merithub session links must be stored in backend.
- Student and tutor dashboards should fetch links from backend.
- Future iOS app should open Merithub session link.
- Do not create Merithub sessions client-side.
- Do not expose Merithub secrets to frontend.

---

## Gemini AI Report Mobile Readiness

AI reports must be saved in database.

Rules:
- Do not generate reports only as emails.
- Save report JSON and Arabic report text.
- Future iOS app must be able to display the report.
- Report status must be trackable:
  - pending
  - processing
  - completed
  - failed

---

## File Upload Readiness

Files should be stored in cloud storage.

Rules:
- Do not store files inside the web app.
- Save file metadata in database.
- Use secure file URLs.
- Future mobile app should be able to request upload permissions or signed URLs.

Applies to:
- Tutor documents
- Profile images
- Curriculum files
- Session recordings if needed

---

## Auth Readiness

Authentication must support future mobile clients.

Rules:
- Do not assume only browser sessions.
- Use Supabase Auth in a way that can support mobile clients later.
- Role checks must happen server-side.
- Protected data must rely on RLS and backend guards.

---

## Notification Readiness

MVP may use email/SMS.

Future iOS app may use push notifications.

Do not hardcode notification logic in one place.

Notification events should be generated for:
- Booking requested
- Booking accepted
- Payment required
- Payment completed
- Lesson reminder
- AI report ready
- Withdrawal approved/rejected

---

## UI Portability Rules

Frontend UI can be web-specific, but business logic should not be.

Avoid:
- browser-only payment assumptions
- localStorage-only critical state
- frontend-only role protection
- frontend-only booking validation
- frontend-only wallet calculations

---

## Future Mobile App Options

The architecture should allow either:
- Native iOS app
- React Native app
- WebView wrapper only if approved and acceptable
- PWA fallback

Do not force one mobile strategy now.

---

## MVP Requirement

For the current MVP:
- Build the web app.
- Keep backend and data model mobile-ready.
- Use Tap external checkout links.
- Save all important states server-side.
- Avoid web-only assumptions.
