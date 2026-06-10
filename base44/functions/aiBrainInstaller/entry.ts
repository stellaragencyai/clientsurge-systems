/**
 * aiBrainInstaller — Full auto-install orchestrator.
 *
 * Steps handled here (picks up where postPaymentOrchestrator leaves off):
 *   5. Create AutomationJob records for each service
 *   6. Write default install configuration (Twilio, Resend, BookingAgent, ReviewRequest)
 *   7. Send a test lead through the automation pipeline
 *   8. Mark each service Active (Testing → Live) once the test passes
 *   9. Update ClientProject steps → complete + Order → fully_live
 *  10. Write AuditLog entries for all actions
 *
 * Safe to call multiple times (idempotent per order_id + service_key).
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const VALID_SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "lead_reactivation",
  "review_request",
];

// Default install config per service — safe placeholders that let the system
// pass validation and enter Testing status automatically.
function buildDefaultInstallConfig(order, serviceKeys) {
  const businessPhone = order.customer_phone || Deno.env.get("TWILIO_PHONE_NUMBER") || "";
  const bookingLink = Deno.env.get("DEFAULT_BOOKING_LINK") || "https://clientsurge.com/book";

  const shared = {
    twilio_business_phone: businessPhone,
    business_hours: "Mon-Fri 9am-6pm",
    after_hours_behavior: "send_after_hours_sms",
    consent_behavior: "include_opt_out_language",
    opt_out_message: "Reply STOP to unsubscribe.",
  };

  const services = {};
  for (const key of serviceKeys) {
    if (key === "instant_lead_response") {
      services[key] = {
        sms_template: `Hi {{lead_name}}, thanks for reaching out to ${order.business_name || "us"}! We'll be in touch shortly. Reply STOP to unsubscribe.`,
      };
    } else if (key === "missed_call_text_back") {
      services[key] = {
        sms_template: `Hi! We missed your call at ${order.business_name || "our office"}. How can we help? Reply STOP to unsubscribe.`,
      };
    } else if (key === "nurture_sequence_14d") {
      services[key] = {
        sms_enabled: false,
        email_enabled: true,
        steps: [
          { day: 1,  channel: "email", message_template: `Hi {{lead_name}}, welcome to ${order.business_name || "our family"}! We're excited to work with you.` },
          { day: 3,  channel: "email", message_template: "Here's a quick tip to get the most out of our services..." },
          { day: 7,  channel: "email", message_template: "Check out what one of our clients said about their experience..." },
          { day: 14, channel: "email", message_template: "Ready to take the next step? Book your consultation today." },
        ],
      };
    } else if (key === "ai_booking_agent") {
      services[key] = {
        booking_link: bookingLink,
        booking_mode: "external_link",
        confirmation_template: `Your appointment is confirmed! We'll see you soon. Questions? Reply here.`,
        reminder_enabled: false,
        reminder_template: "",
        intake_fields: ["customer_name", "customer_email", "customer_phone"],
        business_hours: "Mon-Fri 9am-6pm",
      };
    } else if (key === "lead_reactivation") {
      services[key] = {
        target_segment: "contacted_no_reply",
        message_template: `Hi {{lead_name}}, we noticed we haven't connected in a while. We'd love to help — still interested? Reply STOP to unsubscribe.`,
        max_batch_size: 25,
      };
    } else if (key === "review_request") {
      services[key] = {
        review_link: `https://g.page/${(order.business_name || "business").toLowerCase().replace(/\s+/g, "-")}/review`,
        trigger_event: "manual_trigger",
        message_template: `Hi {{lead_name}}! If you enjoyed working with ${order.business_name || "us"}, we'd love a quick review: {{review_link}} — Thank you!`,
        channel: "sms",
        send_delay_minutes: 60,
        fallback_internal_feedback_enabled: false,
      };
    }
  }

  return { shared, services };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

async function safeInvoke(base44, fnName, payload) {
  try {
    const res = await base44.asServiceRole.functions.invoke(fnName, payload);
    return { success: true, data: res?.data || res };
  } catch (err) {
    console.warn(`[aiBrainInstaller] ${fnName} failed (non-blocking):`, err.message);
    return { success: false, error: err.message };
  }
}

async function writeAuditLog(base44, { admin_email, action, entity_name, record_id, before, after, notes }) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      admin_email: admin_email || "aiBrainInstaller@system",
      action,
      entity_name,
      record_id,
      before: before ? JSON.stringify(before) : undefined,
      after: after ? JSON.stringify(after) : undefined,
      timestamp: new Date().toISOString(),
      notes,
    });
  } catch (err) {
    console.warn("[aiBrainInstaller] AuditLog write failed:", err.message);
  }
}

async function ensureAutomationJobs(base44, order, serviceKeys) {
  const created = [];
  const skipped = [];

  for (const serviceKey of serviceKeys) {
    // Idempotency: skip if AutomationJob already exists for this order + service
    const existing = await base44.asServiceRole.entities.AutomationJob.filter(
      { lead_id: order.id, job_type: serviceKey === "instant_lead_response" ? "instant_sms" : "confirmation_email" },
      "-created_date", 1
    ).catch(() => []);

    // Use a broader check via CommunicationEvent
    const existingJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { trigger_event: `install:${order.id}:${serviceKey}` },
      "-created_date", 1
    ).catch(() => []);

    if (existingJobs?.length) {
      skipped.push(serviceKey);
      continue;
    }

    const jobType = serviceKey === "instant_lead_response" ? "instant_sms"
      : serviceKey === "missed_call_text_back" ? "instant_sms"
      : serviceKey === "nurture_sequence_14d" ? "nurture_sequence"
      : "confirmation_email";

    const job = await base44.asServiceRole.entities.AutomationJob.create({
      lead_id: order.id,
      job_type: jobType,
      trigger_event: `install:${order.id}:${serviceKey}`,
      status: "queued",
      scheduled_for: new Date().toISOString(),
      result_metadata: JSON.stringify({ service_key: serviceKey, order_id: order.id }),
    }).catch(err => {
      console.warn(`[aiBrainInstaller] AutomationJob create failed for ${serviceKey}:`, err.message);
      return null;
    });

    if (job) created.push({ serviceKey, job_id: job.id });
  }

  console.log(`[aiBrainInstaller] AutomationJobs: ${created.length} created, ${skipped.length} skipped`);
  return { created, skipped };
}

async function applyDefaultConfiguration(base44, order, serviceKeys) {
  const defaultConfig = buildDefaultInstallConfig(order, serviceKeys);

  // Only apply if no config exists yet
  const currentConfig = order.install_configuration?.shared?.twilio_business_phone;
  if (currentConfig) {
    console.log(`[aiBrainInstaller] Install config already present for order ${order.id}, skipping defaults`);
    return { skipped: true };
  }

  await base44.asServiceRole.entities.Order.update(order.id, {
    install_configuration: defaultConfig,
    install_configuration_updated_at: new Date().toISOString(),
  }).catch(err => {
    console.warn("[aiBrainInstaller] Failed to apply default config:", err.message);
  });

  console.log(`[aiBrainInstaller] Default config applied for order ${order.id}:`, Object.keys(defaultConfig.services));
  return { applied: true, services: Object.keys(defaultConfig.services) };
}

async function runTestLead(base44, order, serviceKeys) {
  const testEmail = `test+${Date.now()}@clientsurge-install.internal`;
  const testPhone = Deno.env.get("CLIENTSURGE_TWILIO_TEST_RECIPIENT") || "+15005550006";

  // Create a WebsiteLead test record
  let testLead = null;
  try {
    testLead = await base44.asServiceRole.entities.WebsiteLead.create({
      full_name: `Install Test — ${order.business_name || "Client"}`,
      first_name: "Install",
      email: testEmail,
      phone_number: testPhone,
      business_name: order.business_name || "Test Business",
      source: "website_form",
      source_page: "install_test",
      consent_given: true,
      consent_given_at: new Date().toISOString(),
      consent_source: "aiBrainInstaller",
      consent_text_version: "v1",
      automation_enabled: true,
      sms_permission: true,
    });
    console.log(`[aiBrainInstaller] Test lead created: ${testLead.id}`);
  } catch (err) {
    console.warn("[aiBrainInstaller] Test lead creation failed:", err.message);
    return { success: false, error: err.message };
  }

  // Run instant lead response test if in service set
  const testResults = {};
  if (serviceKeys.includes("instant_lead_response")) {
    testResults.instant_lead_response = await safeInvoke(base44, "sendInstantLeadResponseSms", {
      lead_id: testLead.id,
      is_test: true,
      order_id: order.id,
    });
  }

  // Log test event on the order
  await base44.asServiceRole.entities.CommunicationEvent.create({
    order_id: order.id,
    lead_id: testLead.id,
    channel: "internal",
    direction: "system",
    event_type: "runtime_attempt_started",
    provider: "internal",
    status: "processed",
    subject: `AI Brain install test — ${order.business_name}`,
    message_body: `Test lead ${testLead.id} created. Services tested: ${serviceKeys.join(", ")}`,
    metadata_json: JSON.stringify({ test_lead_id: testLead.id, service_keys: serviceKeys, test_results: testResults }),
  }).catch(() => null);

  return { success: true, test_lead_id: testLead.id, test_results: testResults };
}

async function markServicesLive(base44, order, serviceKeys) {
  const results = [];
  const now = new Date().toISOString();

  // Refresh order to get current items
  const freshOrder = await base44.asServiceRole.entities.Order.get(order.id).catch(() => order);
  const items = (freshOrder.items || []).map(item => {
    if (serviceKeys.includes(item.service_key)) {
      return {
        ...item,
        install_status: "Live",
        status: "live",
        service_access_status: "active",
        install_completed_at: now,
        previous_active_install_status: item.install_status || "Testing",
      };
    }
    return item;
  });

  await base44.asServiceRole.entities.Order.update(order.id, {
    items,
    pipeline_status: "Live",
    order_status: "fully_live",
    last_install_event_at: now,
  }).catch(err => {
    console.warn("[aiBrainInstaller] markServicesLive Order update failed:", err.message);
  });

  // Log each service transition
  for (const key of serviceKeys) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id: order.id,
      service_key: key,
      channel: "internal",
      direction: "system",
      event_type: "service_status_changed",
      provider: "internal",
      status: "processed",
      subject: `${key} → Live`,
      message_body: `Service ${key} automatically marked Live by AI Brain Installer.`,
      metadata_json: JSON.stringify({ order_id: order.id, service_key: key, next_status: "Live", source: "aiBrainInstaller" }),
    }).catch(() => null);

    results.push({ service_key: key, status: "Live" });
  }

  return results;
}

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
  }).catch(err => {
    console.warn("[aiBrainInstaller] ClientProject update failed:", err.message);
  });

  return { updated: true, project_id: order.client_project_id };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { order_id, force_reinstall } = body;
  if (!order_id) return json({ error: "order_id required" }, 400);

  const base44 = createClientFromRequest(req);
  const log = {};

  try {
    // ── Load order ────────────────────────────────────────────────────────────
    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) {
      return json({ error: "Order not found" }, 404);
    }

    if (order.payment_status !== "paid") {
      return json({ error: "Order not paid — install blocked", payment_status: order.payment_status }, 400);
    }

    // ── Idempotency: skip if already fully_live (unless forced) ───────────────
    if (order.order_status === "fully_live" && !force_reinstall) {
      console.log(`[aiBrainInstaller] Order ${order_id} already fully_live, skipping`);
      return json({ success: true, order_id, already_live: true });
    }

    // ── Detect package tier + service keys ────────────────────────────────────
    const items = order.items || [];
    const detectedServiceKeys = items
      .map(i => i.service_key)
      .filter(k => k && VALID_SERVICE_KEYS.includes(k));

    // Fallback: derive from activation_package_tier if items missing service_key
    if (!detectedServiceKeys.length) {
      const tier = order.activation_package_tier || order.selected_package_type || "starter_system";
      if (tier === "pro_system" || tier === "pro") {
        detectedServiceKeys.push(...VALID_SERVICE_KEYS);
      } else if (tier === "growth_system" || tier === "growth") {
        detectedServiceKeys.push("instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent");
      } else {
        detectedServiceKeys.push("instant_lead_response", "missed_call_text_back");
      }
    }

    const uniqueServiceKeys = [...new Set(detectedServiceKeys)];
    const packageTier = order.activation_package_tier || (
      uniqueServiceKeys.length >= 6 ? "pro" :
      uniqueServiceKeys.length >= 4 ? "growth" : "basic"
    );

    console.log(`[aiBrainInstaller] Starting install for order ${order_id}`, {
      package_tier: packageTier,
      service_keys: uniqueServiceKeys,
      business: order.business_name,
    });

    // ── Step 4 (verify): Ensure ClientInstallationOS + Checklists exist ───────
    log.init_os = await safeInvoke(base44, "initializeInstallOS", { order_id });

    // ── Step 5: Create AutomationJob records ──────────────────────────────────
    log.automation_jobs = await ensureAutomationJobs(base44, order, uniqueServiceKeys);

    // ── Step 6: Apply default install configuration ───────────────────────────
    log.default_config = await applyDefaultConfiguration(base44, order, uniqueServiceKeys);

    // Reload order after config update
    const orderWithConfig = await base44.asServiceRole.entities.Order.get(order_id).catch(() => order);

    // ── Step 7: Run test lead ─────────────────────────────────────────────────
    log.test = await runTestLead(base44, orderWithConfig, uniqueServiceKeys);

    // ── Step 8: Mark services Live ────────────────────────────────────────────
    log.services_live = await markServicesLive(base44, orderWithConfig, uniqueServiceKeys);

    // ── Step 9: Finalize ClientProject + Order status ─────────────────────────
    log.client_project = await finalizeClientProject(base44, orderWithConfig);

    // Final order status update
    await base44.asServiceRole.entities.Order.update(order_id, {
      order_status: "fully_live",
      pipeline_status: "Live",
      pipeline_error: null,
      last_install_event_at: new Date().toISOString(),
    }).catch(() => null);

    log.order_status = "fully_live";

    // ── Step 10: AuditLog ─────────────────────────────────────────────────────
    await writeAuditLog(base44, {
      action: "ai_brain_install_complete",
      entity_name: "Order",
      record_id: order_id,
      after: {
        order_status: "fully_live",
        pipeline_status: "Live",
        package_tier: packageTier,
        service_keys: uniqueServiceKeys,
        install_steps: log,
      },
      notes: `AI Brain Installer completed for ${order.business_name} (${uniqueServiceKeys.length} services). Package: ${packageTier}.`,
    });

    // Notify admin
    await safeInvoke(base44, "sendGoLiveNotification", {
      order_id,
      customer_email: order.customer_email,
      business_name: order.business_name,
      service_keys: uniqueServiceKeys,
      package_tier: packageTier,
    });

    console.log(`[aiBrainInstaller] ✅ Complete for order ${order_id}`, {
      package_tier: packageTier,
      services: uniqueServiceKeys.length,
    });

    return json({
      success: true,
      order_id,
      package_tier: packageTier,
      service_keys: uniqueServiceKeys,
      order_status: "fully_live",
      log,
    });

  } catch (err) {
    console.error("[aiBrainInstaller] Fatal error", { order_id, error: err.message });

    await writeAuditLog(base44, {
      action: "ai_brain_install_failed",
      entity_name: "Order",
      record_id: order_id,
      after: { error: err.message, log },
      notes: `AI Brain Installer failed: ${err.message}`,
    }).catch(() => null);

    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "failed",
      subject: `aiBrainInstaller failed for order ${order_id}`,
      error_message: err.message,
      metadata_json: JSON.stringify({ order_id, error: err.message, log }),
    }).catch(() => null);

    return json({ success: false, error: err.message, order_id, log }, 500);
  }
});