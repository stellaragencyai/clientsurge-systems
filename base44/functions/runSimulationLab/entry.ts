import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SIMULATION_SCENARIOS = [
  { id: "buyer_form", name: "Buyer Form Submission", service_key: "instant_lead_response", test_type: "form_submission" },
  { id: "seller_form", name: "Seller Form Submission", service_key: "instant_lead_response", test_type: "form_submission" },
  { id: "home_valuation", name: "Home Valuation Request", service_key: "instant_lead_response", test_type: "form_submission" },
  { id: "listing_inquiry", name: "Listing Inquiry", service_key: "instant_lead_response", test_type: "form_submission" },
  { id: "general_contact", name: "General Contact Form", service_key: "instant_lead_response", test_type: "form_submission" },
  { id: "missed_call", name: "Missed Call", service_key: "missed_call_text_back", test_type: "missed_call_test" },
  { id: "inbound_sms_reply", name: "Inbound SMS Reply", service_key: "inbound_sms_assistant", test_type: "inbound_reply_classification_test" },
  { id: "stop_reply", name: "STOP Reply", service_key: "inbound_sms_assistant", test_type: "stop_reply_test" },
  { id: "incomplete_form", name: "Incomplete Form", service_key: "instant_lead_response", test_type: "incomplete_form_test" },
  { id: "high_intent_booking", name: "High-Intent Booking-Ready Lead", service_key: "ai_booking_agent", test_type: "high_intent_booking_test" },
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json().catch(() => ({}));

    if (!order_id) return json({ error: "order_id required" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // Create simulation run
    const existing = await base44.asServiceRole.entities.SimulationRun.filter(
      { order_id, run_status: "in_progress" }, "-created_date", 1
    ).catch(() => []);

    let run;
    if (existing?.length > 0) {
      run = existing[0];
    } else {
      run = await base44.asServiceRole.entities.SimulationRun.create({
        order_id,
        client_id: order.client_id || "",
        client_project_id: order.client_project_id || "",
        client_email: order.customer_email || "",
        business_name: order.business_name || "",
        run_status: "in_progress",
        started_at: new Date().toISOString(),
        total_scenarios: SIMULATION_SCENARIOS.length,
        passed_scenarios: 0,
        failed_scenarios: 0,
        scenario_results: [],
        repair_tasks: [],
      });
    }

    // Run each scenario
    const results = [];
    let passed = 0;
    let failed = 0;
    const repairTasks = [];

    for (const scenario of SIMULATION_SCENARIOS) {
      // Use LLM to simulate the scenario and evaluate
      const evalResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a simulation test evaluator. Evaluate the following automation scenario for a client system:

Client: ${order.business_name}
Scenario: ${scenario.name}
Service: ${scenario.service_key}
Test Type: ${scenario.test_type}

Evaluate whether these checks would pass:
1. lead_capture_verified (was the lead captured in the system?)
2. intent_classification_verified (was the lead intent classified correctly?)
3. sms_response_verified (was an SMS response sent?)
4. email_response_verified (was an email response sent?)
5. crm_sync_verified (was the lead synced to CRM?)
6. nurture_enrollment_verified (was the lead enrolled in nurture sequence?)
7. booking_cta_verified (was a booking CTA sent if appropriate?)
8. stop_handling_verified (was STOP keyword handled if applicable?)
9. digest_inclusion_verified (was the lead included in daily digest?)
10. proof_log_created (was a proof log created?)

Return pass/fail for each check and an overall status. If any check fails, provide a failure_reason and repair_action.

Return as JSON with boolean fields for each check, status (pass/fail/pending), failure_reason, and repair_action.`,
        response_json_schema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["pass", "fail", "pending"] },
            lead_capture_verified: { type: "boolean" },
            intent_classification_verified: { type: "boolean" },
            sms_response_verified: { type: "boolean" },
            email_response_verified: { type: "boolean" },
            crm_sync_verified: { type: "boolean" },
            nurture_enrollment_verified: { type: "boolean" },
            booking_cta_verified: { type: "boolean" },
            stop_handling_verified: { type: "boolean" },
            digest_inclusion_verified: { type: "boolean" },
            proof_log_created: { type: "boolean" },
            failure_reason: { type: "string" },
            repair_action: { type: "string" },
          },
        },
      });

      const result = {
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        service_key: scenario.service_key,
        ...evalResponse,
      };
      results.push(result);

      if (evalResponse.status === "pass") {
        passed++;
      } else if (evalResponse.status === "fail") {
        failed++;
        if (evalResponse.repair_action) {
          repairTasks.push({
            scenario_id: scenario.id,
            task: evalResponse.repair_action,
            priority: "high",
          });
        }
      }
    }

    // Update run with results
    run = await base44.asServiceRole.entities.SimulationRun.update(run.id, {
      run_status: "completed",
      completed_at: new Date().toISOString(),
      passed_scenarios: passed,
      failed_scenarios: failed,
      scenario_results: results,
      repair_tasks: repairTasks,
    });

    return json({ success: true, run });
  } catch (error) {
    console.error("[runSimulationLab] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});