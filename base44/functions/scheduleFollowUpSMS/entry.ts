/**
 * scheduleFollowUpSMS — redeployed 2026-05-02
 * Scheduled: Every 15 minutes
 * Purpose: Send the initial 15-minute follow-up SMS to new CRM leads
 *          that have a phone number and haven't been contacted yet.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #126: business hours locked to America/Phoenix (no DST)
function isPhoenixBusinessHours() {
  const h = parseInt(new Date().toLocaleString("en-US", { timeZone: "America/Phoenix", hour: "numeric", hour12: false }), 10);
  return h >= 8 && h < 20;
}

function minutesSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no user) or admin
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

    if (!accountSid || !authToken) {
      return Response.json({ error: "Twilio credentials not configured" }, { status: 500 });
    }

    // Load admin settings for phone number and templates
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    const fromNumber = settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");
    const bookingLink = settings.booking_link_default || "";
    const smsTemplate = settings.sms_template ||
      "Hi {name}, thanks for reaching out to {business_name}! We'd love to help — when's a good time to connect? {booking_link}";

    if (!fromNumber) {
      return Response.json({ error: "Twilio from number not configured" }, { status: 500 });
    }

    // Find new leads with a phone number that haven't been contacted yet
    const leads = await base44.asServiceRole.entities.Leads.filter(
      {
        status: "New",
        phone: { $exists: true },
        last_contacted_at: { $exists: false },
      },
      "-created_date",
      200
    );

    if (!leads?.length) {
      return Response.json({ success: true, processed: 0, message: "No new leads to contact" });
    }

    const results = { processed: 0, sent: 0, skipped: 0, failed: 0 };

    for (const lead of leads) {
      try {
        // Only process leads created within the last 24 hours
        if (minutesSince(lead.created_date) > 1440) {
          results.skipped++;
          continue;
        }

        // Business hours check — only send between 8am and 8pm (America/Phoenix)
        const nowPhoenix = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });
        const currentHour = new Date(nowPhoenix).getHours();
        if (currentHour < 8 || currentHour >= 20) {
          console.log(`[scheduleFollowUpSMS] Outside business hours (hour=${currentHour}) — skipping lead ${lead.id}`);
          results.skipped++;
          continue;
        }

        if (!lead.phone) {
          results.skipped++;
          continue;
        }

        // Check idempotency — skip if already sent an initial SMS
        const existingEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
          {
            lead_id: lead.id,
            event_type: { $in: ["sms_sent"] },
            channel: "sms",
          },
          "-created_date",
          1
        ).catch(() => []);

        if (existingEvents?.length > 0) {
          console.log(`[scheduleFollowUpSMS] Already sent SMS for lead ${lead.id} — skipping`);
          results.skipped++;
          continue;
        }

        // Render message
        const businessName = settings.default_business_name || Deno.env.get("DEFAULT_BUSINESS_NAME") || "us";
        let messageBody = smsTemplate
          .replace(/{name}/g, lead.full_name || "there")
          .replace(/{business_name}/g, businessName)
          .replace(/{booking_link}/g, bookingLink);

        // TCPA compliance — always append opt-out language
        if (!messageBody.includes("STOP")) {
          messageBody += "\n\nReply STOP to unsubscribe.";
        }

        // Send via Twilio
        const params = { To: lead.phone, From: fromNumber, Body: messageBody };
        if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(params),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err?.message || `Twilio HTTP ${res.status}`;
          console.error(`[scheduleFollowUpSMS] Twilio error for lead ${lead.id}: ${errMsg}`);

          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: "sms",
            direction: "outbound",
            event_type: "sms_failed",
            provider: "twilio",
            status: "failed",
            subject: "15-min follow-up SMS failed",
            error_message: errMsg,
            metadata_json: JSON.stringify({ step: "15min_initial", timestamp: new Date().toISOString() }),
          });

          results.failed++;
          continue;
        }

        const twilioResult = await res.json();

        // Log success
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: "sms",
          direction: "outbound",
          event_type: "sms_sent",
          provider: "twilio",
          status: "sent",
          subject: "15-min follow-up SMS",
          message_body: messageBody,
          provider_message_id: twilioResult.sid,
          metadata_json: JSON.stringify({ step: "15min_initial", timestamp: new Date().toISOString() }),
        });

        // Update lead status and last_contacted_at
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          status: "Contacted",
          last_contacted_at: new Date().toISOString(),
        });

        console.log(`[scheduleFollowUpSMS] Sent SMS to lead ${lead.id} (${lead.phone})`);
        results.sent++;
        results.processed++;
      } catch (leadErr) {
        console.error(`[scheduleFollowUpSMS] Error processing lead ${lead.id}:`, leadErr.message);
        results.failed++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error("[scheduleFollowUpSMS] Fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});