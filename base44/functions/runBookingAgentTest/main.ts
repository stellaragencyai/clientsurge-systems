import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

/**
 * runBookingAgentTest — AI Booking Agent test endpoint with full observability.
 *
 * Execution flow:
 *   1. Resolve ClientDeployment from order.client_id
 *   2. checkModulePermission() for ai_booking_agent
 *   3. Execute booking simulation (creates CommunicationEvent records)
 *   4. logAutomationExecution()
 *   5. calculateDeploymentHealth() on failure
 *
 * Self-contained — no local imports (installRuntime.js inlined to avoid Module not found).
 */
Deno.serve(async (req) => {
  const _obsStartTime = Date.now();
  let _obsCtx = null;

  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { order_id, lead_name, lead_email, lead_phone, scheduled_at } = payload || {};

    if (!order_id) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // ── 1. DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
    if (order.client_id) {
      try {
        const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: order.client_id, deployment_status: { $in: ["live", "onboarding", "configuring", "ready"] } },
          "-created_date", 1
        );
        const deployment = deployments?.[0] || null;
        if (deployment) {
          const permRes = await base44.asServiceRole.functions.invoke("checkModulePermission", {
            deployment_id: deployment.id, module_key: "ai_booking_agent",
          });
          if (permRes.data?.authorized !== true) {
            await base44.asServiceRole.functions.invoke("logAutomationExecution", {
              client_deployment_id: deployment.id, client_id: order.client_id,
              module_key: "ai_booking_agent", trigger_event: "booking_test",
              execution_status: "blocked",
              error_message: `Module not authorized (reason: ${permRes.data?.reason || "unknown"})`,
              error_code: permRes.data?.reason || "module_not_authorized",
            }).catch(() => {});
            return Response.json({
              error: "Module not authorized for this deployment",
              blocked: true,
              reason: permRes.data?.reason,
            }, { status: 403 });
          }
          _obsCtx = {
            deployment_id: deployment.id,
            client_id: order.client_id,
            module_key: "ai_booking_agent",
            trigger_event: "booking_test",
          };
        }
      } catch (err) {
        console.warn("[runBookingAgentTest] Observability init failed:", err.message);
      }
    }

    // ── 2. Execute booking simulation (inlined — no external import) ──
    const now = new Date().toISOString();
    const bookingLink = order.install_configuration?.services?.ai_booking_agent?.booking_link
      || Deno.env.get("DEFAULT_BOOKING_LINK") || "";
    const bookingMode = order.install_configuration?.services?.ai_booking_agent?.booking_mode || "manual";
    const businessName = order.business_name || "your business";
    const recipientName = lead_name || order.customer_name || "there";
    const firstName = recipientName.split(/\s+/)[0] || "there";
    const recipientPhone = lead_phone || order.customer_phone || "";
    const recipientEmail = lead_email || order.customer_email || "";
    const scheduledTime = scheduled_at || now;

    if (!bookingLink) {
      return Response.json({
        success: false,
        error: "No booking link configured for ai_booking_agent service",
        order_id: order.id,
      }, { status: 409 });
    }

    const confirmationMessage = `Hi ${firstName}! Thanks for reaching out to ${businessName}. Here's your booking link: ${bookingLink}`;

    // Create CommunicationEvent records for the booking simulation
    const createdEvents = [];

    const evt1 = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: order.id,
      client_id: order.client_id || null,
      channel: "internal",
      direction: "system",
      event_type: "runtime_attempt_started",
      provider: "internal",
      status: "processed",
      subject: "AI Booking Agent runtime started",
      message_body: `Booking simulation started for ${businessName}.`,
      metadata_json: JSON.stringify({
        order_id: order.id,
        service_key: "ai_booking_agent",
        runtime_type: "run_booking_agent_test",
        recipient_phone: recipientPhone,
        lead_name: recipientName,
      }),
    }).catch(() => null);
    if (evt1) createdEvents.push(evt1);

    const evt2 = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: order.id,
      client_id: order.client_id || null,
      channel: "internal",
      direction: "system",
      event_type: "booking_simulation_created",
      provider: "internal",
      status: "processed",
      subject: "Booking simulation created",
      message_body: `Booking simulation created for ${businessName}.`,
      metadata_json: JSON.stringify({
        order_id: order.id,
        service_key: "ai_booking_agent",
        booking_link: bookingLink,
        booking_mode: bookingMode,
        confirmation_message: confirmationMessage,
      }),
    }).catch(() => null);
    if (evt2) createdEvents.push(evt2);

    const evt3 = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: order.id,
      client_id: order.client_id || null,
      channel: "internal",
      direction: "outbound",
      event_type: "provider_send_attempted",
      provider: "internal",
      status: "pending",
      subject: "AI Booking Agent provider send attempted",
      message_body: confirmationMessage,
      metadata_json: JSON.stringify({
        order_id: order.id,
        service_key: "ai_booking_agent",
        recipient_phone: recipientPhone,
        recipient_email: recipientEmail,
      }),
    }).catch(() => null);
    if (evt3) createdEvents.push(evt3);

    const providerRef = `booking-test:${order.id}:${Date.now()}`;
    const evt4 = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: order.id,
      client_id: order.client_id || null,
      channel: "internal",
      direction: "outbound",
      event_type: "provider_send_succeeded",
      provider: "internal",
      status: "processed",
      subject: "AI Booking Agent provider send succeeded",
      message_body: confirmationMessage,
      provider_message_id: providerRef,
      metadata_json: JSON.stringify({
        order_id: order.id,
        service_key: "ai_booking_agent",
        booking_link: bookingLink,
        booking_mode: bookingMode,
      }),
    }).catch(() => null);
    if (evt4) createdEvents.push(evt4);

    // Touch order last install event
    await base44.asServiceRole.entities.Order.update(order.id, {
      last_install_event_at: now,
    }).catch(() => {});

    const result = {
      success: true,
      order_id: order.id,
      service_key: "ai_booking_agent",
      runtime_type: "run_booking_agent_test",
      booking_simulation_created: true,
      booking_link: bookingLink,
      booking_mode: bookingMode,
      business_hours: order.install_configuration?.services?.ai_booking_agent?.business_hours || "",
      lead_name: recipientName,
      lead_email: recipientEmail,
      lead_phone: recipientPhone,
      scheduled_at: scheduledTime,
      confirmation_message: confirmationMessage,
      confirmation_event_id: evt4?.id || null,
      created_event_ids: createdEvents.map((e) => e.id),
    };

    // ── 3. DEPLOYMENT OBSERVABILITY: Log successful execution ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke("logAutomationExecution", {
          ..._obsCtx,
          execution_status: "completed",
          response_data: JSON.stringify(result),
          external_provider_reference: providerRef,
          execution_time_ms: Date.now() - _obsStartTime,
        });
      } catch (_) {}
    }

    return Response.json({ success: true, result });
  } catch (error) {
    // ── 4. DEPLOYMENT OBSERVABILITY: Log failed execution + trigger health check ──
    if (_obsCtx) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.functions.invoke("logAutomationExecution", {
          ..._obsCtx,
          execution_status: "failed",
          error_message: error instanceof Error ? error.message : String(error),
          error_code: "booking_agent_failed",
          execution_time_ms: Date.now() - _obsStartTime,
        });
        await base44.asServiceRole.functions.invoke("calculateDeploymentHealth", {
          deployment_id: _obsCtx.deployment_id,
        });
      } catch (_) {}
    }

    const message = error instanceof Error ? error.message : "Failed to run booking agent test";
    return Response.json({ error: message }, { status: 500 });
  }
});