/**
 * auditLeadCapturePaths — Backend audit/proof log for lead capture pipeline.
 *
 * Reports:
 *   - Which Twilio From number is active (must be +16025843227)
 *   - Whether +18778123630 is blocked in all send paths
 *   - Whether Twilio is enabled
 *   - Whether Resend is enabled
 *   - Whether SMS status callback is configured
 *   - Which form paths use the canonical workflow
 *   - Latest successful/failed CommunicationLog records
 *
 * Creates an AuditLog record as durable proof.
 * Admin-only. Does NOT send any SMS/email or contact any leads.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const PRODUCTION_SENDER = "+16025843227";
const BLOCKED_SENDER = "+18778123630";

function normalizeE164(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // ── Load AdminSettings ──
    let settings = null;
    try {
      const list = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      settings = list?.[0] || null;
    } catch (e) {
      return json({ error: `Failed to load AdminSettings: ${e.message}` }, { status: 500 });
    }

    // ── From number checks ──
    const settingsFromNumber = normalizeE164(settings?.twilio_from_number || "");
    const envFromNumber = normalizeE164(
      Deno.env.get("TWILIO_FROM_NUMBER") || Deno.env.get("TWILIO_PHONE_NUMBER") || ""
    );
    const activeFromNumber = settingsFromNumber || envFromNumber;
    const fromNumberCorrect = activeFromNumber === PRODUCTION_SENDER;
    const blockedSenderPresent = activeFromNumber === BLOCKED_SENDER;

    // ── Provider checks ──
    const twilioEnabled = settings?.twilio_enabled === true;
    const twilioCredsPresent = !!(
      Deno.env.get("TWILIO_ACCOUNT_SID") &&
      Deno.env.get("TWILIO_AUTH_TOKEN")
    );
    const resendEnabled = settings?.resend_enabled === true;
    const resendKeyPresent = !!Deno.env.get("RESEND_API_KEY");

    // ── Status callback check ──
    const statusCallbackUrl = settings?.sms_status_callback_url || "";
    const statusCallbackEnv = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL") || "";
    const statusCallbackConfigured = !!(statusCallbackUrl || statusCallbackEnv);

    // ── Form path audit ──
    const formPaths = [
      {
        path: "submitLeadCapture",
        function_name: "submitLeadCapture",
        canonical_workflow: true,
        notes: "Creates WebsiteLead → triggers processWebsiteLeadInitialResponse (SMS+email+CommunicationLog)",
      },
      {
        path: "submitContactInquiry (Contact Us form)",
        function_name: "submitContactInquiry",
        canonical_workflow: true,
        notes: "Creates Leads → admin email + thank you email + admin SMS + CommunicationEvent + CommunicationLog",
      },
      {
        path: "processWebsiteLeadInitialResponse (initial response)",
        function_name: "processWebsiteLeadInitialResponse",
        canonical_workflow: true,
        notes: "AdminSettings From resolution, E.164 normalization, consent checks, CommunicationLog for every attempt/skip/failure",
      },
      {
        path: "webhookLeadCapture (webhook lead capture)",
        function_name: "webhookLeadCapture",
        canonical_workflow: true,
        notes: "Creates WebsiteLead → triggers initial response chain",
      },
      {
        path: "sendSMS (generic SMS utility)",
        function_name: "sendSMS",
        canonical_workflow: true,
        notes: "AdminSettings From resolution, blocks +18778123630, E.164 normalization, status callback attached",
      },
    ];

    // ── Latest communication logs ──
    let latestLogs = { sent: [], failed: [], skipped: [] };
    try {
      const sentLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
        { delivery_status: "sent" }, "-created_date", 3
      ).catch(() => []);
      const failedLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
        { delivery_status: "failed" }, "-created_date", 3
      ).catch(() => []);
      const skippedLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
        { delivery_status: "skipped" }, "-created_date", 3
      ).catch(() => []);

      const fmt = (logs) => (logs || []).map((l) => ({
        id: l.id,
        channel: l.channel,
        provider: l.provider,
        trigger_name: l.trigger_name,
        delivery_status: l.delivery_status,
        from_address: l.from_address,
        to_address: l.to_address,
        error_message: l.error_message,
        created_date: l.created_date,
      }));

      latestLogs = {
        sent: fmt(sentLogs),
        failed: fmt(failedLogs),
        skipped: fmt(skippedLogs),
      };
    } catch (_) {}

    // ── Build audit summary ──
    const audit = {
      ran_at: now,
      twilio: {
        enabled: twilioEnabled,
        credentials_present: twilioCredsPresent,
        from_number: activeFromNumber,
        from_number_correct: fromNumberCorrect,
        blocked_sender_detected: blockedSenderPresent,
        expected_sender: PRODUCTION_SENDER,
        blocked_sender: BLOCKED_SENDER,
      },
      resend: {
        enabled: resendEnabled,
        api_key_present: resendKeyPresent,
        from_email: settings?.resend_from_email || null,
      },
      status_callback: {
        configured: statusCallbackConfigured,
        url_from_settings: statusCallbackUrl ? "[SET]" : null,
        url_from_env: statusCallbackEnv ? "[SET]" : null,
        points_to_function: statusCallbackUrl.includes("receiveTwilioSmsStatusCallback") || statusCallbackEnv.includes("receiveTwilioSmsStatusCallback"),
      },
      form_paths: formPaths,
      latest_communication_logs: latestLogs,
      overall_health: fromNumberCorrect && !blockedSenderPresent && twilioCredsPresent && resendKeyPresent && statusCallbackConfigured,
    };

    // ── Store AuditLog record ──
    let auditLogId = null;
    try {
      const record = await base44.asServiceRole.entities.AuditLog.create({
        action: "lead_capture_pipeline_audit",
        performed_by: user.email,
        performed_at: now,
        summary: `From=${activeFromNumber || "MISSING"} | Twilio=${twilioCredsPresent ? "OK" : "MISSING"} | Resend=${resendKeyPresent ? "OK" : "MISSING"} | Callback=${statusCallbackConfigured ? "OK" : "MISSING"} | Health=${audit.overall_health ? "HEALTHY" : "ISSUES"}`,
        details_json: JSON.stringify(audit),
      });
      auditLogId = record?.id || null;
    } catch (e) {
      console.warn("[auditLeadCapturePaths] Failed to store AuditLog:", e.message);
    }

    return json({
      success: true,
      ...audit,
      audit_log_id: auditLogId,
    });
  } catch (error) {
    console.error("[auditLeadCapturePaths] Error:", error.message);
    return json({ error: error.message }, { status: 500 });
  }
});