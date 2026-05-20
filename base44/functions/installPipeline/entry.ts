import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TRACKED_SERVICES = {
  prod_UNi5RHiKNSTfQl: { service_key: "instant_lead_response", display_name: "Instant Lead Response" },
  prod_UNi5QL0bQl98If: { service_key: "missed_call_text_back", display_name: "Missed Call Text-Back" },
  prod_UNi5N0l5MtaV0R: { service_key: "nurture_sequence_14d", display_name: "14-Day Nurture Sequence" },
  prod_UNi5fLL2SyJJdP: { service_key: "ai_booking_agent", display_name: "AI Booking Agent" },
  prod_UNi5PWv05ECzXI: { service_key: "lead_reactivation", display_name: "Old Lead Reactivation" },
  prod_UNi5dvOUm6Fi9i: { service_key: "review_request", display_name: "Review Request Automation" },
};

const VALID_TRANSITIONS = {
  Paid: ["Ready for Install"],
  "Ready for Install": ["Configuring"],
  Configuring: ["Testing"],
  Testing: ["Live", "Error"],
  Live: ["Live"],
  Error: ["Ready for Install", "Configuring"],
};

const RUNTIME_READY_STATUSES = ["Testing", "Live"];

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") throw new Error("Admin access required");
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstName(value) {
  return clean(value).split(/\s+/)[0] || "there";
}

function normalizePhone(value) {
  const raw = clean(value);
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `+1${digits}` : digits ? `+${digits}` : "";
}

function trackedItems(items = []) {
  return items
    .map((item) => {
      const mapped = item.service_key ? null : TRACKED_SERVICES[item.product_id];
      return mapped
        ? { ...item, ...mapped, tracking_enabled: true, install_status: item.install_status || "Ready for Install" }
        : { ...item, tracking_enabled: item.tracking_enabled || Boolean(item.service_key) };
    })
    .filter((item) => item.tracking_enabled && item.service_key);
}

function pipelineStatus(items = []) {
  const statuses = trackedItems(items).map((item) => item.install_status || "Ready for Install");
  if (!statuses.length) return "Error";
  if (statuses.every((status) => status === "Live")) return "Live";
  if (statuses.some((status) => status === "Error")) return "Error";
  if (statuses.some((status) => status === "Testing")) return "Testing";
  if (statuses.some((status) => status === "Configuring")) return "Configuring";
  if (statuses.some((status) => status === "Ready for Install")) return "Ready for Install";
  return "Paid";
}

function mergeConfig(existing = {}, patch = {}) {
  const services = patch.services || {};
  return {
    ...existing,
    ...(patch.shared ? { shared: { ...(existing.shared || {}), ...patch.shared } } : {}),
    ...(patch.services
      ? {
          services: Object.fromEntries(
            Object.entries({ ...(existing.services || {}), ...services }).map(([key, value]) => [
              key,
              { ...(existing.services?.[key] || {}), ...(value || {}) },
            ])
          ),
        }
      : {}),
  };
}

function serviceConfig(order, serviceKey) {
  return order.install_configuration?.services?.[serviceKey] || {};
}

function sharedConfig(order) {
  return order.install_configuration?.shared || {};
}

function render(template, values) {
  return clean(template).replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (_match, key) => clean(values[key]) || "");
}

