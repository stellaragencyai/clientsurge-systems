# ClientSurge Dual-Number Twilio Architecture

## Status

- Phase 1 audit: complete
- Phase 2 foundation: implemented on feature branch
- Production deployment: intentionally not performed from this branch

## Canonical number registry

| Number | Role | Automated SMS | Public use |
|---|---|---:|---:|
| `+18778123630` | Customer service, support, website leads, onboarding, transactional messages | Yes | Yes |
| `+16025843227` | Nolan sales, Arizona/local outreach, direct sales follow-up | Yes | Sales surfaces only |
| `+16025874608` | Nolan personal verification and manual calls | No | No |

The personal number must never be selected by an automated sender. The shared resolver now throws an error if code attempts to use it.

## Confirmed legacy architecture

The application previously enforced one global sender through `AdminSettings.twilio_from_number`. The canonical shared resolver hard-blocked the toll-free number and forced `+16025843227`. The standalone `sendSMS` function also contains its own direct settings lookup and toll-free rejection, proving the sender logic is duplicated.

## Relevant dependency inventory

### Canonical configuration and diagnostics

- `base44/functions/_shared/twilioSenderConfig/entry.ts`
- `base44/functions/_shared/adminSettings.js`
- `base44/functions/_shared/integrationHealth.js`
- `base44/functions/_shared/providerTests.js`
- `base44/entities/AdminSettings.jsonc`
- `src/components/admin/AdminSettingsPanel.jsx`
- `src/components/admin/SmsDiagnosticsPanel.jsx`

### Outbound SMS paths identified by repository search

- `base44/functions/sendSMS/entry.ts`
- `base44/functions/executeInstantSms/entry.ts`
- `base44/functions/sendWebsiteLeadResponse/main.ts`
- `base44/functions/sendWebsiteLeadResponse/entry.ts`
- `base44/functions/processWebsiteLeadInitialResponse/entry.ts`
- `base44/functions/processWebsiteLeadFollowUps/main.ts`
- `base44/functions/processWebsiteLeadFollowUps/entry.ts`
- `base44/functions/processAutomationJobs/main.ts`
- `base44/functions/processAutomationJobs/entry.ts`
- `base44/functions/triggerFollowUpSequence/main.ts`
- `base44/functions/triggerFollowUpSequence/entry.ts`
- `base44/functions/scheduleFollowUpSMS/main.ts`
- `base44/functions/scheduleFollowUpSMS/entry.ts`
- `base44/functions/processDripCampaigns/main.ts`
- `base44/functions/processDripCampaigns/entry.ts`
- `base44/functions/processMissedCallFollowUps/entry.ts`
- `base44/functions/processVoiceCallFollowUps/main.ts`
- `base44/functions/processVoiceCallFollowUps/entry.ts`
- `base44/functions/sendReviewRequest/main.ts`
- `base44/functions/bulkLeadAction/entry.ts`

### Inbound, voice, proof, and health paths identified

- `receiveTwilioInboundSms`
- `receiveTwilioMissedCallWebhook`
- `receiveTwilioSmsStatusCallback`
- `receiveInboundVoiceCall`
- `base44/functions/testVoiceWebhookHealth/entry.ts`
- `base44/functions/runTwilioProofCheck/entry.ts`
- `base44/functions/testMessagingProviders/entry.ts`
- `base44/functions/verifySmsNormalization/entry.ts`
- `base44/functions/getTwilioGrowthEngineAudit/entry.ts`

## Phase 1 findings

1. Sender selection was fragmented. The shared resolver existed, but some senders bypassed it and read `AdminSettings` directly.
2. The toll-free number was hard-blocked in at least two locations.
3. The personal number appeared in nurture templates and was not formally classified.
4. Existing entities already store `provider_from_number`, making conversation affinity feasible.
5. Compliance protection exists in `sendSMS`, including E.164 normalization, consent checks, persisted STOP checks, tenant scoping, circuit breaking, retry logic, delivery status callbacks, and event logging.
6. The migration must preserve those protections while centralizing sender selection.
7. The application needs an explicit number registry instead of overloading one global field.

## Phase 2 changes implemented

### Shared resolver

`base44/functions/_shared/twilioSenderConfig/entry.ts` now:

