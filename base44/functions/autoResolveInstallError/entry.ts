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

        // Legacy auto-config retries are retired; escalate instead of mutating state.
        if (order_id && service_key && log.service === "install_pipeline") {
          await base44.asServiceRole.entities.AgentLog.update(log.id, {
            requires_nolan: true,
            summary: `[MANUAL REQUIRED] ${log.summary}`,
            details: JSON.stringify({
              ...details,
              retired: true,
              replacement_function: "installPipeline",
              reason:
                "Legacy configureService retry path is retired. Use canonical install workspace.",
            }),
          });
          skipped++;
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
