# BOOKING_LOGIC.md

## Purpose

This file defines the MVP booking logic for the "مُدرّس" tutoring marketplace.

---

## Final Booking Decisions

These decisions are final:

- Tutor sets hourly price during registration.
- Lesson duration is fixed at 50 minutes.
- Student requests a booking.
- Tutor can accept or reject the booking.
- Payment happens only after tutor accepts.
- Online lessons are handled through Merithub.
- In-person lessons happen outside the platform location-wise, but booking/payment remain inside the platform.

---

## Booking Lifecycle

Booking statuses:

1. requested
2. accepted
3. payment_pending
4. paid
5. confirmed
6. completed
7. cancelled
8. rejected
9. disputed

---

## Booking Flow

### Step 1 — Student Requests Booking
Student selects:
- Tutor
- Date
- Time slot
- Teaching mode: online or in-person
- Subject
- Optional note

Rules:
- Selected time must be inside tutor availability.
- Lesson duration is always 50 minutes.
- Tutor must be approved.
- Tutor must be visible.

### Step 2 — Tutor Accepts or Rejects
Tutor can:
- Accept request
- Reject request

If rejected:
- Booking status becomes rejected.
- No payment is created.

If accepted:
- Booking status becomes accepted.
- Student receives payment request.

### Step 3 — Student Pays
Payment provider:
- Tap Payments only

After successful payment:
- Booking status becomes confirmed.
- Tutor and student receive confirmation.
- If online, Merithub session is created.

### Step 4 — Lesson Happens
Online:
- Student joins through Merithub link.

In-person:
- Lesson happens according to agreed location/mode.

### Step 5 — Completion
Tutor can mark lesson completed.
Student can confirm completion.

If no issue is raised:
- Booking becomes completed.
- Tutor wallet is updated.

---

## Availability Rules

Tutor uses weekly calendar availability.

Rules:
- Qatar timezone only
- Slot increments: 30 minutes
- Lesson duration: 50 minutes
- No double booking
- Booked slots become unavailable
- Student cannot request unavailable slots

---

## Cancellation Rules

MVP cancellation policy:

Student cancellation:
- Before 24 hours: full refund
- Between 12 and 24 hours: 50% refund
- Less than 12 hours: no refund

Tutor cancellation:
- Student receives full refund
- Cancellation is logged

---

## Online Lessons

Online teaching provider:
- Merithub

Rules:
- Create Merithub session only after payment succeeds.
- Attach Merithub session link to booking.
- Show join button in student and tutor dashboards.
- Do not build custom video system.

---

## What Not To Build In MVP

Do not build:
- Packages
- Complex subscriptions
- Advanced cancellation penalties
- AI lesson reports
- Recording analysis
- Google Calendar sync
- Automatic recurring bookings
