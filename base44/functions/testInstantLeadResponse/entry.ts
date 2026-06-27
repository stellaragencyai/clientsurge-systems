import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Create test WebsiteLead
    const testLead = await base44.asServiceRole.entities.WebsiteLead.create({
      full_name: "Test Lead",
      first_name: "Test",
      email: "test@example.com",
      phone_number: "+16025874608", // Admin notification phone for testing
      service_interest: "Testing",
      message: "Test lead for SMS verification",
      source: "website_form",
      lead_status: "new",
      reply_status: "none",
      booking_status: "none",
      automation_enabled: true,
    });

    console.log(`[TestResponse] Created test lead: ${testLead.id}`);

    // Call sendInstantLeadResponseSms
    const smsResult = await base44.functions.invoke("sendInstantLeadResponseSms", {
      lead_id: testLead.id,
      lead: testLead,
    });

    console.log(`[TestResponse] SMS result:`, smsResult);

    // Verify SMS was logged
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id: testLead.id, event_type: "sms_sent" },
      "-created_date",
      1
    );

    const smsSent = events && events.length > 0;

    return secureJson({
      success: smsResult.success && smsSent,
      test_lead_id: testLead.id,
      sms_result: smsResult,
      sms_logged: smsSent,
      communication_event: events?.[0] || null,
      summary: smsSent
        ? "✅ SMS sent successfully and logged"
        : "❌ SMS sent but not logged properly",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[TestResponse] Error: ${message}`);
    return secureJson({ error: message, success: false }, { status: 500 });
  }
});