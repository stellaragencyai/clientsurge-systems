import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import {
  AssistedDeploymentError,
  executeAssistedSetupSequence,
} from "../_shared/assistedDeployment.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const {
      order_id,
      confirmed = false,
      selected_service_keys = [],
      target_phone = "",
      target_email = "",
      note = "",
    } = payload || {};

    if (!order_id) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await executeAssistedSetupSequence({
      base44,
      order,
      confirmed: Boolean(confirmed),
      selectedServiceKeys: Array.isArray(selected_service_keys) ? selected_service_keys : [],
      targetPhone: target_phone,
      targetEmail: target_email,
      note,
    });

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to run assisted setup sequence";
    const status =
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 :
      error instanceof AssistedDeploymentError ? error.status || 409 :
      500;

    return Response.json(
      {
        error: message,
        details: error instanceof AssistedDeploymentError ? error.details : undefined,
      },
      { status }
    );
  }
});
