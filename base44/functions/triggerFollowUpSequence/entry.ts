import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  sendCommunicationViaOutbox,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

const SEQUENCE_TYPES = ["instant_response", "missed_call_recovery", "day1_followup", "day3_followup", "day7_followup", "reactivation"];

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Auth check
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const { lead_id, sequence_type, custom_note } = payload;

    if (!lead_id) return Response.json({ error: "lead_id is required" }, { status: 400 });
    if (!SEQUENCE_TYPES.includes(sequence_type)) {
      return Response.json({ error: `sequence_type must be one of: ${SEQUENCE_TYPES.join(", ")}` }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

    const now = new Date().toISOString();

    const eventLabel = {
      instant_response: "Manual: Instant Response SMS",
      missed_call_recovery: "Manual: Missed Call Recovery SMS",
      day1_followup: "Manual: Day 1 Follow-Up SMS",
      day3_followup: "Manual: Day 3 Follow-Up SMS",
      day7_followup: "Manual: Day 7 Follow-Up SMS",
      reactivation: "Manual: Reactivation SMS",
    }[sequence_type];

    // Load admin settings
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

    const template = templateMap[sequence_type] || "";
    const rendered = template
      .replace(/{name}/g, lead.full_name || "there")
      .replace(/{business_name}/g, lead.business_name || "us")
      .replace(/{booking_link}/g, settings.booking_link_default || "")
      .replace(/{date}/g, new Date().toLocaleDateString());

    let smsSent = false;
    let smsError = null;

    // Attempt SMS via Twilio if configured
    if (settings.twilio_enabled && lead.phone && rendered) {
      const fromNumber = settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");

      const smsResult = await sendCommunicationViaOutbox({
        base44,
        channel: "sms",
        provider: "twilio",
        recipient: lead.phone,
        body: rendered,
        from: fromNumber,
        lead,
        leadId: lead_id,
        source: "triggerFollowUpSequence",
        sourceRecordId: lead_id,
        templateKey: sequence_type,
        messageType: sequence_type === "reactivation" ? "marketing" : "transactional",
        consentBasis: sequence_type === "reactivation" ? "explicit_sms_consent" : "transactional_relationship",
        metadata: { sequence_type, triggered_by: user.email },
        providerSend: (providerPayload) => sendTwilioSmsProvider({
          ...providerPayload,
          env: (name) => Deno.env.get(name),
          fetchImpl: fetch,
        }),
      });

      if (smsResult.success) {
        smsSent = true;
      } else {
        smsError = smsResult.reason || smsResult.error || "Twilio outbox send failed";
        console.error("Twilio SMS error:", smsError);
      }
    }

    // Log CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: "sms",
      direction: "outbound",
      event_type: "sms_sent",
      provider: smsSent ? "twilio" : "internal",
      status: smsSent ? "sent" : "pending",
      subject: eventLabel,
      message_body: rendered || custom_note || `${eventLabel} triggered manually`,
      error_message: smsError || undefined,
      metadata_json: JSON.stringify({
        sequence_type,
        triggered_by: user.email,
        triggered_at: now,
        sms_sent: smsSent,
      }),
    });

    // Update timestamps
    await base44.asServiceRole.entities.Leads.update(lead_id, {
      last_contacted_at: now,
      last_activity_at: now,
    });

    return Response.json({
      success: true,
      sequence_type,
      sms_sent: smsSent,
      sms_error: smsError,
      message: smsSent
        ? `${eventLabel} sent via SMS to ${lead.phone}.`
        : `${eventLabel} logged. ${smsError ? `SMS failed: ${smsError}` : "Twilio not configured — event logged only."}`,
    });

  } catch (error) {
    console.error("triggerFollowUpSequence error:", error);
    return Response.json({ error: error.message || "Failed to trigger sequence" }, { status: 500 });
  }
});
