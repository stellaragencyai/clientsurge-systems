import { secureJson } from "../_shared/response.ts";
/**
 * bulkLeadAction — performs batch operations on multiple leads.
 *
 * Supported actions:
 *  - "status_change": updates status on all selected leads
 *  - "trigger_sequence": fires a follow-up sequence SMS for each lead
 *  - "add_note": logs an internal note (Events entity) on each lead
 *
 * Payload:
 *  { action: string, lead_ids: string[], status?: string, sequence_type?: string, note?: string }
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";

const SEQUENCE_TYPES = ["instant_response", "missed_call_recovery", "day1_followup", "day3_followup", "day7_followup", "reactivation"];
const VALID_STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"];

function renderTemplate(template, lead, bookingLink) {
  return (template || "")
    .replace(/{name}/g, lead.full_name || "there")
    .replace(/{business_name}/g, lead.business_name || "us")
    .replace(/{booking_link}/g, bookingLink || "")
    .replace(/{date}/g, new Date().toLocaleDateString());
}

async function sendSMS(phone, body, accountSid, authToken, fromNumber) {
  const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: fromNumber, Body: appendSmsOptOut(body) }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Twilio error");
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return secureJson({ error: "Forbidden: Admin only" }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const { action, lead_ids, status, sequence_type, note } = payload;

    if (!action) return secureJson({ error: "action is required" }, { status: 400 });
    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return secureJson({ error: "lead_ids must be a non-empty array" }, { status: 400 });
    }
    if (lead_ids.length > 100) {
      return secureJson({ error: "Maximum 100 leads per bulk action" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const results = { success: 0, failed: 0, errors: [] };

    // ── STATUS CHANGE ─────────────────────────────────────────────────────────
    if (action === "status_change") {
      if (!status || !VALID_STATUSES.includes(status)) {
        return secureJson({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
      }

      for (const lead_id of lead_ids) {
        try {
          await base44.asServiceRole.entities.Leads.update(lead_id, { status });
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id,
            channel: "internal",
            direction: "system",
            event_type: "status_update",
            provider: "internal",
            status: "processed",
            subject: `Bulk status change → ${status}`,
            message_body: `Status updated to "${status}" via bulk action by ${user.email}.`,
            metadata_json: JSON.stringify({ bulk: true, triggered_by: user.email }),
          });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ lead_id, error: err.message });
          console.error(`[bulkLeadAction] bulkLeadAction status_change error for ${lead_id}:`, err.message);
        }
      }

      return secureJson({ success: true, action, status, ...results });
    }

    // ── TRIGGER SEQUENCE ──────────────────────────────────────────────────────
    if (action === "trigger_sequence") {
      if (!sequence_type || !SEQUENCE_TYPES.includes(sequence_type)) {
        return secureJson({ error: `sequence_type must be one of: ${SEQUENCE_TYPES.join(", ")}` }, { status: 400 });
      }

      const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      const settings = settingsRecords?.[0] || {};
      const templateMap = {
        instant_response: settings.sms_template,
        missed_call_recovery: settings.missed_call_sms_template,
        day1_followup: settings.follow_up_day1_sms,
        day3_followup: settings.follow_up_day3_sms,
        day7_followup: settings.follow_up_day7_sms,
        reactivation: settings.sms_template,
      };

      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");
      const twilioReady = !!(accountSid && authToken && fromNumber && settings.twilio_enabled);

      const eventLabel = {
        instant_response: "Bulk: Instant Response SMS",
        missed_call_recovery: "Bulk: Missed Call Recovery SMS",
        day1_followup: "Bulk: Day 1 Follow-Up SMS",
        day3_followup: "Bulk: Day 3 Follow-Up SMS",
        day7_followup: "Bulk: Day 7 Follow-Up SMS",
        reactivation: "Bulk: Reactivation SMS",
      }[sequence_type];

      for (const lead_id of lead_ids) {
        try {
          const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
          if (!lead) { results.failed++; results.errors.push({ lead_id, error: "Lead not found" }); continue; }

          const template = templateMap[sequence_type] || "";
          const body = renderTemplate(template, lead, settings.booking_link_default);
          const outboundSmsBody = body ? appendSmsOptOut(body) : "";

          let smsSent = false;
          let smsError = null;

          if (twilioReady && lead.phone && body) {
            try {
              await sendSMS(lead.phone, outboundSmsBody, accountSid, authToken, fromNumber);
              smsSent = true;
            } catch (err) {
              smsError = err.message;
              console.error(`[bulkLeadAction] bulkLeadAction SMS error for ${lead_id}:`, err.message);
            }
          }

          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id,
            channel: "sms",
            direction: "outbound",
            event_type: "sms_sent",
            provider: smsSent ? "twilio" : "internal",
            status: smsSent ? "sent" : "pending",
            subject: eventLabel,
            message_body: outboundSmsBody || eventLabel,
            error_message: smsError || undefined,
            metadata_json: JSON.stringify({ bulk: true, sequence_type, triggered_by: user.email }),
          });

          await base44.asServiceRole.entities.Leads.update(lead_id, {
            last_contacted_at: now,
          });

          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ lead_id, error: err.message });
          console.error(`[bulkLeadAction] bulkLeadAction sequence error for ${lead_id}:`, err.message);
        }
      }

      return secureJson({ success: true, action, sequence_type, ...results });
    }

    // ── ADD NOTE ──────────────────────────────────────────────────────────────
    if (action === "add_note") {
      if (!note || !note.trim()) {
        return secureJson({ error: "note text is required" }, { status: 400 });
      }

      for (const lead_id of lead_ids) {
        try {
          await base44.asServiceRole.entities.Events.create({
            lead_id,
            event_type: "note",
            data: { text: note.trim(), created_by: user.email, bulk: true },
          });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ lead_id, error: err.message });
          console.error(`[bulkLeadAction] bulkLeadAction add_note error for ${lead_id}:`, err.message);
        }
      }

      return secureJson({ success: true, action, ...results });
    }

    // ── BULK ENRICH ───────────────────────────────────────────────────────────
    if (action === "bulk_enrich") {
      for (const lead_id of lead_ids) {
        try {
          await base44.asServiceRole.functions.invoke("enrichLead", { lead_id });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ lead_id, error: err.message });
          console.error(`[bulkLeadAction] bulkLeadAction enrich error for ${lead_id}:`, err.message);
        }
      }
      return secureJson({ success: true, action, ...results });
    }

    return secureJson({ error: `Unknown action: ${action}. Must be status_change, trigger_sequence, add_note, or bulk_enrich.` }, { status: 400 });

  } catch (error) {
    console.error("[bulkLeadAction] bulkLeadAction error:", error);
    return secureJson({ error: error.message || "Bulk action failed" }, { status: 500 });
  }
});
