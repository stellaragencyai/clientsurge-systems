import { secureJson } from "../_shared/response.ts";
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
      return secureJson({ error: "lead_id required" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);

    console.log(`[Orchestrator] Running AI workflow for ${lead_id} (${trigger_event})`);

    const results = {
      lead_id,
      timestamp: new Date().toISOString(),
      steps: {},
    };

    // PRE-STEP: Validate lead quality (reject spam early)
    console.log("[Orchestrator] Pre-step: Validating lead quality...");
    const qualityResult = await base44.asServiceRole.functions.invoke(
      "validateLeadQuality",
      { full_name: lead.full_name, email: lead.email, phone: lead.phone }
    );
    results.steps.quality_check = qualityResult.data || {};
    
    if (qualityResult.data?.should_reject) {
      console.log(`[Orchestrator] Lead rejected due to low quality (score: ${qualityResult.data.quality_score})`);
      return secureJson(
        {
          success: false,
          lead_id,
          reason: "Lead failed quality validation",
          quality_score: qualityResult.data.quality_score,
          flags: qualityResult.data.flags,
        },
        { status: 422 }
      );
    }

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

    // STEP 2B: Calculate optimal send time + Enroll in Email Drip Campaign
    if (intent && ["asking_question", "pricing_concern", "uncertain"].includes(intent)) {
      console.log("[Orchestrator] Calculating optimal send time...");
      const sendTimeResult = await base44.asServiceRole.functions.invoke(
        "calculateOptimalSendTime",
        { lead_id, message_type: "email" }
      );
      
      console.log("[Orchestrator] Enrolling in email drip campaign at optimal time...");
      const emailResult = await base44.asServiceRole.functions.invoke(
        "enrollEmailDripCampaign",
        { lead_id, trigger_intent: intent, campaign_type: "case_study", project_id }
      );
      results.steps.optimal_send_time = sendTimeResult.data || {};
      results.steps.email_drip = emailResult.success
        ? emailResult.data
        : { skipped: true, reason: emailResult.data?.message };
    }

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

    // DEDUP: Check for duplicates before proceeding
    console.log("[Orchestrator] Deduplication check...");
    const dedupResult = await base44.asServiceRole.functions.invoke(
      "deduplicateLeads",
      { lead_id }
    );
    results.steps.deduplication = dedupResult.data || {};

    // THREADING: Build conversation context
    console.log("[Orchestrator] Building conversation thread...");
    const threadResult = await base44.asServiceRole.functions.invoke(
      "conversationThreading",
      { lead_id }
    );
    results.steps.conversation_thread = threadResult.data || {};

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

      // If email, generate AI subject line
      if (messageType === "email" && messageResult.data?.message_body) {
        console.log("[Orchestrator] Generating AI subject line...");
        const subjectResult = await base44.asServiceRole.functions.invoke(
          "generateSmartSubjectLine",
          {
            lead_id,
            campaign_type: results.steps.action?.campaign_type,
            intent,
            message_preview: messageResult.data.message_body.substring(0, 100),
          }
        );
        results.steps.email_subject = subjectResult.data || {};
      }
    }

    // STEP 6: Route to team member (if hot lead or ready to assign)
    if (score > 60 || bookingProbability > 50) {
      console.log("[Orchestrator] Step 6/7: Routing to optimal team member (AI-predicted)...");
      const predictResult = await base44.asServiceRole.functions.invoke(
        "predictOptimalCloser",
        { lead_id, project_id }
      );
      results.steps.routing = predictResult.success
        ? predictResult.data
        : { error: predictResult.error };
    }

    // STEP 7: Detect objection patterns (if they've replied)
    console.log("[Orchestrator] Step 7/10: Detecting objection patterns...");
    const objectionResult = await base44.asServiceRole.functions.invoke(
      "detectObjectionPatterns",
      { lead_id, message_text: lead.problem || "" }
    );
    results.steps.objections = objectionResult.success
      ? objectionResult.data
      : { error: objectionResult.error };

    // STEP 8: Predict churn window (if customer engaged)
    console.log("[Orchestrator] Step 8/10: Predicting churn window...");
    const churnWindowResult = await base44.asServiceRole.functions.invoke(
      "predictChurnWindow",
      { lead_id }
    );
    results.steps.churn_window = churnWindowResult.success
      ? churnWindowResult.data
      : { error: churnWindowResult.error };

    // STEP 9: Optimize follow-up sequence
    console.log("[Orchestrator] Step 9/10: Optimizing follow-up sequence...");
    const sequenceResult = await base44.asServiceRole.functions.invoke(
      "optimizeFollowupSequence",
      { lead_id, current_step: 1 }
    );
    results.steps.sequence_optimization = sequenceResult.success
      ? sequenceResult.data
      : { error: sequenceResult.error };

    // STEP 10: Legacy churn risk analysis
    console.log("[Orchestrator] Step 10/10: Analyzing churn risk...");
    const churnResult = await base44.asServiceRole.functions.invoke(
      "predictChurnRisk",
      { lead_id, project_id }
    );
    results.steps.churn = churnResult.success
      ? churnResult.data
      : { error: churnResult.error };

    // STEP 11: Smart booking link deployment
    console.log("[Orchestrator] Step 11/14: Smart booking link deployment...");
    const bookingLinkResult = await base44.asServiceRole.functions.invoke(
      "smartBookingLinkDeployment",
      { lead_id, project_id, booking_link: "https://booking.example.com" }
    );
    results.steps.booking_link = bookingLinkResult.data || {};

    // STEP 12: Auto pipeline advancement
    console.log("[Orchestrator] Step 12/14: Auto pipeline advancement...");
    const pipelineResult = await base44.asServiceRole.functions.invoke(
      "autoPipelineAdvancement",
      { lead_id }
    );
    results.steps.pipeline_advancement = pipelineResult.data || {};

    // SUMMARY: Update summary with all steps
    results.summary = {
      score: results.steps.score?.score,
      intent,
      booking_probability: bookingProbability,
      next_action: results.steps.action?.action,
      assigned_to: results.steps.routing?.recommended_closer,
      churn_risk: results.steps.churn?.churn_risk_level,
      pipeline_stage: results.steps.pipeline_advancement?.current_stage,
      booking_link_deployed: results.steps.booking_link?.should_deploy,
      duplicates_merged: results.steps.deduplication?.duplicates_merged,
      conversation_context: results.steps.conversation_thread?.context_summary,
      objection_detected: results.steps.objections?.primary_objection,
      sequence_recommendation: results.steps.sequence_optimization?.recommended_delay_hours,
    };



    console.log(`[Orchestrator] ✅ Complete workflow for ${lead_id}`);

    return secureJson({
      success: true,
      lead_id,
      workflow_complete: true,
      summary: results.summary,
      detailed_results: results,
    });
  } catch (error) {
    console.error("[Orchestrator] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function getRecentInboundMessage(lead_id) {
  // Placeholder: would query latest inbound message from lead
  return null;
}
