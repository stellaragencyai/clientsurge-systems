# ClientSurge Authentication Migration Validation

## Scope

Validate the first production-page adoption of ClientSurge Design System 2.1 on `/login` without changing authentication providers, identity records, protected-route behavior, or role routing.

## Preserved contracts

- Existing `PortalLoginModal` remains the authentication implementation.
- `from_url` query behavior still opens the login modal automatically.
- Existing contact/support route remains available.
- Existing client and admin post-authentication redirects remain unchanged.
- Existing noindex metadata remains active.

## Presentation changes

- Remove public marketing navigation and footer from the transactional login surface.
- Use a white-dominant product workspace with a navy brand panel.
- Use semantic ClientSurge OS buttons, cards, alerts, status, and focus states.
- Present access around the customer's ClientSurge system rather than a generic portal.
- Explain first-time access without creating a second account flow.

## Required checks

### Build and static checks

- `npm run build`
- `npm run lint`
- `npm run typecheck`

### Functional behavior

- `/login` loads successfully.
- Primary sign-in action opens `PortalLoginModal`.
- `/login?from_url=%2Fclient-dashboard` opens the modal automatically.
- Closing the modal returns the user to the login surface.
- Account-help action routes to `/contact`.
- Existing successful client and admin redirects remain intact.

### Responsive behavior

- 375px mobile.
- 768px tablet.
- 1024px compact desktop.
- 1440px desktop.
- No horizontal overflow.
- Controls remain at least 44px high.

### Accessibility

- One primary page heading.
- Main landmark exists.
- Keyboard-only operation succeeds.
- Focus indicators remain visible.
- Alert and modal states are announced correctly.
- Reduced-motion preferences are honored.

## Regression boundaries

- No checkout behavior changed.
- No authentication provider behavior changed.
- No entity schemas changed.
- No Stripe, Twilio, email, onboarding, or installation pipeline behavior changed.
- No homepage presentation changed.

## Exit criteria

The login migration is acceptable when all checks pass and the route provides a coherent ClientSurge OS experience while preserving every existing authentication and routing contract.
