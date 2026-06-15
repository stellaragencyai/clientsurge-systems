import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Simulated order data per pipeline state
const SIM_STATES = {
  paid: {
    pipeline_status: "Paid",
    order_status: "pending_payment",
    payment_status: "paid",
    package_type: "starter_system",
    plan_type: "Starter System",
    services: [
      { service_key: "instant_lead_response", name: "Instant Lead Response", install_status: "Paid" },
      { service_key: "missed_call_text_back", name: "Missed Call Text-Back", install_status: "Paid" },
    ],
    hasSetupInfo: false,
  },
  ready_for_install: {
    pipeline_status: "Ready for Install",
    order_status: "paid_setup_in_progress",
    payment_status: "paid",
    package_type: "starter_system",
    plan_type: "Starter System",
    services: [
      { service_key: "instant_lead_response", name: "Instant Lead Response", install_status: "Ready for Install" },
      { service_key: "missed_call_text_back", name: "Missed Call Text-Back", install_status: "Ready for Install" },
    ],
    hasSetupInfo: true,
  },
  configuring: {
    pipeline_status: "Configuring",
    order_status: "paid_setup_in_progress",
    payment_status: "paid",
    package_type: "starter_system",
    plan_type: "Starter System",
    services: [
      { service_key: "instant_lead_response", name: "Instant Lead Response", install_status: "Configuring" },
      { service_key: "missed_call_text_back", name: "Missed Call Text-Back", install_status: "Paid" },
    ],
    hasSetupInfo: true,
  },
  testing: {
    pipeline_status: "Testing",
    order_status: "paid_setup_in_progress",
    payment_status: "paid",
    package_type: "growth_system",
    plan_type: "Growth System",
    services: [
      { service_key: "instant_lead_response", name: "Instant Lead Response", install_status: "Live" },
      { service_key: "missed_call_text_back", name: "Missed Call Text-Back", install_status: "Live" },
      { service_key: "nurture_sequence_14d", name: "14-Day Nurture Sequence", install_status: "Testing" },
      { service_key: "ai_booking_agent", name: "AI Booking Agent", install_status: "Testing" },
    ],
    hasSetupInfo: true,
  },
  live: {
    pipeline_status: "Live",
    order_status: "fully_live",
    payment_status: "paid",
    package_type: "growth_system",
    plan_type: "Growth System",
    services: [
      { service_key: "instant_lead_response", name: "Instant Lead Response", install_status: "Live" },
      { service_key: "missed_call_text_back", name: "Missed Call Text-Back", install_status: "Live" },
      { service_key: "nurture_sequence_14d", name: "14-Day Nurture Sequence", install_status: "Live" },
      { service_key: "ai_booking_agent", name: "AI Booking Agent", install_status: "Live" },
    ],
    hasSetupInfo: true,
  },
  error: {
    pipeline_status: "Error",
    order_status: "paid_setup_in_progress",
    payment_status: "paid",
    package_type: "growth_system",
    plan_type: "Growth System",
    services: [
      { service_key: "instant_lead_response", name: "Instant Lead Response", install_status: "Live" },
      { service_key: "missed_call_text_back", name: "Missed Call Text-Back", install_status: "Error" },
      { service_key: "nurture_sequence_14d", name: "14-Day Nurture Sequence", install_status: "Error" },
      { service_key: "ai_booking_agent", name: "AI Booking Agent", install_status: "Live" },
    ],
    hasSetupInfo: true,
  },
};

// Simulated events per state
const SIM_EVENTS = {
  paid: [
    { event_type: "order_paid", status: "processed", channel: "internal", direction: "system", provider: "stripe" },
  ],
  ready_for_install: [
    { event_type: "order_paid", status: "processed", channel: "internal", direction: "system", provider: "stripe" },
    { event_type: "install_initialized", status: "processed", channel: "internal", direction: "system", provider: "internal" },
  ],
  configuring: [
    { event_type: "order_paid", status: "processed", channel: "internal", direction: "system", provider: "stripe" },
    { event_type: "install_initialized", status: "processed", channel: "internal", direction: "system", provider: "internal" },
    { event_type: "sms_sent", status: "delivered", channel: "sms", direction: "outbound", provider: "twilio" },
  ],
  testing: [
    { event_type: "order_paid", status: "processed", channel: "internal", direction: "system", provider: "stripe" },
    { event_type: "install_initialized", status: "processed", channel: "internal", direction: "system", provider: "internal" },
    { event_type: "sms_sent", status: "delivered", channel: "sms", direction: "outbound", provider: "twilio" },
    { event_type: "email_sent", status: "sent", channel: "email", direction: "outbound", provider: "resend" },
    { event_type: "service_configuration_updated", status: "processed", channel: "internal", direction: "system", provider: "internal" },
    { event_type: "sms_failed", status: "failed", channel: "sms", direction: "outbound", provider: "twilio", error_message: "Twilio error 30008: Unknown destination handset" },
  ],
  live: [
    { event_type: "order_paid", status: "processed", channel: "internal", direction: "system", provider: "stripe" },
    { event_type: "install_initialized", status: "processed", channel: "internal", direction: "system", provider: "internal" },
    { event_type: "sms_sent", status: "delivered", channel: "sms", direction: "outbound", provider: "twilio" },
    { event_type: "email_sent", status: "sent", channel: "email", direction: "outbound", provider: "resend" },
    { event_type: "lead_created", status: "processed", channel: "internal", direction: "system", provider: "internal" },
    { event_type: "sms_received", status: "received", channel: "sms", direction: "inbound", provider: "twilio" },
    { event_type: "booking_created", status: "processed", channel: "internal", direction: "system", provider: "internal" },
  ],
  error: [
    { event_type: "order_paid", status: "processed", channel: "internal", direction: "system", provider: "stripe" },
    { event_type: "install_initialized", status: "processed", channel: "internal", direction: "system", provider: "internal" },
    { event_type: "sms_failed", status: "failed", channel: "sms", direction: "outbound", provider: "twilio", error_message: "Twilio error 30008: Unknown destination handset" },
    { event_type: "email_failed", status: "failed", channel: "email", direction: "outbound", provider: "resend", error_message: "Resend: Recipient address rejected" },
    { event_type: "service_transition_blocked", status: "failed", channel: "internal", direction: "system", provider: "internal", error_message: "Missing Twilio credentials" },
  ],
};

