# ClientSurge Systems Operational Overview

## Stack Summary
- Frontend: React 18, Vite 6, React Router
- Styling/UI: Tailwind CSS, shadcn-style UI components, Lucide icons, Framer Motion
- Backend: Base44 entities, functions, auth, and agents
- Data access: `@base44/sdk`
- Notifications: Resend email, Twilio SMS
- Scheduling: Base44 demo scheduling flow plus Calendly embed on `/book`
- Build tooling: Vite, ESLint, TypeScript typecheck, npm

## Page Map
- `/`: main marketing homepage
- `/med-spa`: med spa landing page
- `/start`: launches med spa demo modal
- `/book`: Calendly booking page
- `/success`: post-booking confirmation page
- `/contact`: contact form
- `/onboarding`: client onboarding form
- `/client-portal`: authenticated client portal
- `/admin`: main admin dashboard
- `/admin-settings`: legacy admin settings page
- `/admin/leads`: legacy admin leads page
- `/admin/leads/:leadId`: admin lead detail
- `/dashboard`: older admin dashboard
- `/lead-intelligence`: lead discovery/intelligence dashboard
- `/medspa-dashboard`: lead analytics dashboard
- `/sam`: Base44 agent chat UI
- `/legal/:type`: legal pages
- `/test-option-1`, `/test-option-2`, `/test-option-3`: experimental homepage variants

## Current Backend / Integrations
### Canonical website intake
- Public lead capture should use `Leads`
- New canonical lead capture function: `base44/functions/submitLeadCapture`
- Current public lead capture forms now call the backend instead of writing directly to Base44 from the browser

### Existing entities in active use
- `Leads`: website lead capture and demo intake
- `Client`, `ClientProject`: onboarding and client portal
- `AdminSettings`: provider/config settings
- `AutomationJob`: queued downstream actions
- `CommunicationEvent`, `Messages`, `Emails`, `Events`: messaging and audit data
- `DemoRequest`: demo request storage
- `SupportMessage`: client portal support messaging

### Existing functions in active use
- `submitLeadCapture`: canonical public lead capture
- `sendContactEmail`: contact form email notification
- `scheduleDemoBooking`: creates booked lead, sends confirmations, creates calendar event
- `sendPortalWelcomeEmail`: welcome + admin notification for new client accounts
- `sendEmail`, `sendSMS`: generic notification senders
- `testProviderConnections`: admin provider health checks

### External integrations
- Resend
- Twilio
- Webhook-based CRM/automation integration
- Calendly
- Base44 auth and agents

## Known Issues
1. Lead model is still split between `Leads` and legacy `Lead`
2. Contact form emails are sent but contact submissions are not stored as durable admin-visible records
3. Demo booking is split between internal scheduling flow and Calendly
4. Email sending/logging is inconsistent across functions
5. CRM integration is generic webhook transport, not a full sync layer
6. Payment/setup-fee support is not implemented, despite pricing and installed Stripe packages
7. Admin visibility is fragmented across newer and legacy dashboards
8. Public form validation/security is improved for lead capture, but not yet unified across contact/demo flows
9. Brand drift remains in some backend copy and legacy functions (`ApexFlow` references)
10. Route/auth enforcement is inconsistent across pages

## Prioritized Backlog
### P1
- Unify website intake around `Leads` only
- Add durable storage for contact inquiries
- Choose one canonical booking flow
- Standardize email/SMS event logging

### P2
- Build a single CRM sync path for canonical lead records
- Consolidate admin views onto one authoritative dashboard
- Harden public intake with centralized validation/rate limiting

### P3
- Add payment/setup-fee collection and webhook handling
- Clean up legacy `Lead`-based flows or migrate them
- Remove or archive outdated experimental pages and duplicate dashboards

## Completed Work
- Mapped the repository structure, page map, backend inventory, and current integrations
- Audited homepage conversion structure and landing page architecture
- Identified backend gaps across lead capture, notifications, CRM, payments, and admin visibility
- Implemented `submitLeadCapture` as the canonical backend intake for public lead capture
- Updated public lead-capture forms to use the backend intake path
- Added server-side validation, sanitization, and recent-duplicate protection for public lead submissions
- Verified the current codebase builds successfully after the lead capture update

## Next Milestones
### Milestone 1: Intake Stability
- Store contact inquiries in Base44
- Route all public inbound forms through backend functions
- Align all public lead/demo paths to one canonical status model

### Milestone 2: Operational Visibility
- Consolidate admin visibility for leads, contact inquiries, booking status, and delivery failures
- Standardize event logging for email, SMS, and CRM sync attempts

### Milestone 3: Booking + CRM
- Choose and enforce one booking flow
- Implement canonical outbound CRM sync with retry/error tracking

### Milestone 4: Billing + Activation
- Add setup-fee / activation-fee payment flow
- Connect payment state to onboarding and client project milestones
