/**
 * Test Website Lead Automation
 * Manual testing function for all 9 test scenarios
 * Run via: base44.functions.invoke('testWebsiteLeadAutomation', {test: 'test_a', delay_minutes: 0})
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const test = payload.test || "test_a";
    const delayMinutes = payload.delay_minutes || 0;

    // Require admin
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = {};

    // Test A: New website lead with phone + email
    if (test === "test_a" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test A: phone + email lead");
      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test Alice",
        first_name: "Alice",
        email: `test-a-${Date.now()}@example.com`,
        phone_number: "+16025874608",
        service_interest: "Web Design",
        message: "Interested in web design services",
        source: "website_form",
        lead_status: "new",
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
      });
      results.test_a = {
        lead_id: lead.id,
        email: lead.email,
        phone: lead.phone_number,
        initial_response_sent_at: lead.initial_response_sent_at,
      };
    }

    // Test B: New website lead with phone only
    if (test === "test_b" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test B: phone only lead");
      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test Bob",
        first_name: "Bob",
        email: `test-b-no-email-${Date.now()}@noemail.invalid`, // Placeholder email (required by schema)
        phone_number: "+16025874609",
        service_interest: "SEO Services",
        message: "Need SEO help",
        source: "website_form",
        lead_status: "new",
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
      });
      results.test_b = {
        lead_id: lead.id,
        email_note: "Placeholder email used (phone-only scenario). Email sends will fail cleanly due to invalid domain.",
        phone: lead.phone_number,
      };
    }

    // Test C: New website lead with email only
    if (test === "test_c" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test C: email only lead");
      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test Charlie",
        first_name: "Charlie",
        email: `test-c-${Date.now()}@example.com`,
        service_interest: "Content Marketing",
        message: "Looking for content services",
        source: "website_form",
        lead_status: "new",
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
      });
      results.test_c = {
        lead_id: lead.id,
        email: lead.email,
        phone: lead.phone_number || null,
      };
    }

    // Test D: No-response follow-up sequence (set initial_response_sent_at to past)
    if (test === "test_d" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test D: no-response follow-up");
      const pastTime = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();
      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test Diana",
        first_name: "Diana",
        email: `test-d-${Date.now()}@example.com`,
        phone_number: "+16025874610",
        service_interest: "Email Marketing",
        message: "Email campaign help",
        source: "website_form",
        lead_status: "contacted",
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
        initial_response_sent_at: pastTime,
        follow_up_step: 0,
        next_follow_up_at: new Date(Date.now() + 1000).toISOString(),
      });
      results.test_d = {
        lead_id: lead.id,
        initial_response_sent_at: lead.initial_response_sent_at,
        follow_up_step: lead.follow_up_step,
        note: `Set initial_response_sent_at to ${delayMinutes} minutes ago for testing`,
      };
    }

    // Test E: Reply stop condition
    if (test === "test_e" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test E: reply stop");
      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test Eve",
        first_name: "Eve",
        email: `test-e-${Date.now()}@example.com`,
        phone_number: "+16025874611",
        service_interest: "PPC Advertising",
        message: "PPC campaign",
        source: "website_form",
        lead_status: "contacted",
        reply_status: "responded",
        booking_status: "none",
        automation_enabled: true,
        initial_response_sent_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      });

      // Log the reply
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_id: lead.id,
        context_type: "website_lead",
        channel: "email",
        direction: "inbound",
        event_type: "email_received",
        provider: "resend",
        status: "received",
        subject: "Re: Got your request",
        message_body: "Thanks for reaching out!",
        metadata_json: JSON.stringify({
          replied_at: new Date().toISOString(),
        }),
      });

      results.test_e = {
        lead_id: lead.id,
        reply_status: "responded",
        note: "Lead marked as replied — follow-ups should stop",
      };
    }

    // Test F: Booking stop condition
    if (test === "test_f" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test F: booking stop");
      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test Frank",
        first_name: "Frank",
        email: `test-f-${Date.now()}@example.com`,
        phone_number: "+16025874612",
        service_interest: "Social Media Marketing",
        message: "Social media help",
        source: "website_form",
        lead_status: "booked",
        reply_status: "none",
        booking_status: "booked",
        automation_enabled: true,
        initial_response_sent_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      });
      results.test_f = {
        lead_id: lead.id,
        booking_status: "booked",
        note: "Lead marked as booked — follow-ups should stop",
      };
    }

    // Test G: Duplicate processor run
    if (test === "test_g" || test === "all") {
      console.log(
        "[testWebsiteLeadAutomation] Test G: duplicate processor (manual)"
      );
      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test George",
        first_name: "George",
        email: `test-g-${Date.now()}@example.com`,
        phone_number: "+16025874613",
        service_interest: "Analytics",
        message: "Analytics help",
        source: "website_form",
        lead_status: "contacted",
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
        initial_response_sent_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        follow_up_step: 0,
        next_follow_up_at: new Date(Date.now() + 1000).toISOString(),
      });
      results.test_g = {
        lead_id: lead.id,
        note: "MANUAL TEST: Run processWebsiteLeadFollowUps twice. Check logs for duplicate prevention.",
      };
    }

    // Test H: Missing Resend config
    if (test === "test_h" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test H: missing Resend (manual)");
      results.test_h = {
        note: "MANUAL TEST: Temporarily unset RESEND_API_KEY env var, then run sendWebsiteLeadResponse. Email should fail, SMS should succeed.",
      };
    }

    // Test I: Missing Twilio config
    if (test === "test_i" || test === "all") {
      console.log("[testWebsiteLeadAutomation] Test I: missing Twilio (manual)");
      results.test_i = {
        note: "MANUAL TEST: Temporarily unset TWILIO_ACCOUNT_SID env var, then run sendWebsiteLeadResponse. SMS should fail, email should succeed.",
      };
    }

    return Response.json({
      success: true,
      test,
      results,
    });
  } catch (error) {
    console.error("[testWebsiteLeadAutomation] Error:", error.message);
    return Response.json(
      { error: error.message || "Test failed" },
      { status: 500 }
    );
  }
});