function validateConfig(order, serviceKey) {
  const shared = sharedConfig(order);
  const config = serviceConfig(order, serviceKey);
  const missing = [];
  if (!clean(shared.twilio_business_phone)) missing.push("shared.twilio_business_phone");
  if (!clean(shared.business_hours)) missing.push("shared.business_hours");

  if (serviceKey === "nurture_sequence_14d") {
    if (!config.sms_enabled && !config.email_enabled) missing.push("services.nurture_sequence_14d.channels");
    if (!Array.isArray(config.steps) || config.steps.length < 3) missing.push("services.nurture_sequence_14d.steps");
    if ((config.steps || []).some((step) => !Number(step.day) || !clean(step.channel) || !clean(step.message_template))) {
      missing.push("services.nurture_sequence_14d.step_templates");
    }
  }

  if (serviceKey === "ai_booking_agent") {
    if (!clean(config.booking_link)) missing.push("services.ai_booking_agent.booking_link");
    if (!clean(config.booking_mode)) missing.push("services.ai_booking_agent.booking_mode");
    if (!clean(config.confirmation_template)) missing.push("services.ai_booking_agent.confirmation_template");
    if (!Array.isArray(config.intake_fields) || !config.intake_fields.length) {
      missing.push("services.ai_booking_agent.intake_fields");
    }
  }

  if (serviceKey === "lead_reactivation") {
    if (!clean(config.target_segment)) missing.push("services.lead_reactivation.target_segment");
    if (!clean(config.message_template)) missing.push("services.lead_reactivation.message_template");
    if (!Number.isFinite(Number(config.max_batch_size)) || Number(config.max_batch_size) <= 0) {
      missing.push("services.lead_reactivation.max_batch_size");
    }
  }

  if (serviceKey === "review_request") {
    if (!clean(config.review_link)) missing.push("services.review_request.review_link");
    if (!clean(config.trigger_event)) missing.push("services.review_request.trigger_event");
    if (!clean(config.message_template)) missing.push("services.review_request.message_template");
    if (!["sms", "email"].includes(config.channel)) missing.push("services.review_request.channel");
  }

  return { valid: missing.length === 0, missing_fields: missing };
}

async function event(base44, order, patch) {
  return await base44.asServiceRole.entities.CommunicationEvent.create({
    order_id: order.id,
    service_key: patch.service_key,
    context_type: "install_pipeline",
    context_id: order.id,
    channel: patch.channel || "internal",
    direction: patch.direction || "system",
    event_type: patch.event_type,
    provider: patch.provider || "internal",
    status: patch.status || "processed",
    subject: patch.subject,
    message_body: patch.message_body,
    provider_message_id: patch.provider_message_id,
    error_message: patch.error_message,
    metadata_json: JSON.stringify({
      order_id: order.id,
      service_key: patch.service_key,
      runtime_type: patch.runtime_type,
      ...(patch.metadata || {}),
    }),
  });
}

async function sendTwilio({ to, from, body }) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
  if (!accountSid || !authToken || !from) throw new Error("Twilio credentials missing");

  const params = { To: to, From: from, Body: body };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Twilio error: ${json?.message || response.status}`);
  return { provider_message_id: json.sid, provider_status: json.status || "queued" };
}

async function sendResend({ to, subject, body }) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "ClientSurge Systems <noreply@clientsurgesystems.com>";
  if (!resendKey) throw new Error("Resend API key missing");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      text: body,
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Resend error: ${json?.message || response.status}`);
  return { provider_message_id: json.id, provider_status: "sent" };
}

