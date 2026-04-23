import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { loadAdminSettings } from "../_shared/adminSettings.js";
import { deriveIntegrationHealth } from "../_shared/integrationHealth.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const [{ settings }, events] = await Promise.all([
      loadAdminSettings(base44),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 50),
    ]);

    const snapshot = deriveIntegrationHealth({
      settings,
      events,
    });

    return Response.json({
      success: true,
      generated_at: new Date().toISOString(),
      ...snapshot,
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

    const message = error instanceof Error ? error.message : "Failed to load integration health";
    return Response.json({ error: message }, { status: 500 });
  }
});
