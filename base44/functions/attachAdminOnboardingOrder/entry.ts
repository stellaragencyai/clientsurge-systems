import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  AdminOnboardingAttachError,
  attachAdminOnboardingToOrder,
} from "../_shared/adminOnboardingAttach.js";

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
    const result = await attachAdminOnboardingToOrder({
      base44,
      payload,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to attach admin onboarding";
    const status =
      message === "Admin access required" ? 403 :
      error instanceof AdminOnboardingAttachError ? error.status :
      500;

    return Response.json(
      {
        error: message,
        code: error instanceof AdminOnboardingAttachError ? error.code : undefined,
      },
      { status }
    );
  }
});