- Routes customer-service purposes to `+18778123630`.
- Routes sales purposes to `+16025843227`.
- Preserves an existing conversation number before applying purpose defaults.
- Supports an explicit client-assigned number.
- Rejects `+16025874608` for automated sending.
- Supports purpose-specific AdminSettings fields when they are added to deployed data.
- Supports `TWILIO_CUSTOMER_SERVICE_NUMBER` and `TWILIO_SALES_NUMBER` environment variables.
- Retains backward compatibility for callers that still invoke `resolveTwilioSender(base44)` or pass a legacy environment variable name.
- Classifies inbound `To` numbers as `customer_service`, `sales`, `personal_verification`, or `unmatched`.

### Number registry entity

`base44/entities/TwilioPhoneNumber.jsonc` adds a canonical administrative registry with:

- Number and purpose
- Twilio PN SID and optional Messaging Service SID
- SMS and voice capability
- Automated-sending permission
- Approval status
- Webhook URLs
- Public/default flags
- Administrative notes

No credentials are stored in this entity.

### Automated tests

`base44/functions/_shared/twilioSenderConfig/entry.test.ts` covers:

- E.164 normalization
- Inbound number classification
- Personal-number rejection
- Customer-service routing
- Sales routing
- Conversation affinity

## Required call-site contract

Every outbound SMS path must migrate to:

```ts
const fromNumber = await resolveTwilioSender(base44, {
  purpose: messagePurpose,
  conversationFromNumber: existingThread?.provider_from_number,
  clientAssignedNumber: clientConfig?.twilio_number,
});
```

Purpose examples:

- `customer_service`
- `website_lead`
- `instant_lead_response`
- `onboarding`
- `transactional`
- `booking_reminder`
- `review_request`
- `sales_outreach`
- `local_outreach`
- `nolan_followup`

## Inbound routing contract

Inbound SMS and voice handlers must route on Twilio's `To` field:

```ts
const route = classifyInboundNumber(payload.To);
```

- `customer_service`: support and official customer workflows
- `sales`: Nolan sales workflow
- `personal_verification`: store evidence only; do not launch automation
- `unmatched`: store as unmatched, alert admin, and do not auto-reply

## Conversation affinity

The last known outbound or inbound `provider_from_number` associated with the conversation must be passed as `conversationFromNumber`. That value takes precedence over purpose defaults, preventing a thread from switching numbers mid-conversation.

## Compliance rules

- A STOP or equivalent opt-out blocks both automated numbers unless a future legal/compliance design explicitly scopes consent per sender.
- The personal number is never an automated fallback.
- No unknown number may silently fall back to the sales number.
- Tenant resolution must occur before any automated reply.
- All successful and failed sends must continue recording `provider_from_number`.
- Twilio Account SID, Auth Token, and API keys remain in secrets only.

## Deployment configuration

Set these secrets or corresponding approved AdminSettings values before activating the new defaults:

```text
TWILIO_CUSTOMER_SERVICE_NUMBER=+18778123630
TWILIO_SALES_NUMBER=+16025843227
```

Keep the existing legacy `TWILIO_FROM_NUMBER` during the migration window for backward compatibility.

## Rollout sequence

1. Merge after review and passing checks.
2. Deploy the new entity and shared resolver.
3. Seed three registry records with the roles above.
4. Add purpose-specific AdminSettings fields or configure environment variables.
5. Migrate outbound call sites to the shared resolver in small batches.
6. Update inbound handlers to classify the Twilio `To` number.
7. Run tests for 1-877 inbound/outbound, 602 inbound/outbound, STOP, START, HELP, unmatched inbound, missed-call text-back, status callbacks, and conversation affinity.
8. Make the toll-free number public only after production proof passes.

## Rollback

- Revert the feature commits or PR.
- Restore `AdminSettings.twilio_from_number` to `+16025843227`.
- Keep the 1-877 number configured in Twilio but remove it from public surfaces until repaired.
- Do not delete communication logs or registry records; mark records inactive instead.

## Remaining production gate

Code completion does not prove Twilio Console configuration. Before public launch, verify both Phone Number SIDs, webhook assignments, approval state, STOP/START/HELP behavior, and delivery callbacks directly in Twilio. GitHub cannot prove external console state by itself.
