import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Fetch computed business insights for dashboard display
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');

    const insights = {
      outcome_distribution: {},
      top_message_templates: [],
      top_automation_rules: [],
      conversation_patterns: [],
      lead_score_correlation: null,
      funnel_summary: {},
    };

    // === OUTCOME DISTRIBUTION ===
    const outcomes = await base44.asServiceRole.entities.LeadOutcomeAnalytics.filter(
      clientId ? { client_id: clientId } : {},
      '-analytics_computed_at',
      200
    );

    const outcomeMap = {};
    for (const outcome of outcomes) {
      outcomeMap[outcome.outcome_type] = (outcomeMap[outcome.outcome_type] || 0) + 1;
    }
    insights.outcome_distribution = outcomeMap;

    // === TOP MESSAGE TEMPLATES ===
    const templates = await base44.asServiceRole.entities.MessageTemplateInsights.list('-response_rate_percent', 10);
    insights.top_message_templates = templates.map(t => ({
      name: t.template_name,
      response_rate: t.response_rate_percent,
      booking_rate: t.booking_rate_percent,
      usage_count: t.usage_count,
      rank: t.effectiveness_rank,
    }));

    // === TOP AUTOMATION RULES ===
    const rules = clientId
      ? await base44.asServiceRole.entities.AutomationRuleInsights.filter({ project_id: { $contains: clientId } }, '-success_rate_percent', 10)
      : await base44.asServiceRole.entities.AutomationRuleInsights.list('-success_rate_percent', 10);
    
    insights.top_automation_rules = rules.map(r => ({
      name: r.rule_name,
      trigger_count: r.trigger_count,
      success_rate: r.success_rate_percent,
      response_rate: r.response_rate_after_trigger,
      rank: r.effectiveness_rank,
    }));

    // === CONVERSATION PATTERNS ===
    const patterns = await base44.asServiceRole.entities.ConversationPattern.filter(
      clientId ? { client_id: clientId } : {},
      '-frequency',
      5
    );
    insights.conversation_patterns = patterns.map(p => ({
      outcome: p.outcome_type,
      intent: p.ai_intent,
      template: p.initial_template_name,
      total_messages: p.total_messages,
      frequency: p.frequency,
      success_score: p.success_score,
    }));

    // === LEAD SCORE CORRELATION ===
    if (outcomes.length > 0) {
      const withScores = outcomes.filter(o => o.lead_score_at_creation !== null);
      if (withScores.length > 0) {
        const avgScoreSucess = withScores
          .filter(o => o.outcome_type !== 'no_response')
          .reduce((sum, o) => sum + o.lead_score_at_creation, 0) / Math.max(1, withScores.filter(o => o.outcome_type !== 'no_response').length);
        
        const avgScoreNoResponse = withScores
          .filter(o => o.outcome_type === 'no_response')
          .reduce((sum, o) => sum + o.lead_score_at_creation, 0) / Math.max(1, withScores.filter(o => o.outcome_type === 'no_response').length);

        insights.lead_score_correlation = {
          avg_score_successful_outcomes: Math.round(avgScoreSucess),
          avg_score_no_response: Math.round(avgScoreNoResponse),
        };
      }
    }

    // === FUNNEL OVERVIEW ===
    const leadCount = outcomes.length;
    const respondedCount = outcomes.filter(o => o.outcome_type !== 'no_response').length;
    const bookedCount = outcomes.filter(o => o.outcome_type === 'booking_completed').length;

    insights.funnel_summary = {
      total_leads: leadCount,
      responded: respondedCount,
      response_rate_percent: Math.round((respondedCount / Math.max(1, leadCount)) * 100),
      booked: bookedCount,
      booking_rate_percent: Math.round((bookedCount / Math.max(1, leadCount)) * 100),
    };

    return Response.json({
      success: true,
      insights,
      computed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[getBusinessInsights] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});