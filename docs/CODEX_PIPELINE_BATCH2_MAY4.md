# Codex Prompt — Pipeline Completion Batch | Tasks #445, #446, #449, #469, #473, #487, #488
## Priority: CRITICAL — Full activation pipeline
## Date: May 4, 2026 | Assigned: Surge Dev
## Run AFTER: docs/CODEX_CRITICAL_BATCH_MAY4.md is complete

---

## PHASE 0 — SCAN FIRST

Before writing anything, read and report:
1. `base44/functions/activateAllServices/entry.ts` — does it exist? If yes, paste first 50 lines.
2. `base44/functions/sendGoLiveNotification/entry.ts` — exist? First 50 lines.
3. `base44/functions/configureService/entry.ts` — what service_key values does it accept? List them all.
4. `base44/functions/initializeInstallOS/entry.ts` — what input does it expect? What does it return?
5. `base44/functions/installPipeline/entry.ts` — what actions does it accept? Does `advance` work?
6. `base44/functions/sendClientWelcomeEmail/entry.ts` — exist? What input does it need?
7. In Base44 entity automations — is there an automation on Order "create" event? Report yes/no.
8. Is there an automation on ClientInstallationOS "update" event? Report yes/no.

Report all findings before writing a single line.

---

## TASK #445 + #446 — Build activateAllServices + wire to stripePaymentWebhook

### Build: `base44/functions/activateAllServices/entry.ts`

```ts
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TIER_SERVICE_MAP: Record<string, string[]> = {
  starter: ["instant_lead_response", "missed_call_text_back"],
  growth:  ["instant_lead_response", "missed_call_text_back", "appointment_booking_ai", "follow_up_sequences"],
  elite:   ["instant_lead_response", "missed_call_text_back", "appointment_booking_ai", "follow_up_sequences", "review_request_automation", "ai_receptionist"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    // Fetch order
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const packageKey = (order.package_key || "").toLowerCase();
    const services = TIER_SERVICE_MAP[packageKey];
    if (!services) {
      return Response.json({ error: `Unknown plan: ${packageKey}` }, { status: 400 });
    }

    // Mark activating
    await base44.asServiceRole.entities.Order.update(order_id, {
      activation_status: "activating",
      activated_at: new Date().toISOString(),
    });

    const results: { service_key: string; success: boolean; error?: string }[] = [];

    // Activate each service
    for (const service_key of services) {
      try {
        await base44.functions.configureService({ order_id, service_key });
        results.push({ service_key, success: true });
        console.log(`[activateAllServices] ✅ ${service_key} configured`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({ service_key, success: false, error: errMsg });
        console.error(`[activateAllServices] ❌ ${service_key} failed:`, errMsg);
        await base44.asServiceRole.entities.AgentLog.create({
          agent_name: "activateAllServices",
          log_type: "error",
          summary: `configureService failed: ${service_key}`,
          details: `order_id: ${order_id}, error: ${errMsg}`,
          service: service_key,
          requires_nolan: true,
        });
      }
    }

    const allSucceeded = results.every(r => r.success);
    const activatedServices = results.filter(r => r.success).map(r => r.service_key);
    const failedServices = results.filter(r => !r.success).map(r => r.service_key);

    // Update final status
    await base44.asServiceRole.entities.Order.update(order_id, {
      activation_status: allSucceeded ? "activated" : "partial_activation",
    });

    // Send go-live notification if fully activated
    if (allSucceeded) {
      try {
        await base44.functions.sendGoLiveNotification({ order_id });
      } catch (err) {
        console.error("[activateAllServices] sendGoLiveNotification failed:", err);
      }
    } else {
      // Alert Nolan about partial activation
      await fetch(`https://api.telegram.org/bot8495239862:AAF_ScgymDF8MlcwGVKzrPfTldxpSMunZn4/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "7776809236",
          text: `⚠️ PARTIAL ACTIVATION\nOrder: ${order_id}\nBusiness: ${order.business_name}\nFailed: ${failedServices.join(", ")}\nSucceeded: ${activatedServices.join(", ")}`
        })
      });
    }

    return Response.json({
      success: true,
      order_id,
      plan: packageKey,
      services_activated: activatedServices,
      services_failed: failedServices,
      activation_status: allSucceeded ? "activated" : "partial_activation",
    });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[activateAllServices] Fatal error:", errMsg);
    return Response.json({ error: errMsg }, { status: 500 });
  }
});
```

### Wire to stripePaymentWebhook (#446)

In `base44/functions/stripePaymentWebhook/entry.ts`, inside the `checkout.session.completed` handler, after order is created/updated and `package_key` is set, add:

```ts
// Trigger full service activation pipeline
try {
  await base44.functions.activateAllServices({ order_id: order.id });
  console.log("[stripePaymentWebhook] activateAllServices triggered for:", order.id);
} catch (err) {
  // NEVER let this fail the webhook — Stripe must always get 200
  console.error("[stripePaymentWebhook] activateAllServices error:", err);
  await base44.asServiceRole.entities.AgentLog.create({
    agent_name: "stripePaymentWebhook",
    log_type: "error",
    summary: "activateAllServices failed post-checkout",
    details: `order_id: ${order.id}, error: ${String(err)}`,
    service: "stripe",
    requires_nolan: true,
  });
}
```

---

## TASK #469 — Build runFullPipelineTest admin function

Create `base44/functions/runFullPipelineTest/entry.ts`.

This is a QA tool — it simulates a complete purchase for each of the 3 tiers and verifies every step fires correctly. It should be callable from the admin dashboard.

```ts
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const BOT = "8495239862:AAF_ScgymDF8MlcwGVKzrPfTldxpSMunZn4";
const NOLAN_CHAT = "7776809236";

