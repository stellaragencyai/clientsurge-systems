import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function hoursAgo(dateValue) {
  if (!dateValue) return null;
  const time = new Date(dateValue).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.round(((Date.now() - time) / 36e5) * 10) / 10;
}

function flow({ id, severity = "warning", status = "needs_review", title, message, route_hint, entity_name, record_id, age_hours, source = "getBrokenFlows" }) {
  return { id, severity, status, title, message, route_hint, entity_name, record_id, age_hours, source };
}

async function safeFilter(base44, entityName, filter, sort = "-created_date", limit = 50) {
  return await base44.asServiceRole.entities[entityName].filter(filter, sort, limit).catch((error) => {
    console.warn(`[getBrokenFlows] ${entityName}.filter failed: ${error.message}`);
    return [];
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: "Admin only" }, 403);

    const [paidOrders, installationRows, recentAudits, recentDeadLetters, recentExecutions] = await Promise.all([
      safeFilter(base44, "Order", { payment_status: "paid" }, "-created_date", 75),
      safeFilter(base44, "ClientInstallationOS", {}, "-created_date", 250),
      safeFilter(base44, "AuditLog", {}, "-created_date", 75),
      safeFilter(base44, "DeadLetterQueue", {}, "-created_date", 30),
      safeFilter(base44, "SystemExecutionLog", {}, "-created_date", 50),
    ]);

    const installationByOrder = new Map((installationRows || []).map((row) => [row.order_id, row]));
    const flows = [];

    for (const order of paidOrders || []) {
      const age = hoursAgo(order.created_date || order.updated_date);
      const hasConfig = Boolean(order.install_configuration && Object.keys(order.install_configuration || {}).length > 0);
      const hasInstallOS = installationByOrder.has(order.id);
      const hasDraft = Boolean(order.purchase_onboarding_handoff?.credentials_draft);

      if (!hasInstallOS) {
        flows.push(flow({
          id: `missing-install-os-${order.id}`,
          severity: "critical",
          title: "Paid order missing ClientInstallationOS",
          message: `${order.business_name || order.customer_email || order.id} is paid but has no install operating-system record.`,
          route_hint: `/admin/onboarding?order_id=${order.id}`,
          entity_name: "Order",
          record_id: order.id,
          age_hours: age,
        }));
      }

      if (!hasConfig && age !== null && age >= 0.25) {
        flows.push(flow({
          id: `missing-credentials-${order.id}`,
          severity: hasDraft ? "warning" : "critical",
          title: hasDraft ? "Credentials draft exists but not submitted" : "Paid order missing credentials submission",
          message: `${order.business_name || order.customer_email || order.id} has no saved install_configuration${hasDraft ? " but a draft exists" : ""}.`,
          route_hint: `/setup/credentials?order_id=${order.id}`,
          entity_name: "Order",
          record_id: order.id,
          age_hours: age,
        }));
      }
    }

    for (const row of recentDeadLetters || []) {
      flows.push(flow({
        id: `dead-letter-${row.id}`,
        severity: "critical",
        title: "Dead-lettered automation event",
        message: row.error_message || row.message || "A queued system event entered the dead-letter path.",
        route_hint: "/admin/logs",
        entity_name: "DeadLetterQueue",
        record_id: row.id,
        age_hours: hoursAgo(row.created_date || row.timestamp),
      }));
    }

    for (const row of recentExecutions || []) {
      const status = String(row.status || row.execution_status || "").toLowerCase();
      if (["failed", "error", "blocked"].includes(status)) {
        flows.push(flow({
          id: `execution-${row.id}`,
          severity: "critical",
          title: "Failed system execution",
          message: row.error || row.error_message || row.summary || "A system execution failed.",
          route_hint: "/admin/system-observability",
          entity_name: "SystemExecutionLog",
          record_id: row.id,
          age_hours: hoursAgo(row.created_date || row.timestamp),
        }));
      }
    }

    const credentialsAuditCount = (recentAudits || []).filter((row) => row.action === "credentials_submitted").length;

    if (flows.length === 0) {
      flows.push(flow({
        id: "setup-pipeline-clear",
        severity: "info",
        status: "healthy",
        title: "No broken purchase-to-portal flows detected",
        message: `Recent scan found ${credentialsAuditCount} credentials submission audit event(s) and no paid-order setup blockers in the current sample.`,
        route_hint: "/admin/onboarding",
      }));
    }

    return json({
      success: true,
      checked_at: new Date().toISOString(),
      summary: {
        paid_orders_scanned: paidOrders?.length || 0,
        installation_os_scanned: installationRows?.length || 0,
        audit_events_scanned: recentAudits?.length || 0,
        credentials_submission_audits: credentialsAuditCount,
        broken_flow_count: flows.filter((item) => item.severity !== "info").length,
      },
      flows,
    });
  } catch (error) {
    console.error(`[getBrokenFlows] Error: ${error.message}`);
    return json({ error: error.message }, 500);
  }
});
