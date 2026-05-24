/**
 * handleNewLead — redeployed 2026-05-02
 * Entity automation: triggered on Leads create
 * Purpose: Send instant SMS to the new lead + notify admin
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  sendCommunicationViaOutbox,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

function renderTemplate(template, lead) {
  return template
    .replace(/{name}/g, lead.full_name || "there")
    .replace(/{first_name}/g, lead.full_name?.split(" ")[0] || "there")
    .replace(/{business_name}/g, lead.business_name || "us");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support both entity automation payload and direct call
    const lead_id =
      body?.lead_id ||
      body?.event?.entity_id ||
      body?.data?.id ||
      body?.id ||
      body?.entity_id;

    if (!lead_id) {
      console.error("[handleNewLead] No lead_id found in payload:", JSON.stringify(body));
      return Response.json({ error: "Lead data missing — payload keys: " + Object.keys(body || {}).join(", ") }, { status: 400 });
    }

    // Fetch fresh lead data from DB
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      console.error(`[handleNewLead] Lead not found: ${lead_id}`);
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    console.log(`[handleNewLead] Processing lead: ${lead_id} — ${lead.full_name}`);

    const results = { sms: null, admin_notified: false };

    // ─── 1. Send instant SMS to lead ───────────────────────────
    if (lead.phone) {
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
      const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      const settings = settingsRecords?.[0] || {};
      const template = settings.sms_template ||
        "Hi {first_name}, thanks for reaching out! We'll be in touch with you shortly.";

      const messageBody = renderTemplate(template, lead);

      try {
        const smsResult = await sendCommunicationViaOutbox({
          base44,
          channel: "sms",
          provider: "twilio",
          recipient: lead.phone,
          body: messageBody,
          from: fromNumber,
          lead,
          leadId: lead_id,
          source: "handleNewLead",
          sourceRecordId: lead_id,
          templateKey: "instant_lead_response",
          messageType: "transactional",
          consentBasis: "transactional_relationship",
          metadata: { service_key: "instant_lead_response" },
          providerSend: (providerPayload) => sendTwilioSmsProvider({
            ...providerPayload,
            env: (name) => Deno.env.get(name),
            fetchImpl: fetch,
          }),
        });

        if (smsResult.success) {
          results.sms = "sent";
          console.log(`[handleNewLead] SMS sent — SID: ${smsResult.provider_message_id}`);

          await base44.asServiceRole.entities.Leads.update(lead_id, {
            status: "Contacted",
            last_contacted_at: new Date().toISOString(),
          });
        } else {
          const reason = smsResult.reason || smsResult.error || smsResult.status;
          console.error(`[handleNewLead] SMS outbox send failed: ${reason}`);
          results.sms = smsResult.suppressed ? `suppressed: ${reason}` : `failed: ${reason}`;
        }
      } catch (smsErr) {
        console.error(`[handleNewLead] SMS exception: ${smsErr.message}`);
        results.sms = `error: ${smsErr.message}`;
      }
    } else {
      console.warn(`[handleNewLead] Lead ${lead_id} has no phone number — SMS skipped`);
      results.sms = "skipped: no phone";
    }

    // ─── 2. Notify admin ────────────────────────────────────────
    try {
      await base44.asServiceRole.functions.invoke("sendAdminLeadNotification", { lead_id });
      results.admin_notified = true;
      console.log(`[handleNewLead] Admin notification dispatched for lead ${lead_id}`);
    } catch (notifyErr) {
      console.warn(`[handleNewLead] Admin notification failed (non-blocking): ${notifyErr.message}`);
    }

    return Response.json({ success: true, lead_id, ...results });
  } catch (error) {
    console.error("[handleNewLead] Fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
