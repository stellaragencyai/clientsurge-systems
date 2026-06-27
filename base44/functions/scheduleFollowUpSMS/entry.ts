import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

function canSendFollowUpSms() {
  // Quiet hours: 8pm - 8am Phoenix time (MST, UTC-7)
  const nowUTC = new Date();
  const phoenixHour = (nowUTC.getUTCHours() - 7 + 24) % 24;
  if (phoenixHour >= 20 || phoenixHour < 8) {
    return { canSend: false, reason: "quiet_hours" };
  }
  return { canSend: true, reason: "" };
}
async function twilioFetch(url, options) {
  try { return await fetch(url, options); }
  catch (err) { throw new Error(`Twilio request failed: ${err.message || "network error"}`); }
}

function minutesSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60);
}

// ── E.164 PHONE NORMALIZATION ──
function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  if (cleaned.length === 10) {
    if (cleaned[0] === '0' || cleaned[0] === '1') return null;
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const tenDigits = cleaned.slice(1);
    if (tenDigits[0] === '0' || tenDigits[0] === '1') return null;
    return `+${cleaned}`;
  }
  if (cleaned.length >= 11 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no user) or admin
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

    if (!accountSid || !authToken) {
      return secureJson({ error: "Twilio credentials not configured" }, { status: 500 });
    }

    // Load admin settings for phone number and templates
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    const fromNumber = settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");
    const bookingLink = settings.booking_link_default || "";
    const smsTemplate = settings.sms_template ||
      "Hi {name}, thanks for reaching out to {business_name}! We'd love to help — when's a good time to connect? {booking_link}";

    if (!fromNumber) {
      return secureJson({ error: "Twilio from number not configured" }, { status: 500 });
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
      return secureJson({ success: true, processed: 0, message: "No new leads to contact" });
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
        const businessHours = canSendFollowUpSms();
        if (!businessHours.allowed) {
          console.log(`[scheduleFollowUpSMS] ${businessHours.reason} (hour=${businessHours.current_hour}) — skipping lead ${lead.id}`);
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

        // ── E.164 NORMALIZATION ──
        const normalizedPhone = normalizePhoneToE164(lead.phone);
        if (!normalizedPhone) {
          console.warn(`[scheduleFollowUpSMS] Invalid phone "${lead.phone}" for lead ${lead.id} — skipping`);
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: "sms",
            direction: "outbound",
            event_type: "sms_skipped",
            provider: "twilio",
            status: "failed",
            subject: "Follow-up SMS skipped — invalid phone",
            error_message: "invalid_phone_number",
            metadata_json: JSON.stringify({ raw_phone: lead.phone, normalized_phone: null }),
          });
          results.skipped++;
          continue;
        }

        // Send via Twilio
        const params = { To: normalizedPhone, From: fromNumber, Body: messageBody };
        if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

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

        console.log(`[scheduleFollowUpSMS] Sent SMS to lead ${lead.id} (${normalizedPhone})`);
        results.sent++;
        results.processed++;
      } catch (leadErr) {
        console.error(`[scheduleFollowUpSMS] Error processing lead ${lead.id}:`, leadErr.message);
        results.failed++;
      }
    }

    return secureJson({ success: true, ...results });
  } catch (error) {
    console.error("[scheduleFollowUpSMS] Fatal error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});