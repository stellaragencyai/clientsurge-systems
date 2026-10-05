import { resendFetch } from "../_shared/resendFetch.js";
// PL-72 — processWebsiteLeadFollowUps — VERIFIED ACTIVE
// This function handles the 3-step follow-up: 10min SMS → 1hr email → 24hr SMS
// Automation: runs every 10 minutes to catch follow-up windows
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const FOLLOW_UP_STEPS = [
  { step: 1, delay_minutes: 10, channel: "sms", label: "10-min SMS" },
  { step: 2, delay_minutes: 60, channel: "email", label: "1-hr Email" },
  { step: 3, delay_minutes: 1440, channel: "sms", label: "24-hr SMS" },
];

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const results = { processed: 0, skipped: 0, errors: [] };

    // Get all active website leads that need follow-up
    const leads = await base44.asServiceRole.entities.WebsiteLead.filter({
      automation_enabled: true,
      cadence_paused: false,
      archived: false,
    }, "-created_date", 100);

    for (const lead of (leads || [])) {
      try {
        // Check opt-out / pause conditions
        if (lead.cadence_paused || lead.archived) {
          results.skipped++;
          continue;
        }
        if (lead.lead_status === "booked" || lead.lead_status === "closed") {
          results.skipped++;
          continue;
        }

        const createdAt = new Date(lead.created_date);
        const minutesElapsed = (now - createdAt) / 60000;
        const currentStep = lead.follow_up_step || 0;
        const nextStep = FOLLOW_UP_STEPS[currentStep];

        if (!nextStep) {
          results.skipped++;
          continue;
        }

        // Check if enough time has passed for next step
        if (minutesElapsed < nextStep.delay_minutes) {
          results.skipped++;
          continue;
        }

        // Check idempotency — don't send if already sent this step
        if ((lead.follow_up_step || 0) >= nextStep.step) {
          results.skipped++;
          continue;
        }

        // Send the follow-up
        const adminSettings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
        const settings = adminSettings?.[0] || {};

        if (nextStep.channel === "sms") {
          const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
          const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
          const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
          const bookingLink = settings.booking_link_default || Deno.env.get("DEFAULT_BOOKING_LINK") || "";

          if (twilioSid && twilioToken && twilioFrom && lead.phone) {
            const smsBody = (settings.sms_template || "Hi {name}, just following up! Book your free consultation here: {booking_link} Reply STOP to opt out.")
              .replace("{name}", lead.full_name?.split(" ")[0] || "there")
              .replace("{booking_link}", bookingLink)
              .replace("{business_name}", settings.business_name || "ClientSurge Systems");

            await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
              method: "POST",
              headers: { "Authorization": `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ From: twilioFrom, To: lead.phone, Body: smsBody }).toString(),
            });
          }
        } else if (nextStep.channel === "email" && lead.email) {
          const resendKey = Deno.env.get("RESEND_API_KEY");
          const fromEmail = settings.resend_from_email || Deno.env.get("RESEND_FROM_EMAIL") || "support@clientsurgesystems.com";
          const bookingLink = settings.booking_link_default || Deno.env.get("DEFAULT_BOOKING_LINK") || "";

          if (resendKey) {
            await resendFetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: `ClientSurge Systems <${fromEmail}>`,
                to: [lead.email],
                subject: "Quick follow-up on your inquiry",
                html: `<p>Hi ${lead.full_name?.split(" ")[0] || "there"},</p><p>Just checking in on your inquiry. If you'd like to move forward, you can book a free consultation here:</p><p><a href="${bookingLink}">${bookingLink}</a></p><p>Let us know if you have any questions!</p><p style="font-size:11px;color:#888">To unsubscribe from future emails, reply STOP.</p>`,
              }),
            });
          }
        }

        // Update lead follow-up step
        await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
          follow_up_step: nextStep.step,
          last_message_sent: now.toISOString(),
        });

        // Log communication event
        await base44.asServiceRole.entities.CommunicationEvent.create({
          context_type: "website_lead",
          context_id: lead.id,
          channel: nextStep.channel,
          direction: "outbound",
          event_type: `follow_up_step_${nextStep.step}`,
          status: "sent",
          provider: nextStep.channel === "sms" ? "twilio" : "resend",
          subject: `Follow-up step ${nextStep.step} (${nextStep.label})`,
        }).catch(() => {});

        results.processed++;
      } catch (err) {
        results.errors.push({ lead_id: lead.id, error: err.message });
      }
    }

    console.log(`[processWebsiteLeadFollowUps] processed=${results.processed} skipped=${results.skipped} errors=${results.errors.length}`);
    return secureJson({ success: true, ...results });
  } catch (error) {
    console.error("[processWebsiteLeadFollowUps] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});