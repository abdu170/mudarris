# DESIGN_TOKENS.md

## Purpose

This file defines the official design tokens for the "مُدرّس" tutoring marketplace.

It is based on the "Premium Scholarly Marketplace" direction generated from Google Stitch and adapted for an Arabic RTL tutoring platform.

This file is the source of truth for:
- colors
- typography
- spacing
- radius
- elevation
- layout rhythm
- component visual consistency

If any design reference conflicts with this file, this file wins.

---

## Design System Name

Premium Scholarly Marketplace

---

## Brand Concept

The design system is anchored in:

Academic Prestige

The platform should feel like a premium education marketplace where learning is treated as a high-value investment.

The aesthetic merges:
- minimalism
- modern corporate clarity
- warm scholarly identity
- Arabic-first premium design

The UI should feel:
- calm
- authoritative
- trustworthy
- elegant
- parent-friendly
- tutor-professional

Avoid:
- childish school visuals
- generic SaaS blue UI
- neon startup colors
- cluttered dashboards
- gaming aesthetics

---

## Core Color Tokens

```yaml
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'

  on-surface: '#1b1c1a'
  on-surface-variant: '#584141'

  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'

  outline: '#8c7071'
  outline-variant: '#e0bfbf'

  surface-tint: '#af2b3e'

  primary: '#570013'
  on-primary: '#ffffff'
  primary-container: '#800020'
  on-primary-container: '#ff828a'
  inverse-primary: '#ffb3b5'

  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'

  tertiary: '#292721'
  on-tertiary: '#ffffff'
  tertiary-container: '#3f3d36'
  on-tertiary-container: '#aba89f'

  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'

  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b5'
  on-primary-fixed: '#40000b'
  on-primary-fixed-variant: '#8e0f28'

  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'

  tertiary-fixed: '#e7e2d8'
  tertiary-fixed-dim: '#cac6bd'
  on-tertiary-fixed: '#1d1c16'
  on-tertiary-fixed-variant: '#494740'

  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
```

---

## Color Usage Rules

### Primary — Deep Burgundy

Use primary for:
- main CTAs
- active navigation
- important page headings
- selected states
- key brand moments

Do not overuse primary as full-page background.

### Secondary — Muted Gold

Use secondary for:
- premium accents
- verification strokes
- rating accents
- progress indicators
- subtle highlight chips

Use gold sparingly.

### Surface — Warm Cream / Beige

Use surfaces for:
- page background
- card containers
- form fields
- dashboard sections

Warm cream replaces harsh white as the primary page background.

### Text

Use:
- on-surface for primary text
- on-surface-variant for secondary text

Avoid pure black unless needed for contrast.

---

## Typography Tokens

The Stitch output suggested:
- Noto Serif for authority
- Inter for utility

For Arabic-first implementation, adapt this to:

Arabic headings:
- Cairo
- Tajawal
- Optional: Amiri for selected editorial headings only

Arabic body:
- Tajawal
- Cairo

English fallback:
- Inter
- Noto Serif for rare editorial English headings

Recommended implementation:
- Use Cairo or Tajawal as primary Arabic UI font.
- Use serif headings only if Arabic rendering remains elegant and readable.
- Do not use a font that weakens Arabic readability.

```yaml
typography:
  display-lg:
    fontFamily: Cairo
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em

  display-lg-mobile:
    fontFamily: Cairo
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px

  headline-md:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px

  headline-sm:
    fontFamily: Cairo
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px

  body-lg:
    fontFamily: Tajawal
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px

  body-md:
    fontFamily: Tajawal
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px

  label-md:
    fontFamily: Tajawal
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em

  label-sm:
    fontFamily: Tajawal
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
```

---

## Typography Rules

Use a "Serif for Authority, Sans for Utility" idea only if Arabic typography remains strong.

In Arabic-first UI:
- readability comes before decorative authority
- headings should feel premium but clear
- body text must be highly readable
- form labels must be simple and legible

Avoid:
- decorative Arabic fonts
- tiny mobile labels
- condensed fonts
- inconsistent font mixing

---

## Radius Tokens

```yaml
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
```

