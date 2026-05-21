import { secureJson } from "../_shared/response.ts";
/**
 * handleNewLead — redeployed 2026-05-02
 * Entity automation: triggered on Leads create
 * Purpose: Send instant SMS to the new lead + notify admin
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";

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
      return secureJson({ error: "Lead data missing — payload keys: " + Object.keys(body || {}).join(", ") }, { status: 400 });
    }

    // Fetch fresh lead data from DB
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      console.error(`[handleNewLead] Lead not found: ${lead_id}`);
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    console.log(`[handleNewLead] Processing lead: ${lead_id} — ${lead.full_name}`);

    const results = { sms: null, admin_notified: false };

    // ─── 1. Send instant SMS to lead ───────────────────────────
    if (lead.phone) {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
      const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

      if (accountSid && authToken && fromNumber) {
        // Load custom SMS template from AdminSettings if available
        const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
        const settings = settingsRecords?.[0] || {};
        const template = settings.sms_template ||
          "Hi {first_name}, thanks for reaching out! We'll be in touch with you shortly.";

        const messageBody = appendSmsOptOut(renderTemplate(template, lead));

        const params = { To: lead.phone, From: fromNumber, Body: messageBody };
        if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

        try {
          const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams(params),
            }
          );

          if (res.ok) {
            const twilioData = await res.json();
            results.sms = "sent";
            console.log(`[handleNewLead] SMS sent — SID: ${twilioData.sid}`);

            await base44.asServiceRole.entities.CommunicationEvent.create({
              lead_id,
              channel: "sms",
              direction: "outbound",
              event_type: "sms_sent",
              provider: "twilio",
              status: "sent",
              subject: "Instant lead response SMS",
              message_body: messageBody,
              provider_message_id: twilioData.sid,
              metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: new Date().toISOString() }),
            });

            // Update lead to Contacted
            await base44.asServiceRole.entities.Leads.update(lead_id, {
              status: "Contacted",
              last_contacted_at: new Date().toISOString(),
            });
          } else {
            const err = await res.json().catch(() => ({}));
            const errMsg = err?.message || `Twilio HTTP ${res.status}`;
            console.error(`[handleNewLead] Twilio error: ${errMsg}`);
            results.sms = `failed: ${errMsg}`;

            await base44.asServiceRole.entities.CommunicationEvent.create({
              lead_id,
              channel: "sms",
              direction: "outbound",
              event_type: "sms_failed",
              provider: "twilio",
              status: "failed",
              subject: "Instant lead response SMS failed",
              error_message: errMsg,
              metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: new Date().toISOString() }),
            });
          }
        } catch (smsErr) {
          console.error(`[handleNewLead] SMS exception: ${smsErr.message}`);
          results.sms = `error: ${smsErr.message}`;
        }
      } else {
        console.warn("[handleNewLead] Twilio credentials not configured — SMS skipped");
        results.sms = "skipped: missing credentials";
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

    return secureJson({ success: true, lead_id, ...results });
  } catch (error) {
    console.error("[handleNewLead] Fatal error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