function buildSimulatedProject(state, simState) {
  const isLive = state === "live";
  return {
    id: "sim_preview_project",
    business_name: "Demo Business (Preview)",
    plan: simState.plan_type,
    quick_start_completed: simState.hasSetupInfo,
    onboarding_completed: simState.hasSetupInfo,
    launch_approved: isLive,
    client_email: "demo@clientsurge.com",
    go_live_date: isLive ? new Date().toISOString().split("T")[0] : null,
  };
}

function buildSimulatedOrder(state, simState) {
  return {
    id: "sim_preview_order",
    business_name: "Demo Business (Preview)",
    customer_name: "Preview Client",
    payment_status: simState.payment_status,
    billing_status: "active",
    pipeline_status: simState.pipeline_status,
    order_status: simState.order_status,
    package_type: simState.package_type,
    selected_package_type: simState.package_type,
    plan_type: simState.plan_type,
    total_setup: 797,
    total_monthly: 497,
    services: simState.services.map((s, i) => ({
      service_key: s.service_key,
      product_name: s.name,
      display_name: s.name,
      install_status: s.install_status,
      tracking_enabled: s.install_status !== "Paid",
      service_access_status: s.install_status === "Live" ? "active" : "pending",
    })),
    pricing_summary: {
      package_key: simState.package_type,
      package_name: simState.plan_type,
      package_service_keys: simState.services.map((s) => s.service_key),
    },
    install_configuration: simState.hasSetupInfo ? {
      shared: { twilio_business_phone: "+16025551234" },
      brand: { business_name: "Demo Business" },
      services: {
        ai_booking_agent: { booking_link: "https://calendly.com/demo" },
      },
    } : null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      return json({ error: "Authentication required" }, 401);
    }

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin access required" }, 403);
    }

    const url = new URL(req.url);
    let simulateState = url.searchParams.get("state");

    // Also accept state from JSON body (for testing and direct invocation)
    if (!simulateState || simulateState === "undefined") {
      try {
        const body = await req.clone().json();
        if (body.state) simulateState = body.state;
      } catch { /* no body or not JSON */ }
    }

    if (!simulateState) simulateState = "paid";

    if (!SIM_STATES[simulateState]) {
      return json({
        error: `Invalid state. Valid states: ${Object.keys(SIM_STATES).join(", ")}`,
      }, 400);
    }

    const simState = SIM_STATES[simulateState];
    const events = SIM_EVENTS[simulateState] || [];
    const project = buildSimulatedProject(simulateState, simState);
    const order = buildSimulatedOrder(simulateState, simState);

    // Add timestamps to events
    const now = new Date().toISOString();
    const enrichedEvents = events.map((e, i) => ({
      ...e,
      id: `sim_event_${i}`,
      created_date: new Date(Date.now() - (events.length - i) * 60000).toISOString(),
      subject: e.event_type.replace(/_/g, " "),
      message_body: e.error_message || `Simulated ${e.event_type} event`,
    }));

    const allLive = (order.services || []).every((s) => s.install_status === "Live");
    const hasFailed = enrichedEvents.some((e) => e.status === "failed");
    const readinessStatus = allLive && !hasFailed ? "Live" : simulateState === "error" ? "Needs Attention" : order.pipeline_status;

    return json({
      success: true,
      project,
      order,
      subscription: {
        id: "sim_sub",
        status: "active",
        plan_name: order.plan_type,
        plan_type: order.plan_type,
        amount: (order.total_monthly || 497) * 100,
        currency: "usd",
        interval: "month",
      },
      link_status: "admin_preview",
      empty_state: false,
      is_admin_preview: true,
      simulated_state: simulateState,
      user_role: user.role,
      health: {
        readiness_status: readinessStatus,
        recent_failed_events_count: enrichedEvents.filter((e) => e.status === "failed").length,
        recent_proof_events_count: enrichedEvents.filter((e) => e.status !== "failed").length,
        recent_events: enrichedEvents,
      },
    });
  } catch (error) {
    console.error("[getAdminPreviewData] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});