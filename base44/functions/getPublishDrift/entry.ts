import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CRITICAL_FUNCTIONS = [
  "getOrderStatus",
  "checkSetupAuthorization",
  "saveClientCredentialsDraft",
  "saveClientCredentials",
  "repairBrokenFlow",
  "getBrokenFlows",
  "getClientPortalContext",
  "initializeInstallOS",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: "Admin only" }, 403);

    const build = {
      app_version: Deno.env.get("VITE_APP_VERSION") || Deno.env.get("APP_VERSION") || "0.0.0",
      git_commit: Deno.env.get("VITE_GIT_COMMIT") || Deno.env.get("GIT_COMMIT") || Deno.env.get("COMMIT_SHA") || "unknown",
      build_time: Deno.env.get("VITE_BUILD_TIME") || Deno.env.get("BUILD_TIME") || "unknown",
      app_url: Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL") || "https://clientsurgesystems.com",
      base44_app_id: Deno.env.get("BASE44_APP_ID") || "69dc4a79656fdba136d413d3",
    };

    const recentAudits = await base44.asServiceRole.entities.AuditLog.filter({}, "-created_date", 20).catch(() => []);
    const lastCredentialsSubmit = recentAudits.find((row) => row.action === "credentials_submitted") || null;

    return json({
      success: true,
      checked_at: new Date().toISOString(),
      build,
      critical_functions: CRITICAL_FUNCTIONS.map((name) => ({
        name,
        expected_request_tracing: ["getOrderStatus", "checkSetupAuthorization", "saveClientCredentialsDraft", "saveClientCredentials", "repairBrokenFlow", "getBrokenFlows"].includes(name),
      })),
      recent_evidence: {
        audit_rows_scanned: recentAudits.length,
        last_credentials_submission_audit: lastCredentialsSubmit ? {
          id: lastCredentialsSubmit.id,
          timestamp: lastCredentialsSubmit.timestamp || lastCredentialsSubmit.created_date,
          record_id: lastCredentialsSubmit.record_id,
        } : null,
      },
      recommendation: build.git_commit === "unknown"
        ? "Set VITE_GIT_COMMIT/GIT_COMMIT during Base44 publish so deployed build can be compared to GitHub."
        : "Build identifier is present. Compare this commit against GitHub main after publish.",
    });
  } catch (error) {
    console.error(`[getPublishDrift] Error: ${error.message}`);
    return json({ error: error.message }, 500);
  }
});
