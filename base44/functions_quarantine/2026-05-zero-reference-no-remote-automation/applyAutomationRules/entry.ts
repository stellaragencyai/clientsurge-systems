/**
 * Apply Automation Rules
 * Checks all active rules and fires actions when conditions match
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id, lead_id, trigger_type } = await req.json();

    if (!project_id) {
      return Response.json({ error: "project_id required" }, { status: 400 });
    }

    console.log(
      `[ApplyRules] Checking rules for project ${project_id} (${trigger_type})`
    );

    // Get all active rules for this project
    const rules = await base44.asServiceRole.entities.AutomationRule.filter(
      { project_id, enabled: true, trigger_type },
      "priority",
      100
    );

    if (!rules?.length) {
      return Response.json({
        success: true,
        rules_fired: 0,
      });
    }

    // Get lead data if provided
    let lead = null;
    if (lead_id) {
      lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    }

    const firedRules = [];

    // Check each rule
    for (const rule of rules) {
      const conditionsMet = checkConditions(rule.conditions, lead);

      if (conditionsMet) {
        console.log(`[ApplyRules] Firing rule: ${rule.rule_name}`);

        // Execute actions
        for (const action of rule.actions) {
          await executeAction(base44, action, lead, project_id);
        }

        firedRules.push({
          rule_id: rule.id,
          rule_name: rule.rule_name,
          fired_at: new Date().toISOString(),
        });

        // Update rule's last fired time
        await base44.asServiceRole.entities.AutomationRule.update(rule.id, {
          last_fired_at: new Date().toISOString(),
        });
      }
    }

    console.log(`[ApplyRules] ${firedRules.length} rules fired`);

    return Response.json({
      success: true,
      rules_fired: firedRules.length,
      fired_rules: firedRules,
    });
  } catch (error) {
    console.error("[ApplyRules] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function checkConditions(conditions, lead) {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((cond) => {
    if (!lead) return true;

    const value = lead[cond.field];

    switch (cond.operator) {
      case "equals":
        return value === cond.value;
      case "greater_than":
        return value > cond.value;
      case "less_than":
        return value < cond.value;
      case "contains":
        return String(value).includes(String(cond.value));
      case "in_range":
        return value >= cond.value[0] && value <= cond.value[1];
      case "exists":
        return value !== null && value !== undefined;
      default:
        return true;
    }
  });
}

async function executeAction(base44, action, lead, projectId) {
  switch (action.action_type) {
    case "invoke_function":
      await base44.asServiceRole.functions.invoke(action.params.function, {
        lead_id: lead?.id,
        project_id: projectId,
      });
      break;

    case "send_sms":
      console.log(
        `[ApplyRules] Would send SMS: ${action.params.template} to ${lead?.phone}`
      );
      break;

    case "send_email":
      console.log(
        `[ApplyRules] Would send email: ${action.params.template} to ${lead?.email}`
      );
      break;

    case "assign_to_sales":
      console.log(`[ApplyRules] Would assign lead to sales rep`);
      break;

    default:
      console.log(`[ApplyRules] Unknown action: ${action.action_type}`);
  }
}