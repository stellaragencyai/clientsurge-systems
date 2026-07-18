# ClientSurge Design System v2

## North-star reference

ClientSurge uses a deep navy operating-system environment, clean white hierarchy, and a controlled electric-blue-to-cyan gradient. The effect must feel premium and enterprise-grade—not purple-heavy, gamer-like, or neon everywhere.

## Core rules

1. **Navy is the environment.** Use `--cs-navy-950` as the primary dark background and lighter navy tokens for layered surfaces.
2. **White establishes hierarchy.** Major headings use softened white; supporting copy uses muted blue-gray.
3. **The signature gradient is scarce.** Reserve it for decisive headline phrases, primary CTAs, active navigation, and high-value metrics.
4. **Glow communicates action.** Glow belongs on primary actions and active system states, never on every card.
5. **Atmosphere stays restrained.** Rings, particles, and radial light may support hero, authentication, activation, and Mission Control surfaces but must never reduce readability.
6. **One product language.** Authentication, activation, customer portal, billing, and admin screens inherit the same tokens and component behavior.

## Typography hierarchy

- Eyebrow: uppercase, compact, high tracking, electric cyan.
- Display: bold geometric sans, tight tracking, short line length.
- Section heading: strong but smaller than display; avoid decorative treatments.
- Body: readable blue-gray on dark or slate on light.
- Caption: concise; do not use low-contrast gray below accessible thresholds.

## Component standards

### Primary action

Use `.cs-primary-button` for the single dominant action in a surface. It uses the official blue gradient, cyan edge highlight, white text, and controlled blue shadow.

### Secondary action

Use `.cs-secondary-button` on dark backgrounds. It remains transparent and should never visually compete with the primary action.

### Branded atmospheric surface

Use `CSBrandSurface` or `.cs-brand-shell` for authentication hero panels, activation headers, Mission Control welcome zones, and select public-site hero/CTA sections.

### Cards

- `.cs-dark-card`: dark product cards, AI workforce cards, system-health modules.
- `.cs-light-card`: forms, billing surfaces, structured settings, transactional content.

### Inputs

Use `.cs-input` or design-system inputs aligned to its 48px minimum height, 14px radius, electric-blue focus border, and four-pixel focus halo.

## Semantic color use

- Success: healthy, connected, complete.
- Warning: attention required, degraded, incomplete.
- Danger: failed, blocked, destructive.
- Electric blue: active, selected, actionable—not success.

## Motion

- Fast: 140ms for focus and small state changes.
- Base: 220ms for hover and card interactions.
- Slow: 420ms for page-level reveals.
- Respect `prefers-reduced-motion`.

## Naming language

Preferred product language:

- Mission Control
- AI Workforce
- Revenue Engine
- Operations
- Intelligence
- Business Center
- Command Center

Avoid generic labels where a branded operating-system term is clearer, but do not sacrifice usability for novelty.

## Immediate migration order

1. Authentication logo and brand polish.
2. Activation and credentials wizard tokens.
3. Customer portal shell and Mission Control.
4. Billing and admin surfaces.
5. Public site and homepage last.
