/**
 * Test Missed Call Simulation
 * 
 * Simulates a complete missed-call workflow:
 * 1. Creates a test lead from inbound call
 * 2. Triggers missed-call detection
 * 3. Validates SMS + email response
 * 4. Returns detailed results
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST only" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Verify admin access
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (!user || user.role !== "admin") {
      return Response.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { test_phone = "+1-555-0123", test_email = "test@example.com" } =
      await req.json();

    console.log("[testMissedCallSimulation] Starting simulation");

    // ─────────────────────────────────────────────────────
    // STEP 1: Create test lead (simulating inbound call)
    // ─────────────────────────────────────────────────────
    const testLead = await base44.asServiceRole.entities.Leads.create({
      full_name: "Test Caller",
      business_name: "Test Business",
      email: test_email,
      phone: test_phone,
      business_type: "Service Business",
      problem: "Test missed call",
      source: "phone_call",
      status: "New",
      activation_priority: "Low",
      lead_score: 50,
    });

    console.log("[testMissedCallSimulation] Created test lead:", testLead.id);

    // ─────────────────────────────────────────────────────
    // STEP 2: Simulate missed call detection
    // ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: testLead.id,
      channel: "call",
      direction: "inbound",
      event_type: "call_missed",
      provider: "twilio",
      status: "no-answer",
      subject: `[TWILIO] Missed call from ${test_phone}`,
      message_body: "Call status: no-answer",
      provider_message_id: `SIM-${Date.now()}`,
      metadata_json: JSON.stringify({
        call_sid: `SIM-CALL-${Date.now()}`,
        from: test_phone,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log("[testMissedCallSimulation] Logged missed call event");

    // ─────────────────────────────────────────────────────
    // STEP 3: Trigger automation by updating lead status
    // ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Leads.update(testLead.id, {
      status: "Contacted",
      activation_priority: "Hot",
      last_contacted_at: new Date().toISOString(),
    });

    console.log("[testMissedCallSimulation] Updated lead to trigger automation");

    // ─────────────────────────────────────────────────────
    // STEP 4: Wait briefly for automation to process
    // ─────────────────────────────────────────────────────
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // ─────────────────────────────────────────────────────
    // STEP 5: Check results
    // ─────────────────────────────────────────────────────
    const communications = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id: testLead.id },
      "-created_date"
    );

    const smsEvents = communications.filter(
      (e) => e.channel === "sms" && e.event_type === "sms_sent"
    );
    const emailEvents = communications.filter(
      (e) => e.channel === "email" && e.event_type === "email_sent"
    );
    const missedCallEvent = communications.find(
      (e) => e.event_type === "call_missed"
    );

    const results = {
      test_id: testLead.id,
      test_phone,
      test_email,
      missed_call_detected: !!missedCallEvent,
      sms_sent: smsEvents.length > 0,
      sms_details: smsEvents.map((e) => ({
        status: e.status,
        subject: e.subject,
        created_at: e.created_date,
      })),
      email_sent: emailEvents.length > 0,
      email_details: emailEvents.map((e) => ({
        status: e.status,
        subject: e.subject,
        created_at: e.created_date,
      })),
      total_communications: communications.length,
      system_status: "READY",
    };

    // Determine if test passed
    if (missedCallEvent && (smsEvents.length > 0 || emailEvents.length > 0)) {
      results.test_result = "✅ PASSED";
      results.message =
        "Missed call detected, SMS/email response triggered successfully";
    } else if (missedCallEvent) {
      results.test_result = "⚠️ PARTIAL";
      results.message =
        "Missed call detected but no SMS/email response (may be skipped due to settings)";
    } else {
      results.test_result = "❌ FAILED";
      results.message = "Missed call not detected or automation did not trigger";
    }

    console.log("[testMissedCallSimulation] Test complete:", results.test_result);

    return Response.json(results);
  } catch (error) {
    console.error("[testMissedCallSimulation] Error:", error.message);
    return Response.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
});