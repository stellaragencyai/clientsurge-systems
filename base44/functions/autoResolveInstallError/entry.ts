/**
 * autoResolveInstallError — #498
 * Reads AgentLog entries with requires_nolan=false and attempts auto-resolution.
 * Marks resolved=true after successful fix.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const unresolvedLogs = await base44.asServiceRole.entities.AgentLog
      .filter({ log_type: "error", resolved: false, requires_nolan: false })
      .catch(() => []);

    let resolved = 0;
    let skipped = 0;

    for (const log of (unresolvedLogs || []).slice(0, 20)) {
      try {
        const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details || {};
        const { order_id, service_key } = details;

        // Auto-resolve: retry service activation if we have the context
        if (order_id && service_key && log.service === "install_pipeline") {
          await base44.asServiceRole.functions.invoke("configureService", { order_id, service_key });
          await base44.asServiceRole.entities.AgentLog.update(log.id, {
            resolved: true,
            summary: `[AUTO-RESOLVED] ${log.summary}`,
          });
          resolved++;
        } else {
          // No actionable context — mark as reviewed but flag for human
          await base44.asServiceRole.entities.AgentLog.update(log.id, {
            requires_nolan: true, // escalate
            summary: `[ESCALATED] ${log.summary}`,
          });
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    return Response.json({ success: true, auto_resolved: resolved, escalated: skipped, total_checked: (unresolvedLogs || []).length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
