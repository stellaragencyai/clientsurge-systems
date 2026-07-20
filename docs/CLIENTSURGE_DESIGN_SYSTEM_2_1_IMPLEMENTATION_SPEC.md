# ClientSurge Design System 2.1 — Implementation Contract

## Purpose

Create one shared, production-grade visual system for every authenticated ClientSurge surface. The system must make ClientSurge feel calm, operational, premium, fast, and trustworthy.

## Locked product balance

- Approximately 70% white and neutral workspace surfaces.
- Approximately 20% navy navigation, framing, and brand emphasis.
- Approximately 10% electric blue actions, active states, progress, and priority data.
- Marketing pages may remain atmospheric and dark; authenticated product surfaces remain predominantly white.

## Semantic color contract

- `--cs-bg-app`: application canvas.
- `--cs-bg-surface`: primary white surface.
- `--cs-bg-subtle`: secondary neutral surface.
- `--cs-border`: default structural border.
- `--cs-text-primary`: primary content.
- `--cs-text-secondary`: supporting content.
- `--cs-text-muted`: metadata and tertiary content.
- `--cs-navy-*`: sidebar, dark panels, and controlled brand moments.
- `--cs-blue-*`: primary actions, active navigation, progress, and information.
- `--cs-success-*`, `--cs-warning-*`, `--cs-danger-*`: semantic status only.

Color must communicate hierarchy or state. It must not be used as decoration without purpose.

## Typography contract

- Product typography must prioritize scanning, data comprehension, and clear action hierarchy.
- Page titles must be compact and operational rather than promotional.
- Body text must remain readable at normal browser zoom.
- Metrics use tabular numerals where supported.
- Avoid oversized marketing typography inside the application.

## Layout contract

### Desktop

- Persistent navy sidebar.
- White main workspace.
- Compact top bar for account, organization, support, and notifications.
- Page content uses a maximum readable width where appropriate, but dashboards may use the full workspace.

### Mobile

- Sidebar becomes an accessible drawer.
- Primary actions remain reachable without horizontal scrolling.
- Tables degrade into cards or controlled horizontal regions.
- Navigation, dialogs, and forms must remain keyboard and screen-reader operable.

## Core primitives

The system must provide shared implementations for:

- Application shell
- Sidebar navigation
- Mobile drawer
- Page header
- Primary, secondary, quiet, and destructive buttons
- Text inputs, text areas, selects, radio cards, toggles, and upload zones
- Surface cards, metric cards, status panels, alerts, and empty states
- Tables, filters, tabs, timelines, activity feeds, and pagination
- Dialogs, drawers, toasts, tooltips, and confirmation states
- Progress bars, step indicators, loading skeletons, unavailable states, and error states

## Accessibility requirements

- Visible focus states for every interactive element.
- Minimum AA contrast for normal text and controls.
- Reduced-motion support.
- No status conveyed by color alone.
- Touch targets should generally be at least 44px in either dimension.
- Navigation landmarks and headings must reflect the visual hierarchy.

## Logo requirements

- Use only approved ClientSurge logo assets.
- Use the light logo on navy surfaces and the dark logo on white surfaces.
- Do not invent a replacement mark.
- Text-only fallback is permitted only when the approved asset is unavailable.

## Product language requirements

Preferred:

- Command Center
- Activate Your System
- Your System Is Ready
- System Activity
- System Health
- Connected Services
- Automated Process
- Launch

Avoid unnecessary platform jargon in customer-facing UI. Technical terms may remain in admin and engineering surfaces when they improve accuracy.

## Acceptance criteria

This workstream is complete when authentication, activation, Command Center, billing, support, and admin surfaces can be assembled from the shared system without introducing a competing color, spacing, radius, button, card, or navigation language.
