# API_RULES.md

## Purpose

This file defines API rules and conventions for the "مُدرّس" platform.

---

## General Rules

- All API logic must be server-side when sensitive.
- Never trust client-side payment status.
- Validate all inputs.
- Return consistent responses.
- Use Arabic user-facing error messages.
- Use English internal code names.

---

## Response Format

Successful response:

```json
{
  "success": true,
  "data": {},
  "message": "تمت العملية بنجاح"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "رسالة واضحة للمستخدم"
  }
}
```

---

## Required API Areas

### Auth
- Register student
- Register tutor
- Login
- Logout
- Verify phone OTP
- Reset password

### Tutors
- List tutors
- Get tutor profile
- Update tutor profile
- Update availability
- Submit for approval

### Bookings
- Request booking
- Accept booking
- Reject booking
- Cancel booking
- Mark completed
- Get student bookings
- Get tutor bookings

### Payments
- Create Tap payment after tutor accepts
- Verify payment
- Handle Tap webhook
- Record payment status

### Wallets
- Get wallet
- Request withdrawal
- Admin approve withdrawal
- Admin reject withdrawal

### Merithub
- Create session after paid booking
- Store session link
- Fetch session metadata if needed

### Admin
- Approve tutor
- Reject tutor
- Suspend user
- Manage bookings
- Manage payments
- Manage withdrawals
- Upload curriculum files

---

## Validation Rules

Required:
- Email format validation
- Qatar phone validation
- Price numeric validation
- Booking time validation
- File type validation
- Role permission validation

---

## Security Rules

- Admin APIs require admin role.
- Payment APIs require server-side secrets.
- Tap webhooks must verify signature.
- Merithub API keys must never be exposed to frontend.
- Supabase service role must never be exposed to frontend.