async function runNurtureTest(base44, order, payload) {
  const item = trackedItems(order.items).find((candidate) => candidate.service_key === "nurture_sequence_14d");
  if (!item || !RUNTIME_READY_STATUSES.includes(item.install_status)) {
    throw new Error("14-Day Nurture Sequence is not runtime-ready.");
  }
  const validation = validateConfig(order, "nurture_sequence_14d");
  if (!validation.valid) throw new Error(`Nurture configuration incomplete: ${validation.missing_fields.join(", ")}`);

  const config = serviceConfig(order, "nurture_sequence_14d");
  const step = config.steps[Number(payload.step_index) || 0];
  const shared = sharedConfig(order);
  const recipientPhone = normalizePhone(payload.target_phone || order.customer_phone);
  const recipientEmail = clean(payload.target_email || order.customer_email);
  const message = render(step.message_template, {
    first_name: firstName(order.customer_name),
    customer_name: order.customer_name,
    business_name: order.business_name,
    business_phone: shared.twilio_business_phone,
    twilio_business_phone: shared.twilio_business_phone,
    business_hours: shared.business_hours,
    opt_out_message: shared.opt_out_message || "Reply STOP to opt out.",
    recipient_phone: recipientPhone,
    recipient_email: recipientEmail,
    day: step.day,
    channel: step.channel,
  });

  await event(base44, order, {
    service_key: "nurture_sequence_14d",
    event_type: "runtime_attempt_started",
    runtime_type: "run_nurture_sequence_test",
    subject: "Nurture sequence runtime test started",
    message_body: message,
    metadata: { step_index: Number(payload.step_index) || 0, step },
  });

  if (step.channel === "sms") {
    if (!recipientPhone) throw new Error("Recipient phone is required for SMS nurture tests.");
    await event(base44, order, {
      service_key: "nurture_sequence_14d",
      event_type: "provider_send_attempted",
      runtime_type: "run_nurture_sequence_test",
      channel: "sms",
      provider: "twilio",
      message_body: message,
      metadata: { recipient_phone: recipientPhone },
    });
    const sent = await sendTwilio({ to: recipientPhone, from: shared.twilio_business_phone, body: message });
    await event(base44, order, {
      service_key: "nurture_sequence_14d",
      event_type: "provider_send_succeeded",
      runtime_type: "run_nurture_sequence_test",
      channel: "sms",
      provider: "twilio",
      status: "sent",
      message_body: message,
      provider_message_id: sent.provider_message_id,
      metadata: { recipient_phone: recipientPhone, provider_status: sent.provider_status },
    });
    return { service_key: "nurture_sequence_14d", channel: "sms", recipient_phone: recipientPhone, provider_message_id: sent.provider_message_id };
  }

  if (!recipientEmail) throw new Error("Recipient email is required for email nurture tests.");
  const sent = await sendResend({
    to: recipientEmail,
    subject: `${order.business_name} nurture sequence test`,
    body: message,
  });
  await event(base44, order, {
    service_key: "nurture_sequence_14d",
    event_type: "provider_send_succeeded",
    runtime_type: "run_nurture_sequence_test",
    channel: "email",
    provider: "resend",
    status: "sent",
    message_body: message,
    provider_message_id: sent.provider_message_id,
    metadata: { recipient_email: recipientEmail, provider_status: sent.provider_status },
  });
  return {
    service_key: "nurture_sequence_14d",
    channel: "email",
    recipient_email: recipientEmail,
    provider_message_id: sent.provider_message_id,
  };
}

async function runBookingTest(base44, order, payload) {
  const item = trackedItems(order.items).find((candidate) => candidate.service_key === "ai_booking_agent");
  if (!item || !RUNTIME_READY_STATUSES.includes(item.install_status)) {
    throw new Error("AI Booking Agent is not runtime-ready.");
  }
  const validation = validateConfig(order, "ai_booking_agent");
  if (!validation.valid) throw new Error(`Booking configuration incomplete: ${validation.missing_fields.join(", ")}`);

  const config = serviceConfig(order, "ai_booking_agent");
  const runtime = {
    lead_name: clean(payload.lead_name) || "Booking Test Lead",
    lead_email: clean(payload.lead_email || order.customer_email),
    lead_phone: normalizePhone(payload.lead_phone || order.customer_phone),
    scheduled_at: clean(payload.scheduled_at) || new Date().toISOString(),
    booking_link: config.booking_link,
  };
  const confirmation = render(config.confirmation_template, {
    ...runtime,
    first_name: firstName(runtime.lead_name),
    customer_name: runtime.lead_name,
    business_name: order.business_name,
    booking_link: config.booking_link,
    scheduled_at: runtime.scheduled_at,
  });

  await event(base44, order, {
    service_key: "ai_booking_agent",
    event_type: "runtime_attempt_started",
    runtime_type: "run_booking_agent_test",
    subject: "Booking agent runtime test started",
    message_body: confirmation,
    metadata: runtime,
  });
  await event(base44, order, {
    service_key: "ai_booking_agent",
    event_type: "booking_simulation_created",
    runtime_type: "run_booking_agent_test",
    subject: "Booking simulation created",
    message_body: `Booking simulation created for ${order.business_name}.`,
    metadata: { ...runtime, booking_mode: config.booking_mode },
  });
  const success = await event(base44, order, {
    service_key: "ai_booking_agent",
    event_type: "provider_send_succeeded",
    runtime_type: "run_booking_agent_test",
    channel: "internal",
    provider: "internal",
    subject: "Booking confirmation simulated",
    message_body: confirmation,
    provider_message_id: `booking-test:${order.id}:${Date.now()}`,
    metadata: runtime,
  });
  return {
    service_key: "ai_booking_agent",
    booking_simulation_created: true,
    booking_link: config.booking_link,
    booking_mode: config.booking_mode,
    confirmation_message: confirmation,
    created_event_ids: [success.id],
  };
}

