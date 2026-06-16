/**
 * runAIBrainInstallerBackfill — Admin-only idempotent backfill runner.
 *
 * Eligibility (OR logic):
 *   1. Order.payment_status = "paid"
 *   2. Linked ClientProject.step_payment = "complete" (even if Order.payment_status = "pending")
 *
 * Skips:
 *   - Orders already order_status = "fully_live"
 *   - Real production orders (non-test emails)
 *
 * QA/test email patterns that ARE eligible (processed, not skipped):
 *   clientsurge.test | handoff-smoke | stripe-webhook-proof |
 *   stripe-post-main-proof | stripe-fresh-proof | clientsurge-install.internal
 *
 * Real production orders (skipped) = any email NOT matching a known test pattern.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// Test/QA email patterns — these ARE processed by the backfill
const QA_PATTERNS = [
  "clientsurge.test",
  "handoff-smoke",
  "stripe-webhook-proof",
  "stripe-post-main-proof",
  "stripe-fresh-proof",
  "clientsurge-install.internal",
  "@example.com",
  "+test@",
  "qa+",
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

// Returns true if this is a QA/test order (eligible for backfill processing)
function isQaOrder(email = "") {
  const lower = email.toLowerCase();
  return QA_PATTERNS.some((p) => lower.includes(p));
}

// Returns true if this is a REAL production order (should be SKIPPED by backfill)
function isRealProductionOrder(email = "") {
  return !isQaOrder(email);
}

function detectServiceKeys(order) {
  const fromItems = (order.items || [])
    .map((i) => i.service_key)
    .filter((k) => k && VALID_SERVICE_KEYS.includes(k));

  if (fromItems.length) return [...new Set(fromItems)];

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

// ── Step 1: AutomationJob records (idempotent via trigger_event key) ──────────

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

// ── Step 2: Fill install_configuration defaults ───────────────────────────────

async function applyDefaultConfig(base44, order, serviceKeys, adminSettings) {
  // Only skip if already configured with a real phone number
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

// ── Step 3: Send test WebsiteLead (idempotent via marker email) ───────────────

async function ensureTestLead(base44, order) {
  const markerEmail = `backfill-test+${order.id}@clientsurge-install.internal`;

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

// ── Step 4: Mark each service Live ───────────────────────────────────────────

async function markServicesLive(base44, order, serviceKeys) {
  const now = new Date().toISOString();
  const fresh = await base44.asServiceRole.entities.Order.get(order.id).catch(() => order);

  const items = (fresh.items || []).map((item) =>
    serviceKeys.includes(item.service_key)
      ? { ...item, install_status: "Live", status: "live", service_access_status: "active", install_completed_at: now, install_started_at: item.install_started_at || now }
      : item
  );

  await base44.asServiceRole.entities.Order.update(order.id, {
    items,
    pipeline_status: "Live",
    order_status: "fully_live",
    payment_status: "paid",
    last_install_event_at: now,
    install_initialized_at: fresh.install_initialized_at || now,
    pipeline_error: null,
  }).catch((err) => {
    console.error("[backfill] markServicesLive update failed:", err.message);
  });

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

// ── Step 5: Finalize ClientProject ────────────────────────────────────────────

async function finalizeClientProject(base44, order) {
  if (!order.client_project_id) return { skipped: true, reason: "no_client_project_id" };
  const now = new Date().toISOString();
  await base44.asServiceRole.entities.ClientProject.update(order.client_project_id, {
    step_payment: "complete",
    step_onboarding: "complete",
    step_system_setup: "complete",
    step_sms: "complete",
    step_email: "complete",
    step_booking: "complete",
    step_followup: "complete",
    step_live: "complete",
    go_live_date: now,
  }).catch((err) => {
    console.error("[backfill] finalizeClientProject update failed:", err.message);
  });
  return { updated: true, project_id: order.client_project_id };
}

// ── Per-order orchestration ───────────────────────────────────────────────────

async function processOrder(base44, order, adminSettings) {
  const orderId = order.id;
  const serviceKeys = detectServiceKeys(order);
  const result = {
    order_id: orderId,
    email: order.customer_email,
    business: order.business_name,
    service_keys: serviceKeys,
  };

  try {
    // 0. Init install OS + checklists
    await base44.asServiceRole.functions.invoke("initializeInstallOS", { order_id: orderId }).catch(() => null);

    // 1. AutomationJob records
    result.jobs = await ensureAutomationJobs(base44, orderId, serviceKeys);

    // 2. Fill install_configuration defaults
    result.config = await applyDefaultConfig(base44, order, serviceKeys, adminSettings);

    // 3. Send test WebsiteLead
    result.test_lead = await ensureTestLead(base44, order);

    // 4. Mark services Live + finalize Order fields
    await markServicesLive(base44, order, serviceKeys);

    // 5. Finalize ClientProject
    result.project = await finalizeClientProject(base44, order);

    // 6. AuditLog — success
    await writeAuditLog(base44, {
      action: "ai_brain_backfill_complete",
      record_id: orderId,
      after: { ...result, order_status: "fully_live" },
      notes: `Backfill complete for ${order.business_name} — ${serviceKeys.length} services activated.`,
    });

    result.success = true;
    console.log(`[backfill] ✅ ${orderId} (${order.business_name || order.customer_email})`);
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

  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== "admin") {
    return json({ error: "Forbidden: admin access required" }, 403);
  }

  let body = {};
  try { body = await req.json(); } catch { /* no body */ }

  const { dry_run = false, limit = 50 } = body;

  try {
    // Load AdminSettings
    const allSettings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1).catch(() => []);
    const adminSettings = allSettings?.[0] || {};

    // ── Bucket 1: Orders with payment_status = "paid" ────────────────────────
    const paidOrders = await base44.asServiceRole.entities.Order.filter(
      { payment_status: "paid" }, "-created_date", limit
    ).catch(() => []);

    // ── Bucket 2: Orders with order_status = "paid_setup_in_progress" ────────
    const inProgressOrders = await base44.asServiceRole.entities.Order.filter(
      { order_status: "paid_setup_in_progress" }, "-created_date", limit
    ).catch(() => []);

    // ── Bucket 3: Orders whose linked ClientProject.step_payment = "complete" ─
    //   Fetch projects with step_payment = complete, then find matching orders
    const completedProjects = await base44.asServiceRole.entities.ClientProject.filter(
      { step_payment: "complete" }, "-created_date", limit
    ).catch(() => []);

    const projectOrderIds = new Set(
      completedProjects.map((p) => p.order_id).filter(Boolean)
    );
    const projectClientEmails = completedProjects.map((p) => p.client_email).filter(Boolean);

    // Also fetch orders matching by client_project_id linkage
    const projectLinkedOrders = completedProjects.length
      ? await base44.asServiceRole.entities.Order.filter(
          { order_status: "pending_payment" }, "-created_date", limit
        ).then((orders) =>
          orders.filter((o) =>
            (o.client_project_id && completedProjects.some((p) => p.id === o.client_project_id)) ||
            (o.id && projectOrderIds.has(o.id)) ||
            (o.customer_email && projectClientEmails.includes(o.customer_email))
          )
        ).catch(() => [])
      : [];

    // Merge + deduplicate all buckets
    const allOrders = [...paidOrders, ...inProgressOrders, ...projectLinkedOrders];
    const seenIds = new Set();
    const uniqueOrders = allOrders.filter((o) => {
      if (seenIds.has(o.id)) return false;
      seenIds.add(o.id);
      return true;
    });

    // ── Filter: skip already-live AND skip real production orders ─────────────
    const eligible = uniqueOrders.filter((o) => {
      if (o.order_status === "fully_live") return false;  // already done
      if (isRealProductionOrder(o.customer_email || "")) return false;  // skip prod
      return true;
    });

    console.log(`[backfill] Found ${eligible.length} eligible orders (from ${uniqueOrders.length} unique, ${allOrders.length} total across buckets)`);

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
          client_project_id: o.client_project_id,
          service_keys: detectServiceKeys(o),
        })),
      });
    }

    // Process each eligible order sequentially (safe, auditable)
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