# Codex Prompt — Critical Tasks Batch | Tasks #468, #470, #471, #472, #474, #478, #517, #301
## Priority: CRITICAL — All are launch blockers
## Date: May 4, 2026 | Assigned: Surge Dev

---

## PHASE 0 — SCAN FIRST (read before writing anything)

Before touching any file, read and report:
1. `src/pages/Pricing.jsx` — find ALL Stripe payment links. List each one and whether it starts with `buy.stripe.com/test_` or `buy.stripe.com/` (live)
2. `src/lib/salesCatalog.js` — list every price value found (monthly + setup). Report any that are NOT: Starter $497/$797, Growth $997/$1297, Elite $1997/$2497, or valid à la carte prices
3. `base44/functions/stripePaymentWebhook/entry.ts` — find the `checkout.session.completed` handler. Does it check `stripe_event_id` for idempotency before processing? Does it verify the webhook signature?
4. `base44/functions/stripeWebhookOrders/entry.ts` — same questions: signature check? idempotency check?
5. `base44/functions/createCheckoutSession/entry.ts` — does it check if `STRIPE_SECRET_KEY` starts with `sk_live_`?
6. Any file in `src/` — search for any hardcoded `sk_live_` secret key string. Report exact file + line if found.

Report all findings before making any changes.

---

## TASK #301 — Replace test Stripe links with live links

**File:** `src/pages/Pricing.jsx` (and any other file with `buy.stripe.com/test_`)

Replace ALL test payment links with the live ones:

| Tier | Live Link |
|------|-----------|
| Starter ($497/mo + $797 setup) | https://buy.stripe.com/14AcN40P5eKu8qz3N5bII00 |
| Growth ($997/mo + $1,297 setup) | https://buy.stripe.com/eVq6oGbtJeKu6ir6ZhbII01 |
| Elite ($1,997/mo + $2,497 setup) | https://buy.stripe.com/14A4gyeFVdGq0Y7fvNbII02 |

Also check `src/components/store/` and `src/components/landing/Pricing.jsx` for any test links.

After replacing, do a global search for `buy.stripe.com/test_` — if any remain, replace them or flag them.

---

## TASK #470 — salesCatalog.js price audit

**File:** `src/lib/salesCatalog.js`

Enforce these as the ONLY canonical prices in the entire file:

| Tier | Monthly | Setup |
|------|---------|-------|
| Starter | $497 | $797 |
| Growth | $997 | $1,297 |
| Elite | $1,997 | $2,497 |

À la carte prices (these are also canonical — do not change):
- Instant Lead Response: $197/mo
- Missed Call Text-Back: $147/mo
- Appointment Booking AI: $297/mo
- Follow-Up Sequences: $247/mo
- Review Request Automation: $197/mo
- AI Receptionist: $497/mo

Rules:
- Remove or fix ANY price that doesn't match the above (especially $97, $297 for tiers, $1997 without comma)
- Add a comment at the top: `// CANONICAL PRICES — DO NOT EDIT WITHOUT NOLAN APPROVAL`
- After fixing salesCatalog.js, search all JSX files for hardcoded price strings that contradict these values. Fix or flag each one.

---

## TASK #471 — Live key enforcement

**Files:** `base44/functions/createCheckoutSession/entry.ts`, `base44/functions/stripePaymentWebhook/entry.ts`

In BOTH files, add this check at the top (after the env var read):

```ts
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
if (!stripeKey.startsWith("sk_live_")) {
  console.error("[STRIPE] FATAL: Not running with live key. Current prefix:", stripeKey.slice(0, 10));
  // On production domain, throw. On test env, warn only.
  const isProduction = Deno.env.get("ENVIRONMENT") === "production";
  if (isProduction) {
    return Response.json({ error: "Stripe is not configured for production" }, { status: 500 });
  }
}
```

---

## TASK #468 + #478 — Stripe webhook security + idempotency

**Files:** `base44/functions/stripePaymentWebhook/entry.ts`, `base44/functions/stripeWebhookOrders/entry.ts`

Apply BOTH fixes to BOTH files:

### Fix 1: Webhook signature verification (#468)
```ts
// At the top of the handler, before parsing the body:
const sig = req.headers.get("stripe-signature");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

if (!sig || !webhookSecret) {
  console.error("[STRIPE] Missing signature or webhook secret");
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

let event;
try {
  const rawBody = await req.text();
  event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
} catch (err) {
  console.error("[STRIPE] Webhook signature verification failed:", err.message);
  return Response.json({ error: "Invalid signature" }, { status: 400 });
}
```

### Fix 2: Idempotency check (#478)
```ts
// After parsing the event, before any processing:
const stripeEventId = event.id;

// Check if we already processed this event
const existingOrders = await base44.asServiceRole.entities.Order.filter({ stripe_event_id: stripeEventId });
if (existingOrders && existingOrders.length > 0) {
  console.log("[STRIPE] Duplicate event, skipping:", stripeEventId);
  return Response.json({ received: true, duplicate: true }, { status: 200 });
}
```

Then after successfully processing:
```ts
// Save the event ID to prevent re-processing
await base44.asServiceRole.entities.Order.update(order.id, {
  stripe_event_id: stripeEventId
});
```

IMPORTANT: The webhook must ALWAYS return 200 to Stripe, even on errors. Stripe retries on non-200 responses.

---

## TASK #474 — Wire stripeWebhookOrders → initializeInstallOS

