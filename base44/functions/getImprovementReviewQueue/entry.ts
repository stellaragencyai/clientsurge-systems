import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * getImprovementReviewQueue
 * 
 * Fetches improvement recommendations from system health insights and automation
 * diagnostics. Returns review-ready recommendations with status tracking.
 * 
 * Admin-only endpoint. Logs all review actions for audit trail.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, item_id, decision, notes } = await req.json();

    // ── ACTION: FETCH QUEUE ──
    if (action === 'fetch') {
      // Build synthetic recommendations from system data
      const automationJobs = await base44.asServiceRole.entities.AutomationJob
        .filter({ status: 'failed' }, '-created_date', 50)
        .catch(() => []);
      
      const communicationEvents = await base44.asServiceRole.entities.CommunicationEvent
        .filter({ status: 'failed' }, '-created_date', 50)
        .catch(() => []);

      const automationRules = await base44.asServiceRole.entities.AutomationRule
        .filter({}, '-updated_date', 50)
        .catch(() => []);

      // Build recommendation items
      const items = [];

      // Failed automation jobs → recommendations
      if (automationJobs?.length > 0) {
        const failureGroups = {};
        automationJobs.forEach(job => {
          const key = job.error_message?.substring(0, 50) || 'unknown_error';
          failureGroups[key] = (failureGroups[key] || 0) + 1;
        });

        Object.entries(failureGroups).forEach(([key, count]) => {
          if (count >= 3) {
            items.push({
              review_id: `rec_job_${key.substring(0, 20)}`,
              source_issue: `${count} failed automation jobs`,
              description: `Pattern detected: "${key}". Consider reviewing automation timing, webhook endpoints, or lead routing logic.`,
              source_module: 'Automation Engine',
              severity: count >= 10 ? 'critical' : 'high',
              status: 'pending_review',
              recommendation: 'Review failed job logs and adjust automation configuration',
              created_at: new Date().toISOString(),
              count,
            });
          }
        });
      }

      // Failed communication events → recommendations
      if (communicationEvents?.length > 0) {
        const failureGroups = {};
        communicationEvents.forEach(event => {
          const provider = event.provider || 'unknown';
          failureGroups[provider] = (failureGroups[provider] || 0) + 1;
        });

        Object.entries(failureGroups).forEach(([provider, count]) => {
          if (count >= 2) {
            items.push({
              review_id: `rec_msg_${provider}`,
              source_issue: `${count} failed ${provider} messages`,
              description: `${provider} delivery failures detected. Check credentials, rate limits, and webhook configurations.`,
              source_module: 'Messaging Pipeline',
              severity: count >= 5 ? 'high' : 'medium',
              status: 'pending_review',
              recommendation: `Validate ${provider} integration and retry failed messages`,
              created_at: new Date().toISOString(),
              count,
            });
          }
        });
      }

      // Inactive automation rules → recommendations
      if (automationRules?.length > 0) {
        const inactiveCount = automationRules.filter(r => r.status === 'inactive' || !r.status).length;
        if (inactiveCount >= 1) {
          items.push({
            review_id: `rec_rules_inactive`,
            source_issue: `${inactiveCount} inactive automation rules`,
            description: `Several automation rules are inactive. Review and re-enable if they should be running.`,
            source_module: 'Automation Rules',
            severity: 'advisory',
            status: 'pending_review',
            recommendation: 'Review inactive rules and re-enable or archive as needed',
            created_at: new Date().toISOString(),
            count: inactiveCount,
          });
        }
      }

      // Return sorted by severity
      const severityOrder = { critical: 0, high: 1, medium: 2, advisory: 3 };
      items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      return Response.json({
        success: true,
        items,
        total_count: items.length,
        timestamp: new Date().toISOString(),
      });
    }

    // ── ACTION: UPDATE DECISION ──
    if (action === 'decide') {
      if (!item_id || !decision || !['approved', 'rejected'].includes(decision)) {
        return Response.json({ error: 'Invalid decision payload' }, { status: 400 });
      }

      // Log decision to CommunicationEvent for audit trail
      await base44.asServiceRole.entities.CommunicationEvent.create({
        channel: 'internal',
        direction: 'system',
        event_type: 'improvement_review_decision',
        provider: 'internal',
        status: 'processed',
        subject: `Improvement Review Decision: ${decision.toUpperCase()}`,
        message_body: JSON.stringify({
          review_id: item_id,
          decision,
          notes,
          admin_email: user.email,
          timestamp: new Date().toISOString(),
        }),
        metadata_json: JSON.stringify({
          review_id: item_id,
          decision,
          admin: user.email,
        }),
      }).catch(err => console.error('[getImprovementReviewQueue] Log error:', err));

      return Response.json({
        success: true,
        review_id: item_id,
        decision,
        logged_at: new Date().toISOString(),
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[getImprovementReviewQueue] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});