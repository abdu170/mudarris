# ROLE_PERMISSIONS.md

## Purpose

This file defines role permissions for the "مُدرّس" platform.

Roles:
- Student
- Tutor
- Admin

---

## Student Permissions

Students can:
- Create account
- Browse tutors
- View tutor profiles
- Request bookings
- Pay after tutor accepts booking
- Join Merithub online sessions
- Message tutors inside the platform
- View own bookings
- View own wallet/credits
- Cancel own bookings according to policy
- Review tutors after completed lessons

Students cannot:
- View other students' data
- View tutor private documents
- Access admin pages
- Modify payment status
- Approve tutors
- Change booking status except allowed cancellation actions

---

## Tutor Permissions

Tutors can:
- Create account
- Submit profile for review
- Set hourly price during registration
- Set subjects
- Set grade levels
- Set teaching mode
- Set availability calendar
- Accept or reject booking requests
- Message students inside the platform
- View own bookings
- View own wallet
- Request withdrawals
- Edit own profile

Tutors cannot:
- Become visible before admin approval
- Access student private data beyond active bookings
- Modify payment records
- Approve withdrawals
- Access admin pages
- Create Merithub sessions manually outside booking flow

---

## Admin Permissions

Admins can:
- View all users
- Approve tutors
- Reject tutors
- Suspend tutors
- Manage bookings
- View payments
- Review failed payments
- Approve withdrawals
- Reject withdrawals
- Upload curriculum files
- Manage reports
- View chat records when needed for disputes
- Manage platform settings

Admins cannot:
- Bypass payment audit logging
- Delete financial history
- Disable core security logs

---

## RLS Requirements

Supabase RLS must enforce:
- Users can only read/update own profile.
- Tutors can only update own tutor profile.
- Students can only access own bookings.
- Tutors can access bookings assigned to them.
- Admins can access all records.
- Financial tables must be protected with strict policies.
- Payment status updates must happen server-side only.
