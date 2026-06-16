import { secureJson } from "../_shared/response.ts";
/**
 * Initialize Business Config from Template
 * On service selection, auto-populate all configurations
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id, industry, mode = "full_automation" } = await req.json();

    if (!project_id || !industry) {
      return secureJson(
        { error: "project_id and industry required" },
        { status: 400 }
      );
    }

    console.log(
      `[InitConfig] Initializing ${industry} for ${project_id} (mode: ${mode})`
    );

    // Get industry template
    const templates = await base44.asServiceRole.entities.BusinessConfigTemplate.filter(
      { industry, status: "active" },
      "-created_date",
      1
    );

    if (!templates?.length) {
      return secureJson(
        { error: `No template found for industry: ${industry}` },
        { status: 404 }
      );
    }

    const template = templates[0];

    // Update project with template config
    await base44.asServiceRole.entities.ClientProject.update(project_id, {
      install_configuration: {
        industry,
        mode,
        response_sla_minutes: template.response_sla_minutes,
        booking_frequency_days: template.booking_frequency_days,
        churn_baseline_days: template.churn_baseline_days,
        default_templates: template.default_templates,
        scoring_multipliers: template.scoring_multipliers,
      },
    });

    // Create automation rules based on mode
    const rules = generateRulesForMode(mode);
    for (const rule of rules) {
      await base44.asServiceRole.entities.AutomationRule.create({
        rule_name: rule.rule_name,
        project_id,
        trigger_type: rule.trigger_type,
        conditions: rule.conditions,
        actions: rule.actions,
        priority: rule.priority,
        enabled: true,
      });
    }

    console.log(
      `[InitConfig] ✅ Initialized ${industry} (${rules.length} rules created)`
    );

    return secureJson({
      success: true,
      project_id,
      industry,
      mode,
      template_applied: template.template_name,
      rules_created: rules.length,
    });
  } catch (error) {
    console.error("[InitConfig] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function generateRulesForMode(mode) {
  const baseRules = [
    {
      rule_name: "Score all new leads",
      trigger_type: "lead_created",
      conditions: [{ field: "lead_score", operator: "equals", value: 0 }],
      actions: [{ action_type: "invoke_function", params: { function: "scoreLeadIntelligence" } }],
      priority: 10,
    },
    {
      rule_name: "Classify lead intent",
      trigger_type: "lead_replied",
      conditions: [],
      actions: [{ action_type: "invoke_function", params: { function: "classifyLeadIntent" } }],
      priority: 9,
    },
  ];

  if (mode === "full_automation") {
    return [
      ...baseRules,
      {
        rule_name: "Route hot leads to sales",
        trigger_type: "lead_scored",
        conditions: [
          { field: "lead_score", operator: "greater_than", value: 75 },
        ],
        actions: [{ action_type: "invoke_function", params: { function: "routeToOptimalTeamMember" } }],
        priority: 8,
      },
      {
        rule_name: "Daily churn check",
        trigger_type: "churn_check",
        conditions: [],
        actions: [{ action_type: "invoke_function", params: { function: "predictChurnRisk" } }],
        priority: 7,
      },
    ];
  }

  if (mode === "instant_plus_nurture") {
    return [
      ...baseRules,
      {
        rule_name: "Send instant response",
        trigger_type: "lead_created",
        conditions: [{ field: "phone", operator: "exists", value: null }],
        actions: [{ action_type: "send_sms", params: { template: "instant_response" } }],
        priority: 8,
      },
    ];
  }

  return baseRules;
}