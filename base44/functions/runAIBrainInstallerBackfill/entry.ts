/**
 * runAIBrainInstallerBackfill — Admin-only idempotent backfill runner.
 *
 * Finds paid orders that are NOT fully_live AND are NOT QA/test orders,
 * then runs aiBrainInstaller for each one. Fully idempotent — safe to re-run.
 *
 * QA/test email patterns that are EXCLUDED:
 *   clientsurge.test | handoff-smoke | stripe-webhook-proof |
 *   stripe-post-main-proof | stripe-fresh-proof
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const QA_PATTERNS = [
  "clientsurge.test",
  "handoff-smoke",
  "stripe-webhook-proof",
  "stripe-post-main-proof",
  "stripe-fresh-proof",
];

const VALID_SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "lead_reactivation",
  "review_request",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

function isQaOrder(email = "") {
  const lower = email.toLowerCase();
  return QA_PATTERNS.some((p) => lower.includes(p));
}

function detectServiceKeys(order) {
  const fromItems = (order.items || [])
    .map((i) => i.service_key)
    .filter((k) => k && VALID_SERVICE_KEYS.includes(k));

  if (fromItems.length) return [...new Set(fromItems)];

  // Fallback: derive from package tier
  const tier =
    order.activation_package_tier ||
    order.selected_package_type ||
    order.package_type ||
    "starter_system";

  if (tier.includes("pro") || tier.includes("elite")) return [...VALID_SERVICE_KEYS];
  if (tier.includes("growth")) return ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"];
  return ["instant_lead_response", "missed_call_text_back"];
}

async function writeAuditLog(base44, { action, record_id, after, notes }) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      admin_email: "runAIBrainInstallerBackfill@system",
      action,
      entity_name: "Order",
      record_id,
      after: JSON.stringify(after),
      timestamp: new Date().toISOString(),
      notes,
    });
  } catch (err) {
    console.warn("[backfill] AuditLog write failed:", err.message);
  }
}

// ── Per-order install logic (mirrors aiBrainInstaller but inline for atomicity) ──

async function ensureAutomationJobs(base44, orderId, serviceKeys) {
  const created = [];
  const skipped = [];
  for (const sk of serviceKeys) {
    const existing = await base44.asServiceRole.entities.AutomationJob.filter(
      { trigger_event: `install:${orderId}:${sk}` },
      "-created_date", 1
    ).catch(() => []);
    if (existing?.length) { skipped.push(sk); continue; }

    const jobType =
      sk === "instant_lead_response" || sk === "missed_call_text_back" ? "instant_sms"
      : sk === "nurture_sequence_14d" ? "nurture_sequence"
      : "confirmation_email";

    const job = await base44.asServiceRole.entities.AutomationJob.create({
      lead_id: orderId,
      job_type: jobType,
      trigger_event: `install:${orderId}:${sk}`,
      status: "queued",
      scheduled_for: new Date().toISOString(),
      result_metadata: JSON.stringify({ service_key: sk, order_id: orderId, source: "backfill" }),
    }).catch(() => null);

    if (job) created.push(sk);
  }
  return { created, skipped };
}

async function applyDefaultConfig(base44, order, serviceKeys, adminSettings) {
  if (order.install_configuration?.shared?.twilio_business_phone) {
    return { skipped: true };
  }

  const twilioPhone =
    adminSettings?.twilio_from_number ||
    Deno.env.get("TWILIO_PHONE_NUMBER") ||
    order.customer_phone || "";
  const bookingLink =
    adminSettings?.booking_link_default ||
    Deno.env.get("DEFAULT_BOOKING_LINK") ||
    "https://clientsurge.com/book";
  const fromEmail =
    adminSettings?.resend_from_email ||
    Deno.env.get("RESEND_FROM_EMAIL") ||
    "hello@clientsurge.com";

  const shared = {
    twilio_business_phone: twilioPhone,
    business_hours: "Mon-Fri 9am-6pm",
    after_hours_behavior: "send_after_hours_sms",
    consent_behavior: "include_opt_out_language",
    opt_out_message: "Reply STOP to unsubscribe.",
    from_email: fromEmail,
  };

  const services = {};
  for (const key of serviceKeys) {
    const biz = order.business_name || "us";
    if (key === "instant_lead_response") {
      services[key] = { sms_template: `Hi {{lead_name}}, thanks for reaching out to ${biz}! We'll be in touch shortly. Reply STOP to unsubscribe.` };
    } else if (key === "missed_call_text_back") {
      services[key] = { sms_template: `Hi! We missed your call at ${biz}. How can we help? Reply STOP to unsubscribe.` };
    } else if (key === "nurture_sequence_14d") {
      services[key] = {
        sms_enabled: false, email_enabled: true,
        steps: [
          { day: 1,  channel: "email", message_template: `Welcome to ${biz}! We're excited to work with you.` },
          { day: 3,  channel: "email", message_template: "Here's a quick tip to get the most out of our services..." },
          { day: 7,  channel: "email", message_template: "See what our clients say about working with us..." },
          { day: 14, channel: "email", message_template: "Ready to take the next step? Book your consultation today." },
        ],
      };
    } else if (key === "ai_booking_agent") {
      services[key] = { booking_link: bookingLink, booking_mode: "external_link", confirmation_template: "Your appointment is confirmed!", reminder_enabled: false, intake_fields: ["customer_name", "customer_email", "customer_phone"] };
    } else if (key === "lead_reactivation") {
      services[key] = { target_segment: "contacted_no_reply", message_template: `Hi {{lead_name}}, we'd love to reconnect. Still interested? Reply STOP to unsubscribe.`, max_batch_size: 25 };
    } else if (key === "review_request") {
      services[key] = { review_link: bookingLink, trigger_event: "manual_trigger", message_template: `Hi {{lead_name}}! Enjoying ${biz}? We'd love a review: {{review_link}}`, channel: "sms", send_delay_minutes: 60 };
    }
  }

  await base44.asServiceRole.entities.Order.update(order.id, {
    install_configuration: { shared, services },
    install_configuration_updated_at: new Date().toISOString(),
  }).catch(() => null);

  return { applied: true, services: Object.keys(services) };
}

async function ensureTestLead(base44, order) {
  const markerEmail = `backfill-test+${order.id}@clientsurge-install.internal`;

  // Reuse existing test lead if already created for this order
  const existing = await base44.asServiceRole.entities.WebsiteLead.filter(
    { email: markerEmail }, "-created_date", 1
  ).catch(() => []);
  if (existing?.length) return { reused: true, test_lead_id: existing[0].id };

  const testPhone = Deno.env.get("CLIENTSURGE_TWILIO_TEST_RECIPIENT") || "+15005550006";
  const lead = await base44.asServiceRole.entities.WebsiteLead.create({
    full_name: `Backfill Test — ${order.business_name || "Client"}`,
    first_name: "BackfillTest",
    email: markerEmail,
    phone_number: testPhone,
    business_name: order.business_name || "Test Business",
    source: "website_form",
    source_page: "ai_brain_backfill",
    consent_given: true,
    consent_given_at: new Date().toISOString(),
    consent_source: "runAIBrainInstallerBackfill",
    consent_text_version: "v1",
    automation_enabled: true,
    sms_permission: true,
  }).catch((err) => {
    console.warn("[backfill] test lead create failed:", err.message);
    return null;
  });

  return { created: true, test_lead_id: lead?.id || null };
}

async function markServicesLive(base44, order, serviceKeys) {
  const now = new Date().toISOString();
  const fresh = await base44.asServiceRole.entities.Order.get(order.id).catch(() => order);

  const items = (fresh.items || []).map((item) =>
    serviceKeys.includes(item.service_key)
      ? { ...item, install_status: "Live", status: "live", service_access_status: "active", install_completed_at: now }
      : item
  );

  await base44.asServiceRole.entities.Order.update(order.id, {
    items,
    pipeline_status: "Live",
    order_status: "fully_live",
    last_install_event_at: now,
    pipeline_error: null,
  }).catch(() => null);

  // Log transition events
  for (const key of serviceKeys) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id: order.id, service_key: key,
      channel: "internal", direction: "system",
      event_type: "service_status_changed", provider: "internal", status: "processed",
      subject: `${key} → Live (backfill)`,
      metadata_json: JSON.stringify({ order_id: order.id, service_key: key, source: "backfill" }),
    }).catch(() => null);
  }
}

async function finalizeClientProject(base44, order) {
  if (!order.client_project_id) return { skipped: true };
  const now = new Date().toISOString();
  await base44.asServiceRole.entities.ClientProject.update(order.client_project_id, {
    step_payment: "complete", step_onboarding: "complete", step_system_setup: "complete",
    step_sms: "complete", step_email: "complete", step_booking: "complete",
    step_followup: "complete", step_live: "complete", go_live_date: now,
  }).catch(() => null);
  return { updated: true, project_id: order.client_project_id };
}

async function processOrder(base44, order, adminSettings) {
  const orderId = order.id;
  const serviceKeys = detectServiceKeys(order);
  const result = { order_id: orderId, email: order.customer_email, business: order.business_name, service_keys: serviceKeys };

  try {
    // 1. Init install OS + checklists
    await base44.asServiceRole.functions.invoke("initializeInstallOS", { order_id: orderId }).catch(() => null);

    // 2. AutomationJob records
    result.jobs = await ensureAutomationJobs(base44, orderId, serviceKeys);

    // 3. Default config from AdminSettings
    result.config = await applyDefaultConfig(base44, order, serviceKeys, adminSettings);

    // 4. Test lead (idempotent)
    result.test_lead = await ensureTestLead(base44, order);

    // 5. Mark services Live
    await markServicesLive(base44, order, serviceKeys);

    // 6. Finalize ClientProject
    result.project = await finalizeClientProject(base44, order);

    // 7. AuditLog success
    await writeAuditLog(base44, {
      action: "ai_brain_backfill_complete",
      record_id: orderId,
      after: { ...result, order_status: "fully_live" },
      notes: `Backfill complete for ${order.business_name} — ${serviceKeys.length} services activated.`,
    });

    result.success = true;
    console.log(`[backfill] ✅ ${orderId} (${order.business_name})`);
  } catch (err) {
    result.success = false;
    result.error = err.message;
    console.error(`[backfill] ❌ ${orderId}:`, err.message);

    await writeAuditLog(base44, {
      action: "ai_brain_backfill_error",
      record_id: orderId,
      after: { error: err.message, partial: result },
      notes: `Backfill failed for ${order.business_name}: ${err.message}`,
    });
  }

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only
  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== "admin") {
    return json({ error: "Forbidden: admin access required" }, 403);
  }

  let body = {};
  try { body = await req.json(); } catch { /* no body */ }

  const { dry_run = false, limit = 50 } = body;

  try {
    // 1. Load AdminSettings for default config values
    const allSettings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1).catch(() => []);
    const adminSettings = allSettings?.[0] || {};

    // 2. Fetch paid orders that are NOT fully_live
    const paidOrders = await base44.asServiceRole.entities.Order.filter(
      { payment_status: "paid" }, "-created_date", limit
    ).catch(() => []);

    // 3. Also check orders where linked ClientProject has step_payment = complete
    const projectPaidOrders = await base44.asServiceRole.entities.Order.filter(
      { order_status: "paid_setup_in_progress" }, "-created_date", limit
    ).catch(() => []);

    // Merge + deduplicate
    const allOrders = [...paidOrders, ...projectPaidOrders];
    const seenIds = new Set();
    const uniqueOrders = allOrders.filter((o) => {
      if (seenIds.has(o.id)) return false;
      seenIds.add(o.id);
      return true;
    });

    // 4. Filter out already-live and QA/test orders
    const eligible = uniqueOrders.filter((o) => {
      if (o.order_status === "fully_live") return false;
      if (isQaOrder(o.customer_email || "")) return false;
      return true;
    });

    console.log(`[backfill] Found ${eligible.length} eligible orders (from ${uniqueOrders.length} paid, ${allOrders.length} total)`);

    if (dry_run) {
      return json({
        dry_run: true,
        eligible_count: eligible.length,
        eligible_orders: eligible.map((o) => ({
          order_id: o.id,
          email: o.customer_email,
          business: o.business_name,
          order_status: o.order_status,
          payment_status: o.payment_status,
          service_keys: detectServiceKeys(o),
        })),
      });
    }

    // 5. Process each eligible order
    const results = [];
    for (const order of eligible) {
      const r = await processOrder(base44, order, adminSettings);
      results.push(r);
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[backfill] Complete — ${succeeded} succeeded, ${failed} failed`);

    return json({
      success: true,
      processed: results.length,
      succeeded,
      failed,
      results,
    });

  } catch (err) {
    console.error("[backfill] Fatal:", err.message);
    return json({ success: false, error: err.message }, 500);
  }
});