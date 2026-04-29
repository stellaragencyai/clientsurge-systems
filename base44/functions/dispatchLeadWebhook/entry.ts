import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { loadAdminSettings } from "../_shared/adminSettings.js";

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isTest = payload?.test === true;
    const explicitWebhookUrl = typeof payload?.webhook_url === "string" ? payload.webhook_url.trim() : "";
    const explicitSecret = typeof payload?.webhook_secret_token === "string" ? payload.webhook_secret_token.trim() : "";

    const { settings } = await loadAdminSettings(base44);
    const webhookUrl = explicitWebhookUrl || settings.webhook_url || Deno.env.get("EXTERNAL_WEBHOOK_URL") || "";
    const secretToken = explicitSecret || settings.webhook_secret_token || "";

    if (!webhookUrl || !isValidUrl(webhookUrl)) {
      return Response.json({ error: "A valid webhook URL is required" }, { status: 400 });
    }

    let webhookPayload = payload?.payload || null;

    if (!isTest) {
      const leadId = typeof payload?.leadId === "string" ? payload.leadId : typeof payload?.lead_id === "string" ? payload.lead_id : "";
      if (!leadId) {
        return Response.json({ error: "Lead ID required" }, { status: 400 });
      }

      const leads = await base44.asServiceRole.entities.Leads.filter({ id: leadId });
      if (!Array.isArray(leads) || leads.length === 0) {
        return Response.json({ error: "Lead not found" }, { status: 404 });
      }

      const lead = leads[0];
      webhookPayload = {
        event: payload?.event_type || "lead_created",
        timestamp: new Date().toISOString(),
        lead: {
          id: lead.id,
          name: lead.full_name || "",
          phone: lead.phone || "",
          email: lead.email || "",
          issue: lead.problem || "",
          source: lead.source || "form",
          status: lead.status || "",
        },
      };
    }

    if (!webhookPayload || typeof webhookPayload !== "object") {
      return Response.json({ error: "Webhook payload is required" }, { status: 400 });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secretToken ? { "X-Webhook-Secret": secretToken } : {}),
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      return Response.json(
        {
          error: message || `Webhook request failed with status ${response.status}`,
          status: response.status,
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      payload: webhookPayload,
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to dispatch webhook";
    return Response.json({ error: message }, { status: 500 });
  }
});
