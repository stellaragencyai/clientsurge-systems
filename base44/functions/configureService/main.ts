import { secureJson } from "../_shared/response.ts";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
/**
 * Legacy configureService quarantine.
 * Real install state now flows through the canonical install pipeline and
 * remote setup workspace. This function remains only to fail fast and avoid
 * silent side effects from stale callers.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

export async function handleConfigureServiceRequest(req) {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

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

    return secureJson(
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
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }

    return secureJson(
      {
        error: error instanceof Error ? error.message : "Failed to process retired configureService request",
        code: "legacy_configure_service_error",
      },
      { status: 500 }
    );
  }
}

Deno.serve(handleConfigureServiceRequest);
