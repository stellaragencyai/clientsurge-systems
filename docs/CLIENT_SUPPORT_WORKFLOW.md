# Client Support Workflow

## Support Channels

- Support email: `support@clientsurgesystems.com` after the mailbox/alias is verified for production use.
- Client portal if available: use the protected portal support/messaging surface.
- Admin notes: record internal decisions, blockers, and proof references on the relevant client/project/order.
- Emergency escalation path: owner phone/text path must be recorded in the client access checklist before go-live.

## Priority Levels

### Urgent

Examples:

- Lead capture down.
- Booking broken.
- SMS/email automation failure.
- Client cannot receive leads.

Target response: same business day or faster.

### High

Examples:

- One automation degraded.
- Dashboard issue.
- Incorrect notification routing.

Target response: 1 business day.

### Normal

Examples:

- Small copy changes.
- Reporting questions.
- Routine automation adjustment.

Target response: 2 business days.

### Low

Examples:

- Cosmetic change.
- Future improvement request.

Target response: 3-5 business days.

## Bug vs Change Request

- Bug: purchased and approved functionality is not working as accepted or is creating incorrect client/customer behavior.
- Included support: routine monitoring, small approved template corrections, delivery troubleshooting, and clarification of already-installed system behavior.
- Paid change request: new scope, new provider, new campaign, new automation, new channel, or material redesign of approved behavior.
- New automation request: any automation not included in the purchased package or handoff.
- Out-of-scope request: work that requires unauthorized access, unsupported provider behavior, legal/compliance claims outside approved copy, or unapproved live-client data manipulation.

## Escalation

- Owner escalation: assign one ClientSurge owner for each urgent/high support item.
- Provider escalation: record provider, ticket/reference ID, opened date, and expected next update.
- Client communication: send factual status updates only; do not promise unverified fix times.
- Fix log: record issue, severity, owner, discovered date, fix applied, proof, client notified, and closed date.

## Billing Issue Handling

- Confirm whether the issue is payment failure, invoice question, plan change, cancellation, or duplicate charge concern.
- Use Stripe/customer portal surfaces where appropriate; do not ask for card numbers in chat/email.
- Separate billing support from automation health unless billing status directly affects service access.
- Record billing action, owner, and client-facing message.

## Automation Failure Handling

- Classify priority based on lead capture, booking, notification, and customer-facing impact.
- Check recent deploy/provider/webhook logs before changing templates or config.
- Run safe test payloads before and after fix.
- Attach proof and update the client if customer-facing behavior was affected.

## Reporting Cadence

- Urgent/high items: update the client when acknowledged, when root cause is known, when fixed, and when proof is available.
- Normal/low items: update at response target and when complete.
- Monthly support: include open issue review, resolved issue summary, automation health, and next recommendations.

## Client Communication Templates

### Acknowledgement

Subject: Support request received: `[issue summary]`

Body:

Hi `[client name]`,

We received your request about `[issue summary]`. Current priority: `[priority]`. Owner: `[ClientSurge owner]`. Next update: `[time/date]`.

We will not make live changes until the issue is verified and the next action is clear.

### Fix Applied

Subject: Update: `[issue summary]`

Body:

Hi `[client name]`,

We applied the fix for `[issue summary]`. Proof reviewed: `[proof reference]`. Current status: `[resolved/monitoring/client review needed]`.

Please reply with any issue you still see.

### Change Request

Subject: Change request review: `[request summary]`

Body:

Hi `[client name]`,

This request appears to be `[included support/paid change/new automation/out of scope]` because `[reason]`. Next step: `[next action]`.

We will confirm scope before making changes.

