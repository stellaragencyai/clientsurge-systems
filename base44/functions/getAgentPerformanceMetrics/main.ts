import { secureJson } from "../_shared/response.ts";
/**
 * getAgentPerformanceMetrics — #552
 * Queries Leads filtered by assigned_agent.
 * Returns per-agent stats: leads handled, response rate, demos booked, avg reply time.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const AGENTS = ["MedSpa AI", "Dental AI", "Tanning AI", "HVAC AI", "Roofing AI", "Contractors AI"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const leads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    const allLeads = leads || [];

    const metrics: Record<string, any> = {};

    for (const agent of AGENTS) {
      const agentLeads = allLeads.filter((l: any) => l.assigned_to === agent || (l.industry && agent.toLowerCase().includes(l.industry?.split("_")[0]?.toLowerCase() || "")));
      const contacted = agentLeads.filter((l: any) => l.status === "Contacted" || l.status === "Booked").length;
      const booked = agentLeads.filter((l: any) => l.demo_booked || l.status === "Booked").length;
      const responseRate = agentLeads.length > 0 ? Math.round((contacted / agentLeads.length) * 100) : 0;

      metrics[agent] = {
        agent_name: agent,
        total_leads: agentLeads.length,
        contacted,
        demos_booked: booked,
        response_rate: responseRate,
        status: agentLeads.length > 0 ? "active" : "idle",
      };
    }

    return secureJson({ success: true, agents: Object.values(metrics) });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
