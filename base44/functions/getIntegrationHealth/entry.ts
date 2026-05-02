import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // Load settings and events in parallel
    const [settingsRecords, events] = await Promise.all([
      base44.asServiceRole.entities.AdminSettings.list(null, 1),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 50),
    ]);

    const settings = settingsRecords?.[0] || {};
    const recentEvents = events || [];

    // Build integration status cards
    const integrations = [
      {
        id: "twilio",
        name: "Twilio SMS",
        derived_status: settings.twilio_enabled ? "healthy" : "unavailable",
        status_label: settings.twilio_enabled ? "Connected" : "Not Configured",
        status_reason: settings.twilio_enabled
          ? "Twilio SMS is active"
          : "Missing: Account SID, Auth Token, or Phone Number",
        missing_configuration: !settings.twilio_enabled ? ["Account SID", "Auth Token", "Phone Number"] : [],
        latest_activity_at: recentEvents.find((e) => e.provider === "twilio")?.created_date || null,
        recent_failure_count: recentEvents.filter((e) => e.provider === "twilio" && e.status === "failed").length,
      },
      {
        id: "resend",
        name: "Resend Email",
        derived_status: settings.resend_enabled ? "healthy" : "unavailable",
        status_label: settings.resend_enabled ? "Connected" : "Not Configured",
        status_reason: settings.resend_enabled
          ? "Resend email is active"
          : "Missing: API Key or From Email",
        missing_configuration: !settings.resend_enabled ? ["API Key", "From Email"] : [],
        latest_activity_at: recentEvents.find((e) => e.provider === "resend")?.created_date || null,
        recent_failure_count: recentEvents.filter((e) => e.provider === "resend" && e.status === "failed").length,
      },
    ];

    // System stats
    const successCount = recentEvents.filter(
      (e) => e.status === "sent" || e.status === "delivered" || e.status === "processed"
    ).length;
    const failureCount = recentEvents.filter((e) => e.status === "failed").length;
    const totalCount = successCount + failureCount;

    return Response.json({
      success: true,
      generated_at: new Date().toISOString(),
      integrations,
      recent_activity: recentEvents,
      system: {
        uptime: { available: true, label: "Operational", reason: "Services running" },
        messages_tracked: recentEvents.length,
        successful_activity_count: successCount,
        failed_activity_count: failureCount,
        success_rate_percent: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : null,
      },
    });
  } catch (error) {
    console.error("[getIntegrationHealth] Error:", error);
    return Response.json({ error: error.message || "Failed to load integration health" }, { status: 500 });
  }
});