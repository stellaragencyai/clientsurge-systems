import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { executeBookingSimulation, RuntimeExecutionError } from "../_shared/installRuntime/entry.ts";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const payload = await req.json().catch(() => ({}));
    const {
      order_id,
      lead_name,
      lead_email,
      lead_phone,
      scheduled_at,
    } = payload || {};

    if (!order_id) {
      return secureJson({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return secureJson({ error: "Order not found" }, { status: 404 });
    }

    // ── DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    if (order.client_id) {
      try {
        const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: order.client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
          '-created_date', 1
        );
        const deployment = deployments?.[0] || null;
        if (deployment) {
          const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
            deployment_id: deployment.id, module_key: 'ai_booking_agent'
          });
          if (permRes.data?.authorized !== true) {
            await base44.asServiceRole.functions.invoke('logAutomationExecution', {
              client_deployment_id: deployment.id, client_id: order.client_id,
              module_key: 'ai_booking_agent', trigger_event: 'booking_test',
              execution_status: 'blocked',
              error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
              error_code: permRes.data?.reason || 'module_not_authorized',
            }).catch(() => {});
            return secureJson({ error: 'Module not authorized for this deployment', blocked: true, reason: permRes.data?.reason }, { status: 403 });
          }
          _obsCtx = { deployment_id: deployment.id, client_id: order.client_id, module_key: 'ai_booking_agent', trigger_event: 'booking_test' };
        }
      } catch (err) {
        console.warn('[runBookingAgentTest] Observability init failed:', err.message);
      }
    }

    const result = await executeBookingSimulation({
      base44,
      order,
      runtimeType: "run_booking_agent_test",
      leadName: lead_name,
      leadEmail: lead_email,
      leadPhone: lead_phone,
      scheduledAt: scheduled_at,
    });

    // ── DEPLOYMENT OBSERVABILITY: Log successful execution ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'completed',
          response_data: JSON.stringify(result),
          execution_time_ms: Date.now() - _obsStartTime,
        });
      } catch (_) {}
    }

    return secureJson({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run booking agent test";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 :
      error instanceof RuntimeExecutionError ? error.status || 409 :
      500;

    return secureJson(
      {
        error: message,
        details: error instanceof RuntimeExecutionError ? error.details : undefined,
      },
      { status }
    );
  }
});