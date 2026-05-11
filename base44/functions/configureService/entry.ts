/**
 * Legacy configureService quarantine.
 * Real install state now flows through the canonical install pipeline and
 * remote setup workspace. This function remains only to fail fast and avoid
 * silent side effects from stale callers.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

export async function handleConfigureServiceRequest(req) {
  const base44 = createClientFromRequest(req);

  let payload = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const orderId = typeof payload.order_id === "string" ? payload.order_id.trim() : "";
  const serviceKey =
    typeof payload.service_key === "string" ? payload.service_key.trim() : "";

  if (orderId && serviceKey) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id: orderId,
      service_key: serviceKey,
      channel: "internal",
      direction: "system",
      event_type: "service_transition_blocked",
      provider: "internal",
      status: "failed",
      subject: "Legacy configureService blocked",
      message_body:
        "configureService is retired. Use the canonical install pipeline and install workspace instead.",
      context_type: "legacy_quarantine",
      context_id: `configureService:${orderId}:${serviceKey}`,
      metadata_json: JSON.stringify({
        replacement_function: "installPipeline",
        action: "update_install_configuration/update_status",
      }),
    }).catch(() => null);
  }

  return Response.json(
    {
      success: false,
      retired: true,
      code: "legacy_configure_service_retired",
      error:
        "configureService is retired. Use the canonical install pipeline and install workspace instead.",
      order_id: orderId || null,
      service_key: serviceKey || null,
      replacement_function: "installPipeline",
      replacement_actions: ["update_install_configuration", "update_status"],
    },
    { status: 410 }
  );
}

Deno.serve(handleConfigureServiceRequest);
