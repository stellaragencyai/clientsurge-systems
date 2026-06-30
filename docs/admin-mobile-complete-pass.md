# Admin Mobile Complete Pass

This PR covers the full mobile-admin backlog requested after the first `/admin` hotfix.

## Covered fixes

- Main `/admin` shell remains protected by the existing mobile entry hotfix.
- Settings tabs are made horizontal-scrollable, sticky, and touch-friendly on mobile.
- Admin Leads table with the 1100px desktop width signature is converted to a stacked mobile card layout with labels.
- Overview dashboard is compressed on mobile: tighter spacing, 2-column KPI cards, smaller KPI values, and single-column action stacking.
- Adds a mobile sticky admin action bar for Home, Leads, Inbox, Settings, and Menu.
- Adds overflow/scroll containment for admin tables/logs/cards to reduce viewport blowout.

## Scope

Admin mobile UI only. No Stripe, Twilio, Resend, CRM, lead, order, client, or public website behavior changes.
