/**
 * AI Booking Conversation Agent
 * Moves leads toward booking by analyzing their replies and generating smart next steps
 * Triggered when a lead shows interest but hasn't booked yet
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

async function generateBookingMessage(base44, lead, lastMessage, bookingLink) {
  console.log(`[BookingAgent] Generating booking message for ${lead.full_name}`);

  const prompt = `You are a booking assistant helping move a qualified lead toward scheduling.

Lead Name: ${lead.full_name}
Service Interest: ${lead.service_interest || "not specified"}
Last Message from Lead: "${lastMessage || 'No message yet'}"
Booking Link: ${bookingLink || "Not available"}

Generate a SHORT, friendly, conversational SMS (max 160 chars) that:
1. Acknowledges their interest warmly
2. Addresses any hesitation in their message (if present)
3. Makes booking feel easy and next step obvious
4. Ends with a clear CTA (either booking link or simple next action)

Keep tone natural and human. No corporate jargon.`;

  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "gemini_3_flash",
    });

    return response || null;
  } catch (error) {
    console.error(`[BookingAgent] AI generation failed: ${error.message}`);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { lead_id, last_message } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    // Fetch lead
    const leads = await base44.asServiceRole.entities.WebsiteLead.filter(
      { id: lead_id },
      null,
      1
    );

    if (!leads || leads.length === 0) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leads[0];

    // Get booking link from settings
    let bookingLink = "";
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.filter({}, null, 1);
      if (settings && settings.length > 0) {
        bookingLink = settings[0].booking_link_default || "";
      }
    } catch (e) {
      console.warn(`[BookingAgent] Settings fetch failed: ${e.message}`);
    }

    // Generate AI message
    const aiMessage = await generateBookingMessage(base44, lead, last_message, bookingLink);

    if (!aiMessage) {
      console.warn(`[BookingAgent] AI generation returned empty, using fallback`);
      const fallbackMessage = bookingLink
        ? `Hey ${lead.first_name || "there"}! Ready to book? ${bookingLink}`
        : `Great interest! Let's get you scheduled. When works best?`;
      
      return Response.json({
        success: true,
        lead_id,
        message: fallbackMessage,
        booking_link: bookingLink,
        ai_generated: false,
      });
    }

    // Log conversation event
    try {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id,
        channel: "sms",
        direction: "outbound",
        event_type: "sms_sent",
        provider: "internal",
        status: "pending",
        message_body: aiMessage,
        metadata_json: JSON.stringify({
          service_key: "ai_booking_agent",
          ai_generated: true,
          booking_link: bookingLink,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn(`[BookingAgent] Event logging failed: ${e.message}`);
    }

    // Update lead status
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(lead_id, {
        booking_status: "clicked",
        last_engagement_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(`[BookingAgent] Lead update failed: ${e.message}`);
    }

    return Response.json({
      success: true,
      lead_id,
      message: aiMessage,
      booking_link: bookingLink,
      ai_generated: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[BookingAgent] Error: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
});