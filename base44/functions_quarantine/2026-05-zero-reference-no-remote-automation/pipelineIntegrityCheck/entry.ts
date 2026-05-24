/**
 * pipelineIntegrityCheck — #161 #162 #163 #166
 * Verifies and auto-fixes pipeline data consistency after Order state changes.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { order_id, fix = true } = await req.json().catch(() => ({}));
  if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

  const issues: string[] = [];
  const fixes: string[] = [];

  const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  // #161: client_id must be set
  if (!order.client_id && order.customer_email) {
    issues.push("#161: client_id missing");
    if (fix) {
      const users = await base44.asServiceRole.entities.User.filter({ email: order.customer_email }).catch(() => []);
      if (users?.[0]?.id) {
        await base44.asServiceRole.entities.Order.update(order_id, { client_id: users[0].id });
        fixes.push("Set client_id from email match");
      }
    }
  }

  // #162: ClientProject must exist for paid orders
  if (order.payment_status === "paid") {
    const projects = await base44.asServiceRole.entities.ClientProject.filter({ order_id }).catch(() => []);
    if (!projects?.length) {
      issues.push("#162: No ClientProject for paid order");
      if (fix) {
        await base44.asServiceRole.entities.ClientProject.create({
          order_id, business_name: order.business_name, industry: order.industry,
          package_key: order.package_key, status: "Active", workflow_stage: "Onboarding",
          monthly_rate: order.monthly_rate, client_name: order.customer_name || order.business_name,
        });
        fixes.push("Created missing ClientProject");
      }
    }
  }

  // #163: CommunicationEvent must exist for paid orders
  const comms = await base44.asServiceRole.entities.CommunicationEvent.filter({ context_id: order_id }).catch(() => []);
  if (!comms?.length && order.payment_status === "paid") {
    issues.push("#163: No CommunicationEvent for order");
    if (fix) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_id: order_id, context_type: "order", event_type: "system_check",
        direction: "outbound", metadata_json: JSON.stringify({ note: "integrity_check_auto" }),
      });
      fixes.push("Created audit CommunicationEvent");
    }
  }

  // #166: workflow_stage must be in sync with payment_status
  if (order.payment_status === "paid" && order.workflow_stage === "Pending") {
    issues.push("#166: workflow_stage out of sync — still Pending after paid");
    if (fix) {
      await base44.asServiceRole.entities.Order.update(order_id, { workflow_stage: "Configuring" });
      fixes.push("Synced workflow_stage → Configuring");
    }
  }

  await base44.asServiceRole.entities.AgentLog.create({
    agent_name: "Agent Smith", log_type: issues.length ? "WARNING" : "INFO",
    summary: `pipelineIntegrityCheck: ${issues.length} issues, ${fixes.length} fixed`,
    details: [...issues, ...fixes.map(f => "FIX: " + f)].join("\n") || "All checks passed",
    service: "pipelineIntegrityCheck", requires_nolan: issues.length > fixes.length,
    resolved: issues.length === fixes.length,
  });

  return Response.json({ order_id, issues_found: issues.length, fixes_applied: fixes.length, issues, fixes });
});
