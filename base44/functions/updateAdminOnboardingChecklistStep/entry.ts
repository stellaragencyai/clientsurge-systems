import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  OnboardingMirrorMutationError,
  updateAdminOnboardingChecklistStep,
} from "../_shared/onboardingMirrorControls.js";

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const payload = await req.json().catch(() => ({}));
    const updated = await updateAdminOnboardingChecklistStep({
      base44,
      onboardingClientId: payload?.onboarding_client_id,
      stepKey: payload?.step_key,
      value: payload?.value,
    });

    return Response.json({
      success: true,
      onboarding_client: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update onboarding checklist";
    const status =
      message === "Admin access required" ? 403 :
      error instanceof OnboardingMirrorMutationError ? error.status :
      500;

    return Response.json(
      {
        error: message,
        code: error instanceof OnboardingMirrorMutationError ? error.code : undefined,
      },
      { status }
    );
  }
});
