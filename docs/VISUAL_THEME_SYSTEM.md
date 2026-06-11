# Visual Theme System

Last updated: 2026-06-06

## Primary Colors

- Ink: `#0A1628` for core text, footer text, and dark UI contrast.
- Primary blue: `#0088CC` for public CTAs, icons, links, focus states, and route accents.
- Deep blue: `#003B8F` for gradient depth, footer system bands, and trust/security accents.
- Bright blue: `#00AEEF` for highlights, glow edges, focus rings, and active navigation.
- Surface: `#ffffff` for public sections, legal pages, cards, and most content backgrounds.
- Soft blue surface: `#f7fbff` for section tinting and quiet public-page contrast.

## Accent Colors

- Success green may be used only for availability/status dots and confirmed-safe states.
- Red may be used only for problem states, errors, or comparison cards.
- Warm brown/gold legacy gradients should not be introduced on new public CTAs.

## Blue Glow Rules

- Blue glow is reserved for primary CTAs, active progress, and trust/security emphasis.
- Use subtle shadows such as `rgba(0,174,239,0.18)` to `rgba(0,174,239,0.4)`.
- Avoid decorative glow blobs or unrelated background orbs.
- Buttons may use blue gradients; page sections should not become all-gradient panels unless they are constrained bands like the footer automation strip.

## Typography Scale

- Public page hero headings use display styling with tight but readable line-height.
- Compact panels, cards, nav menus, and footers must use smaller headings that fit their container.
- Do not scale fonts directly with viewport width.
- Letter spacing should be zero for normal text and modest positive tracking only for uppercase eyebrow labels.

## Button Standards

- Primary public CTA language is `Free Automation Audit`.
- Main public CTA buttons use 8px radius or pill styling only when the surrounding component already uses pill CTAs.
- Primary buttons should include clear action affordance, often with `ArrowRight` from `lucide-react`.
- Secondary buttons should be quieter and should not compete with the audit CTA.
- Avoid demo-first wording on public CTAs unless the link is explicitly a video/demo asset.

## Card Standards

- Cards should use 8px radius or the existing component radius where already established.
- Do not nest cards inside cards.
- Cards are for repeated items, route grids, modals, and framed tools, not for whole page sections.
- Card text must wrap cleanly at mobile widths.

## Section Standards

- Public pages should use full-width bands with constrained inner content.
- Navigation, footer, hero, CTA, and trust/security sections should remain consistent across `/`, `/automations`, `/industries`, `/store`, and industry routes.
- Legal pages should stay quiet, readable, and low-motion.

## Page Layout Rules

- The first viewport must communicate ClientSurge Systems and the route's concrete offer.
- Public pages should keep the header and footer consistent.
- Mobile layouts must avoid horizontal overflow at 320px, 375px, 390px, 414px, and 768px.
- Sticky elements must not cover primary CTA or form completion controls.

## Animation Rules

- Motion should clarify progression, lead flow, or system state.
- Avoid motion that shifts layout or hides important controls.
- Respect readable timing; keep animations lightweight on mobile.

## Legal Page Rules

- Legal routes are PUBLIC and indexable, but they should not use sales-heavy hero composition.
- Legal copy must preserve support email and phone links.
- Terms and privacy routes must remain in footer navigation.

## Mobile Rules

- Buttons must maintain at least 44px touch targets.
- Fixed navigation and mobile call bars must account for safe-area insets.
- Long CTA labels must wrap or shrink gracefully without clipping.

## Accessibility Rules

- Keep skip link support in `App.jsx`.
- Preserve focus-visible outlines on footer, nav, and CTA controls.
- Use descriptive alt text for meaningful images.
- Decorative icons must use `aria-hidden`.
- Heading hierarchy should remain one route-level `h1` followed by section-level `h2`/`h3`.

## Current Violations Tracked

- `/plumbing` is a standalone controlled-launch route; verify live route delivery after publish.
- Some older docs still mention demo-era CTA language; launch-visible React and static shell copy now use `Free Automation Audit`.
