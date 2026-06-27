import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PROVIDER_DEFAULTS = {
  website_cms: { recommended_method: "collaborator_invite", instructions: "Invite support@clientsurgesystems.com as an admin/editor on your website CMS (WordPress, Shopify, Webflow, etc.)." },
  dns_provider: { recommended_method: "guided_dns_records", instructions: "We'll provide you with exact DNS records to add. No credentials needed — just paste them into your DNS provider." },
  domain_registrar: { recommended_method: "guided_dns_records", instructions: "DNS records can be added through your domain registrar. We'll provide the exact records." },
  email_domain: { recommended_method: "guided_dns_records", instructions: "We'll provide SPF, DKIM, and DMARC DNS records for email authentication. No credentials needed." },
  booking_calendar: { recommended_method: "collaborator_invite", instructions: "Invite us as a team member on your booking platform (Calendly, Acuity, etc.) with view/manage permissions." },
  crm: { recommended_method: "oauth_connect", instructions: "Connect your CRM via OAuth if available, or invite us as a user with read/write access." },
  twilio_phone: { recommended_method: "collaborator_invite", instructions: "We'll provision and manage your Twilio number. No action needed — we handle this in our account." },
  google_analytics: { recommended_method: "oauth_connect", instructions: "Grant read access to your Google Analytics property via Google's OAuth connection." },
  google_search_console: { recommended_method: "oauth_connect", instructions: "Grant access to your Google Search Console property via Google's OAuth connection." },
};

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
    const { order_id, provider, access_type, client_instructions, status } = body;

    if (!order_id || !provider) return json({ error: "order_id and provider required" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // FIX 1A.4-4: Server-side authorization gate — blocks access requests until SetupAuthorization accepted
    const authCheck = await base44.asServiceRole.entities.SetupAuthorization.filter(
      { order_id, authorization_status: "accepted" }, "-created_date", 1
    ).catch(() => []);
    if (!authCheck || authCheck.length === 0) {
      return json({ error: "Setup Authorization Agreement must be accepted before submitting access requests.", code: "authorization_required" }, 403);
    }

    const defaults = PROVIDER_DEFAULTS[provider] || {};
    const resolvedMethod = access_type || defaults.recommended_method || "collaborator_invite";

    const existing = await base44.asServiceRole.entities.SmartAccessRequest.filter(
      { order_id, provider }, "-created_date", 1
    ).catch(() => []);

    const data = {
      order_id,
      client_id: order.client_id || "",
      client_project_id: order.client_project_id || "",
      client_email: order.customer_email || "",
      business_name: order.business_name || "",
      provider,
      access_type: resolvedMethod,
      recommended_method: defaults.recommended_method || "collaborator_invite",
      client_instructions: client_instructions || defaults.instructions || "",
      status: status || "requested",
      submitted_at: status === "submitted" ? new Date().toISOString() : undefined,
    };

    let access;
    if (existing?.length > 0) {
      access = await base44.asServiceRole.entities.SmartAccessRequest.update(existing[0].id, data);
    } else {
      access = await base44.asServiceRole.entities.SmartAccessRequest.create(data);
    }

    return json({ success: true, access });
  } catch (error) {
    console.error("[saveSmartAccessRequest] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});