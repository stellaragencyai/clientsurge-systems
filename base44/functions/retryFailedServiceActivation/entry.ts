/**
 * Legacy retry path quarantine.
 * The old configureService retry branch is retired to prevent stale automation
 * from mutating install state outside the canonical install pipeline.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { requireAdminUser } from "../_shared/authGuards.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const { order_id, service_key, first_attempt_error } = await req.json();

    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "retryFailedServiceActivation",
      log_type: "error",
      summary: `Legacy retry blocked for ${service_key || "unknown_service"} on order ${order_id || "unknown_order"}`,
      details: JSON.stringify({
        first_attempt_error,
        retired: true,
        replacement_function: "installPipeline",
      }),
      service: "install_pipeline",
      requires_nolan: true,
      resolved: false,
    }).catch(() => {});

    return Response.json(
      {
        success: false,
        retired: true,
        order_id: order_id || null,
        service_key: service_key || null,
        code: "legacy_retry_failed_service_activation_retired",
        error:
          "retryFailedServiceActivation is retired. Use the canonical install pipeline and install workspace instead.",
      },
      { status: 410 }
    );
  } catch (err) {
    return Response.json(
      {
        error: err.message,
        code: err.code || "retry_failed_service_activation_error",
      },
      { status: err.status || 500 }
    );
  }
});
