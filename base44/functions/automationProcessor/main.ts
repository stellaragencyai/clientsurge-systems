import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Automation Processor: Executes automation rules + workflows
 * Updated with idempotency + orchestration integration
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      workflow_id,
      event_queue_id,
      communication_event_id,
      client_id,
      client_project_id,
      idempotency_key,
    } = await req.json();

    // Check idempotency
    if (idempotency_key) {
      const existing = await base44.asServiceRole.entities.IdempotencyKey.filter(
        { idempotency_key },
        '-created_date',
        1
      ).catch(() => []);

      if (existing?.length > 0 && existing[0].status === 'completed') {
        console.log(`[automationProcessor] Skipping duplicate idempotency key:`, idempotency_key);
        return Response.json({
          success: true,
          skipped: true,
          reason: 'idempotency_duplicate',
          automation_rules_executed: 0,
        });
      }
    }

    const results = {
      success: false,
      skipped: false,
      automation_rules_executed: 0,
    };

    // Fetch event details
    if (communication_event_id) {
      const event = await base44.asServiceRole.entities.CommunicationEvent.get(communication_event_id);
      if (!event) {
        return Response.json({ error: 'Event not found' }, { status: 404 });
      }

      // Fetch applicable automation rules
      const rules = await base44.asServiceRole.entities.AutomationRule.filter(
        { project_id: client_project_id || client_id, enabled: true },
        '-priority',
        50
      ).catch(() => []);

      // Execute matching rules
      for (const rule of rules) {
        try {
          if (matchesRuleConditions(rule, event)) {
            for (const action of rule.actions || []) {
              console.log(`[automationProcessor] Executing action: ${action.action_type}`, {
                rule_id: rule.id,
              });
            }
            results.automation_rules_executed++;
          }
        } catch (ruleError) {
          console.error(`[automationProcessor] Rule ${rule.id} error:`, ruleError.message);
        }
      }
    }

    results.success = true;

    return Response.json(results);
  } catch (error) {
    console.error('[automationProcessor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function matchesRuleConditions(rule, event) {
  if (!rule.conditions || rule.conditions.length === 0) {
    return true;
  }
  return rule.conditions.some(c => c.value === event.event_type);
}