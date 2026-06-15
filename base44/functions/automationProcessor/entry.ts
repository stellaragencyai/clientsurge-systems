import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Automation Processor: Executes automation rules + workflows
 * Part of Scale Architecture processing pipeline
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_queue_id, communication_event_id, client_id, client_project_id } = await req.json();

    // Fetch event details
    const event = await base44.asServiceRole.entities.CommunicationEvent.get(communication_event_id);
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const results = {
      event_queue_id,
      communication_event_id,
      automation_rules_executed: 0,
    };

    // Fetch applicable automation rules for this client/project
    const rules = await base44.asServiceRole.entities.AutomationRule.filter(
      {
        project_id: client_project_id || client_id,
        enabled: true,
      },
      '-priority',
      50
    ).catch(() => []);

    // Execute matching rules
    for (const rule of rules) {
      try {
        // Check if rule conditions match event
        if (matchesRuleConditions(rule, event)) {
          // Execute rule actions
          for (const action of rule.actions || []) {
            // Placeholder: invoke action handler
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

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[automationProcessor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function matchesRuleConditions(rule, event) {
  if (!rule.conditions || rule.conditions.length === 0) {
    return true; // No conditions = always match
  }
  // Simplified: check if event_type matches any condition
  return rule.conditions.some(c => c.value === event.event_type);
}