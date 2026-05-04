/**
 * aiPackageOrchestrator
 * Smart remote activation brain.
 *
 * Reads order package_key → determines canonical service list →
 * resolves optimal activation sequence → calls configureService per
 * service in order, skipping blockers and continuing on individual failures.
 *
 * Steps (smallest possible):
 *   1. Validate order + resolve package services
 *   2. Ensure InstallOS is initialized (idempotent)
 *   3. Call generateServiceTemplates (AI personalization)
 *   4. For each service in sequence: invoke configureService
 *   5. Track partial success — write activation_errors to Order
 *   6. On full completion, send go-live notification
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TIER_SERVICE_MAP = {
  starter_system: ["instant_lead_response", "ai_booking_agent"],
  growth_system:  ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
  elite_system:   ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent", "lead_reactivation", "review_request"],
};

// Optimal activation sequence — fastest wins first, blockers last
const ACTIVATION_SEQUENCE = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "review_request",
  "lead_reactivation",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { order_id, package_key, service_keys } = await req.json();
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Step 1: Resolve canonical service list
    const resolvedPackageKey = package_key || order.pricing_summary?.package_key || order.package_type;
    let services = service_keys || (resolvedPackageKey ? TIER_SERVICE_MAP[resolvedPackageKey] : null);

    if (!services || services.length === 0) {
      // Derive from order items
      services = (order.items || []).map(i => i.service_key).filter(Boolean);
    }

    if (!services || services.length === 0) {
      return Response.json({ error: "No services found for this order" }, { status: 400 });
    }

    // Sort services by optimal activation sequence
    const orderedServices = ACTIVATION_SEQUENCE.filter(sk => services.includes(sk));
    const extras = services.filter(sk => !ACTIVATION_SEQUENCE.includes(sk));
    const finalOrder = [...orderedServices, ...extras];

    console.log(`[Orchestrator] Activating ${finalOrder.length} services for order ${order_id}: ${finalOrder.join(", ")}`);

    // Step 2: Ensure InstallOS is initialized (idempotent)
    try {
      await base44.asServiceRole.functions.invoke("initializeInstallOS", { order_id });
      console.log(`[Orchestrator] InstallOS initialized for ${order_id}`);
    } catch (e) {
      console.warn(`[Orchestrator] InstallOS init warning (may already exist): ${e.message}`);
    }

    // Step 3: Generate AI-personalized templates first
    try {
      await base44.asServiceRole.functions.invoke("generateServiceTemplates", {
        order_id,
        service_keys: finalOrder,
      });
      console.log(`[Orchestrator] AI templates generated`);
    } catch (e) {
      console.warn(`[Orchestrator] Template generation warning (using fallbacks): ${e.message}`);
    }

    // Step 4: Activate each service sequentially, track results
    const results = [];
    const activation_errors = [];
    const services_queued = [];

    for (const sk of finalOrder) {
      console.log(`[Orchestrator] Activating: ${sk}`);
      try {
        await base44.asServiceRole.functions.invoke("configureService", {
          order_id,
          service_key: sk,
        });
        results.push({ service_key: sk, status: "activated" });
        services_queued.push(sk);
        console.log(`[Orchestrator] ✓ ${sk} activated`);
      } catch (e) {
        console.error(`[Orchestrator] ✗ ${sk} failed: ${e.message}`);
        activation_errors.push({
          service_key: sk,
          error_message: e.message,
          failed_at: new Date().toISOString(),
          retry_count: 0,
        });
        results.push({ service_key: sk, status: "error", error: e.message });
        // Continue — do NOT halt other services on one failure
      }
    }

    // Step 5: Write activation_errors to Order
    if (activation_errors.length > 0) {
      await base44.asServiceRole.entities.Order.update(order_id, {
        activation_errors,
        last_install_event_at: new Date().toISOString(),
      });
    }

    // Step 6: If all services configured, send go-live notification
    const allSuccess = activation_errors.length === 0;
    if (allSuccess) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: order.customer_email,
          subject: "🚀 Your ClientSurge Systems Are Activating Now",
          body: `<p>Hi ${order.customer_name},</p><p>Your AI automation systems are being activated right now. You'll receive a confirmation once everything is live.</p><p>— ClientSurge Systems</p>`,
          from_name: "ClientSurge Systems",
        });
      } catch (e) {
        console.warn(`[Orchestrator] Go-live email failed: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      services_queued,
      activation_errors,
      results,
      message: allSuccess
        ? `All ${services_queued.length} services activated successfully`
        : `${services_queued.length} activated, ${activation_errors.length} failed — check activation_errors`,
    });
  } catch (error) {
    console.error("[aiPackageOrchestrator] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});