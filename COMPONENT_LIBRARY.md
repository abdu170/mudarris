# COMPONENT_LIBRARY.md

## Purpose

This file defines the reusable component library for the "مُدرّس" platform.

Antigravity should build these components first and reuse them across pages.

---

## Core Components

### Button

Variants:
- primary
- secondary
- ghost
- danger
- disabled
- loading

Sizes:
- sm
- md
- lg

Rules:
- Primary button uses brand dark red.
- Loading button must prevent duplicate submissions.
- Danger button must not be used without confirmation.

---

### Input

Types:
- text
- email
- password
- phone
- number
- search

States:
- default
- focus
- error
- disabled
- loading

Rules:
- Always show label.
- Arabic error message below field.
- Phone input must support Qatar format.

---

### Select

Used for:
- subject
- grade level
- area
- teaching mode
- tutor gender
- status filters

Rules:
- Must support RTL.
- Must be mobile friendly.
- Long options should not break layout.

---

### Textarea

Used for:
- tutor bio
- booking notes
- admin rejection reason
- review comment

Rules:
- Character counter when useful.
- Do not allow excessive height growth.

---

### Modal

Used for:
- confirmation
- consent
- booking confirmation
- payment prompt

Rules:
- Must trap focus.
- Must be closable unless critical action is in progress.
- Mobile modal can become bottom sheet.

---

### Tabs

Used for:
- booking status
- dashboard sections
- admin tables
- wallet history

Rules:
- Active tab must be clear.
- Tabs must not overflow badly on mobile.

---

### Toast

Used for:
- success
- error
- warning
- info

Rules:
- Short Arabic messages.
- Do not use toast as the only error display for forms.

---

## Marketplace Components

### TutorCard

Must display:
- tutor image
- display name
- verification badge
- rating average
- review count
- subjects
- grade levels
- teaching mode
- areas
- hourly price
- availability preview
- CTA button

Actions:
- view profile
- request booking

---

### TutorProfileHeader

Must display:
- image
- display name
- verification badge
- rating
- price
- teaching mode
- main CTA buttons

---

### TutorFilters

Filters:
- subject
- grade
- price range
- area
- teaching mode
- gender
- rating

Mobile:
- Use drawer.

Desktop:
- Sidebar or top filter bar.

---

## Booking Components

### BookingCard

Must display:
- tutor/student name
- date
- time
- teaching mode
- status
- price
- action buttons

Actions depend on role:
- student: pay, cancel, message, join session
- tutor: accept, reject, complete, message
- admin: view, resolve

---

### BookingStatusBadge

Statuses:
- requested
- accepted
- payment_pending
- paid
- confirmed
- completed
- cancelled
- rejected
- disputed

---

### AvailabilityCalendar

Must support:
- weekly grid
- day columns
- time rows
- create slot
- resize slot
- delete slot
- teaching mode per slot
- current week loading

Antigravity builds UI.
Claude Code handles persistence and conflict logic.

---

### CalendarSlot

Displays:
- start time
- end time
- teaching mode
- booked/unavailable state

---

## Dashboard Components

### DashboardCard

Used for:
- stats
- quick summaries
- dashboard widgets

Must include:
- title
- value
- optional trend
- optional action

---

### WalletCard

Displays:
- available balance
- pending balance
- withdrawal CTA

Financial values must come from backend.

---

### AIReportCard

Displays:
- report status
- lesson title
- summary
- strengths
- improvement areas
- recommendations

States:
- no report
- processing
- completed
- failed

---

### ReviewSummary

Displays:
- average rating
- number of reviews
- category rating summary

---

## Chat Components

### ConversationList

Shows:
- user name
- last message
- unread count
- timestamp

---

### ChatWindow

Shows:
- paginated messages
- input field
- send button
- blocked message warning

---

### MessageBubble

States:
- sent
- received
- blocked
- system warning

---

## Admin Components

### AdminTable

Must support:
- pagination
- status badges
- row actions
- filters
- loading rows
- empty state

---

### ApprovalCard

Used for tutor approvals.

Shows:
- tutor identity
- documents
- profile summary
- approve/reject actions

---

## Legal/Consent Components

### ConsentCheckbox

Used for:
- terms
- privacy
- AI recording consent

Must not be pre-checked.

---

### PolicyLinkBlock

Shows links to:
- terms
- privacy
- AI consent
- refund policy

---

## Component Rules

- Components must be reusable.
- Do not duplicate button/card styles.
- Do not build page-specific variants unless necessary.
- Keep props simple and predictable.
- Support loading and empty states where relevant.