**File:** `base44/functions/stripeWebhookOrders/entry.ts`

After setting `package_key` on the Order, add:

```ts
// Wire to initializeInstallOS
try {
  await base44.functions.initializeInstallOS({ order_id: order.id });
  console.log("[STRIPE] initializeInstallOS triggered for order:", order.id);
} catch (err) {
  // Log but never fail the webhook
  console.error("[STRIPE] initializeInstallOS failed:", err.message);
  await base44.asServiceRole.entities.AgentLog.create({
    agent_name: "stripeWebhookOrders",
    log_type: "error",
    summary: "initializeInstallOS failed after package_key set",
    details: `order_id: ${order.id}, error: ${String(err)}`,
    service: "stripe",
    requires_nolan: true
  });
}
```

Also verify at the checkout session creation point in `createCheckoutSession` that `metadata.package_key` is being set:
```ts
metadata: {
  package_key: selectedPlan, // e.g. "starter", "growth", "elite"
  order_id: newOrder.id,
  customer_email: customerEmail,
}
```
If this is missing, add it. Without it the webhook cannot know which tier was purchased.

---

## TASK #472 — TCPA SMS consent

**Files:** Every public lead capture form component + every SMS template string

### In all lead capture forms (check these files):
- `src/components/forms/DemoBookingModal.jsx`
- `src/components/forms/LeadCaptureForm.jsx` (if exists)
- `src/pages/Contact.jsx`
- Any form with a phone number field

Add this text below the phone number field and above the submit button:
```jsx
<p className="text-xs text-gray-500 mt-2">
  By submitting this form, you consent to receive automated SMS messages from ClientSurge Systems 
  at the number provided. Message &amp; data rates may apply. Reply STOP to opt out at any time.
</p>
```

### In all SMS template strings (check these files):
- `base44/functions/generateIndustryFirstSMS/entry.ts`
- `base44/functions/sendInstantLeadResponse/entry.ts`
- Any function that sends a first-contact SMS

Append to EVERY first-contact SMS (not follow-ups):
```
Reply STOP to opt out.
```

Note: Keep total SMS under 160 chars. If adding STOP opt-out pushes over 160, shorten the body, not the opt-out.

---

## TASK #517 — Stripe invoice webhook handlers

**File:** `base44/functions/stripePaymentWebhook/entry.ts` (or `stripeWebhookOrders/entry.ts` — add to whichever handles Stripe events)

Add handlers for two new Stripe events:

### invoice.paid
```ts
case "invoice.paid": {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;
  const customerEmail = invoice.customer_email;
  
  // Find order by customer_email or subscription ID
  const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: customerEmail });
  if (orders && orders.length > 0) {
    await base44.asServiceRole.entities.Order.update(orders[0].id, {
      billing_status: "active",
      last_payment_date: new Date().toISOString(),
      last_invoice_amount: invoice.amount_paid / 100,
    });
  }
  console.log("[STRIPE] invoice.paid processed for:", customerEmail);
  break;
}
```

### invoice.payment_failed
```ts
case "invoice.payment_failed": {
  const invoice = event.data.object;
  const customerEmail = invoice.customer_email;
  const attemptCount = invoice.attempt_count;
  
  const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: customerEmail });
  if (orders && orders.length > 0) {
    await base44.asServiceRole.entities.Order.update(orders[0].id, {
      billing_status: "past_due",
      payment_failed_at: new Date().toISOString(),
      payment_failed_count: attemptCount,
    });
    
    // Alert Nolan via Telegram
    await fetch(`https://api.telegram.org/bot8495239862:AAF_ScgymDF8MlcwGVKzrPfTldxpSMunZn4/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: "7776809236",
        text: `⚠️ PAYMENT FAILED\nClient: ${customerEmail}\nAttempt #${attemptCount}\nOrder: ${orders[0].id}\nAction needed: check Stripe dashboard`
      })
    });
  }
  console.log("[STRIPE] invoice.payment_failed processed for:", customerEmail);
  break;
}
```

Make sure both event types are included in the Stripe webhook's list of subscribed events (check your Stripe dashboard webhook config).

---

## TASK #479b — Secret key scan

Search EVERY file in `src/` for the string `sk_live_`. This is a critical security check.

```bash
grep -r "sk_live_" src/
```

If any results are found:
1. Remove the key from the frontend file immediately
2. Move it to an environment variable: `Deno.env.get("STRIPE_SECRET_KEY")`
3. Report exactly which file had it

Also check for `rk_live_` (restricted keys) — those should also never be in frontend files.

---

## VERIFICATION CHECKLIST

After completing all tasks above, confirm:

- [ ] Zero `buy.stripe.com/test_` links remain anywhere in src/
- [ ] salesCatalog.js has ONLY the canonical prices
- [ ] Both Stripe webhook functions have signature verification
- [ ] Both Stripe webhook functions check stripe_event_id before processing
- [ ] stripeWebhookOrders calls initializeInstallOS after setting package_key
- [ ] createCheckoutSession attaches metadata.package_key to session
- [ ] TCPA consent text appears on all public phone-capture forms
- [ ] "Reply STOP to opt out" on all first-contact SMS templates
- [ ] invoice.paid and invoice.payment_failed handlers exist
- [ ] No sk_live_ or rk_live_ string exists in any src/ file

Report results for each item. Flag any that could not be completed with a reason.
