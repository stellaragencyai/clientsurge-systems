# ClientSurge 25-Issue Command Dashboard

Last updated: 2026-06-28

This is the clean operating tracker for the 25 launch issues from the audit. Base44 `ProjectTask` has hundreds of duplicate or stale records, so this file and the Google Sheet are the command layer for this chat.

Google Sheet: https://docs.google.com/spreadsheets/d/1dRDYmvJKgXffYW8j_fsDVhVPayr8nLpxAS3qneG_9t8/edit

Status values: `Not Started`, `In Progress`, `Fixed in PR`, `Needs Verification`, `Blocked`, `Done`.

| ID | Issue | Priority | Status | Next Action |
|---:|---|---|---|---|
| 1 | Paid Order does not reliably create ClientProject | P0 Critical | Fixed in PR | Sync branch, test real checkout, confirm Order has client_project_id and install records. |
| 2 | No single clean post-payment orchestrator | P0 Critical | In Progress | Consolidate payment flow after PR #1102 and disable redundant handlers. |
| 3 | Real full purchase test not completed | P0 Critical | Needs Verification | Run real checkout: payment -> Order -> ClientProject -> Install OS -> checklist -> email/SMS. |
| 4 | Pricing source-of-truth conflict | P0 Critical | Not Started | Audit salesCatalog, Pricing, Store, Stripe metadata, and emails; enforce one config. |
| 5 | Checkout backend path must be proven | P0 Critical | Needs Verification | Verify every CTA uses backend checkout and no stale/test links remain. |
| 6 | Credentials intake must save activation config | P0 Critical | In Progress | Implement/verify saveClientCredentials writes Order.install_configuration correctly. |
| 7 | Tier/service activation gate missing or unproven | P0 Critical | Not Started | Enforce TIER_SERVICE_MAP and reject out-of-tier services before configureService. |
| 8 | Activation not tied to workflow changes | P0 Critical | Not Started | Create/verify workflow automation for credentials_complete, website_approved, activated. |
| 9 | Portal automation data may be sample/mock | P0 Critical | Not Started | Replace AutomationsOverview sample arrays with real checklist/status reads. |
| 10 | Client analytics may be hardcoded or unverified | P1 High | In Progress | Audit getClientAnalytics and portal metrics; no fake leads/revenue/bookings. |
| 11 | Install progress must be same truth in admin and portal | P1 High | Not Started | Build shared install progress from ClientInstallationOS + checklist steps. |
| 12 | TCPA/SMS consent not consistently finished | P0 Critical | In Progress | Patch submitLeadCapture consent_given_at, consent_ip, E.164 normalization, checkbox. |
| 13 | All outbound SMS must pass compliance layer | P0 Critical | In Progress | Force all SMS sends through smsComplianceFilter/sendSMS wrapper. |
| 14 | Quiet hours and frequency caps missing | P1 High | Not Started | Implement quiet hours queue and max 3 messages per lead per 24h. |
| 15 | Admin/security exposed-function audit incomplete | P1 High | Not Started | Audit authGuards, sendTestLead, legacy imports, RLS, and exposed functions. |
| 16 | AuditLog entity/actions not enforced | P1 High | Not Started | Create AuditLog helper and wire lead/order/admin actions to it. |
| 17 | PII scrubbing missing in logs | P1 High | Not Started | Build maskPII helper and require it for AgentLog/CommunicationEvent metadata. |
| 18 | Resend domain authentication not confirmed | P0 Critical | Needs Verification | Verify SPF, DKIM, DMARC in Resend/DNS and send deliverability test. |
| 19 | Uptime/error monitoring incomplete | P1 High | Not Started | Set UptimeRobot/BetterStack plus backend 5xx email/Telegram alerts. |
| 20 | GA4/conversion tracking missing | P1 High | Not Started | Add GA4 ID and events: lead_submitted, checkout_clicked, purchase_completed, demo_booked. |
| 21 | ProjectTask database noisy/stale | P1 High | In Progress | Use this dashboard as command source; optionally add CleanLaunchIssue entity later. |
| 22 | Public metadata leaks generic/Base44-like copy | P1 High | Needs Verification | Audit homepage title/meta/OG/schema and remove template/generic copy. |
| 23 | Testimonials/social proof/claims credibility issues | P1 High | Not Started | Replace fake-looking testimonials and change wording to “Up to 6 automations.” |
| 24 | Mobile/accessibility/final QA incomplete | P1 High | Not Started | Run mobile breakpoints, Lighthouse, axe/WAVE, CTA tests and patch failures. |
| 25 | Shiny AI expansion must stay frozen until core works | P1 High | In Progress | Do not build new AI perks until issues 1-8 and 12-13 are verified. |

## Current active work

PR #1102 handles the first core failure class: payment webhooks can no longer silently accept paid orders that fail to provision a ClientProject.

## Immediate execution order

1. Merge/test PR #1102 after syncing branch with main.
2. Verify full purchase path.
3. Patch credentials save + tier activation gate.
4. Patch public-form consent and outbound SMS compliance.
5. Remove portal mock data and replace with truth-backed status.
