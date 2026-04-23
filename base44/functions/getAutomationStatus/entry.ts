import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { deriveAutomationStatuses } from "../_shared/automationStatus.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const [orders, events] = await Promise.all([
      base44.asServiceRole.entities.Order.list("-created_date", 100).catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 500).catch(() => []),
    ]);

    const automations = deriveAutomationStatuses({
      orders,
      events,
    });

    return Response.json({
      automations,
      summary: {
        canonical_services_tracked: automations.filter((automation) => automation.supported).length,
        live_services: automations.filter((automation) => automation.state === "live").length,
        errored_services: automations.filter((automation) => automation.state === "error").length,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to derive automation status",
      },
      { status: 500 }
    );
  }
});
