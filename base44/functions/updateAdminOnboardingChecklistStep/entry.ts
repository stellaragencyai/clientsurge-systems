import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { onboarding_client_id, step_key, value } = payload || {};

    if (!onboarding_client_id || !step_key) {
      return Response.json({ error: "onboarding_client_id and step_key are required" }, { status: 400 });
    }

    const client = await base44.asServiceRole.entities.OnboardingClient.get(onboarding_client_id);
    if (!client) {
      return Response.json({ error: "Onboarding client not found" }, { status: 404 });
    }

    const updated = await base44.asServiceRole.entities.OnboardingClient.update(onboarding_client_id, {
      [step_key]: value,
    });

    return Response.json({ success: true, onboarding_client: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update onboarding checklist";
    return Response.json({ error: message }, { status: 500 });
  }
});