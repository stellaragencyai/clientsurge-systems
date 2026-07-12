# ClientSurge Email Outreach Launch Gate

Date: 2026-07-12
Status: Code-prepared; production sending remains blocked until every proof below is complete.

## Launch rule

No outreach campaign may be sent merely because a draft exists. A batch can send only after the backend recipient preview reports `sending_ready: true` and an admin types the exact confirmation phrase `SEND N`, where `N` is the eligible recipient count.

## Required environment configuration

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` — verified `@clientsurgesystems.com` address
- `OUTREACH_REPLY_TO_EMAIL` — monitored inbox, initially `nolan@clientsurgesystems.com`
- `OUTREACH_POSTAL_ADDRESS` — valid physical postal address used in every commercial email footer
- `EMAIL_UNSUBSCRIBE_SECRET` — random secret of at least 32 characters
- `PUBLIC_FUNCTION_BASE_URL` — externally reachable Base44 function base used by signed unsubscribe links
- `EMAIL_CAMPAIGN_ENABLED=true`
- `EMAIL_DELIVERABILITY_PROOF_STATUS=verified`

Do not set the two final enablement variables until the proof sequence below passes.

## Required provider and DNS proof

- [ ] SPF authorizes the configured sending provider
- [ ] DKIM passes for `clientsurgesystems.com`
- [ ] DMARC is present and aligned
- [ ] Resend shows the sending domain as verified
- [ ] The configured From address sends successfully to an internal test mailbox
- [ ] The configured Reply-To mailbox receives a direct reply
- [ ] The signed unsubscribe page opens from an external mailbox
- [ ] The unsubscribe POST marks the recipient and lead suppressed
- [ ] A second preview excludes the unsubscribed address
- [ ] Bounce and complaint webhooks reach `trackEmailEvent`
- [ ] A complaint immediately marks the lead do-not-contact

## Safe production records

The production read-only audit found zero `EmailCampaign` records, zero `EmailCampaignRecipient` records, and zero `NurtureCampaign` records. No campaign is currently running.

The legacy 30-day nurture runner is retired because its old copy contained unverified case studies and unsupported performance claims.

## Create the five reviewed drafts

After Base44 publishing is restored:

1. Run `seedLaunchEmailCampaigns` with:

```json
{ "dry_run": true }
```

2. Review all proposed creates/updates and duplicate IDs.
3. Apply only with:

```json
{
  "dry_run": false,
  "confirm_phrase": "SEED LAUNCH EMAIL CAMPAIGNS"
}
```

The function creates or updates draft records only. It never sends email and never overwrites an already-sent campaign.

## First batch eligibility

The first campaign must contain no more than 25 leads from one launch industry. Every recipient must satisfy all of the following:

- Canonical industry is Roofing, HVAC, Dental, Med Spa, or Plumbing
- `quality_review_status = verified_outbound_ready`
- Valid business email
- Not a test, demo, smoke-test, sample, or internal record
- Not a duplicate candidate or quarantined record
- Not `Needs Manual Review`
- Not do-not-contact, unsubscribed, bounced, replied, booked, lost, or won
- Not contacted during the previous 14 days
- Meets the selected website filter
- Unique email within the batch

## Send workflow

1. Open the reviewed industry draft.
2. Generate the backend preview.
3. Read the eligible count, suppression breakdown, readiness failures, and sample recipients.
4. Resolve every readiness failure.
5. Verify all sample businesses belong to the selected industry.
6. Type the exact phrase `SEND N`.
7. Send the batch.
8. Watch delivery, bounce, complaint, unsubscribe, reply, and booking activity.
9. Stop immediately if deliverability or targeting is wrong.

## Reply handling during controlled launch

Outbound messages use a monitored Reply-To mailbox. Until an authenticated inbound-email webhook is connected and proven, replies are handled manually:

- Positive reply → update the lead to `Replied` or `Interested`
- Request for later contact → `Follow Up Later`
- Meeting confirmed → `Audit Booked`
- Unsubscribe / stop request → do-not-contact immediately
- Negative reply → stop the sequence and record the outcome

No automated follow-up should run after a reply.

## First-touch copy source

The five canonical drafts live in:

- `src/lib/launchEmailCampaigns.js`
- `base44/functions/_shared/launchEmailCampaigns.js`

They intentionally contain no fabricated case studies, guaranteed outcomes, percentage improvements, or booking/revenue promises.

## Remaining blockers

- [ ] Restore GitHub Actions and Base44 publishing
- [ ] Publish the sender, webhook, unsubscribe endpoint, schema changes, and admin UI
- [ ] Configure the real postal address
- [ ] Configure and verify the public unsubscribe function base URL
- [ ] Run DNS and Resend proof
- [ ] Seed the five drafts
- [ ] Mark the first 25 leads `verified_outbound_ready`
- [ ] Preview and manually approve the first batch
- [ ] Connect authenticated inbound reply synchronization
