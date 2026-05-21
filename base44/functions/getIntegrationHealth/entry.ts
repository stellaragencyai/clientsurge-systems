import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { stripeFetch, twilioFetch } from "../_shared/providerFetch.js";

async function pingTwilio() {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!sid || !token) return { ok: false, error: 'Credentials not configured' };
  try {
    const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { 'Authorization': 'Basic ' + btoa(`${sid}:${token}`) },
    });
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function pingResend() {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { ok: false, error: 'RESEND_API_KEY not set' };
  try {
    const res = await resendFetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function pingStripe() {
  const key = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_LIVE_SECRET_KEY');
  if (!key) return { ok: false, error: 'STRIPE_SECRET_KEY not set' };
  try {
    const res = await stripeFetch('https://api.stripe.com/v1/balance', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (e) { return { ok: false, error: e.message }; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    // Parallel: settings, events, live pings
    const [settingsRecords, events, twilioResult, resendResult, stripeResult] = await Promise.all([
      base44.asServiceRole.entities.AdminSettings.list(null, 1),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 100),
      pingTwilio(),
      pingResend(),
      pingStripe(),
    ]);

    const settings = settingsRecords?.[0] || {};
    const recentEvents = events || [];
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const failureCount = (provider) =>
      recentEvents.filter(e => e.provider === provider && e.status === 'failed' && e.created_date > sixHoursAgo).length;

    const deriveStatus = (pingOk, settingEnabled, provider) => {
      if (!pingOk) return 'error';
      if (!settingEnabled) return 'disabled';
      if (failureCount(provider) >= 3) return 'error';
      return 'healthy';
    };

    const integrations = [
      {
        id: "twilio",
        name: "Twilio SMS",
        live_ping_ok: twilioResult.ok,
        live_ping_error: twilioResult.error || null,
        derived_status: deriveStatus(twilioResult.ok, settings.twilio_enabled, 'twilio'),
        status_label: twilioResult.ok ? "Connected" : "Connection Failed",
        status_reason: twilioResult.ok
          ? (settings.twilio_enabled ? "Live ping successful — Twilio is active" : "Credentials valid but not enabled in settings")
          : `Live ping failed: ${twilioResult.error}`,
        missing_configuration: !settings.twilio_enabled ? ["Enable Twilio in Admin Settings"] : [],
        latest_activity_at: recentEvents.find(e => e.provider === "twilio")?.created_date || null,
        recent_failure_count: failureCount('twilio'),
      },
      {
        id: "resend",
        name: "Resend Email",
        live_ping_ok: resendResult.ok,
        live_ping_error: resendResult.error || null,
        derived_status: deriveStatus(resendResult.ok, settings.resend_enabled, 'resend'),
        status_label: resendResult.ok ? "Connected" : "Connection Failed",
        status_reason: resendResult.ok
          ? (settings.resend_enabled ? "Live ping successful — Resend is active" : "Credentials valid but not enabled in settings")
          : `Live ping failed: ${resendResult.error}`,
        missing_configuration: !settings.resend_enabled ? ["Enable Resend in Admin Settings"] : [],
        latest_activity_at: recentEvents.find(e => e.provider === "resend")?.created_date || null,
        recent_failure_count: failureCount('resend'),
      },
      {
        id: "stripe",
        name: "Stripe Payments",
        live_ping_ok: stripeResult.ok,
        live_ping_error: stripeResult.error || null,
        derived_status: deriveStatus(stripeResult.ok, true, 'stripe'),
        status_label: stripeResult.ok ? "Connected" : "Connection Failed",
        status_reason: stripeResult.ok
          ? "Live ping successful — Stripe is active"
          : `Live ping failed: ${stripeResult.error}`,
        missing_configuration: [],
        latest_activity_at: recentEvents.find(e => e.provider === "stripe")?.created_date || null,
        recent_failure_count: failureCount('stripe'),
      },
    ];

    const successCount = recentEvents.filter(e => ["sent","delivered","processed"].includes(e.status)).length;
    const errorCount = recentEvents.filter(e => e.status === "failed").length;
    const totalCount = successCount + errorCount;
    const allHealthy = integrations.every(i => i.derived_status === 'healthy');

    return secureJson({
      success: true,
      generated_at: new Date().toISOString(),
      integrations,
      recent_activity: recentEvents.slice(0, 30),
      system: {
        uptime: {
          available: allHealthy,
          label: allHealthy ? "All Systems Operational" : "Issues Detected",
          reason: allHealthy ? "All integrations responding normally" : "One or more integrations failing live ping",
        },
        messages_tracked: recentEvents.length,
        successful_activity_count: successCount,
        failed_activity_count: errorCount,
        success_rate_percent: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : null,
      },
    });
  } catch (error) {
    console.error("[getIntegrationHealth] Error:", error);
    return secureJson({ error: error.message || "Failed to load integration health" }, { status: 500 });
  }
});