import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { saveAdminSettings } from "../_shared/adminSettings.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));

    const settings = await saveAdminSettings({
      base44,
      actor: user,
      patch: payload?.settings || {},
    });

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

    const message = error instanceof Error ? error.message : "Failed to update admin settings";
    return Response.json({ error: message }, { status: 500 });
  }
});
