# ClientSurge Operations SOP Pack

Last updated: 2026-06-28
Owner: ClientSurge Systems
Status: Launch-ready internal operating draft

This document covers the operational SOPs needed before aggressive client acquisition. It is not legal advice. Any customer-facing policy or contract language should be reviewed by counsel before relying on it as final legal documentation.

---

## 1. Support Ticket SOP

### Purpose
Create a consistent support path for customer issues, bugs, setup questions, billing concerns, and automation failures.

### Intake Channels
- Primary: support@clientsurgesystems.com
- Backup: client portal support form or admin inbox
- Emergency: owner/operator SMS or phone only for active outage, payment-impacting failure, or active customer launch issue

### Ticket Categories
1. Access or login issue
2. Billing or subscription issue
3. Website/form issue
4. SMS, phone, or Twilio issue
5. Email or Resend issue
6. Booking/calendar issue
7. Automation not firing
8. Client setup/onboarding question
9. Cancellation or refund request
10. General support

### Severity Levels

#### P0 — Business-critical outage
Use when a paid client cannot receive leads, bookings, SMS, email, or checkout-related service.

Response target: same business day, ideally within 2 hours.
Action: stop other non-critical work, verify logs, create incident record, communicate status.

#### P1 — Important client-impacting defect
Use when one automation, notification, or dashboard area is degraded but core service still operates.

Response target: within 1 business day.
Action: triage, reproduce, patch or escalate.

#### P2 — Standard support
Use for configuration requests, copy changes, routine questions, or non-urgent setup help.

Response target: within 2 business days.
Action: clarify, resolve, document.

#### P3 — Nice-to-have request
Use for future enhancements, design tweaks, and low-priority requests.

Response target: backlog review.
Action: log, prioritize in weekly review.

### Ticket Workflow
1. Log request with customer, channel, timestamp, issue category, severity, and affected system.
2. Confirm receipt to customer.
3. Check Base44 records, CommunicationEvent logs, Order state, and provider dashboards as applicable.
4. Reproduce the issue if safe.
5. Apply fix or create escalation note.
6. Confirm resolution with evidence.
7. Close ticket only after the customer or internal proof confirms resolution.

### Required Ticket Notes
- Customer name/business
- Contact email/phone
- Issue summary
- Severity
- Affected automation or provider
- Evidence checked
- Root cause if known
- Fix applied
- Customer communication sent
- Close reason

---

## 2. Incident Response SOP

### Purpose
Respond consistently when production systems fail or customer-facing automations produce incorrect outcomes.

### Incident Triggers
- Live homepage fails or key route blanks
- Lead capture fails
- Booking flow fails after form submit
- Stripe checkout/payment/webhook failure
- Twilio SMS/voice outage or misrouting
- Resend email delivery/config failure
- Client portal unavailable
- Wrong customer data shown
- Security/privacy concern
- Automation sends messages incorrectly

### Incident Severity

#### SEV-1
Customer-facing outage, payment-impacting issue, data exposure, or active messaging malfunction.

Actions:
1. Pause risky automations if needed.
2. Create incident record.
3. Check live site, GitHub latest commit, Base44 records, provider dashboard, and Asana blocker.
4. Apply emergency patch or rollback.
5. Notify affected customer if customer-facing.
6. Post incident summary after resolution.

#### SEV-2
Important degraded service but no data exposure and no complete outage.

Actions:
1. Reproduce.
2. Patch within current work cycle.
3. Add regression check.
4. Log root cause.

#### SEV-3
Internal-only bug or non-blocking issue.

Actions:
1. Add to backlog.
2. Batch with weekly cleanup.

### Incident Checklist
- What broke?
- Who is affected?
- When did it start?
- Is money, customer data, lead capture, booking, SMS, or email affected?
- Is there a safe rollback?
- What proof confirms recovery?
- What follow-up task prevents recurrence?

### Post-Incident Report Template
- Incident title
- Date/time opened
- Date/time resolved
- Severity
- Affected systems
- Customer impact
- Root cause
- Fix applied
- Proof of recovery
- Preventive action

---

## 3. Weekly Metrics Review SOP

### Purpose
Run a weekly command review so launch decisions are based on proof, not vibes.

### Cadence
Weekly, preferably Monday morning.

