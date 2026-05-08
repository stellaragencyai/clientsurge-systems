# ONBOARDING SOP — ClientSurge Systems
**Version:** 1.0 | **Last Updated:** May 8, 2026 | **Author:** Agent Smith

## Overview
This document covers the exact steps to manually onboard a new client from payment confirmed to system live.
Target time: **24–48 hours** from payment to live.

---

## Step 1 — Confirm Payment (Day 0)
1. Stripe fires `checkout.session.completed` → `stripeWebhookOrders` creates `Order` record
2. `sendOrderConfirmationEmail` sends confirmation to client's email
3. `sendClientWelcomeEmail` sends welcome email with portal link
4. Verify in admin: Order has `payment_status = "paid"` and `workflow_stage = "Configuring"`
5. Run `pipelineIntegrityCheck` if any of the above are missing

**Admin URL:** clientsurgesystems.com/admin → Orders

---

## Step 2 — Collect Client Credentials (Day 0–1)
Client receives link to `/setup/credentials?order_id=...`

They fill out:
- Business phone number (Twilio source)
- Booking platform + link (Calendly / Vagaro / etc.)
- Business name, industry, services offered
- Tone of voice preference

**Verify in admin:** `ClientOnboarding` record exists with `workflow_stage = "Ready for Install"`

---

## Step 3 — Configure Twilio (Day 1)
1. Go to Twilio Console → Phone Numbers → Buy a local Phoenix-area number
2. Set SMS webhook: `https://clientsurgesystems.com/api/functions/twilioInboundSMS`
3. Set Voice webhook: `https://clientsurgesystems.com/api/functions/twilioInboundCall`
4. Store the number in `ClientOnboarding.twilio_number`
5. Check `twilio_configured = true` in admin

**Note:** A2P 10DLC brand registration is required before sending bulk SMS — see TWILIO_A2P_SOP.md

---

## Step 4 — Build AI Messages (Day 1)
Using client's tone, business name, and services, customize:
- **Instant response SMS** — fires within 60s of new lead
- **Missed call text-back** — fires within 2 minutes of missed call
- **Day 1, 3, 7 follow-up** — SMS or email based on lead type
- **Reactivation message** — for cold leads 30+ days old

Update `messages_customized = true` in admin when done.

---

## Step 5 — Connect Lead Sources (Day 1)
Depending on what the client uses:
- **Website form** → webhook already wired if using ClientSurge site
- **Facebook Ads** → connect via Zapier or direct webhook
- **Google Ads** → connect call tracking through Twilio
- **Existing CRM** → manual CSV import or Zapier bridge

Update `lead_sources_connected = true` in admin when done.

---

## Step 6 — End-to-End Test (Day 1–2)
1. Submit a test lead via the website form
2. Verify instant response SMS fires within 60 seconds
3. Call the Twilio number and hang up → verify missed call text fires within 2 min
4. Check `CommunicationEvent` records exist in admin for both sends
5. Verify lead appears in admin leads table with correct status

Update `end_to_end_tested = true` in admin when done.

---

## Step 7 — Deliver Dashboard (Day 2)
1. Set `dashboard_delivered = true` in admin
2. Send client their portal link: `https://clientsurgesystems.com/client-portal`
3. Walk them through the portal on a 15-min call or Loom video

---

## Step 8 — Go Live (Day 2)
1. Set `went_live = true` in admin → triggers `sendWentLiveEmail` automatically
2. Set `onboarding_complete = true`
3. Telegram notification fires to you via `onboardingStepTelegramAlert`
4. Update Order `workflow_stage = "Active"`

**Client is live. 🚀**

---

## Troubleshooting
| Problem | Fix |
|---------|-----|
| Order not created after payment | Run `pipelineIntegrityCheck` with the order_id |
| Welcome email not sent | Check AgentLog for `sendClientWelcomeEmail` errors |
| SMS not firing | Verify Twilio credentials with "Test Connection" in AdminSettings |
| Lead not appearing in admin | Check `submitLeadCapture` logs — may be dedup or quality filter |
| Client can't access portal | Verify `client_id` is set on the Order record |

---

## Key URLs
- Admin: https://clientsurgesystems.com/admin
- Client portal: https://clientsurgesystems.com/client-portal
- Stripe dashboard: https://dashboard.stripe.com
- Twilio console: https://console.twilio.com
- Resend dashboard: https://resend.com/dashboard
