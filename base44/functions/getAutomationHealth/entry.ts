import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: "Unauthorized" }, 401);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return json({ error: "Forbidden — admin access required" }, 403);
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    // ── 1. CommunicationLog stats for last 24h ──
    // Fetch most recent 500 logs and filter in JS (avoids date-format comparison issues)
    const recentLogs = await base44.asServiceRole.entities.CommunicationLog.list(
      "-created_date",
      500
    ).catch(() => []);

    const logs = (recentLogs || []).filter((l) => {
      const logDate = new Date(l.created_date || l.sent_at || l.failed_at);
      return logDate.getTime() >= now.getTime() - 24 * 60 * 60 * 1000;
    });
    const smsSent = logs.filter((l) => l.channel === "sms" && (l.delivery_status === "sent" || l.delivery_status === "delivered" || l.delivery_status === "queued"));
    const smsFailed = logs.filter((l) => l.channel === "sms" && l.delivery_status === "failed");
    const emailSent = logs.filter((l) => l.channel === "email" && (l.delivery_status === "sent" || l.delivery_status === "delivered" || l.delivery_status === "queued"));
    const emailFailed = logs.filter((l) => l.channel === "email" && l.delivery_status === "failed");

    const latestSms = logs.find((l) => l.channel === "sms" && l.sent_at);
    const latestEmail = logs.find((l) => l.channel === "email" && l.sent_at);
    const latestFailure = logs.find((l) => l.delivery_status === "failed");

    // ── 2. Stuck leads ──
    // WebsiteLead records where automation_enabled=true, initial_response_sent_at is null,
    // and created_date is older than 5 minutes
    const stuckLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
      {
        automation_enabled: true,
        initial_response_sent_at: null,
        created_date: { $lt: fiveMinutesAgo },
        archived: false,
      },
      "-created_date",
      50
    ).catch(() => []);

    // ── 3. Total website leads ──
    const allWebsiteLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
      { archived: false },
      "-created_date",
      1
    ).catch(() => []);

    // Use count from a broader query — we just need total + waiting count
    const totalLeadsQuery = await base44.asServiceRole.entities.WebsiteLead.filter(
      { archived: false },
      "-created_date",
      500
    ).catch(() => []);
    const totalLeads = (totalLeadsQuery || []).length;
    const leadsWaiting = (totalLeadsQuery || []).filter(
      (l) => l.automation_enabled === true && !l.initial_response_sent_at
    ).length;

    // ── 4. Recent logs for table ──
    const recentForTable = (logs || []).slice(0, 50);

    // ── 5. Provider readiness ──
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioFromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");
    const appBaseUrl = Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL");

    const providerReadiness = {
      twilio_account_configured: twilioAccountSid ? "yes" : "no",
      twilio_from_number_configured: twilioFromNumber ? "yes" : "no",
      resend_api_configured: resendApiKey ? "yes" : "no",
      resend_from_email_configured: resendFromEmail ? "yes" : "no",
      app_base_url_configured: appBaseUrl ? "yes" : "no",
    };

    // ── 6. Warning banner logic ──
    const recentLeadsExist = leadsWaiting > 0;
    const logsBeingCreated = (logs || []).length > 0;
    const launchBlockerWarning =
      recentLeadsExist && !logsBeingCreated
        ? "⚠️ Recent leads exist but no CommunicationLog rows are being created. The automation path is bypassing the messaging layer. This is a launch blocker."
        : null;

    // ── 7. Build stuck lead details ──
    const stuckLeadDetails = (stuckLeads || []).map((lead) => {
      const reasons = [];
      if (!lead.phone_number) reasons.push("missing_phone");
      if (!lead.email) reasons.push("missing_email");
      if (lead.consent_given === false) reasons.push("no_consent");
      if (lead.sms_permission === false) reasons.push("no_sms_permission");
      if (lead.cadence_paused === true) reasons.push("cadence_paused");
      if (lead.do_not_contact === true) reasons.push("do_not_contact");
      if (reasons.length === 0) reasons.push("unknown — automation may not be triggering");

      return {
        id: lead.id,
        full_name: lead.full_name,
        email: lead.email,
        phone_number: lead.phone_number,
        business_name: lead.business_name,
        source: lead.source,
        consent_given: lead.consent_given,
        sms_permission: lead.sms_permission,
        cadence_paused: lead.cadence_paused,
        created_date: lead.created_date,
        automation_enabled: lead.automation_enabled,
        reason: reasons.join(", "),
      };
    });

    return json({
      status_cards: {
        sms_sent_24h: smsSent.length,
        sms_failed_24h: smsFailed.length,
        email_sent_24h: emailSent.length,
        email_failed_24h: emailFailed.length,
        latest_sms_at: latestSms?.sent_at || null,
        latest_email_at: latestEmail?.sent_at || null,
        leads_waiting_initial_response: leadsWaiting,
        leads_stuck_with_automation: stuckLeadDetails.length,
        total_website_leads: totalLeads,
      },
      recent_logs: recentForTable,
      stuck_leads: stuckLeadDetails,
      provider_readiness: providerReadiness,
      launch_blocker_warning: launchBlockerWarning,
      snapshot_at: now.toISOString(),
    });
  } catch (error) {
    console.error("[getAutomationHealth] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});