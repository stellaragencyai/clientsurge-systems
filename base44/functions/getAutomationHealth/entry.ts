import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function detectEnvironment(req) {
  try {
    const url = new URL(req.url);
    if (url.hostname.includes("preview") || url.hostname.includes("sandbox")) return "preview";
  } catch (_) {}
  return "production";
}

/**
 * Returns real-time automation health data and persists an AutomationHealthSnapshot.
 * Provider readiness includes: config present, last test pass/fail, last test time,
 * last provider message ID, and last error — all derived from CommunicationLog records.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: "Unauthorized" }, 401);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return json({ error: "Forbidden — admin access required" }, 403);
    }

    const now = new Date();
    const env = detectEnvironment(req);

    // ── 1. CommunicationLog stats for last 24h ──
    const recentLogs = await base44.asServiceRole.entities.CommunicationLog.list(
      "-created_date",
      500
    ).catch(() => []);

    const logs = (recentLogs || []).filter((l) => {
      const logDate = new Date(l.created_date || l.sent_at || l.failed_at);
      return logDate.getTime() >= now.getTime() - 24 * 60 * 60 * 1000;
    });

    const smsSent = logs.filter((l) => l.channel === "sms" && ["sent", "delivered", "queued"].includes(l.delivery_status));
    const smsFailed = logs.filter((l) => l.channel === "sms" && l.delivery_status === "failed");
    const emailSent = logs.filter((l) => l.channel === "email" && ["sent", "delivered", "queued"].includes(l.delivery_status));
    const emailFailed = logs.filter((l) => l.channel === "email" && l.delivery_status === "failed");

    const latestSms = logs.find((l) => l.channel === "sms" && l.sent_at);
    const latestEmail = logs.find((l) => l.channel === "email" && l.sent_at);
    const latestFailure = logs.find((l) => l.delivery_status === "failed");

    // ── 2. Provider test history (from manual_test logs) ──
    const twilioTestLogs = (recentLogs || [])
      .filter((l) => l.trigger_name === "manual_test" && l.provider === "twilio")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const resendTestLogs = (recentLogs || [])
      .filter((l) => l.trigger_name === "manual_test" && l.provider === "resend")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const lastTwilioTest = twilioTestLogs[0] || null;
    const lastResendTest = resendTestLogs[0] || null;

    // ── 3. Stuck leads (automation on, no response, older than 5 min) ──
    const allLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
      { archived: false },
      "-created_date",
      500
    ).catch(() => []);

    const fiveMinAgo = now.getTime() - 5 * 60 * 1000;
    const stuckLeads = (allLeads || []).filter(
      (l) => l.automation_enabled === true && !l.initial_response_sent_at && new Date(l.created_date).getTime() < fiveMinAgo
    );

    // For each stuck lead, determine the likely reason
    const stuckLeadDetails = stuckLeads.slice(0, 50).map((lead) => {
      const reasons = [];
      if (!lead.phone_number) reasons.push("missing_phone");
      if (!lead.email) reasons.push("missing_email");
      if (lead.consent_given === false) reasons.push("no_consent");
      if (lead.sms_permission === false) reasons.push("no_sms_permission");
      if (lead.cadence_paused === true) reasons.push("cadence_paused");
      if (lead.do_not_contact === true) reasons.push("do_not_contact");

      // Check CommunicationLog rows for this lead
      const leadLogs = (recentLogs || []).filter(
        (l) => l.related_entity_type === "WebsiteLead" && l.related_entity_id === lead.id
      );
      if (leadLogs.length === 0) {
        reasons.push("no_communication_log_found");
      } else {
        // Extract skip reasons from skipped logs
        const skippedLogs = leadLogs.filter((l) => l.delivery_status === "skipped");
        const failedLogs = leadLogs.filter((l) => l.delivery_status === "failed");
        if (skippedLogs.length > 0) {
          const skipReasons = [...new Set(skippedLogs.map((l) => l.error_message).filter(Boolean))];
          reasons.push(...skipReasons);
        }
        if (failedLogs.length > 0) {
          reasons.push("provider_failed");
        }
      }

      if (reasons.length === 0) reasons.push("unknown");

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
        is_test: isTestLead(lead),
        reason: reasons.join(", "),
      };
    });

    const totalLeads = (allLeads || []).length;
    const leadsWaiting = (allLeads || []).filter(
      (l) => l.automation_enabled === true && !l.initial_response_sent_at
    ).length;

    // ── 3b. Test/internal lead detection ──
    const testLeads = (allLeads || []).filter(isTestLead);
    const realLeadsWaiting = (allLeads || []).filter(
      (l) => l.automation_enabled === true && !l.initial_response_sent_at && !isTestLead(l)
    ).length;

    // ── 3c. Initial response working check ──
    // Pass only if a non-test WebsiteLead has a real CommunicationLog with trigger_name=initial_response and delivery_status sent/queued/delivered
    const initialResponseLogs = (logs || []).filter(
      (l) => l.trigger_name === "initial_response" && ["sent", "queued", "delivered"].includes(l.delivery_status)
    );
    const initialResponseWorking = initialResponseLogs.length > 0 ? "pass" : (logs || []).length > 0 ? "fail" : "unknown";

    // ── 4. Provider readiness (config + last test result) ──
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioFromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");

    const twilioConfigPresent = Boolean(twilioAccountSid && twilioFromNumber);
    const resendConfigPresent = Boolean(resendApiKey && resendFromEmail);

    const lastTwilioTestPassed = lastTwilioTest
      ? ["sent", "queued", "delivered"].includes(lastTwilioTest.delivery_status)
      : null;
    const lastResendTestPassed = lastResendTest
      ? ["sent", "queued", "delivered"].includes(lastResendTest.delivery_status)
      : null;

    const providerReadiness = {
      twilio: {
        config_present: twilioConfigPresent ? "yes" : "no",
        last_test_passed: lastTwilioTestPassed === null ? "never" : lastTwilioTestPassed ? "yes" : "no",
        last_test_time: lastTwilioTest?.created_date || null,
        last_provider_message_id: lastTwilioTest?.provider_message_id || null,
        last_error: lastTwilioTest?.error_message || null,
      },
      resend: {
        config_present: resendConfigPresent ? "yes" : "no",
        last_test_passed: lastResendTestPassed === null ? "never" : lastResendTestPassed ? "yes" : "no",
        last_test_time: lastResendTest?.created_date || null,
        last_provider_message_id: lastResendTest?.provider_message_id || null,
        last_error: lastResendTest?.error_message || null,
      },
    };

    // ── 5. Launch blocker warning ──
    const launchBlockerWarning =
      realLeadsWaiting > 0 && (logs || []).filter((l) => l.trigger_name === "initial_response").length === 0
        ? "⚠️ Real (non-test) leads waiting for initial response but no initial_response CommunicationLog rows exist in 24h. The lead-response workflow is not firing."
        : null;

    // ── 6. Build status cards ──
    const statusCards = {
      sms_sent_24h: smsSent.length,
      sms_failed_24h: smsFailed.length,
      email_sent_24h: emailSent.length,
      email_failed_24h: emailFailed.length,
      latest_sms_at: latestSms?.sent_at || null,
      latest_email_at: latestEmail?.sent_at || null,
      latest_failure_at: latestFailure?.failed_at || null,
      leads_waiting_initial_response: leadsWaiting,
      leads_stuck_with_automation: stuckLeadDetails.length,
      total_website_leads: totalLeads,
      real_leads_waiting_initial_response: realLeadsWaiting,
      test_internal_leads: testLeads.length,
      initial_response_working: initialResponseWorking,
    };

    // ── 7. Persist AutomationHealthSnapshot ──
    const notesParts = [];
    notesParts.push(`SMS: ${smsSent.length} sent, ${smsFailed.length} failed`);
    notesParts.push(`Email: ${emailSent.length} sent, ${emailFailed.length} failed`);
    notesParts.push(`Twilio last test: ${lastTwilioTestPassed === null ? "never" : lastTwilioTestPassed ? "passed" : "failed"}`);
    notesParts.push(`Resend last test: ${lastResendTestPassed === null ? "never" : lastResendTestPassed ? "passed" : "failed"}`);
    notesParts.push(`Stuck leads: ${stuckLeadDetails.length}`);
    if (launchBlockerWarning) notesParts.push("LAUNCH BLOCKER: no logs being created");

    try {
      await base44.asServiceRole.entities.AutomationHealthSnapshot.create({
        snapshot_at: now.toISOString(),
        total_website_leads: totalLeads,
        leads_waiting_initial_response: leadsWaiting,
        sms_sent_24h: smsSent.length,
        sms_failed_24h: smsFailed.length,
        email_sent_24h: emailSent.length,
        email_failed_24h: emailFailed.length,
        latest_sms_at: latestSms?.sent_at || null,
        latest_email_at: latestEmail?.sent_at || null,
        latest_failure_at: latestFailure?.failed_at || null,
        notes: notesParts.join(" | "),
      });
    } catch (e) {
      console.warn("[getAutomationHealth] Snapshot create failed:", e.message);
    }

    // ── 8. Recent logs for table ──
    const recentForTable = (logs || []).slice(0, 50);

    return json({
      status_cards: statusCards,
      recent_logs: recentForTable,
      stuck_leads: stuckLeadDetails,
      provider_readiness: providerReadiness,
      launch_blocker_warning: launchBlockerWarning,
      test_internal_leads: testLeads.length,
      initial_response_working: initialResponseWorking,
      snapshot_at: now.toISOString(),
      environment: env,
    });
  } catch (error) {
    console.error("[getAutomationHealth] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});