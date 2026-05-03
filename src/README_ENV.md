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
| `DEFAULT_BUSINESS_NAME` | Fallback business name in templates | `ClientSurge Systems` |
| `AUTOMATION_SHARED_SECRET` | Shared secret for internal automation calls | Random 32-char string |
| `ELEVENLABS_API_KEY` | ElevenLabs voice API key (if used) | From ElevenLabs dashboard |

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
``