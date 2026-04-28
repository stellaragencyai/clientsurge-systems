/**
 * AUTOMATION ORCHESTRATOR
 * Central hub that runs all 7 AI functions in sequence
 * Coordinates the complete lead-to-booking workflow
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, project_id, trigger_event } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);

    console.log(`[Orchestrator] Running AI workflow for ${lead_id} (${trigger_event})`);

    const results = {
      lead_id,
      timestamp: new Date().toISOString(),
      steps: {},
    };

    // STEP 1: Score the lead
    console.log("[Orchestrator] Step 1/7: Scoring lead...");
    const scoreResult = await base44.asServiceRole.functions.invoke(
      "scoreLeadIntelligence",
      { lead_id, project_id }
    );
    results.steps.score = scoreResult.success
      ? scoreResult.data
      : { error: scoreResult.error };

    // STEP 2: Classify intent (if there's a recent message)
    console.log("[Orchestrator] Step 2/7: Classifying intent...");
    const recentMessage = getRecentInboundMessage(lead_id);
    if (recentMessage) {
      const intentResult = await base44.asServiceRole.functions.invoke(
        "classifyLeadIntent",
        { lead_id, message_text: recentMessage }
      );
      results.steps.intent = intentResult.success
        ? intentResult.data
        : { error: intentResult.error };
    }

    const intent = results.steps.intent?.intent || "general";
    const score = results.steps.score?.score || 50;

    // STEP 3: Predict outcome
    console.log("[Orchestrator] Step 3/7: Predicting outcome...");
    const outcomeResult = await base44.asServiceRole.functions.invoke(
      "predictLeadOutcome",
      { lead_id, project_id }
    );
    results.steps.outcome = outcomeResult.success
      ? outcomeResult.data
      : { error: outcomeResult.error };

    const bookingProbability =
      results.steps.outcome?.booking_probability || 0;

    // STEP 4: Decide next action
    console.log("[Orchestrator] Step 4/7: Deciding next action...");
    const actionResult = await base44.asServiceRole.functions.invoke(
      "decideNextAction",
      { lead_id, intent, score, booking_probability, project_id }
    );
    results.steps.action = actionResult.success
      ? actionResult.data
      : { error: actionResult.error };

    // STEP 5: Generate smart response (if action requires messaging)
    if (
      results.steps.action?.action &&
      ["send_sms", "send_email"].includes(results.steps.action.action)
    ) {
      console.log("[Orchestrator] Step 5/7: Generating personalized message...");
      const messageType = results.steps.action.action === "send_sms"
        ? "sms"
        : "email";
      const messageResult = await base44.asServiceRole.functions.invoke(
        "generateSmartResponse",
        { lead_id, intent, message_type: messageType, project_id }
      );
      results.steps.message = messageResult.success
        ? messageResult.data
        : { error: messageResult.error };
    }

    // STEP 6: Route to team member (if hot lead or ready to assign)
    if (score > 60 || bookingProbability > 50) {
      console.log("[Orchestrator] Step 6/7: Routing to optimal team member...");
      const routeResult = await base44.asServiceRole.functions.invoke(
        "routeToOptimalTeamMember",
        { lead_id, project_id }
      );
      results.steps.routing = routeResult.success
        ? routeResult.data
        : { error: routeResult.error };
    }

    // STEP 7: Churn analysis (if customer has booked before)
    console.log("[Orchestrator] Step 7/7: Analyzing churn risk...");
    const churnResult = await base44.asServiceRole.functions.invoke(
      "predictChurnRisk",
      { lead_id, project_id }
    );
    results.steps.churn = churnResult.success
      ? churnResult.data
      : { error: churnResult.error };

    // Summary
    results.summary = {
      score: results.steps.score?.score,
      intent,
      booking_probability: bookingProbability,
      next_action: results.steps.action?.action,
      assigned_to: results.steps.routing?.assigned_to_name,
      churn_risk: results.steps.churn?.churn_risk_level,
    };

    console.log(`[Orchestrator] ✅ Complete workflow for ${lead_id}`);

    return Response.json({
      success: true,
      lead_id,
      workflow_complete: true,
      summary: results.summary,
      detailed_results: results,
    });
  } catch (error) {
    console.error("[Orchestrator] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function getRecentInboundMessage(lead_id) {
  // Placeholder: would query latest inbound message from lead
  return null;
}