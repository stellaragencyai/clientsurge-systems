import { secureJson } from "../_shared/response.ts";
/**
 * Booking Confirmation Loop
 * Auto-confirms booking, feeds back to AI model
 * Closes feedback loop for continuous learning
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, booking_date, booking_time, service_type } = await req.json();

    if (!lead_id || !booking_date) {
      return secureJson(
        { error: "lead_id and booking_date required" },
        { status: 400 }
      );
    }

    console.log(`[BookingLoop] Processing confirmation for ${lead_id}`);

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Update lead status to Booked
    await base44.asServiceRole.entities.Leads.update(lead_id, {
      status: "Booked",
      booked_at: new Date().toISOString(),
    });

    // 3. Create confirmation event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      event_type: "booking_confirmed",
      channel: "system",
      direction: "system",
      provider: "internal",
      status: "completed",
      message_body: `Booking confirmed for ${booking_date} at ${booking_time || "TBD"}`,
      metadata_json: JSON.stringify({
        booking_date,
        booking_time,
        service_type,
        confirmed_at: new Date().toISOString(),
      }),
    });

    // 4. Log booking for AI feedback loop
    await base44.asServiceRole.entities.LeadRevenue.create({
      lead_id,
      source: lead.source,
      booking_id: `BOOKING-${lead_id}-${Date.now()}`,
      booking_date,
      revenue_date: new Date().toISOString(),
      service_type: service_type || "standard",
      revenue_amount: 0, // Placeholder, will be updated when payment received
    });

    // 5. Send confirmation SMS + email
    const confirmationSMS = `Hi ${lead.full_name}, thanks for booking! Your appointment is confirmed for ${booking_date}. Reply CONFIRM to acknowledge.`;
    const confirmationEmail = `
Hello ${lead.full_name},

Your appointment is confirmed!
Date: ${booking_date}
Time: ${booking_time || "As scheduled"}
Service: ${service_type || "Service"}

If you need to reschedule, reply to this email or call us.

See you soon!
    `.trim();

    // Queue confirmation messages
    await base44.asServiceRole.entities.AutomationJob.create({
      lead_id,
      job_type: "booking_confirmation_sms",
      trigger_event: "booking_confirmed",
      status: "queued",
      scheduled_for: new Date().toISOString(),
      result_metadata: JSON.stringify({ message: confirmationSMS }),
    });

    await base44.asServiceRole.entities.AutomationJob.create({
      lead_id,
      job_type: "booking_confirmation_email",
      trigger_event: "booking_confirmed",
      status: "queued",
      scheduled_for: new Date().toISOString(),
      result_metadata: JSON.stringify({ subject: "Booking Confirmed", body: confirmationEmail }),
    });

    console.log(
      `[BookingLoop] Confirmed booking for ${lead_id}, queued confirmation messages`
    );

    return secureJson({
      success: true,
      lead_id,
      status: "Booked",
      booking_date,
      booking_time,
      confirmations_queued: ["sms", "email"],
      feedback_logged: true,
      recommendation: "Lead ready for calendar sync and post-booking nurture",
    });
  } catch (error) {
    console.error("[BookingLoop] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});