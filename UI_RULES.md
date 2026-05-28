# UI_RULES.md

## Purpose

This file defines strict UI behavior rules for the "مُدرّس" platform.

Antigravity must follow this file when building screens and components.

---

## General UI Principles

- Arabic-first
- RTL-first
- Mobile-first
- Clear before decorative
- Trustworthy and premium
- Consistent across all pages

Do not create different visual systems per page.

---

## Page Layout Rules

Public pages:
- Use full-width sections with consistent max-width containers.
- Keep important CTAs visible.
- Avoid clutter.

Dashboard pages:
- Use sidebar on desktop.
- Use bottom navigation or collapsible navigation on mobile.
- Keep cards grouped by priority.

Admin pages:
- Prioritize data clarity.
- Use tables on desktop.
- Use card lists on mobile.

---

## Form Rules

All forms must include:
- Clear Arabic labels
- Validation messages
- Loading state
- Disabled state during submission
- Success/error feedback

Placeholder text must not replace labels.

Required fields must be clearly marked.

---

## Modal Rules

Use modals for:
- Confirming destructive actions
- Short focused forms
- Booking confirmation
- Payment prompt
- Consent approval

Do not use modals for long multi-step flows.

Use full pages for:
- Tutor signup
- Student signup
- Admin management
- Long forms

---

## Drawer Rules

Use drawers for:
- Mobile filters
- Mobile navigation
- Quick details
- Calendar slot editing

Do not use drawers for payment or critical approvals.

---

## Table Rules

Desktop:
- Use tables for admin lists.
- Include status badges.
- Include clear row actions.
- Use pagination.

Mobile:
- Convert tables to stacked cards.
- Avoid horizontal overflow.

---

## Loading States

Every page must have loading state.

Use:
- Skeleton cards for tutors
- Skeleton rows for tables
- Skeleton widgets for dashboards
- Spinner only for small inline actions

Avoid full-page spinner unless initial app boot.

---

## Empty States

Every list page must have empty state.

Examples:
- No tutors found
- No bookings yet
- No messages yet
- No reports yet
- No withdrawals yet

Empty state should include:
- Short Arabic explanation
- Suggested next action
- Optional illustration

---

## Error States

Every failed async area must show:
- Arabic error message
- Retry action if possible
- No app crash

Dashboard widgets must fail independently.

---

## Status Badges

Use badges for:
- Tutor approval
- Booking status
- Payment status
- Lesson mode
- AI report status
- Withdrawal status

---

## CTA Rules

Primary CTA:
- One main action per screen when possible.

Secondary actions:
- Visually lower priority.

Danger actions:
- Require confirmation.

---

## Mobile Rules

Mobile must support:
- Large tap targets
- Sticky booking CTA on tutor profile
- Filter drawer on tutors listing
- Dashboard cards in single column
- Chat optimized for thumb usage

---

## Accessibility

- Text must be readable.
- Color must not be the only status indicator.
- Clickable areas must be large enough.
- Respect reduced motion preference.
- Avoid flashing animation.

---

## RTL Rules

- Text aligned right.
- Icons placed according to RTL flow.
- Navigation order follows Arabic reading direction.
- Form inputs and labels must feel native Arabic.

---

## Do Not Build

Do not build:
- Overly complex animations
- Hidden controls
- Tiny clickable elements
- Inconsistent page-specific component styles
- English-first UI
