import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { validateSetupLinkToken } from '../_shared/setupLinkToken.ts';

const AGREEMENT_VERSION = "2026-06-26-v1";
const ALL_SCOPES = ["website_form_edits", "dns_records", "email_authentication", "sms_email_automation", "tracking_scripts", "twilio_call_forwarding", "booking_integration", "test_leads", "temp_credentials_fallback", "client_go_live_approval"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Request-ID": data?.request_id || "" },
  });
}
function cleanEmail(value) { return String(value || "").trim().toLowerCase(); }
function cleanString(value) { return String(value || "").trim(); }
function isAdmin(user) { return user?.role === "admin" || user?.role === "super_admin"; }

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, client_id, client_project_id, accepted_scopes, client_email, business_name } = body;
    const setupToken = cleanString(body.token || body.setup_token);

    if (!order_id) return json({ error: "order_id required", request_id: requestId }, 400);
    if (!accepted_scopes || !Array.isArray(accepted_scopes) || accepted_scopes.length === 0) return json({ error: "accepted_scopes required", request_id: requestId }, 400);

    const invalidScopes = accepted_scopes.filter((s) => !ALL_SCOPES.includes(s));
    if (invalidScopes.length > 0) return json({ error: `Invalid scopes: ${invalidScopes.join(", ")}`, request_id: requestId }, 400);

    const currentUser = await base44.auth.me().catch(() => null);
    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found", request_id: requestId }, 404);

    const orderEmail = cleanEmail(order.customer_email || client_email);
    const userEmail = cleanEmail(currentUser?.email);
    const tokenResult = setupToken ? await validateSetupLinkToken(setupToken, order_id, orderEmail) : { valid: false, reason: "missing_token" };

    if (setupToken && !tokenResult.valid) return json({ error: "This setup link is expired or invalid.", code: tokenResult.reason, request_id: requestId }, 403);
    if (!isAdmin(currentUser) && !tokenResult.valid && userEmail && orderEmail && userEmail !== orderEmail) return json({ error: "This setup authorization does not belong to the signed-in account.", code: "setup_link_email_mismatch", request_id: requestId }, 403);
    if (!isAdmin(currentUser) && !tokenResult.valid && !userEmail) return json({ error: "Sign in with the order email or use the signed setup link from your confirmation email.", code: "setup_auth_required", request_id: requestId }, 403);

    const existing = await base44.asServiceRole.entities.SetupAuthorization.filter({ order_id, authorization_status: "accepted" }, "-created_date", 1).catch(() => []);
    if (existing?.length > 0) {
      return json({ success: true, already_authorized: true, request_id: requestId, authorization_id: existing[0].id, accepted_at: existing[0].accepted_at });
    }

    const accepted_ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    const user_agent = req.headers.get("user-agent") || "";
    const acceptedBy = orderEmail || cleanEmail(client_email) || userEmail;

    const auth = await base44.asServiceRole.entities.SetupAuthorization.create({
      order_id,
      client_id: client_id || order.client_id || "",
      client_project_id: client_project_id || order.client_project_id || "",
      accepted_at: new Date().toISOString(),
      accepted_by_email: acceptedBy,
      accepted_ip,
      user_agent,
      agreement_version: AGREEMENT_VERSION,
      accepted_scopes,
      authorization_status: "accepted",
      business_name: business_name || order.business_name || "",
      client_email: acceptedBy,
    });

    console.log(`[saveSetupAuthorization] Authorization accepted for order ${order_id} by ${acceptedBy}; request_id=${requestId}`);

    const existingSession = await base44.asServiceRole.entities.ActivationWizardSession.filter({ order_id }, "-created_date", 1).catch(() => []);
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
    } else {
      await base44.asServiceRole.entities.ActivationWizardSession.create({
        order_id,
        client_id: client_id || order.client_id || "",
        client_project_id: client_project_id || order.client_project_id || "",
        client_email: acceptedBy,
        business_name: business_name || order.business_name || "",
        package_key: order.selected_package_type || order.package_type || order.pricing_summary?.package_key || "",
        current_step: 1,
        completed_steps: [0],
        blockers: [],
        status: "in_progress",
        last_updated_at: now,
        setup_authorization_id: auth.id,
      });
    }

    return json({ success: true, request_id: requestId, authorization_id: auth.id, accepted_at: auth.accepted_at, agreement_version: AGREEMENT_VERSION });
  } catch (error) {
    console.error(`[saveSetupAuthorization] Error: ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});
