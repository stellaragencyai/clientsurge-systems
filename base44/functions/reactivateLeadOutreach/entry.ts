import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

/**
 * Reactivate Lead Outreach
 * Sends SMS + Email with special offer to dormant leads.
 * Tracks attempts (max 2 before archiving).
 */
const MAX_REACTIVATION_ATTEMPTS = 2;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { reactivation_id } = await req.json();

    if (!reactivation_id) {
      return secureJson({ error: "reactivation_id required" }, { status: 400 });
    }

    // 1. Get reactivation record
    const reactivation = await base44.asServiceRole.entities.LeadReactivation.get(reactivation_id);
    if (!reactivation || reactivation.status === "unrecoverable") {
      return secureJson({ success: false, message: "Record not reactivatable" }, { status: 409 });
    }

    // 2. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(reactivation.lead_id);
    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    // 3. Determine outreach based on attempt number
    const attempt = (reactivation.attempts || 0) + 1;
    const businessName = lead.business_name || "your business";

    if (attempt > MAX_REACTIVATION_ATTEMPTS) {
      await base44.asServiceRole.entities.LeadReactivation.update(reactivation_id, {
        status: "unrecoverable",
      });
      return secureJson({ success: true, message: "Lead archived after max attempts" });
    }

    let offer, subject, smsMessage;
    if (attempt === 1) {
      offer = "We've missed you! Come back for 20% off your next booking.";
      subject = `${lead.full_name}, we miss you at ${businessName}...`;
      smsMessage = `Hi ${lead.full_name}, it's been ${reactivation.days_dormant} days! We'd love to help ${businessName} again. 20% off right now: [link]`;
    } else {
      offer = "Last chance: 25% off + free consultation this week only.";
      subject = `${lead.full_name}, final offer inside...`;
      smsMessage = `${lead.full_name}! Last chance: 25% off ${businessName}'s next service. Ends Friday: [link]`;
    }

    // 4. Send SMS
    if (lead.phone) {
      await base44.asServiceRole.entities.AutomationJob.create({
        lead_id: lead.id,
        job_type: "reactivation_sms",
        trigger_event: "dormant_reactivation",
        status: "queued",
        scheduled_for: new Date().toISOString(),
        result_metadata: JSON.stringify({ message: smsMessage, attempt, reactivation_id }),
      });
    }

    // 5. Send Email
    if (lead.email) {
      const emailBody = `Hi ${lead.full_name},\n\nIt's been ${reactivation.days_dormant} days since we last connected, and we wanted to reach out.\n\nWe've made some great improvements to our service, and we'd love to help ${businessName} again.\n\n${offer}\n\nReady to get back on track? [Book Now]\n\nBest,\nThe ${businessName} Team`;

      await base44.asServiceRole.entities.AutomationJob.create({
        lead_id: lead.id,
        job_type: "reactivation_email",
        trigger_event: "dormant_reactivation",
        status: "queued",
        scheduled_for: new Date().toISOString(),
        result_metadata: JSON.stringify({ subject, body: emailBody, attempt, reactivation_id }),
      });
    }

    // 6. Update reactivation record
    await base44.asServiceRole.entities.LeadReactivation.update(reactivation_id, {
      attempts: attempt,
      reactivation_stage: attempt === 1 ? "first_touch" : "final_offer",
      status: "reactivating",
      reactivation_offer: offer,
    });

    // 7. Log communication event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      event_type: "status_update",
      channel: "email",
      direction: "outbound",
      provider: "internal",
      status: "queued",
      message_body: `Reactivation attempt ${attempt}: ${offer}`,
      metadata_json: JSON.stringify({ reactivation_id, attempt, days_dormant: reactivation.days_dormant }),
    });

    return secureJson({
      success: true,
      lead_id: lead.id,
      attempt,
      offer,
      sms_queued: !!lead.phone,
      email_queued: !!lead.email,
    });
  } catch (error) {
    console.error("[Reactivate] Error:", error.message);
    return secureJson({ error: error.message, success: false }, { status: 500 });
  }
});