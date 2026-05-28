# MEDIA_AND_ANIMATION_RULES.md

## Purpose

This file defines rules for images, illustrations, animations, Lottie files, and motion effects.

---

## Media Philosophy

Media should support:
- trust
- clarity
- premium feel
- educational identity

Media should not distract from:
- tutor search
- booking
- payments
- dashboards
- reading reports

---

## Allowed Media Types

Allowed:
- optimized images
- SVG illustrations
- lightweight Lottie animations
- WebP assets
- educational icons
- profile images
- curriculum PDFs
- tutor documents
- Merithub session recordings when consent exists

---

## Static Images

Use static images for:
- hero illustration
- empty states
- onboarding
- AI report preview
- tutor profile fallback

Rules:
- Optimize images.
- Prefer WebP.
- Use lazy loading.
- Provide alt text.
- Avoid huge images.

---

## Tutor Profile Images

Rules:
- Must be uploaded securely.
- Must have fallback avatar.
- Must be optimized.
- Must not expose storage secrets.
- Must support rounded card display.

---

## Lottie Animations

Allowed for:
- loading
- booking confirmed
- payment success
- AI report processing
- empty states

Rules:
- Keep small.
- Do not autoplay too many animations on one page.
- Avoid heavy JSON files.
- Provide fallback static state.

---

## Motion Rules

Allowed:
- fade-in
- hover transition
- loading shimmer
- slot selection feedback
- dashboard card reveal
- success micro animation

Not allowed:
- flashing motion
- long intro animation
- excessive parallax
- background video loops
- motion that blocks user action

---

## Reduced Motion

Respect reduced motion preference where possible.

If reduced motion is enabled:
- Disable non-essential animations.
- Keep essential feedback simple.

---

## AI Report Media

AI report page may use:
- small progress visuals
- strength/weakness chips
- recommendation cards
- report status animation

Do not use:
- emotional judgment visuals
- scary warning icons
- child-shaming visuals

---

## Recording Media

Merithub recordings:
- Require consent
- Must be private
- Must not be public assets
- Must be used only for AI report generation if approved
- Must follow AI_CONSENT_POLICY.md

---

## Performance Requirements

- Lazy-load non-critical media.
- Compress images.
- Avoid blocking first page render.
- Keep homepage fast.
- Do not load animations before main content.

---

## Accessibility

All meaningful images need Arabic alt text.

Decorative images can use empty alt text.

Animations must not reduce readability.
