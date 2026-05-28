# UI_STITCH_REFERENCES.md

## Purpose

This file contains Google Stitch UI references for the "مُدرّس" platform.

These references are VISUAL REFERENCES ONLY.

Do NOT use the raw HTML as production architecture.

Antigravity must convert these references into:
- reusable React components
- Tailwind components
- RTL-native layouts
- mobile-first pages
- clean routing
- shared components

Use these files as source of truth:
- DESIGN_TOKENS.md
- STYLE.md
- UI_RULES.md
- COMPONENT_LIBRARY.md
- SYSTEM_FLOW.md
- SITE_STRUCTURE.md

---

# Reference 1 — Homepage / About Platform Section

## Intended Page

Homepage section:
- About Mudarris
- Why Mudarris
- Academic quality
- Modern learning
- Parent trust

## Recommended Homepage Placement

1. Hero
2. Search
3. Featured tutors
4. About / Why Mudarris
5. How it works
6. AI reports preview
7. Parent trust
8. CTA
9. Footer

## Design Notes

Use this design direction:
- premium academic
- warm cream background
- burgundy headings
- muted gold accents
- editorial images
- large spacing
- calm trust-building sections

Remove:
- mobile bottom nav from public homepage
- standalone HTML structure
- duplicated CDN imports
- direct Google image URLs in final production

Convert into components:
- HomeAboutSection
- HomeValuesSection
- HomeAcademicQualitySection
- HomeModernLearningSection
- HomeTrustImageCard

## Reference Layout Summary

Sections:
- Centered hero text
- Two-column values section
- Two-column academic quality section
- Highlighted modern learning card section
- Premium footer

Use images as placeholders only.

---

# Reference 2 — Tutors Marketplace Page

## Intended Page

Route:
- /tutors

## Design Notes

This is the visual reference for tutor browsing and filtering.

Convert into components:
- TutorSearchPage
- TutorSearchBar
- TutorFilters
- TutorSortBar
- TutorGrid
- TutorCard
- TutorPagination

## Visual Structure

1. Fixed top app bar
2. Search input
3. Horizontal quick filters
4. Results count
5. Sorting control
6. Tutor card grid
7. Load more / pagination control

## Tutor Card Must Include

- tutor image
- display name
- verification badge
- rating average
- review count
- subjects
- hourly price
- availability preview
- CTA button

Example card content:
- د. طارق محمود
- 4.9 (128)
- رياضيات - فيزياء
- 250 ر.ق / ساعة
- متاح اليوم
- عرض الملف

## Implementation Rules

- Use 12 tutor cards per page.
- Do not implement infinite scroll.
- Use skeleton cards while loading.
- Replace hardcoded tutor data with mock data for Antigravity stage.
- Backend integration remains pending for Claude Code.
- Use filter drawer on mobile.
- Bottom nav is only for logged-in dashboard/app pages, not public marketplace unless user is authenticated.

---

# Stitch Code Conversion Rules

When using Stitch HTML:

1. Do not paste raw HTML into the app.
2. Do not keep CDN Tailwind script.
3. Do not duplicate Google font imports in components.
4. Do not keep raw Material Symbols imports in page files.
5. Convert repeated UI into reusable React components.
6. Replace external image URLs with local assets or safe placeholders.
7. Use Cairo/Tajawal from DESIGN_TOKENS.md.
8. Use DESIGN_TOKENS.md colors, spacing, radius, and typography.
9. Keep all layouts RTL-native.
10. Keep backend logic mocked until Claude Code stage.

---

# Required React Component Output

Antigravity should produce:

```txt
src/components/home/HomeAboutSection.tsx
src/components/home/HomeValuesSection.tsx
src/components/home/HomeAcademicQualitySection.tsx
src/components/home/HomeModernLearningSection.tsx

src/components/tutors/TutorSearchBar.tsx
src/components/tutors/TutorFilters.tsx
src/components/tutors/TutorSortBar.tsx
src/components/tutors/TutorGrid.tsx
src/components/tutors/TutorCard.tsx
src/components/tutors/TutorPagination.tsx

src/app/page.tsx
src/app/tutors/page.tsx
```

---

# Important Final Rule

These Stitch references define the look and feel only.

They do not define:
- routing architecture
- backend logic
- auth
- payments
- booking validation
- Merithub integration
- Gemini integration
- database structure

Those are defined in the project system files.
