/**
 * AI Function 6: routeToOptimalTeamMember
 * Intelligently assigns leads to best team member based on close rates
 * 
 * INPUT: Lead data + team members + their conversion history
 * OUTPUT: Best team member to close + confidence + reasoning
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, project_id } = await req.json();

    if (!lead_id || !project_id) {
      return Response.json(
        { error: "lead_id and project_id required" },
        { status: 400 }
      );
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    const project = await base44.asServiceRole.entities.ClientProject.get(project_id);

    // Get team members assigned to this project
    const teamMembers = await getProjectTeamMembers(base44, project);

    console.log(`[RouteTeam] Routing ${lead_id} to optimal team member`);

    const teamProfiles = await Promise.all(
      teamMembers.map(async (member) => ({
        email: member.email,
        name: member.name,
        conversion_rate: await getConversionRate(base44, member.email),
        specialty: member.specialty || "general",
        current_load: await getCurrentWorkload(base44, member.email),
        avg_close_time_days: await getAvgCloseTime(base44, member.email),
      }))
    );

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Choose the BEST team member to close this lead.

LEAD PROFILE:
- Name: ${lead.full_name}
- Business: ${lead.business_name} (${lead.business_type})
- Lead Score: ${lead.lead_score}/100
- Source: ${lead.source}

TEAM MEMBERS:
${teamProfiles
  .map(
    (t) => `
- ${t.name} (${t.email})
  Conversion Rate: ${t.conversion_rate.toFixed(1)}%
  Specialty: ${t.specialty}
  Current Load: ${t.current_load} leads
  Avg Close Time: ${t.avg_close_time_days} days
`
  )
  .join("")}

ASSIGNMENT LOGIC:
1. Match specialty to lead type (med spa expert → med spa lead)
2. Prioritize high conversion rate (but balance workload)
3. Avoid overloading anyone (cap ~10 active leads)
4. Consider fastest closers for hot leads
5. Consider thorough closers for complex leads

Respond with JSON:
{
  "assigned_to_email": "best member email",
  "assigned_to_name": "name",
  "confidence": number 0-100,
  "reasoning": "why this person",
  "expected_close_time_days": number
}`,
      response_json_schema: {
        type: "object",
        properties: {
          assigned_to_email: { type: "string" },
          assigned_to_name: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 100 },
          reasoning: { type: "string" },
          expected_close_time_days: { type: "number" },
        },
        required: ["assigned_to_email", "reasoning"],
      },
    });

    // Update lead assignment
    await base44.asServiceRole.entities.Leads.update(lead_id, {
      assigned_to: result.assigned_to_email,
      assigned_at: new Date().toISOString(),
    });

    console.log(`[RouteTeam] ${lead_id} assigned to ${result.assigned_to_name}`);

    return Response.json({
      success: true,
      lead_id,
      assigned_to: result.assigned_to_email,
      assigned_to_name: result.assigned_to_name,
      confidence: result.confidence,
      reasoning: result.reasoning,
      expected_days: result.expected_close_time_days,
    });
  } catch (error) {
    console.error("[RouteTeam] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

async function getProjectTeamMembers(base44, project) {
  // Placeholder: in real system, would query team members assigned to project
  return [
    { email: project.owner_email, name: "Owner", specialty: "general" },
  ];
}

async function getConversionRate(base44, memberEmail) {
  // Placeholder: would calculate from Leads where assigned_to=memberEmail and status="Booked"
  return 35; // 35%
}

async function getCurrentWorkload(base44, memberEmail) {
  const assigned = await base44.asServiceRole.entities.Leads.filter(
    { assigned_to: memberEmail, status: { $ne: "Closed" } },
    "-created_date",
    100
  ).catch(() => []);
  return (assigned || []).length;
}

async function getAvgCloseTime(base44, memberEmail) {
  // Placeholder: would calculate average days from assignment to booking
  return 3;
}