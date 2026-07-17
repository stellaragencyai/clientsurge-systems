import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Request-ID": data?.request_id || "",
    },
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

function flow({
  id,
  severity = "warning",
  status = "needs_review",
  title,
  message,
  route_hint,
  entity_name,
  record_id,
  age_hours,
  source = "getBrokenFlows",
  proof_state = "record_based",
  repairable = false,
}) {
  return {
    id,
    severity,
    status,
    title,
    message,
    route_hint,
    entity_name,
    record_id,
    age_hours,
    source,
    proof_state,
    repairable,
  };
}

async function safeFilter(base44, entityName, filter, sort = "-created_date", limit = 50) {
  const entityApi = base44.asServiceRole.entities?.[entityName];
  if (!entityApi?.filter) {
    const error = `${entityName} entity is not available in this app`;
    console.warn(`[getBrokenFlows] ${error}`);
    return { rows: [], ok: false, error };
  }
  try {
    const rows = await entityApi.filter(filter, sort, limit);
    return { rows: rows || [], ok: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[getBrokenFlows] ${entityName}.filter failed: ${message}`);
    return { rows: [], ok: false, error: message };
  }
}

function buildCoverage(results) {
  const sources = Object.entries(results).map(([name, result]) => ({
    name,
    available: result.ok,
    rows_scanned: result.rows.length,
    error: result.error,
  }));
  const availableCount = sources.filter((source) => source.available).length;
  const score = Math.round((availableCount / sources.length) * 100);
  const status = score === 100 ? "verified" : score >= 60 ? "partial" : "blocked";
  return {
    status,
    score,
    sources_available: availableCount,
    sources_expected: sources.length,
    sources,
    label:
      status === "verified"
        ? "All diagnostic data sources responded."
        : status === "partial"
          ? "Some diagnostic sources were unavailable; results may be incomplete."
          : "Most diagnostic sources were unavailable; do not treat this scan as complete.",
  };
}

Deno.serve(async (req) => {
  const requestId = `broken_flows_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: "Admin only", request_id: requestId }, 403);

    const [ordersResult, installationsResult, auditsResult, deadLettersResult, executionsResult] = await Promise.all([
      safeFilter(base44, "Order", { payment_status: "paid" }, "-created_date", 75),
      safeFilter(base44, "ClientInstallationOS", {}, "-created_date", 250),
      safeFilter(base44, "AuditLog", {}, "-created_date", 75),
      safeFilter(base44, "DeadLetterQueue", {}, "-created_date", 30),
      safeFilter(base44, "SystemExecutionLog", {}, "-created_date", 50),
    ]);

    const sourceResults = {
      paid_orders: ordersResult,
      installation_os: installationsResult,
      audit_log: auditsResult,
      dead_letter_queue: deadLettersResult,
      system_execution_log: executionsResult,
    };
    const coverage = buildCoverage(sourceResults);

    const paidOrders = ordersResult.rows;
    const installationRows = installationsResult.rows;
    const recentAudits = auditsResult.rows;
    const recentDeadLetters = deadLettersResult.rows;
    const recentExecutions = executionsResult.rows;

    const installationByOrder = new Map(installationRows.map((row) => [row.order_id, row]));
    const flows = [];

    for (const order of paidOrders) {
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
          proof_state: "verified_missing_record",
          repairable: true,
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
          proof_state: hasDraft ? "draft_only" : "verified_missing_record",
          repairable: hasDraft,
        }));
      }
    }

    for (const row of recentDeadLetters) {
      flows.push(flow({
        id: `dead-letter-${row.id}`,
        severity: "critical",
        title: "Dead-lettered automation event",
        message: row.error_message || row.message || "A queued system event entered the dead-letter path.",
        route_hint: "/admin/logs",
        entity_name: "DeadLetterQueue",
        record_id: row.id,
        age_hours: hoursAgo(row.created_date || row.timestamp),
        proof_state: "provider_failure_recorded",
      }));
    }

    for (const row of recentExecutions) {
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
          proof_state: "execution_failure_recorded",
        }));
      }
    }

    const credentialsAuditCount = recentAudits.filter((row) => row.action === "credentials_submitted").length;

    if (flows.length === 0 && coverage.status === "verified") {
      flows.push(flow({
        id: "setup-pipeline-clear",
        severity: "info",
        status: "healthy",
        title: "No broken purchase-to-portal flows detected",
        message: `Recent scan found ${credentialsAuditCount} credentials submission audit event(s) and no paid-order setup blockers in the current sample.`,
        route_hint: "/admin/onboarding",
        proof_state: "scan_verified",
      }));
    } else if (flows.length === 0) {
      flows.push(flow({
        id: "setup-pipeline-unverified",
        severity: "warning",
        status: "coverage_incomplete",
        title: "No failures found, but the scan is incomplete",
        message: coverage.label,
        route_hint: "/admin/system-observability",
        proof_state: "scan_incomplete",
      }));
    }

    return json({
      success: true,
      request_id: requestId,
      checked_at: new Date().toISOString(),
      coverage,
      summary: {
        paid_orders_scanned: paidOrders.length,
        installation_os_scanned: installationRows.length,
        audit_events_scanned: recentAudits.length,
        credentials_submission_audits: credentialsAuditCount,
        broken_flow_count: flows.filter((item) => item.severity !== "info").length,
      },
      flows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[getBrokenFlows] Error: ${message}; request_id=${requestId}`);
    return json({ error: message, request_id: requestId }, 500);
  }
});