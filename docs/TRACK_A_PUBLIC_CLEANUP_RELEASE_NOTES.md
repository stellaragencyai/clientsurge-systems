# Track A Public Website Cleanup Release Notes

## Scope
Public website credibility, SEO route exposure, crawlable pricing fallback, robots, sitemap, legal pages, footer cleanup, and containment for Base44-generated public route leakage.

## Intended public route whitelist
- `/`
- `/pricing`
- `/automations`
- `/contact`
- `/privacy`
- `/terms`
- `/sms-terms`
- `/refund-policy`

## Private/internal route families
Unauthenticated visitors must not see internal page names, route lists, admin titles, setup titles, or app-builder directories for these route families:

- `/admin`
- `/dashboard`
- `/client`
- `/client-portal`
- `/setup`
- `/functions`
- `/internal`
- `/private`
- `/onboarding`
- `/install`
- `/audit`
- `/observability`
- `/reconciliation`

## Major changes
- Narrows public route metadata to the eight intended public routes.
- Adds `/sms-terms` as a real public legal page.
- Wires `/privacy` and redirects `/privacy-policy` to `/privacy`.
- Moves setup/onboarding pages behind auth exposure protection.
- Restricts generated sitemap and static sitemap to only intended public routes.
- Rebuilds robots directives for private/internal route families.
- Replaces public footer route sprawl with clean public/legal links.
- Adds a static fallback with crawlable package pricing.
- Adds a public route-exposure guard that removes generated `Pages` directory blocks and hides internal route anchors if Base44 tries to render them.

## Acceptance checks
Before marking Track A complete, verify live production:

- `/` has no `Pages` heading and no internal route directory.
- `/pricing` has no `Pages` heading and shows crawlable pricing.
- `/automations` has no `Pages` heading and no internal route directory.
- `/contact` has no `Pages` heading and no internal route directory.
- `/privacy`, `/terms`, `/sms-terms`, and `/refund-policy` load cleanly.
- `/dashboard`, `/admin`, `/setup`, and `/client` do not expose internal route names to unauthenticated visitors.
- `/robots.txt` returns clean text.
- `/sitemap.xml` contains only the intended public route whitelist.

## Boundaries respected
This Track A patch does not intentionally change Stripe webhook logic, lead records, CRM data, Twilio, Resend, Base44 entities, or authenticated dashboard business logic beyond exposure protection.
