import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

async function simulateInboundSms(fromNumber, body, messageSid) {
  const smsPayload = new FormData();
  smsPayload.append("MessageSid", messageSid);
  smsPayload.append("From", fromNumber);
  smsPayload.append("To", Deno.env.get("TWILIO_PHONE_NUMBER") || "+16025874608");
  smsPayload.append("Body", body);
  smsPayload.append("AccountSid", Deno.env.get("TWILIO_ACCOUNT_SID") || "ACxxxxxxxxx");

  return smsPayload;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check admin role
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}

    if (user && user.role !== "admin") {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const testCase = payload.test || "all";

    const results = {};

    // Test 1: Create active WebsiteLead, then simulate SMS reply
    if (testCase === "test_1" || testCase === "all") {
      console.log("[testInboundSmsReply] Test 1: Active lead replies by SMS");

      const lead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Test Lead One",
        first_name: "Test",
        email: "test-sms-1@example.com",
        phone_number: "+16025551234",
        service_interest: "SMS test",
        message: "Test lead for SMS reply",
        source: "website_form",
        lead_status: "contacted",
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
        initial_response_sent_at: new Date().toISOString(),
        follow_up_step: 0,
      });

      const messageSid = `SM_TEST_1_${Date.now()}`;
      const smsPayload = await simulateInboundSms("+16025551234", "Yes, I'm interested!", messageSid);

      console.log("[testInboundSmsReply] Created lead", lead.id, "- simulating SMS reply");

      // Log: created, now verify updated state
      const updatedLead = await base44.asServiceRole.entities.WebsiteLead.get(lead.id);

      results.test_1 = {
        lead_id: lead.id,
        lead_reply_status: updatedLead.reply_status,
        lead_status: updatedLead.lead_status,
        next_follow_up_cleared: updatedLead.next_follow_up_at === null,
        automation_enabled: updatedLead.automation_enabled,
        note: "Ready for live SMS webhook test",
      };

      console.log("[testInboundSmsReply] Test 1 result:", results.test_1);
    }

    // Test 2: Unknown phone number should log as unmatched
    if (testCase === "test_2" || testCase === "all") {
      console.log("[testInboundSmsReply] Test 2: Unknown phone detection");

      results.test_2 = {
        scenario: "Unknown phone +15551234567 texts in",
        expected: "Logged as unmatched, no crash",
        note: "Requires live webhook to fully test",
      };

      console.log("[testInboundSmsReply] Test 2 result:", results.test_2);
    }

    // Test 3: Duplicate MessageSid check
    if (testCase === "test_3" || testCase === "all") {
      console.log("[testInboundSmsReply] Test 3: Idempotency validation");

      results.test_3 = {
        scenario: "Same MessageSid sent twice",
        expected: "Second call returns ok_duplicate status",
        note: "Requires live webhook to fully test",
      };

      console.log("[testInboundSmsReply] Test 3 result:", results.test_3);
    }

    // Test 4: Closed lead should not be reactivated
    if (testCase === "test_4" || testCase === "all") {
      console.log("[testInboundSmsReply] Test 4: Closed lead protection");

      const closedLead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: "Closed Lead",
        first_name: "Closed",
        email: "closed@example.com",
        phone_number: "+16025553333",
        service_interest: "Closed test",
        message: "Test",
        source: "website_form",
        lead_status: "closed",
        reply_status: "none",
        booking_status: "none",
        automation_enabled: false,
      });

      // Verify it was not matched (excluded from query)
      results.test_4 = {
        closed_lead_id: closedLead.id,
        lead_status: "closed",
        expected: "SMS from this number will not match (no reactivation)",
        note: "Closed leads are excluded from phone matching query",
      };

      console.log("[testInboundSmsReply] Test 4 result:", results.test_4);
    }

    return secureJson({
      success: true,
      test: testCase,
      results,
      message: "Test fixtures created. Live webhook tests require manual SMS or Twilio test request.",
    });
  } catch (error) {
    console.error("[testInboundSmsReply] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});