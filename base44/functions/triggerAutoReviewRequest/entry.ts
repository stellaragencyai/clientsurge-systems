/**
 * Auto Review Request Trigger
 * Called via entity automation when Order.order_status = "fully_live"
 * Automatically sends review request if not already sent in past 7 days
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || data.order_status !== "fully_live") {
      console.log("[AutoReviewRequest] Skipped — not fully_live status");
      return secureJson({ skipped: true, reason: "Not fully_live status" });
    }

    const order = data;
    console.log(`[AutoReviewRequest] Triggered for order ${order.id}`);

    // ─────────────────────────────────────────────────────────
    // VALIDATION: Ensure required fields exist
    // ─────────────────────────────────────────────────────────
    if (!order.customer_name || !order.business_name) {
      console.log(
        `[AutoReviewRequest] Skipped — missing customer_name or business_name for order ${order.id}`
      );
      return secureJson({
        skipped: true,
        reason: "Missing customer_name or business_name",
      });
    }

    if (!order.customer_phone && !order.customer_email) {
      console.log(
        `[AutoReviewRequest] Skipped — no phone or email for order ${order.id}`
      );
      return secureJson({
        skipped: true,
        reason: "No phone or email on order",
      });
    }

    // ── PART 4: PACKAGE PERMISSION ENFORCEMENT ──
    // Resolve ClientDeployment and check module permission before sending review request.
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    if (order.client_id) {
      try {
        const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: order.client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
          '-created_date', 1
        );
        const deployment = deployments?.[0] || null;
        if (deployment) {
          const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
            deployment_id: deployment.id, module_key: 'review_reactivation'
          });
          if (permRes.data?.authorized !== true) {
            // PART 5: Log blocked execution
            await base44.asServiceRole.functions.invoke('logAutomationExecution', {
              client_deployment_id: deployment.id, client_id: order.client_id,
              module_key: 'review_reactivation', trigger_event: 'order_fully_live',
              execution_status: 'blocked',
              error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
              error_code: permRes.data?.reason || 'module_not_authorized',
            }).catch(() => {});
            return secureJson({
              blocked: true,
              reason: permRes.data?.reason,
              message: 'Module not authorized for this deployment',
            }, { status: 403 });
          }
          _obsCtx = {
            deployment_id: deployment.id,
            client_id: order.client_id,
            module_key: 'review_reactivation',
            trigger_event: 'order_fully_live'
          };
        }
      } catch (err) {
        console.warn('[AutoReviewRequest] Permission check failed:', err.message);
      }
    }

    // ─────────────────────────────────────────────────────────
    // DUPLICATE CHECK: Within last 7 days
    // ─────────────────────────────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const recentReviews = await base44.asServiceRole.entities.CommunicationEvent.filter(
        {
          event_type: "review_request",
          status: "sent",
          created_date: { $gte: sevenDaysAgo },
          subject: { $regex: order.customer_phone?.replace(/\D/g, "") || order.customer_email },
        },
        "-created_date",
        1
      );

      if (recentReviews && recentReviews.length > 0) {
        console.log(
          `[AutoReviewRequest] Skipped — review request already sent within 7 days for order ${order.id}`
        );
        return secureJson({
          skipped: true,
          reason: "Review request already sent in past 7 days",
        });
      }
    } catch (dupErr) {
      console.warn(
        `[AutoReviewRequest] Duplicate check failed: ${dupErr.message} — proceeding anyway`
      );
    }

    // ─────────────────────────────────────────────────────────
    // DETERMINE PREFERRED CHANNEL
    // ─────────────────────────────────────────────────────────
    let preferred_channel = "both";
    if (order.customer_phone && !order.customer_email) {
      preferred_channel = "sms";
    } else if (order.customer_email && !order.customer_phone) {
      preferred_channel = "email";
    }

    // ─────────────────────────────────────────────────────────
    // GET REVIEW LINKS FROM ORDER CONFIG
    // ─────────────────────────────────────────────────────────
    let google_review_link = "";
    let yelp_review_link = "";

    try {
      const config = order.install_configuration?.services?.review_request || {};
      google_review_link = config.review_link || "";
      // Yelp is optional, leave empty if not set
    } catch (_) {}

    if (!google_review_link) {
      console.log(
        `[AutoReviewRequest] Skipped — no google_review_link configured in order ${order.id}`
      );
      return secureJson({
        skipped: true,
        reason: "No google_review_link configured",
      });
    }

    // ─────────────────────────────────────────────────────────
    // CALL sendReviewRequest
    // ─────────────────────────────────────────────────────────
    console.log(
      `[AutoReviewRequest] Calling sendReviewRequest for ${order.customer_name} (${order.business_name})`
    );

    const result = await base44.asServiceRole.functions.invoke("sendReviewRequest", {
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || "",
      customer_email: order.customer_email || "",
      business_name: order.business_name,
      google_review_link,
      yelp_review_link: yelp_review_link || null,
      preferred_channel,
      skip_duplicate_check: true, // Already checked above
    });

    if (result.data?.success) {
      // ── DEPLOYMENT OBSERVABILITY: Log successful execution ──
      if (_obsCtx) {
        try {
          await base44.asServiceRole.functions.invoke('logAutomationExecution', {
            ..._obsCtx,
            execution_status: 'completed',
            response_data: JSON.stringify({ sms_sent: result.data.sms_sent, email_sent: result.data.email_sent }),
            execution_time_ms: Date.now() - _obsStartTime,
          });
        } catch (_) {}
      }
      console.log(
        `[AutoReviewRequest] Review request sent for order ${order.id} — SMS: ${result.data.sms_sent}, Email: ${result.data.email_sent}`
      );
      return secureJson({
        success: true,
        sms_sent: result.data.sms_sent,
        email_sent: result.data.email_sent,
      });
    } else {
      console.warn(
        `[AutoReviewRequest] Review request failed for order ${order.id}: ${result.data?.error || "Unknown error"}`
      );
      return secureJson(
        {
          success: false,
          error: result.data?.error || "Failed to send review request",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    // ── DEPLOYMENT OBSERVABILITY: Log failed execution + trigger health check ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'failed',
          error_message: error.message,
          error_code: 'review_request_failed',
          execution_time_ms: Date.now() - _obsStartTime,
        });
        await base44.asServiceRole.functions.invoke('calculateDeploymentHealth', { deployment_id: _obsCtx.deployment_id });
      } catch (_) {}
    }
    console.error("[AutoReviewRequest] Fatal error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});