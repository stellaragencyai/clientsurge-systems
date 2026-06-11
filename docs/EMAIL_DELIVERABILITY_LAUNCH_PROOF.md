# Email Deliverability Launch Proof

## Overall Status

PARTIAL. Repo-side safety gates, local proof tooling, and documentation exist. Final launch readiness still requires provider dashboard, DNS, Base44 production env, and safe live test proof.

## Required Environment Variables

| Variable | Classification | Notes |
|---|---|---|
| `RESEND_API_KEY` | REQUIRED_FOR_TRANSACTIONAL_EMAIL / REQUIRED_FOR_CAMPAIGNS | Secret in Base44 production env. Never print or commit. |
| `RESEND_FROM_LEADS` | REQUIRED_FOR_TRANSACTIONAL_EMAIL / REQUIRED_FOR_CAMPAIGNS | Verified sender for lead/audit confirmations. |
| `RESEND_REPLY_TO_LEADS` | REQUIRED_FOR_TRANSACTIONAL_EMAIL / REQUIRED_FOR_CAMPAIGNS | Monitored reply-to for customer replies. |
| `ADMIN_NOTIFICATION_EMAIL` | REQUIRED_FOR_TRANSACTIONAL_EMAIL | Admin/internal alert recipient. |
| `SUPPORT_EMAIL` | REQUIRED_FOR_TRANSACTIONAL_EMAIL | Public support fallback and unsubscribe mailbox fallback. |
| `SYSTEM_EMAIL` | REQUIRED_FOR_TRANSACTIONAL_EMAIL | System/admin alert sender. |
| `BILLING_EMAIL` | REQUIRED_FOR_TRANSACTIONAL_EMAIL | Billing/order sender map. |
| `ONBOARDING_EMAIL` | REQUIRED_FOR_TRANSACTIONAL_EMAIL | Onboarding sender map. |
| `TEST_EMAIL_RECIPIENT` | TEST_ONLY | Single approved safe-test inbox. |
| `EMAIL_TEST_MODE` | TEST_ONLY | Must be `true` for `npm run email:safe-test`; otherwise false. |
| `EMAIL_CAMPAIGN_ENABLED` | REQUIRED_FOR_CAMPAIGNS | Must remain `false` until proof is complete. |
| `EMAIL_DELIVERABILITY_PROOF_STATUS` | REQUIRED_FOR_CAMPAIGNS / OWNER_CONFIRMATION_REQUIRED | Non-test direct sends and campaign sends require `verified`, `passed`, or `production_verified`. |

## Sender Address Map

| Role | Env var | Current safe default |
|---|---|---|
| Leads / confirmations | `RESEND_FROM_LEADS` | `support@clientsurgesystems.com` |
| Lead reply-to | `RESEND_REPLY_TO_LEADS` | `nolan@clientsurgesystems.com` |
| Support | `SUPPORT_EMAIL` | `support@clientsurgesystems.com` |
| System alerts | `SYSTEM_EMAIL` | `system@clientsurgesystems.com` |
| Billing | `BILLING_EMAIL` | `billing@clientsurgesystems.com` |
| Onboarding | `ONBOARDING_EMAIL` | `onboarding@clientsurgesystems.com` |
| Admin alerts | `ADMIN_NOTIFICATION_EMAIL` | `system@clientsurgesystems.com` |

OWNER_CONFIRMATION_REQUIRED for final mailbox/alias existence and monitored reply ownership.

## DNS Records Required

- Google Workspace MX for `clientsurgesystems.com`.
- One SPF TXT record that covers Google Workspace and Resend-approved sending.
- DMARC TXT at `_dmarc.clientsurgesystems.com`.
- Google Workspace DKIM TXT/CNAME selector generated in Google Admin.
- Resend DKIM records exactly as shown in Resend dashboard.
- Resend verification TXT/CNAME records, including `_resend` only if Resend dashboard requires it.

## Google Workspace Checks

- PROVIDER_DASHBOARD_REQUIRED: Gmail active for the domain.
- PROVIDER_DASHBOARD_REQUIRED: DKIM generated and enabled.
- OWNER_CONFIRMATION_REQUIRED: `support@`, `system@`, `billing@`, `onboarding@`, and `nolan@` exist as users, groups, or aliases.