async function runLeadReactivationTest(base44, order, payload) {
  const item = trackedItems(order.items).find((candidate) => candidate.service_key === "lead_reactivation");
  if (!item || !RUNTIME_READY_STATUSES.includes(item.install_status)) {
    throw new Error("Old Lead Reactivation is not runtime-ready.");
  }
  const validation = validateConfig(order, "lead_reactivation");
  if (!validation.valid) throw new Error(`Lead reactivation configuration incomplete: ${validation.missing_fields.join(", ")}`);

  const config = serviceConfig(order, "lead_reactivation");
  const maxBatchSize = Math.max(1, Math.min(Number(payload.max_test_leads) || 3, Number(config.max_batch_size) || 25));
  const leads = await base44.asServiceRole.entities.Leads.list("-created_date", 100);
  const selectedLeads = (leads || [])
    .filter((lead) => !["Booked", "Closed"].includes(lead.status))
    .slice(0, maxBatchSize);

  await event(base44, order, {
    service_key: "lead_reactivation",
    event_type: "runtime_attempt_started",
    runtime_type: "run_reactivation_test",
    subject: "Lead reactivation test started",
    message_body: `Testing ${selectedLeads.length} old-lead reactivation target(s).`,
    metadata: {
      target_segment: config.target_segment,
      max_batch_size: config.max_batch_size,
      selected_lead_count: selectedLeads.length,
    },
  });

  const createdEventIds = [];
  for (const lead of selectedLeads) {
    const message = render(config.message_template, {
      lead_name: clean(lead.full_name) || "there",
      first_name: firstName(lead.full_name),
      business_name: order.business_name,
      lead_email: lead.email,
      lead_phone: lead.phone,
      target_segment: config.target_segment,
    });
    const success = await event(base44, order, {
      service_key: "lead_reactivation",
      event_type: "provider_send_succeeded",
      runtime_type: "run_reactivation_test",
      channel: "internal",
      provider: "internal",
      status: "processed",
      subject: "Lead reactivation message simulated",
      message_body: message,
      provider_message_id: `reactivation:${order.id}:${lead.id}`,
      metadata: {
        lead_id: lead.id,
        lead_name: lead.full_name,
        lead_email: lead.email,
        lead_phone: lead.phone,
        target_segment: config.target_segment,
      },
    });
    createdEventIds.push(success.id);
  }

  const summary = await event(base44, order, {
    service_key: "lead_reactivation",
    event_type: "lead_reactivation_batch_completed",
    runtime_type: "run_reactivation_test",
    subject: "Lead reactivation batch test completed",
    message_body: `Lead reactivation test selected ${selectedLeads.length} target(s).`,
    metadata: {
      target_segment: config.target_segment,
      selected_lead_ids: selectedLeads.map((lead) => lead.id),
      selected_lead_count: selectedLeads.length,
      max_batch_size: config.max_batch_size,
    },
  });

  return {
    service_key: "lead_reactivation",
    target_segment: config.target_segment,
    target_size: selectedLeads.length,
    selected_lead_ids: selectedLeads.map((lead) => lead.id),
    summary_event_id: summary.id,
    created_event_ids: [...createdEventIds, summary.id],
  };
}

