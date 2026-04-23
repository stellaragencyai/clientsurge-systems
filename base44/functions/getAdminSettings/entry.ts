import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { loadAdminSettings } from "../_shared/adminSettings.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const { settings } = await loadAdminSettings(base44);

    return Response.json({
      success: true,
      settings,
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

    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return Response.json({ error: message }, { status: 500 });
  }
});