async function tg(text: string) {
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: NOLAN_CHAT, text, parse_mode: "HTML" }),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results: Record<string, any> = {};

    for (const tier of ["starter", "growth", "elite"]) {
      const steps: { step: string; pass: boolean; error?: string }[] = [];

      // Step 1: Create QA fixture order
      let order: any;
      try {
        order = await base44.asServiceRole.entities.Order.create({
          business_name: `QA Test Business (${tier})`,
          customer_name: "QA Tester",
          customer_email: "qa@clientsurgesystems.com",
          package_key: tier,
          payment_status: "paid",
          activation_status: "pending",
          is_qa_test: true,
        });
        steps.push({ step: "create_order", pass: true });
      } catch (err) {
        steps.push({ step: "create_order", pass: false, error: String(err) });
        results[tier] = { steps, passed: false };
        continue;
      }

      // Step 2: initializeInstallOS
      try {
        await base44.functions.initializeInstallOS({ order_id: order.id });
        steps.push({ step: "initializeInstallOS", pass: true });
      } catch (err) {
        steps.push({ step: "initializeInstallOS", pass: false, error: String(err) });
      }

      // Step 3: activateAllServices
      try {
        const result = await base44.functions.activateAllServices({ order_id: order.id });
        const pass = result.services_failed?.length === 0;
        steps.push({ step: "activateAllServices", pass, error: pass ? undefined : `Failed: ${result.services_failed?.join(", ")}` });
      } catch (err) {
        steps.push({ step: "activateAllServices", pass: false, error: String(err) });
      }

      // Step 4: verify Order.activation_status
      try {
        const refreshed = await base44.asServiceRole.entities.Order.get(order.id);
        const pass = refreshed.activation_status === "activated";
        steps.push({ step: "verify_activation_status", pass, error: pass ? undefined : `Got: ${refreshed.activation_status}` });
      } catch (err) {
        steps.push({ step: "verify_activation_status", pass: false, error: String(err) });
      }

      // Step 5: cleanup QA order
      try {
        await base44.asServiceRole.entities.Order.delete(order.id);
        steps.push({ step: "cleanup", pass: true });
      } catch (err) {
        steps.push({ step: "cleanup", pass: false, error: String(err) });
      }

      const allPassed = steps.every(s => s.pass);
      results[tier] = { steps, passed: allPassed };
    }

    // Build Telegram report
    const lines = ["🧪 <b>PIPELINE TEST RESULTS</b>\n"];
    for (const [tier, data] of Object.entries(results) as any) {
      const icon = data.passed ? "✅" : "❌";
      lines.push(`${icon} <b>${tier.toUpperCase()}</b>`);
      for (const s of data.steps) {
        lines.push(`  ${s.pass ? "✓" : "✗"} ${s.step}${s.error ? ` — ${s.error}` : ""}`);
      }
      lines.push("");
    }
    await tg(lines.join("\n"));

    // Log to AgentLog
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "runFullPipelineTest",
      log_type: "info",
      summary: "Pipeline QA test completed",
      details: JSON.stringify(results),
      service: "system",
    });

    return Response.json({ success: true, results });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