Usage:
- inputs: DEFAULT / 0.5rem
- buttons: DEFAULT / 0.5rem
- small chips: xl / 1.5rem
- cards: lg / 1rem
- modals: lg or xl
- avatars: full

---

## Spacing Tokens

```yaml
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
```

Rules:
- Use 8px base rhythm.
- Keep generous vertical space.
- Avoid dense layouts.
- Mobile pages use 16px side margin.
- Desktop public pages use 48px margin and 1200px max container.
- Dashboard pages can use tighter spacing but must remain readable.

---

## Layout System

Desktop:
- 12-column grid
- 1200px max-width for public pages
- generous gutters
- editorial spacing

Mobile:
- fluid grid
- single-column layouts
- sticky CTAs where useful
- large tap targets

RTL:
- navigation starts from the right
- progress fills from right to left
- icons should respect RTL direction
- layout must be RTL-native, not LTR flipped at the end

---

## Elevation and Depth

Hierarchy should be created using:
- tonal layering
- soft borders
- ambient shadows
- subtle surface changes

Shadow direction:
- soft and diffused
- low opacity
- warm tint where possible

Recommended shadow color:
- `#800020` at 4–8% opacity

Cards:
- 1px border using outline-variant or surface-container-high
- optional subtle ambient shadow
- hover lift only when useful

Avoid:
- heavy dark shadows
- muddy gray shadows
- overly flat UI with no hierarchy

---

## Component Token Rules

### Buttons

Primary:
- background: primary
- text: on-primary
- hover: slightly darker primary
- radius: DEFAULT
- no heavy gradients

Secondary:
- transparent or surface container
- border: secondary or outline
- text: secondary or primary

Tertiary:
- text-only
- primary text
- no heavy background

Danger:
- error color only
- use for destructive actions

---

### Cards

Card surfaces:
- surface-container-lowest
- surface-container-low
- surface-container

Card border:
- outline-variant
- low opacity border

Card radius:
- lg

Card padding:
- use spacing base rhythm
- avoid cramped content

Tutor cards should use:
- image/thumbnail
- rating
- price
- subject tags
- CTA
- clear hierarchy

---

### Input Fields

Input background:
- surface-container-low

Input active state:
- 2px primary right border in RTL
- or subtle secondary outline

Input radius:
- DEFAULT

Input labels:
- label-md
- right aligned

Error:
- error border
- Arabic error message

---

### Chips and Tags

Use for:
- subjects
- grade levels
- teaching mode
- status labels
- AI report insight labels

Radius:
- xl or full

Color:
- use muted surfaces
- avoid too many bright chips

---

### Progress Indicators

Use:
- 4px slim line
- filled portion: secondary / muted gold
- unfilled portion: surface-container-high

RTL:
- progress fills from right to left

---

### Avatars

Tutor avatars:
- circular
- optional 2px secondary stroke for verified/premium tutors
- fallback initials supported

---

## Status Colors

Use status colors carefully.

Recommended:
- success: muted green, not neon
- warning: muted gold
- error: defined error token
- info: subdued neutral or primary-container

Never use bright uncontrolled status colors.

---

## Motion Tokens

Motion should be subtle.

Allowed:
- 150ms hover transitions
- 200ms modal fade/slide
- loading shimmer
- soft card hover lift
- selected slot highlight

Avoid:
- heavy motion
- long page transitions
- excessive parallax
- flashing elements

---

## Accessibility Rules

- Maintain readable contrast.
- Do not rely on color alone for status.
- Use clear focus states.
- Support reduced motion where possible.
- All meaningful images need alt text.
- Touch targets should be large enough on mobile.

---

## Tailwind Mapping Recommendation

Antigravity may map tokens into Tailwind config.

Suggested names:
- `brand-primary`
- `brand-burgundy`
- `brand-gold`
- `brand-cream`
- `surface`
- `surface-container`
- `surface-high`
- `text-main`
- `text-muted`
- `outline-soft`

Do not use random one-off colors in components.

All colors should come from this file.

---

## Final Rule

DESIGN_TOKENS.md is the primary source of truth for visual constants.

STYLE.md explains the design direction.

UI_RULES.md explains behavior.

COMPONENT_LIBRARY.md explains reusable components.

All four files must work together without conflict.
