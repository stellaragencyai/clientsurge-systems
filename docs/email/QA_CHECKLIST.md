# ClientSurge Email QA Checklist

Use this checklist before merging or publishing any new email-template changes.

## Required test matrix

- Gmail desktop
- Gmail mobile
- Apple Mail
- Outlook web if available
- Light mode
- Dark mode preview

## Visual checks

- Logo appears in the top-left header.
- If the logo does not load, fallback `CS` mark appears cleanly.
- No legacy brown theme colors are visible.
- No emoji-led heading or CTA presentation.
- Cards are readable on mobile.
- CTA button is visible, blue, and tappable.
- Footer uses the correct sender identity.

## Sender identity checks

- System notifications use `ClientSurge Systems`.
- Support messages use `ClientSurge Support`.
- Founder/client-facing report messages use `Nolan Strommer · ClientSurge Systems`.
- Sales/nurture messages use `ClientSurge Sales` or the approved leads sender.
- Billing messages use `ClientSurge Billing`.
- Reply-to matches the sender purpose.

## Deliverability checks

- Resend domain is verified.
- DKIM passes.
- SPF aligns.
- DMARC aligns.
- No high-risk spam phrasing in subject line.
- Marketing/nurture sends remain behind deliverability gates.
- Outreach emails include unsubscribe/opt-out instruction where appropriate.

## Link checks

- CTA opens the expected page.
- Client Portal links resolve.
- Admin Dashboard links resolve.
- Setup credentials link includes the expected order context.
- No private Google Drive links or local file paths are used for images.

## Resend metadata checks

- Email includes category tags.
- Email includes sender identity tags where applicable.
- CommunicationEvent is written when the workflow expects an audit trail.
- Provider message ID is stored when available.

## Safety boundaries

- Do not send real customer emails during preview testing.
- Do not change Stripe live objects as part of email QA.
- Do not change pricing or checkout behavior as part of email QA.
- Do not ask clients to email passwords or private access credentials.

## Merge gate

Before merging, run:

```bash
npm run email:branding-check
```

The check should fail if legacy brown styling or emoji-led email presentation returns to email-related function files.
