# ClientSurge Activation OS — Shell Contract

## Purpose

Provide one guided, resumable activation experience that turns a purchased ClientSurge system into an installation-ready business configuration without exposing technical implementation details to the customer.

## Locked sequence

1. Business Profile
2. Website Setup
3. Brand Setup
4. Lead Routing
5. Booking
6. Communications
7. Connected Services
8. Review
9. Submit for Installation

## Shell responsibilities

The shell owns presentation and workflow framing only:

- Step navigation
- Current, completed, upcoming, available, and blocked states
- Desktop and mobile progress
- Save-state communication
- Previous and continue actions
- Validation summaries
- Blocked-step messaging
- Responsive workspace framing
- Sticky action footer

The shell does not own:

- Base44 entity definitions
- Backend persistence implementation
- Business-specific validation rules
- API credentials
- Installation creation
- Route authorization

Those concerns must enter through explicit props, adapters, and step-level containers.

## Save-state contract

Supported visible states:

- `idle`: persisted and unchanged
- `dirty`: local changes have not been persisted
- `saving`: persistence request is active
- `saved`: most recent persistence request succeeded
- `error`: persistence failed and retry may be offered
- `offline`: persistence is unavailable because connectivity is unavailable

The UI must never display a saved state before persistence succeeds.

## Navigation contract

- Completed steps are selectable.
- Current step is selectable and marked with `aria-current="step"`.
- Upcoming steps remain unavailable unless a step explicitly declares `available: true`.
- Blocked and unavailable steps display a visible reason and keep the disabled control focusable with `aria-disabled` plus descriptive helper text.
- Step selection does not bypass container-level validation or persistence guards.

## Accessibility contract

- The screen uses one `main` landmark.
- Step navigation uses a named `nav` and ordered list.
- The current step uses `aria-current="step"`.
- Save status uses polite live announcements, except save failure uses assertive alert semantics.
- Progress uses native `progress` semantics on mobile.
- Blocked or unavailable step controls expose their disabled reason through visible text referenced by `aria-describedby`.
- Buttons retain visible focus and minimum practical touch targets.
- Icons are decorative unless they communicate unique information.
- Motion respects reduced-motion settings.

## Responsive contract

Desktop:

- Sticky white product top bar
- Persistent navy step sidebar
- White/neutral guided workspace
- Sticky bottom action footer

Tablet and mobile:

- Sidebar is replaced by compact progress and horizontal step indicators
- Content becomes single-column
- Footer actions stack at narrow widths
- Safe-area bottom padding is preserved
- No horizontal page overflow

## Product styling

- Predominantly white and neutral workspace
- Navy navigation and identity framing
- Semantic product blue for progress and primary activation actions
- Pricing commerce gradient is not used in activation
- Fine borders and restrained shadows
- No decorative glassmorphism or excessive animation

## Integration boundary

After rebasing onto PR #1353, the shared activation primitives live in the Design System boundary. This branch keeps an activation-specific compatibility adapter and contract layer so downstream setup flows can adopt those primitives without introducing a competing shell. The follow-on integration must:

1. Rebase on the validated Design System 2.1 branch.
2. Use the shared Design System activation primitives as the rendering source of truth.
3. Import the activation stylesheet through the approved application style entry point.
4. Connect the shell to the current Business Setup and credentials/onboarding architecture through an adapter.
5. Preserve existing backend behavior until a separately reviewed migration changes it.
