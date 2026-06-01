# ClientSurge Live Provider Approval Packet

Prepared: 2026-05-21

Purpose: define the smallest controlled approval scope needed to move ClientSurge from locally verified launch readiness into provider proof without accidental live customer impact.

## Current Verdict

Do not run live proof yet.

The safe next step is to approve only the staged/test-mode setup and read-only verification items first. Live SMS, live email, live payment, Base44 production publish, DNS, credentials, and provider routing changes remain separate approval gates.

## Evidence Already Verified

- Domain 07 frontend checklist is complete locally at 35/35 tracked items.
- Local tests/lint/build passed after the final Domain 07 changes and Stripe staging override hardening:
  - `npm run test:node` passed 399/399.
  - `npm run test:deno` passed 21/21.
  - `npm run lint` passed.
  - `npm run build` passed.
  - `git diff --check` passed.
- The production launch preflight identifies operational blockers, not generic frontend blockers.
- Stripe live package IDs are locally aligned in app checkout source.
- Local source confirms `stripePaymentWebhook` delegates to the canonical `stripeWebhookOrders` handler.
- Stripe test mode now has package products, setup/monthly prices, and one enabled package-proof webhook endpoint.
- Production Base44 backend freshness is still blocked by the current app type/deploy workflow uncertainty.

## Approval Gate A: Stripe Test-Mode Catalog Setup

Status: approved by Nolan and partially completed on 2026-05-21; app-path proof is still waiting on staging/test Base44 environment configuration.

Scope:

- Create or mirror three Stripe test-mode products. Completed:
  - ClientSurge Systems Starter
  - ClientSurge Systems Growth
  - ClientSurge Systems Elite
- Create matching setup and monthly test-mode prices. Completed.
- Configure a test-mode webhook endpoint or use Stripe CLI forwarding for one controlled test checkout. Test endpoint exists.
- Run a Stripe test-mode checkout/webhook proof after the staging/test Base44 environment is configured with the test Stripe key, test webhook secret, and `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON`.
- Record product IDs, price IDs, webhook endpoint/forwarding path, event IDs, and app-side Order/install-pipeline result.

Current Stripe test-mode package resources:

| Package | Product | Setup price | Monthly price |
|---|---|---|---|
| Starter | `prod_UYhtwNW8eVqQdI` | `price_1TZaTKBVGjsISdG0FYZuolxJ` | `price_1TZaTLBVGjsISdG0dj7Y62fu` |
| Growth | `prod_UYhtW1TiATAaSS` | `price_1TZaTLBVGjsISdG0OLeOUdAH` | `price_1TZaTMBVGjsISdG0FlG2VVWG` |
| Elite | `prod_UYhtICcoNgWC9d` | `price_1TZaTMBVGjsISdG0TtdrSHRP` | `price_1TZaTNBVGjsISdG0t7w5I7gM` |

Current Stripe test-mode webhook endpoint:

- `we_1TZELjBVGjsISdG0oOblz0gd`
- `https://grinning-apex-flow-growth.base44.app/api/functions/stripePaymentWebhook`
- Enabled events include `checkout.session.completed`, invoice payment success/failure, subscription updates/deletes, and `payment_intent.payment_failed`.

App-path test checkout requirement:

- Set `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` in the staging/test Base44 environment so `createCheckoutSession` uses the test-mode package IDs above while production keeps the default live IDs.

Explicitly excluded:

- No live charges.
- No live Stripe product/price edits.
- No live webhook endpoint edits.
- No refund or real-card activity.

Success proof:

- Test checkout session is created for each package path or at least the approved first package.
- `checkout.session.completed` reaches the intended webhook handler.
- Expected Order and install-pipeline records are created or updated in the approved test workspace.
- No production customer records are changed.

## Approval Gate B: Base44 Production Deploy Path Decision

Recommended approval: decision only, then a separate publish approval.

Decision needed:

1. Keep `clientsurgesystems.com` on the current Base44 app-editor production app and identify the supported UI/backend publish path.
2. Or move backend proof to the CLI-compatible Backend Platform app after confirming domain and routing implications.

Known app IDs:

- Current production/app-editor ID: `69dc4a79656fdba136d413d3`.
- Prior CLI-linked Backend Platform app ID: `69f4f3973cbf2c33a9653cae`.

Explicitly excluded until later approval:

- No production publish.
- No domain routing changes.
- No Base44 credential or permission changes.
- No production record mutation beyond read-only inspection.

Success proof:

- The exact deploy/publish workflow is documented.
- `installPipeline` backend freshness can be proven after publish.
- `base44 functions list` auditability issue is either fixed or documented with a supported workaround.

## Approval Gate C: Resend Live Transactional Proof

Recommended approval: only after Base44 deploy path is confirmed and test/staging proof passes.

Scope:

- Verify production secrets exist by name with values hidden:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `RESEND_WEBHOOK_SECRET`
- Confirm Resend webhook target for deployed `receiveResendWebhook`.
- Send one approved admin notification email to an internal/test recipient.
- Send one approved customer confirmation email to an internal/test recipient.
- Verify Resend logs and `CommunicationEvent` rows.

Explicitly excluded:

- No marketing campaign sends.
- No broad resend/retry job.
- No customer list import.
- No DNS/domain changes unless separately approved.

Success proof:

- Resend accepts both sends.
- Delivery or failure callback is captured.
- `CommunicationEvent` reflects the send and callback status.

## Approval Gate D: Twilio Live SMS/Missed-Call Proof

Recommended approval: only after choosing the automation number.

Decision needed:

- Keep `+16025843227` on ElevenLabs for demo/receptionist flow and use `+18778123630` or a new number for Base44 automation.
- Or move `+16025843227` to Base44 automation, accepting that it changes the current ElevenLabs routing.

Scope after number decision:

- Verify production secrets exist by name with values hidden:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `TWILIO_SMS_STATUS_CALLBACK_URL`
  - `TWILIO_WEBHOOK_KEY`
- Configure the chosen number's voice, inbound SMS, and status callback URLs only if approved.
- Run one approved live SMS test from/to Nolan-approved numbers.
- Run one approved missed-call test.
- Verify duplicate `CallSid` suppression and `CommunicationEvent` rows.

Explicitly excluded:

- No customer phone numbers.
- No bulk sends.
- No campaign messaging.
- No changes to the ElevenLabs demo number unless Nolan explicitly approves that number move.

Success proof:

- SMS is sent and status callback is captured.
- Missed-call webhook creates exactly one recovery response.
- Duplicate replay does not send a second message.
- `CommunicationEvent` rows are attached as proof.

## Approval Gate E: Controlled Live Payment Proof

Recommended approval: last, after Stripe test-mode proof and Base44 backend freshness proof.

Required approval details:

- Package to purchase.
- Exact expected amount.
- Card/payment method owner.
- Refund or no-refund plan.
- Test customer email and phone.
- Time window.

Explicitly excluded:

- No live payment proof before test-mode checkout/webhook proof.
- No real customer order.
- No ad traffic or public launch announcement.

Success proof:

- Live checkout completes.
- Stripe webhook updates Order and install pipeline.
- Transactional email/SMS behavior follows the approved test contact path.
- Refund/no-refund action follows Nolan's approval.

## Recommended Next Approval

Approve Gate A only:

```text
Approved: Stripe test-mode catalog setup and test-mode checkout/webhook proof only.
No live charges, no live webhook edits, no production publish, no Twilio/Resend sends.
```

After Gate A passes, decide Gate B before any production proof.
