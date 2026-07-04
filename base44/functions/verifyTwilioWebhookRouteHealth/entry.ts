/**
 * verifyTwilioWebhookRouteHealth — Safe webhook route health verifier.
 *
 * Admin-only. Does NOT send any external SMS or voice messages.
 * Performs GET probes against each Twilio webhook route to verify
 * the endpoint exists and responds with HTTP 200.
 *
 * Updates:
 *   - AdminSettings.last_webhook_test_result / last_webhook_test_at
 *   - WebhookRegistration status for each route
 *   - LaunchGate route_health evidence
 *
 * Route health is a prerequisite for proof — routes returning 404/405
 * block all downstream automation proof.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const ROUTE_LABELS = {
  voice: "receiveInboundVoiceCall",
  sms: "receiveTwilioInboundSms",
  missed_call: "receiveTwilioMissedCallWebhook",
  sms_status_callback: "receiveTwilioSmsStatusCallback",
};

const WEBHOOK_REG_SOURCE_NAMES = {
  voice: "twilio_voice",
  sms: "twilio_sms",
  missed_call: "twilio_missed_call",
  sms_status_callback: "twilio_sms_status_callback",
};

async function probeRoute(url) {
  if (!url) {
    return { tested: false, http_status: null, ok: false, error: "URL not configured" };
  }

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "ClientSurge-RouteHealthCheck/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    const body = await resp.text().catch(() => "");
    const contentType = resp.headers.get("content-type") || "";

    return {
      tested: true,
      http_status: resp.status,
      ok: resp.status === 200,
      content_type: contentType,
      has_xml: contentType.includes("text/xml") || contentType.includes("application/xml"),
      has_response_root: /<Response[\s>]/i.test(body),
      has_json_ok: body.includes('"status"') && body.includes('"ok"'),
      error: resp.status !== 200 ? `HTTP ${resp.status}` : null,
    };
  } catch (err) {
    return {
      tested: true,
      http_status: null,
      ok: false,
      error: `Fetch failed: ${err.message}`,
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Load AdminSettings for webhook URLs
    let settings = null;
    try {
      const [s] = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      settings = s || null;
    } catch (_) {}

    const routeUrls = {
      voice: settings?.voice_webhook_url || Deno.env.get("TWILIO_VOICE_WEBHOOK_URL") || "",
      sms: settings?.sms_webhook_url || Deno.env.get("TWILIO_INBOUND_SMS_WEBHOOK_URL") || "",
      missed_call: settings?.missed_call_webhook_url || Deno.env.get("TWILIO_MISSED_CALL_WEBHOOK_URL") || "",
      sms_status_callback: settings?.sms_status_callback_url || Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL") || "",
    };

    // Probe each route (parallel)
    const routeKeys = Object.keys(routeUrls);
    const probeResults = {};
    const probePromises = routeKeys.map(async (key) => {
      probeResults[key] = await probeRoute(routeUrls[key]);
    });
    await Promise.all(probePromises);

    // Build summary
    const routeHealth = {};
    let allHealthy = true;
    const blockers = [];

    for (const key of routeKeys) {
      const result = probeResults[key];
      const isHealthy = result.ok;
      routeHealth[key] = {
        url: routeUrls[key] || "NOT_CONFIGURED",
        route_function: ROUTE_LABELS[key],
        ...result,
        healthy: isHealthy,
      };
      if (!isHealthy) {
        allHealthy = false;
        blockers.push(`${key}: ${result.error || `HTTP ${result.http_status}`}`);
      }
    }

    // Update WebhookRegistration records
    for (const key of routeKeys) {
      const sourceName = WEBHOOK_REG_SOURCE_NAMES[key];
      const result = probeResults[key];
      try {
        const regs = await base44.asServiceRole.entities.WebhookRegistration.filter(
          { source_name: sourceName },
          "-created_date",
          1
        );
        if (regs?.length > 0) {
          await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, {
            last_triggered_at: result.tested ? now : regs[0].last_triggered_at,
            last_error: result.error || null,
            status: result.ok ? "active" : "error",
          });
        }
      } catch (_) {}
    }

    // Update AdminSettings with route health result
    const healthSummary = {
      tested_at: now,
      all_healthy: allHealthy,
      routes: Object.fromEntries(
        Object.entries(routeHealth).map(([k, v]) => [
          k,
          { http_status: v.http_status, ok: v.ok, error: v.error },
        ])
      ),
    };

    if (settings) {
      await base44.asServiceRole.entities.AdminSettings.update(settings.id, {
        last_webhook_test_result: JSON.stringify(healthSummary),
        last_webhook_test_at: now,
      });
    }

    // Update LaunchGate for route health
    try {
      const gates = await base44.asServiceRole.entities.LaunchGate.list("", 50);
      const routeGate = gates?.find((g) => g.gate_key === "twilio_webhook_route_health");
      if (routeGate) {
        await base44.asServiceRole.entities.LaunchGate.update(routeGate.id, {
          status: allHealthy ? "proof_passed" : "blocked",
          completion_percent: Math.round(
            (routeKeys.filter((k) => routeHealth[k].ok).length / routeKeys.length) * 100
          ),
          proof_percent: allHealthy ? 100 : 0,
          current_blocker: blockers.length > 0 ? blockers.join("; ") : null,
          next_action: allHealthy
            ? "All webhook routes healthy — proceed to proof generation"
            : "Repair webhook routes before attempting proof generation",
          evidence_summary: JSON.stringify(routeHealth, null, 2),
          last_checked_at: now,
          last_verdict: allHealthy
            ? "All routes returning 200"
            : `${blockers.length} route(s) unhealthy`,
        });
      } else {
        await base44.asServiceRole.entities.LaunchGate.create({
          gate_key: "twilio_webhook_route_health",
          gate_name: "Twilio Webhook Route Health",
          section_label: "Route Health",
          status: allHealthy ? "proof_passed" : "blocked",
          severity: "critical_blocker",
          completion_percent: Math.round(
            (routeKeys.filter((k) => routeHealth[k].ok).length / routeKeys.length) * 100
          ),
          proof_percent: allHealthy ? 100 : 0,
          required_categories: ["webhook_routes"],
          required_tasks: ["verify_voice_route", "verify_sms_route", "verify_missed_call_route", "verify_status_callback_route"],
          required_proofs: ["all_routes_200"],
          current_blocker: blockers.length > 0 ? blockers.join("; ") : null,
          next_action: allHealthy
            ? "All webhook routes healthy — proceed to proof generation"
            : "Repair webhook routes before attempting proof generation",
          evidence_summary: JSON.stringify(routeHealth, null, 2),
          approval_required: false,
          last_checked_at: now,
          last_verdict: allHealthy
            ? "All routes returning 200"
            : `${blockers.length} route(s) unhealthy`,
          unlock_condition_summary: "All four Twilio webhook routes return HTTP 200 on GET probe",
        });
      }
    } catch (err) {
      console.warn("[verifyTwilioWebhookRouteHealth] LaunchGate update failed:", err?.message);
    }

    return Response.json({
      success: true,
      tested_at: now,
      all_healthy: allHealthy,
      route_health: routeHealth,
      blockers,
      repair_actions: blockers.map((b) => `Repair: ${b}`),
    });
  } catch (error) {
    console.error("[verifyTwilioWebhookRouteHealth] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});