```

---

## TASK #473 + #487 — Order "create" automation chain

These 4 actions must fire on every new Order. Check if a Base44 entity automation exists for Order "create". If not, create the wiring inside `onLeadCreated` or create a new function `onOrderCreated`.

Create `base44/functions/onOrderCreated/entry.ts`:

```ts
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const errors: string[] = [];

    // Action 1: initializeInstallOS
    try {
      await base44.functions.initializeInstallOS({ order_id });
    } catch (err) {
      errors.push(`initializeInstallOS: ${err}`);
      console.error("[onOrderCreated] initializeInstallOS failed:", err);
    }

    // Action 2: sendClientWelcomeEmail
    try {
      await base44.functions.sendClientWelcomeEmail({ order_id });
    } catch (err) {
      errors.push(`sendClientWelcomeEmail: ${err}`);
      console.error("[onOrderCreated] sendClientWelcomeEmail failed:", err);
    }

    // Action 3: admin Telegram notification
    try {
      await fetch(`https://api.telegram.org/bot8495239862:AAF_ScgymDF8MlcwGVKzrPfTldxpSMunZn4/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "7776809236",
          text: `💳 NEW CLIENT PURCHASE\nBusiness: ${order.business_name}\nPlan: ${order.package_key}\nEmail: ${order.customer_email}\nOrder ID: ${order_id}`,
        }),
      });
    } catch (err) {
      errors.push(`telegram_notify: ${err}`);
    }

    // Action 4: advance workflow_stage
    try {
      await base44.asServiceRole.entities.Order.update(order_id, {
        workflow_stage: "intake_received",
      });
    } catch (err) {
      errors.push(`workflow_stage: ${err}`);
    }

    // Log to AgentLog
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "onOrderCreated",
      log_type: errors.length ? "warning" : "info",
      summary: `New order processed: ${order.business_name}`,
      details: errors.length ? `Errors: ${errors.join(" | ")}` : "All 4 actions completed",
      service: "onboarding",
      requires_nolan: errors.length > 0,
    });

    return Response.json({
      success: true,
      order_id,
      actions_completed: 4 - errors.length,
      errors,
    });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
```

Then in the Base44 dashboard, create an entity automation:
- Entity: `Order`
- Event: `create`
- Action: call `onOrderCreated` with `{ order_id: data.id }`

---

## TASK #488 — ClientInstallationOS "update" automation

Create `base44/functions/onInstallOSUpdate/entry.ts`:

```ts
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { install_id, workflow_stage, order_id } = await req.json();

    switch (workflow_stage) {

      case "credentials_complete":
        // Trigger full service activation
        try {
          await base44.functions.activateAllServices({ order_id });
          console.log("[onInstallOSUpdate] activateAllServices triggered");
        } catch (err) {
          console.error("[onInstallOSUpdate] activateAllServices failed:", err);
          await base44.asServiceRole.entities.AgentLog.create({
            agent_name: "onInstallOSUpdate",
            log_type: "error",
            summary: "activateAllServices failed on credentials_complete",
            details: String(err),
            requires_nolan: true,
          });
        }
        break;

      case "website_approved":
        // Apply website spec + notify Nolan
        try {
          await base44.functions.generateClientWebsite({ order_id });
        } catch (err) {
          console.error("[onInstallOSUpdate] generateClientWebsite failed:", err);
        }
        await fetch(`https://api.telegram.org/bot8495239862:AAF_ScgymDF8MlcwGVKzrPfTldxpSMunZn4/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "7776809236",
            text: `🌐 WEBSITE APPROVED\nOrder: ${order_id}\nWebsite spec is ready to deploy.`,
          }),
        });
        break;

      case "activated":
        // Send go-live notification
        try {
          await base44.functions.sendGoLiveNotification({ order_id });
        } catch (err) {
          console.error("[onInstallOSUpdate] sendGoLiveNotification failed:", err);
        }
        break;

      default:
        console.log("[onInstallOSUpdate] No action for stage:", workflow_stage);
    }

    return Response.json({ success: true, workflow_stage });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
```

Then in Base44 dashboard, create an entity automation:
- Entity: `ClientInstallationOS`
- Event: `update`
- Action: call `onInstallOSUpdate` with `{ install_id: data.id, workflow_stage: data.workflow_stage, order_id: data.order_id }`

---

## TASK #449 — E2E activation test with real order

After activateAllServices is deployed, run this test:

```
POST /api/functions/activateAllServices
Body: { "order_id": "69f13b948861e8a032d10f2e" }
```

Expected response:
```json
{
  "success": true,
  "plan": "starter" or "growth" or "elite",
  "services_activated": [...],
  "services_failed": [],
  "activation_status": "activated"
}
```

If `services_failed` is not empty, check AgentLog for details on which service failed and why.
Report exact response back to Nolan via Telegram.

---

## VERIFICATION CHECKLIST

After all tasks above:

- [ ] `activateAllServices` function exists and returns correct service list per tier
- [ ] `stripePaymentWebhook` calls `activateAllServices` after checkout.session.completed
- [ ] `runFullPipelineTest` Telegrams pass/fail per step for all 3 tiers
- [ ] `onOrderCreated` fires 4 actions: initializeInstallOS + welcome email + Telegram + workflow_stage
- [ ] Base44 entity automation exists on Order "create" → calls onOrderCreated
- [ ] Base44 entity automation exists on ClientInstallationOS "update" → calls onInstallOSUpdate
- [ ] Real order `69f13b948861e8a032d10f2e` activates successfully
- [ ] Nolan receives Telegram on go-live

Flag any step that cannot be completed with a reason.
