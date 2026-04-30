/**
 * Predict Churn Window
 * Analyzes customer engagement to predict when they're at risk of cancelling
 * Triggers retention campaigns before churn happens
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    console.log(`[ChurnPredictor] Analyzing churn risk for ${lead_id}`);

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get communication history (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      100
    );

    const recentEvents = (events || []).filter(
      (e) => new Date(e.created_date) >= sixtyDaysAgo
    );

    // 3. Calculate engagement metrics
    const lastContactDate = recentEvents.length > 0
      ? new Date(recentEvents[0].created_date)
      : new Date(lead.last_contacted_at || lead.created_date);

    const daysSinceContact = Math.floor(
      (new Date() - lastContactDate) / (1000 * 60 * 60 * 24)
    );

    const emailOpens = recentEvents.filter(
      (e) => e.event_type === "email_sent"
    ).length;
    const emailClicks = recentEvents.filter(
      (e) => e.event_type === "email_clicked"
    ).length;
    const smsReceived = recentEvents.filter(
      (e) => e.channel === "sms" && e.direction === "inbound"
    ).length;

    // 4. Detect engagement decline
    const engagementTrend = emailOpens > 0 ? emailClicks / emailOpens : 0;
    const isDisengaged = engagementTrend < 0.1 && daysSinceContact > 14;
    const isAtRisk = daysSinceContact > 30 || emailOpens === 0;

    // 5. Calculate churn probability
    let churnScore = 0;
    if (daysSinceContact > 45) churnScore += 30;
    if (daysSinceContact > 30) churnScore += 20;
    if (emailOpens === 0) churnScore += 25;
    if (engagementTrend < 0.05) churnScore += 25;
    if (smsReceived === 0) churnScore += 15;

    churnScore = Math.min(100, churnScore);

    // 6. Predict window for intervention
    let daysUntilChurn = 14;
    if (churnScore >= 70) daysUntilChurn = 7;
    if (churnScore >= 80) daysUntilChurn = 3;

    const interventionDate = new Date();
    interventionDate.setDate(interventionDate.getDate() + daysUntilChurn);

    console.log(
      `[ChurnPredictor] Churn score: ${churnScore}%, intervention window: ${daysUntilChurn} days`
    );

    return Response.json({
      success: true,
      lead_id,
      churn_score: churnScore,
      days_since_contact: daysSinceContact,
      is_at_risk: isAtRisk,
      is_disengaged: isDisengaged,
      engagement_trend: Math.round(engagementTrend * 100),
      predicted_intervention_window: daysUntilChurn,
      intervention_date: interventionDate.toISOString(),
      recommendation:
        churnScore > 60
          ? "URGENT: Send win-back campaign immediately"
          : "Send engagement boost offer",
    });
  } catch (error) {
    console.error("[ChurnPredictor] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});