## Resend Verification Checks

- PROVIDER_DASHBOARD_REQUIRED: domain added and verified.
- PROVIDER_DASHBOARD_REQUIRED: DKIM verified.
- PROVIDER_DASHBOARD_REQUIRED: approved from addresses match the sender map.
- PRODUCTION_SAFE_TEST_REQUIRED: safe `[TEST]` send IDs verified in Resend logs and recipient inbox.

## Cloudflare DNS Checklist

- Confirm MX points to Google Workspace.
- Confirm SPF has one TXT record only.
- Confirm Google DKIM selector record from Google Admin.
- Confirm DMARC policy and report address.
- Confirm Resend DKIM and verification records from Resend dashboard.
- Do not change DNS without explicit owner approval.

## Base44 Production Env Checklist

- `RESEND_API_KEY` exists.
- Sender/reply-to/admin/support/system/billing/onboarding env vars exist.
- `EMAIL_CAMPAIGN_ENABLED=false` until outreach proof is complete.
- `EMAIL_DELIVERABILITY_PROOF_STATUS=verified` only after DNS/provider/test proof is complete.
- `TEST_EMAIL_RECIPIENT` is configured only for a controlled safe test window.

## Safe Email Test Command

```powershell
$env:EMAIL_TEST_MODE='true'
npm run email:safe-test
```

The harness refuses missing `TEST_EMAIL_RECIPIENT`, requires `[TEST]` subjects, uses fake `.test` lead data, and writes `artifacts/email/email-test-proof.json`.

## DNS Scanner Command

```powershell
npm run email:dns-readiness
```

The scanner is read-only and writes `artifacts/email/dns-email-readiness.json`.

## Provider Proof Checklist

- PROVIDER_DASHBOARD_REQUIRED: Resend domain and sender verification screenshots or dashboard confirmation.
- PROVIDER_DASHBOARD_REQUIRED: Resend message IDs from `email-test-proof.json` show delivered.
- PROVIDER_DASHBOARD_REQUIRED: Google Workspace mailbox/alias proof.
- PROVIDER_DASHBOARD_REQUIRED: Base44 production env proof without exposing secret values.

## Transactional Email Readiness

Repo-side transactional paths fail safely on missing provider config or catch provider errors. Website lead confirmation copy uses automation audit language for key industry variants. Production send readiness still needs provider proof.

## Campaign Email Readiness

Campaign code excludes suppressed leads, recently contacted leads, duplicates, and missing-email/missing-website leads. It adds List-Unsubscribe headers and footer text. Campaign sends now fail closed unless `EMAIL_CAMPAIGN_ENABLED=true` and `EMAIL_DELIVERABILITY_PROOF_STATUS` is verified.

## Compliance / Unsubscribe / Suppression

Campaigns include List-Unsubscribe headers and unsubscribe footer text. Suppression checks include do-not-contact, unsubscribed, bounced, hard-bounced, and terminal CRM statuses. Bounce and complaint webhooks update communication/campaign state when deployed.

## What Blocks Launch

- PROVIDER_DASHBOARD_REQUIRED: Resend domain/sender verification.
- PROVIDER_DASHBOARD_REQUIRED: Google Workspace DKIM and mailbox/alias proof.
- PRODUCTION_SAFE_TEST_REQUIRED: controlled test email delivery proof.
- PROVIDER_DASHBOARD_REQUIRED: Base44 production env confirmation.

## Manual Owner Tasks Still Required

- Confirm final sender map and mailbox ownership.
- Verify DNS in Cloudflare and provider dashboards.
- Run one approved safe live email test to `TEST_EMAIL_RECIPIENT`.
- Confirm proof artifact IDs in Resend dashboard.
- Set `EMAIL_DELIVERABILITY_PROOF_STATUS=verified` only after evidence is complete.

## Production Proof Still Required

PRODUCTION_SAFE_TEST_REQUIRED before claiming PASS. Outreach remains blocked until the campaign gate is deliberately opened after proof.
