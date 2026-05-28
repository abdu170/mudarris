# SITE_STRUCTURE.md

## Purpose

This file defines all MVP pages and visible options for the مُدرّس platform.

Build only the pages listed here.

Do not invent extra pages unless required for routing or error handling.

---

## Total MVP Pages

Total pages: 24

---

## Public Pages

### 1. Landing Page
Route: /

Sections:
- Hero
- Search bar
- How it works
- Featured tutors
- Platform benefits
- Call to action
- Footer

Options:
- Search by subject
- Search by grade
- Search by teaching mode
- Register as student
- Register as tutor

---

### 2. Tutors Listing
Route: /tutors

Filters:
- Subject
- Grade level
- Price range
- Area
- Teaching mode: online / in-person / both
- Tutor gender
- Rating

Sorting:
- Highest rated
- Lowest price
- Newest

---

### 3. Tutor Profile
Route: /tutor/:id

Sections:
- Tutor image
- Display name
- Verification badge
- Rating
- Subjects
- Grade levels
- Teaching mode
- Areas
- Hourly price
- Bio
- Availability calendar preview
- Reviews

Actions:
- Message tutor
- Request booking
- Select online lesson through Merithub
- Select in-person lesson

---

## Auth Pages

### 4. Login
Route: /login

Fields:
- Email
- Password

Actions:
- Login
- Forgot password
- Go to student signup
- Go to tutor signup

---

### 5. Forgot Password
Route: /forgot-password

Fields:
- Email

Actions:
- Send reset link

---

### 6. Student Signup
Route: /signup/student

Fields:
- Full name
- Phone
- Email
- Password
- Grade level
- Curriculum

Actions:
- Create student account

---

### 7. Tutor Signup
Route: /signup/tutor

Steps:
1. Personal information
2. Teaching information
3. Pricing and availability
4. Documents

Fields:
- Real full name
- Display name
- Phone
- Email
- Password
- Subjects
- Grade levels
- Experience years
- Bio
- Teaching mode
- Areas
- Hourly price
- Documents upload

Actions:
- Submit for admin review

---

## Student Pages

### 8. Student Dashboard
Route: /student/dashboard

Cards:
- Upcoming lessons
- Recent bookings
- Wallet balance
- Referral link

Actions:
- Browse tutors
- View bookings
- Copy referral link

---

### 9. Student Bookings
Route: /student/bookings

Tabs:
- Upcoming
- Completed
- Cancelled

Actions:
- View lesson
- Cancel booking
- Message tutor
- Join Merithub session if online

---

### 10. Student Messages
Route: /student/messages

Options:
- Conversation list
- Chat window
- Send message
- Blocked contact-warning message

---

### 11. Student Wallet
Route: /student/wallet

Sections:
- Balance
- Credits
- Payment history
- Refund history

---

### 12. Student Settings
Route: /student/settings

Options:
- Update profile
- Update phone
- Change password
- Notification preferences

---

## Tutor Pages

### 13. Tutor Dashboard
Route: /tutor/dashboard

Cards:
- Upcoming lessons
- Earnings
- Wallet balance
- Rating
- Profile completion

---

### 14. Tutor Bookings
Route: /tutor/bookings

Tabs:
- Pending
- Upcoming
- Completed
- Cancelled

Actions:
- Accept booking
- Reject booking
- Mark lesson completed
- Message student

---

### 15. Tutor Messages
Route: /tutor/messages

Options:
- Conversation list
- Chat window
- Send message
- Blocked contact-warning message

---

### 16. Tutor Wallet
Route: /tutor/wallet

Sections:
- Available balance
- Pending balance
- Withdrawal requests
- Transaction history

Actions:
- Request withdrawal

---

### 17. Tutor Profile Edit
Route: /tutor/profile/edit

Sections:
- Public profile
- Subjects
- Grade levels
- Areas
- Teaching mode
- Hourly price
- Bio
- Profile image
- Documents

---

### 18. Tutor Settings
Route: /tutor/settings

Options:
- Account settings
- Phone
- Email
- Password
- Visibility on/off
- Notifications

---

### 19. Tutor Availability
Route: /tutor/availability

Calendar:
- Weekly calendar grid
- Days as columns
- Time rows
- Create slot
- Resize slot
- Delete slot
- Teaching mode per slot:
  - online
  - in-person
  - both

Rules:
- Qatar timezone only
- Minimum lesson duration: 1 hour
- Slot increments: 30 minutes

---

## Admin Pages

### 20. Admin Dashboard
Route: /admin

Cards:
- Total tutors
- Pending tutor approvals
- Total students
- Bookings
- Payments
- Withdrawal requests

---

### 21. Admin Tutor Approvals
Route: /admin/tutors

Actions:
- View tutor profile
- View documents
- Approve tutor
- Reject tutor
- Suspend tutor

---

### 22. Admin Bookings
Route: /admin/bookings

Filters:
- Status
- Tutor
- Student
- Date

Actions:
- View booking
- Resolve issue
- Cancel booking if needed

---

### 23. Admin Payments
Route: /admin/payments

Sections:
- Successful payments
- Failed payments
- Refunds
- Wallet transactions

---

### 24. Admin Withdrawals
Route: /admin/withdrawals

Actions:
- Approve withdrawal
- Reject withdrawal
- View tutor wallet

---

## MVP Excluded Features

Do not build:
- Bronze/Silver/Gold referral levels
- Hidden report button after 90 days
- Student reward for reporting
- Advanced violation psychology system
- Daily.co calls
- Google Calendar sync
- Advanced analytics
- AI moderation
- Complex package system
- PWA
