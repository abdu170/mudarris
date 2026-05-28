# ENV_STRUCTURE.md

## Purpose

This file defines required environment variables.

Never hardcode secrets.

---

## Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Rules:
- Public anon key may be used client-side.
- Service role key must be server-side only.

---

## Tap Payments

```env
TAP_PUBLIC_KEY=
TAP_SECRET_KEY=
TAP_WEBHOOK_SECRET=
TAP_ENVIRONMENT=sandbox
```

Rules:
- Secret key server-side only.
- Webhook secret server-side only.
- Use sandbox before production.

---

## Merithub

```env
MERITHUB_CLIENT_ID=
MERITHUB_CLIENT_SECRET=
MERITHUB_API_BASE_URL=
```

Rules:
- Merithub credentials server-side only.
- Sessions created only after confirmed payment.

---

## Uploadthing

```env
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

---

## Twilio

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
```

---

## Resend

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

---

## App

```env
NEXT_PUBLIC_APP_URL=
APP_ENV=development
ADMIN_EMAILS=
```

---

## Gemini Phase 2

Only needed later for AI session reports.

```env
GEMINI_API_KEY=
```

Do not use in MVP unless AI reports are explicitly implemented.
