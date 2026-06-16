/**
 * workflowStageManager — #419
 * Auto-updates Order.workflow_stage as website build progresses.
 * Stages: intake → spec_generated → copy_generated → approved → building → live
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function secureJson(data, opts = {}) {
  return new Response(JSON.stringify(data), {
    status: opts.status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const WORKFLOW_STAGES = [
  "Paid",
  "Configuring",
  "Website Spec Generated",
  "Website Copy Generated",
  "Awaiting Approval",
  "Website Building",
  "Installing",
  "Testing",
  "Live",
];

export function getNextStage(current) {
  const idx = WORKFLOW_STAGES.indexOf(current);
  if (idx === -1 || idx >= WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[idx + 1];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, stage, advance } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    let new_stage = stage;
    if (advance) {
      new_stage = getNextStage(order.workflow_stage || "Paid");
      if (!new_stage) return secureJson({ success: true, message: "Already at final stage", current: order.workflow_stage });
    }

    if (!WORKFLOW_STAGES.includes(new_stage)) {
      return secureJson({ error: `Invalid stage: ${new_stage}. Valid: ${WORKFLOW_STAGES.join(", ")}` }, { status: 400 });
    }

    // Log stage transition separately instead of using dynamic keys
    await base44.asServiceRole.entities.Order.update(order_id, {
      workflow_stage: new_stage,
    });
    
    // Create audit log for stage transition
    await base44.asServiceRole.entities.AuditLog.create({
      admin_email: "system",
      action: "workflow_stage_update",
      entity_name: "Order",
      record_id: order_id,
      before: JSON.stringify({ workflow_stage: order.workflow_stage }),
      after: JSON.stringify({ workflow_stage: new_stage }),
      timestamp: new Date().toISOString(),
      notes: `Stage: ${order.workflow_stage} → ${new_stage}`,
    }).catch(() => null);

    console.log(`[workflowStageManager] ${order_id}: ${order.workflow_stage} → ${new_stage}`);
    return secureJson({ success: true, previous: order.workflow_stage, current: new_stage });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});