# ClientSurge OS Phase F - Worker 3 UX and Accessibility Packet

Source: Phase F Platform Integration Foundation, Worker #3 review handoff.

## Scope

This packet is for Worker #3 to review the integrated operating-system experience. The foundation connects navigation, search, notifications, activity, customer context, permissions, and truth semantics into one admin surface. Worker #3 should review the experience as an integrated SaaS operating system, not as isolated pages.

This packet does not claim production launch readiness or live data proof.

## Review Targets

| Target | Files and routes | Review focus |
| --- | --- | --- |
| Global admin shell | `src/components/admin/AdminShell.jsx` | Navigation grouping, active states, responsive behavior, scan density, mobile topbar, and bottom mobile rail. |
| Internal admin dashboard nav | `src/internal-pages/AdminDashboard.jsx` | Phase F group labels, route discoverability, and consistency with the admin shell. |
| Platform review route | `/admin/platform`, `src/pages/admin/PlatformIntegrationFoundation.jsx` | Route map, contract readability, restricted states, truth labels, and review utility. |
| Universal search | `src/components/admin/AdminGlobalSearch.jsx`, `src/lib/adminGlobalSearch.js` | Search scope, loading/error/empty states, result clarity, keyboard behavior, and destination confidence. |
| Integration contract | `src/lib/platformIntegrationFoundation.js` | User-facing labels, route names, permission states, activity semantics, and notification vocabulary. |

## Screenshot Matrix

Viewport proof captured in the task workspace, outside the repository:

| Viewport | Screenshot |
| --- | --- |
| 1440x900 | `outputs/phase-f-platform-integration-screenshots/viewport-platform-1440x900.png` |
| 1280x900 | `outputs/phase-f-platform-integration-screenshots/viewport-platform-1280x900.png` |
| 1024x768 | `outputs/phase-f-platform-integration-screenshots/viewport-platform-1024x768.png` |
| 768x900 | `outputs/phase-f-platform-integration-screenshots/viewport-platform-768x900.png` |
| 390x844 | `outputs/phase-f-platform-integration-screenshots/viewport-platform-390x844.png` |
| 375x667 | `outputs/phase-f-platform-integration-screenshots/viewport-platform-375x667.png` |

Desktop full-page screenshot stitching was unreliable because the admin shell uses nested scrolling, so viewport screenshots are the review proof source.

## UX Review Checklist

Worker #3 should verify:

- The first viewport communicates "one operating system" without reading like a standalone module.
- Command Center, Intelligence, Operations, Customers, Communications, AI Workforce, Administration, and Account are recognizable and consistently ordered.
- Route names are specific enough for operators to choose the next screen without guessing.
- Active navigation, mobile quick nav, and sidebar state are consistent across breakpoints.
- The platform route is useful for review without becoming a noisy permanent dashboard.
- Universal search clearly distinguishes customers, leads, conversations, AI workers, timeline events, settings, billing, and documents.
- Empty, loading, unavailable, restricted, stale, and error states are visually distinct and action-oriented.
- Restricted states never look like missing data.
- Truth labels make fixture, estimated, stale, unavailable, and verified states clear.
- Long route names, business names, and result labels do not overlap or overflow on 390x844 and 375x667 viewports.
- Density feels appropriate for a work-focused SaaS admin experience.

## Accessibility Checklist

Worker #3 should verify:

- Keyboard reachability for sidebar nav, topbar controls, search, result rows, route cards, and review sections.
- Visible focus states on every interactive control.
- `aria-current` on current route links.
- Search dialog has a labelled input, result count/status updates, and keyboard-selectable results.
- Contract and route tables have meaningful captions or equivalent labels.
- Status chips and truth labels are not color-only.
- Reduced-motion preference does not break hover, transition, or drawer behavior.
- Mobile navigation remains reachable without horizontal scrolling.
- Screen reader flow starts with the page heading, then summary, then contracts, then handoff.

## Observations From Foundation Proof

- Desktop, tablet, and mobile viewports rendered the Phase F route successfully.
- The desktop first viewport was adjusted so the summary card does not crowd the route overview.
- Mobile topbar wrapping was corrected for the Platform Integration label.
- The existing bottom mobile admin rail sits on the viewport edge; content remains scrollable, but Worker #3 should decide whether this is acceptable for long review pages.
- Real entity data may introduce longer labels than fixtures, especially business names, AI worker names, and document titles.

## Recommended Verdict Criteria

Approve UX when:

- Operators can find the major systems from navigation alone.
- Search result categories and destinations are immediately understandable.
- Permission and truth states reduce ambiguity instead of adding admin noise.
- The experience works at 1440x900, 1280x900, 1024x768, 768x900, 390x844, and 375x667.
- Keyboard and screen reader paths are usable for the primary review and search flows.

Do not approve UX if:

- Any route looks verified, healthy, operational, or current without source proof.
- Restricted access reads as an error or empty state.
- Mobile navigation blocks primary content or traps focus.
- Search sends operators to uncertain or fixture-backed destinations without labeling that truth state.

## Known UX Risks

- The grouped sidebar is long by design; Worker #3 should confirm the grouping helps scanning more than it adds weight.
- The bottom mobile rail predates Phase F and may need a separate shell decision.
- The platform review route is valuable for review, but it may be too contract-heavy for a permanent everyday operator page.
- Contract labels are intentionally conservative until Worker #2 binds live data.
