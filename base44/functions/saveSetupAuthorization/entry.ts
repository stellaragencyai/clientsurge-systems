import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const AGREEMENT_VERSION = "2026-06-26-v1";

const ALL_SCOPES = [
  "website_form_edits",
  "dns_records",
  "email_authentication",
  "sms_email_automation",
  "tracking_scripts",
  "twilio_call_forwarding",
  "booking_integration",
  "test_leads",
  "temp_credentials_fallback",
  "client_go_live_approval",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, client_id, client_project_id, accepted_scopes, client_email, business_name } = body;

    if (!order_id) return json({ error: "order_id required" }, 400);
    if (!accepted_scopes || !Array.isArray(accepted_scopes) || accepted_scopes.length === 0) {
      return json({ error: "accepted_scopes required" }, 400);
    }

    // Validate scopes
    const invalidScopes = accepted_scopes.filter((s) => !ALL_SCOPES.includes(s));
    if (invalidScopes.length > 0) {
      return json({ error: `Invalid scopes: ${invalidScopes.join(", ")}` }, 400);
    }

    // Check for existing authorization (idempotency)
    const existing = await base44.asServiceRole.entities.SetupAuthorization.filter(
      { order_id, authorization_status: "accepted" },
      "-created_date",
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      return json({
        success: true,
        already_authorized: true,
        authorization_id: existing[0].id,
        accepted_at: existing[0].accepted_at,
      });
    }

    // Extract IP and user agent from request headers
    const accepted_ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    const user_agent = req.headers.get("user-agent") || "";

    const auth = await base44.asServiceRole.entities.SetupAuthorization.create({
      order_id,
      client_id: client_id || "",
      client_project_id: client_project_id || "",
      accepted_at: new Date().toISOString(),
      accepted_by_email: client_email || "",
      accepted_ip,
      user_agent,
      agreement_version: AGREEMENT_VERSION,
      accepted_scopes,
      authorization_status: "accepted",
      business_name: business_name || "",
      client_email: client_email || "",
    });

    console.log(`[saveSetupAuthorization] Authorization accepted for order ${order_id} by ${client_email}`);

    // FIX 1A.4-3: Update or create ActivationWizardSession on authorization acceptance
    const existingSession = await base44.asServiceRole.entities.ActivationWizardSession.filter(
      { order_id }, "-created_date", 1
    ).catch(() => []);

    const now = new Date().toISOString();
    if (existingSession?.length > 0) {
      const session = existingSession[0];
      const completedSteps = session.completed_steps || [];
      if (!completedSteps.includes(0)) completedSteps.push(0);
      await base44.asServiceRole.entities.ActivationWizardSession.update(session.id, {
        setup_authorization_id: auth.id,
        completed_steps: completedSteps,
        current_step: Math.max(session.current_step || 0, 1),
        status: "in_progress",
        last_updated_at: now,
      });
      console.log(`[saveSetupAuthorization] ActivationWizardSession updated for order ${order_id}`);
    } else {
      await base44.asServiceRole.entities.ActivationWizardSession.create({
        order_id,
        client_id: client_id || "",
        client_project_id: client_project_id || "",
        client_email: client_email || "",
        business_name: business_name || "",
        package_key: "",
        current_step: 1,
        completed_steps: [0],
        blockers: [],
        status: "in_progress",
        last_updated_at: now,
        setup_authorization_id: auth.id,
      });
      console.log(`[saveSetupAuthorization] ActivationWizardSession created for order ${order_id}`);
    }

    return json({
      success: true,
      authorization_id: auth.id,
      accepted_at: auth.accepted_at,
      agreement_version: AGREEMENT_VERSION,
    });
  } catch (error) {
    console.error("[saveSetupAuthorization] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});