# ClientSurge Systems — Environment Variables Reference

All secrets are managed in **Dashboard → Settings → Environment Variables**.  
Never commit real secret values to source control.

---

## Required Secrets

### Stripe

| Variable | Description | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe secret key (`sk_live_` or `sk_test_`) | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe publishable key (`pk_live_` or `pk_test_`) | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) | [Stripe Dashboard → Webhooks → signing secret](https://dashboard.stripe.com/webhooks) |

### Twilio (SMS)

| Variable | Description | Where to get it |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (`ACxxxxxxxx`) | [Twilio Console](https://console.twilio.com/) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | [Twilio Console](https://console.twilio.com/) |
| `TWILIO_PHONE_NUMBER` | Twilio outbound phone number (E.164 format, e.g. `+16025551234`) | Twilio Console → Phone Numbers |
| `TWILIO_SMS_STATUS_CALLBACK_URL` | URL for Twilio delivery status webhooks | Function endpoint URL for `receiveTwilioSmsStatusCallback` |

### Resend (Email)

| Variable | Description | Where to get it |
|---|---|---|
| `RESEND_API_KEY` | Resend API key (`re_...`) | [Resend Dashboard → API Keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Verified sender email (e.g. `nolan@clientsurgesystems.com`) | Must be a verified domain in Resend |

### App Config

| Variable | Description | Example Value |
|---|---|---|
| `BASE44_APP_ID` | Auto-injected by Base44 platform. Do not set manually. | `69dc4a79...` |
| `APP_URL` | Public URL of the app | `https://clientsurgesystems.com` |
| `ADMIN_EMAIL` | Primary admin email for notifications | `nolan@clientsurgesystems.com` |
| `ADMIN_NOTIFICATION_EMAIL` | Email that receives admin lead/order alerts | `nolan@clientsurgesystems.com` |
| `ADMIN_NOTIFICATION_PHONE` | Phone for admin SMS alerts | `+16025843227` |
| `DEFAULT_BOOKING_LINK` | Default Calendly/booking link | `https://calendly.com/...` |
| `VITE_DEFAULT_BOOKING_LINK` | Public browser booking/scheduler link used by `/book` | `https://calendly.com/...` |
| `VITE_TAWK_TO_PROPERTY_ID` | Optional public Tawk.to property ID for live chat | Tawk.to dashboard |
| `VITE_TAWK_TO_WIDGET_ID` | Optional public Tawk.to widget ID for live chat | Tawk.to dashboard |
| `DEFAULT_BUSINESS_NAME` | Fallback business name in templates | `ClientSurge Systems` |
| `AUTOMATION_SHARED_SECRET` | Shared secret for internal automation calls | Random 32-char string |
| `GOOGLE_MAPS_API_KEY` | Google Maps/Places key used by `discoverLeads`; missing keys return a clear 503 instead of failing silently | Google Cloud Console |
| `INSTALL_PIPELINE_TIMEOUT_MS` | Optional installPipeline action timeout override; defaults to 30000ms | `30000` |
| `ELEVENLABS_API_KEY` | ElevenLabs voice API key (if used) | From ElevenLabs dashboard |

### Launch Verification Inputs

These are operator-only inputs used by `npm run launch:external-blockers`; they are not app runtime requirements unless noted above.

| Variable | Description | Example Value |
|---|---|---|
| `CLIENTSURGE_HEALTHCHECK_URL` | Deployed healthCheck function URL to probe and register in uptime monitoring | `https://.../healthCheck` |
| `STRIPE_LIVE_SECRET_KEY` | Live Stripe secret key used to verify live-mode readiness | `sk_live_...` |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | Live Stripe publishable key used to verify live-mode readiness | `pk_live_...` |
| `STRIPE_WEBHOOK_PROOF_URL` | Production Stripe webhook endpoint for signed proof tests | `https://clientsurgesystems.com/api/functions/stripeWebhookOrders` |
| `CLIENTSURGE_LIVE_PURCHASE_URL` | Production purchase URL for an approved real-card smoke test | `https://clientsurgesystems.com/store` |
| `CLIENTSURGE_LIVE_TEST_EMAIL` | Inbox used for approved real purchase verification | `qa@example.com` |
| `CLIENTSURGE_PAID_CUSTOMER_EMAIL` | Real paid customer email for billing portal smoke verification | `customer@example.com` |
| `CLIENTSURGE_LEAD_TEST_URL` | Local or staging lead endpoint for the 50-concurrent load-test harness | `https://staging.../submitLeadCapture` |
| `CLIENTSURGE_TWILIO_TEST_RECIPIENT` | Consented phone number for Twilio live SMS/voice tests | `+16025551234` |
| `CLIENTSURGE_TWILIO_SMS_WEBHOOK_URL` | Production inbound SMS webhook URL to configure in Twilio | `https://.../receiveInboundSms` |
| `CLIENTSURGE_TWILIO_VOICE_WEBHOOK_URL` | Production inbound voice webhook URL to configure in Twilio | `https://.../receiveInboundCall` |
| `CLIENTSURGE_RESEND_TEST_INBOX` | Inbox used for Resend delivery/bounce validation | `qa@example.com` |
| `CLIENTSURGE_SMS_VOLUME_TEST_AUTHORIZED` | Must be `true` before any high-volume SMS simulation | `true` |

---

## Switching to Live Mode

1. Replace `STRIPE_SECRET_KEY` with `sk_live_...`
2. Replace `STRIPE_PUBLISHABLE_KEY` with `pk_live_...`
3. Update `STRIPE_WEBHOOK_SECRET` with the live webhook's signing secret
4. Update the Stripe webhook endpoint URL to the production domain
5. Verify Twilio number is A2P 10DLC registered for US commercial SMS
6. Confirm `RESEND_FROM_EMAIL` domain is DKIM/DMARC authenticated

---

## Local Development

For local dev, create a `.env.local` file (never commit this):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=test@yourdomain.com
APP_URL=http://localhost:5173
ADMIN_EMAIL=you@youremail.com
GOOGLE_MAPS_API_KEY=
INSTALL_PIPELINE_TIMEOUT_MS=30000
VITE_TAWK_TO_PROPERTY_ID=
VITE_TAWK_TO_WIDGET_ID=
```
