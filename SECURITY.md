
# SECURITY.md

## Core Security Principles
- Zero trust architecture
- Principle of least privilege
- Secure-by-default policies

## Authentication
- Supabase Auth
- Email verification required
- OTP verification required
- Session expiration enabled

## Authorization
- Strict role separation:
  - Student
  - Tutor
  - Admin

## API Security
- Rate limiting
- Input sanitization
- CSRF protection
- XSS prevention

## Payment Security
- Tap Payments webhooks verified
- Signed webhook validation
- Escrow integrity checks

## Chat Protection
Blocked automatically:
- Phone numbers
- Emails
- External links
- Payment bypass attempts

## Admin Protection
- Protected routes
- OTP-required admin login
- Auto logout after inactivity

## Infrastructure
- HTTPS only
- Secure environment variables
- Vercel deployment hardening

## Monitoring
- Audit logs
- Violation logs
- Payment logs
- Admin action logs
