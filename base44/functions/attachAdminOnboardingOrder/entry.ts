import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import {
  AdminOnboardingAttachError,
  attachAdminOnboardingToOrder,
} from "../_shared/adminOnboardingAttach.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const result = await attachAdminOnboardingToOrder({ base44, payload });

    return secureJson(result);
  } catch (error) {
    if (error instanceof AuthGuardError || error instanceof AdminOnboardingAttachError) {
      return secureJson(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status || 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to attach admin onboarding";
    return secureJson({ error: message }, { status: 500 });
  }
});
