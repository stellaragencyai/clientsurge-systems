# CRM / Leads Command System

## CRM Source Of Truth

The source of truth for the Launch Command Center CRM health module is the Base44 `Leads` entity. The module reads `Leads` only and does not write lead records, campaign recipients, communication events, or dedupe updates.

Related entities:

- `EmailCampaign`
- `EmailCampaignRecipient`
- `CommunicationEvent`
- `Client`
- `Order`
- `OnboardingClient`

## Usable Lead Definition

A usable lead must:

- Have an email address.
- Not be marked `do_not_contact`.
- Not be `email_unsubscribed`.
- Not be `email_bounced`.
- Not be in a terminal `Won`, `Lost`, or `Closed` status/stage.
- Have either `industry`, `business_type`, `crm_tag`, or `industry_tags`.

Website presence is tracked separately because it improves personalization and industry readiness, but missing website is reported as a fix-needed field rather than hidden from the dry-run preview by default.

## Suppression Rules

The CRM Health module treats a lead as suppressed when any of the following are true:

- `do_not_contact`, `dnc`, or `outreach_status = do_not_contact`.
- `email_unsubscribed` or `unsubscribed`.
- `email_bounced`, `bounced`, or `hard_bounced`.
- `status` or `crm_stage` is `Won`, `Lost`, or `Closed`.

Suppressed leads are excluded from the first-campaign dry-run preview.

## First 25-Lead Dry-Run Process

The admin `CRM Health` tab supports dry-run previews for:

- Industry: `roofing`, `hvac`, `dental`, `med_spa`, `plumbing`, or `other`.
- Max count: `25` or `50`.
- Exclude suppressed leads.
- Exclude missing-email leads.
- Exclude recently contacted leads when `last_contacted_at` or `last_contacted_date` exists.
- Exclude duplicate email recipients after the first eligible lead.

The preview returns counts only plus a small masked sample. It does not send emails, create `EmailCampaignRecipient` records, update `Leads`, update outreach status, or create `CommunicationEvent` records.

## Data Privacy And Masking Rules

The dashboard and preview must not expose private lead lists by default.

Samples use:

- Email: `n***@domain.com`
- Phone: `***-***-1234`

The existing `sendEmailCampaign` preview path also returns masked `email_masked` and `phone_masked` fields for sample recipients.

## Launch Command Center Integration

Prepared category:

- `F CRM / Leads`

Prepared LaunchTask mapping:

- Verify live Leads schema
- Confirm CRM source of truth
- Calculate usable lead count
- Backfill industry and crm_tag
- Backfill source_history
- Identify missing email/phone/website
- Identify duplicate email groups
- Identify duplicate phone groups
- Review high-confidence duplicates
- Prepare 25-lead preview
- Confirm suppression rules
- Confirm campaign attribution fields

Prepared LaunchProof mapping:

- CRM schema scan
- Lead count scan
- Duplicate dry-run
- Suppression dry-run
- First campaign dry-run preview

`LaunchCategory`, `LaunchTask`, and `LaunchProof` entities are not present in this checkout. Until Project 1 provides those entities or an approved local seed pattern, CRM Health keeps this integration documentation-only and does not create live task/proof records.

## Before Real Outreach Unlocks

Before any campaign can be sent:

- Confirm live `Leads` schema matches the local `Leads` entity.
- Review CRM Health summary cards and fix high-risk data issues.
- Review duplicate email and phone groups manually.
- Backfill missing industry/CRM tags for target industries.
- Backfill source history where needed.
- Confirm suppression counts and reasons.
- Confirm deliverability proof gates and owner-approved campaign sender settings.
- Run the first 25-lead dry-run preview and retain the proof.
- Obtain explicit owner approval for live campaign send.

## Proof Required Before Campaigns Unlock

Minimum proof packet:

- CRM schema scan.
- Lead count scan.
- Duplicate dry-run output with masked samples only.
- Suppression dry-run output.
- First 25-lead dry-run preview.
- Owner approval that the previewed industry and send size are authorized.

Campaign sending remains blocked by existing deliverability gates and is not unlocked by this module alone.