async function runReviewRequestTest(base44, order, payload) {
  const item = trackedItems(order.items).find((candidate) => candidate.service_key === "review_request");
  if (!item || !RUNTIME_READY_STATUSES.includes(item.install_status)) {
    throw new Error("Review Request Automation is not runtime-ready.");
  }
  const validation = validateConfig(order, "review_request");
  if (!validation.valid) throw new Error(`Review request configuration incomplete: ${validation.missing_fields.join(", ")}`);

  const config = serviceConfig(order, "review_request");
  const recipientPhone = normalizePhone(payload.target_phone || order.customer_phone);
  const recipientEmail = clean(payload.target_email || order.customer_email);
  if (config.channel === "sms" && !recipientPhone) throw new Error("Recipient phone is required for SMS review tests.");
  if (config.channel === "email" && !recipientEmail) throw new Error("Recipient email is required for email review tests.");

  const message = render(config.message_template, {
    first_name: firstName(payload.customer_name || order.customer_name),
    customer_name: clean(payload.customer_name || order.customer_name),
    business_name: order.business_name,
    review_link: config.review_link,
    trigger_event: payload.trigger_event || config.trigger_event,
    customer_email: recipientEmail,
    customer_phone: recipientPhone,
  });
  const runtime = {
    trigger_event: payload.trigger_event || config.trigger_event,
    configured_trigger_event: config.trigger_event,
    channel: config.channel,
    review_link: config.review_link,
    send_delay_minutes: config.send_delay_minutes,
    fallback_internal_feedback_enabled: Boolean(config.fallback_internal_feedback_enabled),
    recipient_email: recipientEmail,
    recipient_phone: config.channel === "sms" ? recipientPhone : "",
  };

  await event(base44, order, {
    service_key: "review_request",
    event_type: "runtime_attempt_started",
    runtime_type: "run_review_request_test",
    subject: "Review request runtime test started",
    message_body: message,
    metadata: runtime,
  });
  await event(base44, order, {
    service_key: "review_request",
    event_type: "review_request_trigger_simulated",
    runtime_type: "run_review_request_test",
    subject: "Review request trigger simulated",
    message_body: `Review request trigger ${runtime.trigger_event} simulated.`,
    metadata: runtime,
  });
  const success = await event(base44, order, {
    service_key: "review_request",
    event_type: "provider_send_succeeded",
    runtime_type: "run_review_request_test",
    channel: config.channel,
    provider: "internal",
    status: "processed",
    subject: "Review request message simulated",
    message_body: message,
    provider_message_id: `review-request:${order.id}:${Date.now()}`,
    metadata: runtime,
  });

  return {
    service_key: "review_request",
    trigger_event: runtime.trigger_event,
    channel: config.channel,
    review_link: config.review_link,
    recipient_phone: config.channel === "sms" ? recipientPhone : null,
    recipient_email: config.channel === "email" ? recipientEmail : null,
    message_preview: message,
    created_event_ids: [success.id],
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { action, order_id } = payload;

    if (action === "initialize") {
      if (!order_id) return Response.json({ error: "order_id is required" }, { status: 400 });
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      const items = trackedItems(order.items || []);
      const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: "paid",
        items: (order.items || []).map((item) => items.find((tracked) => tracked.product_id === item.product_id) || item),
        pipeline_status: pipelineStatus(items),
        install_initialized_at: order.install_initialized_at || new Date().toISOString(),
        last_install_event_at: new Date().toISOString(),
      });
      return Response.json({ success: true, order: updatedOrder });
    }

    if (action === "list_queue") {
      await requireAdmin(base44);
      const orders = await base44.asServiceRole.entities.Order.list("-created_date", 100);
      return Response.json({
        success: true,
        orders: (orders || []).filter((order) => order.payment_status === "paid" && trackedItems(order.items).length),
      });
    }

    if (action === "update_configuration" || action === "update_config") {
      await requireAdmin(base44);
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      const config = mergeConfig(order.install_configuration || {}, { shared: payload.shared, services: payload.services });
      const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
        install_configuration: config,
        install_configuration_updated_at: new Date().toISOString(),
        last_install_event_at: new Date().toISOString(),
      });
      await event(base44, updatedOrder, {
        service_key: "install_configuration",
        event_type: "service_configuration_updated",
        subject: "Install configuration updated",
        message_body: payload.note || "Install configuration updated.",
        metadata: { updated_services: Object.keys(payload.services || {}) },
      });
      return Response.json({ success: true, order: updatedOrder });
    }

    if (action === "update_status") {
      await requireAdmin(base44);
      const { service_key, install_status, note } = payload;
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      const items = trackedItems(order.items || []);
      const target = items.find((item) => item.service_key === service_key);
      if (!target) return Response.json({ error: "Service not found on order" }, { status: 404 });
      const current = target.install_status || "Ready for Install";
      if (!VALID_TRANSITIONS[current]?.includes(install_status)) {
        return Response.json({ error: `Invalid transition: ${current} -> ${install_status}` }, { status: 409 });
      }
      if (["Testing", "Live"].includes(install_status)) {
        const validation = validateConfig(order, service_key);
        if (!validation.valid) {
          await event(base44, order, {
            service_key,
            event_type: "service_transition_blocked",
            subject: "Service transition blocked",
            message_body: `Blocked transition to ${install_status}: ${validation.missing_fields.join(", ")}`,
            metadata: { validation },
          });
          return Response.json({ error: "Configuration incomplete", details: { validation } }, { status: 409 });
        }
      }
      const updatedItems = (order.items || []).map((item) =>
        (item.service_key || TRACKED_SERVICES[item.product_id]?.service_key) === service_key
          ? {
              ...item,
              service_key,
              display_name: item.display_name || target.display_name,
              tracking_enabled: true,
              install_status,
              status: install_status === "Live" ? "live" : install_status === "Paid" ? "pending" : "setting_up",
              install_started_at: install_status === "Configuring" && !item.install_started_at ? new Date().toISOString() : item.install_started_at,
              install_completed_at: install_status === "Live" ? new Date().toISOString() : item.install_completed_at,
              install_error: install_status === "Error" ? note || "Install error" : undefined,
            }
          : item
      );
      const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
        items: updatedItems,
        pipeline_status: pipelineStatus(updatedItems),
        last_install_event_at: new Date().toISOString(),
      });
      await event(base44, updatedOrder, {
        service_key,
        event_type: "service_status_changed",
        subject: "Service status changed",
        message_body: `${service_key}: ${current} -> ${install_status}`,
        metadata: { previous_status: current, next_status: install_status, note },
      });
      return Response.json({ success: true, order: updatedOrder });
    }

    if (action === "run_nurture_sequence_test") {
      await requireAdmin(base44);
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      const result = await runNurtureTest(base44, order, payload);
      return Response.json({ success: true, result });
    }

    if (action === "run_booking_agent_test") {
      await requireAdmin(base44);
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      const result = await runBookingTest(base44, order, payload);
      return Response.json({ success: true, result });
    }

    if (action === "run_reactivation_test") {
      await requireAdmin(base44);
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      const result = await runLeadReactivationTest(base44, order, payload);
      return Response.json({ success: true, result });
    }

    if (action === "run_review_request_test") {
      await requireAdmin(base44);
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      const result = await runReviewRequestTest(base44, order, payload);
      return Response.json({ success: true, result });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Install pipeline action failed";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message.includes("required") ? 400 :
      message.includes("not runtime-ready") || message.includes("incomplete") ? 409 :
      500;
    return Response.json({ error: message }, { status });
  }
});