### Review Inputs
- LaunchGate statuses
- Orders and Stripe webhook results
- WebsiteLead and Leads counts
- DemoRequest records
- CommunicationEvent logs
- CommunicationLog provider delivery states
- Failed jobs/admin alerts
- GA4/traffic/CTA activity
- Asana incomplete launch tasks

### Scorecard Sections
1. Lead capture health
2. Booking flow health
3. Stripe/payment health
4. SMS/Twilio health
5. Email/Resend health
6. Client onboarding/install health
7. Revenue/MRR health
8. Dashboard truth/data quality
9. Launch blockers
10. Next 3 highest-leverage actions

### Weekly Review Output
At the end of each review, create a short status note:

- Overall status: Green / Yellow / Red
- Biggest win
- Biggest blocker
- Top 3 fixes this week
- Tasks to check off
- Tasks that must stay open due to missing proof

### Weekly Decision Rule
Do not mark final launch readiness green unless:
- Booking proof is clean
- Stripe proof is clean
- SMS proof is clean
- Lead capture proof is clean
- Legal/business foundation has no critical unresolved owner blockers

---

## 4. New Client Onboarding SOP

### Purpose
Turn a paid customer into a configured ClientSurge client without losing setup details.

### Trigger
A Stripe Order reaches `payment_status = paid` or an owner manually approves onboarding for a customer.

### Onboarding Stages
1. Payment captured
2. Client profile created
3. Setup checklist generated
4. Credentials requested
5. Business details verified
6. Automations configured
7. Provider tests run
8. Go-live approval requested
9. Client handoff completed
10. Weekly support cadence begins

### Required Client Details
- Business name
- Owner/contact name
- Email
- Phone
- Website URL
- Industry
- Service area
- Business hours
- Booking link/calendar process
- Current CRM or lead destination
- SMS consent/compliance preference
- Automation package purchased
- Primary business pain

### Setup Access Checklist
Collect only what is needed:
- Website/admin access or publishing process
- Domain/DNS access only if required
- Calendar/booking link
- CRM or lead destination
- Twilio number/campaign details if client-owned
- Email sender details if client-owned
- Brand voice and response preferences

### Go-Live Checklist
Before marking client live:
- Lead capture test passes
- SMS/email response test passes
- Booking path test passes
- Client receives sample notification
- Dashboard shows truthful status
- Client approves copy/automation behavior
- Rollback or pause path is known

### Handoff Message Template
Subject: Your ClientSurge setup is ready for review

Hi {{client_name}},

Your ClientSurge setup is ready for review. We have configured your core automations and completed the initial checks for lead capture, follow-up, and booking handoff.

Please review:
1. Your lead capture path
2. Your automated message copy
3. Your booking handoff
4. Your dashboard/access

Reply with approval or any changes you want before we mark the system live.

---

## 5. Refund / Cancellation SOP

### Purpose
Handle cancellations, refunds, duplicate charges, and billing disputes consistently.

### Intake
All refund or cancellation requests should be routed to support@clientsurgesystems.com and logged with the customer Order record.

### Cancellation Rules
- Customer may request cancellation before the next billing cycle.
- Cancellation stops future billing after the current paid period unless otherwise approved in writing.
- Confirm whether automations should be paused, exported, transferred, or removed.

### Refund Review Rules
Refunds are reviewed case by case.

Refund may be considered when:
- Duplicate charge occurred
- Wrong amount was charged
- ClientSurge cannot begin service
- Written exception is approved

Refund may be denied when:
- Custom setup has started
- Customer failed to provide required access
- Service was delivered or made available
- Customer changed mind after setup began
- Customer violated terms or platform requirements

### Refund Workflow
1. Confirm customer identity and Order.
2. Identify charge, date, amount, and Stripe session/subscription.
3. Review service delivery status.
4. Decide: refund, partial refund, credit, cancellation only, or deny.
5. Document reason.
6. Notify customer.
7. Update Stripe and Order/CommunicationEvent records.
8. Archive or pause client services if needed.

### Cancellation Confirmation Template
Subject: Your ClientSurge cancellation request

Hi {{client_name}},

We received your cancellation request for {{business_name}}. Your subscription will be canceled according to the current billing terms and no future monthly billing will occur after the effective cancellation date.

We will confirm once the billing update is complete.

---

## 6. Owner Guardrails

Do not mark the following complete without external proof:
- Insurance coverage activated
- Bookkeeping system fully configured
- Final legal/contract stack approved
- No critical legal gaps remain
- Live payment/subscription proof
- Real call/SMS delivery proof
