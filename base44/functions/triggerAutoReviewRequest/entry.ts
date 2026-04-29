/**
 * Auto Review Request Trigger
 * Called via entity automation when Order.order_status = "fully_live"
 * Automatically sends review request if not already sent in past 7 days
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || data.order_status !== "fully_live") {
      console.log("[AutoReviewRequest] Skipped — not fully_live status");
      return Response.json({ skipped: true, reason: "Not fully_live status" });
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
      return Response.json({
        skipped: true,
        reason: "Missing customer_name or business_name",
      });
    }

    if (!order.customer_phone && !order.customer_email) {
      console.log(
        `[AutoReviewRequest] Skipped — no phone or email for order ${order.id}`
      );
      return Response.json({
        skipped: true,
        reason: "No phone or email on order",
      });
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
        return Response.json({
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
      return Response.json({
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
      console.log(
        `[AutoReviewRequest] Review request sent for order ${order.id} — SMS: ${result.data.sms_sent}, Email: ${result.data.email_sent}`
      );
      return Response.json({
        success: true,
        sms_sent: result.data.sms_sent,
        email_sent: result.data.email_sent,
      });
    } else {
      console.warn(
        `[AutoReviewRequest] Review request failed for order ${order.id}: ${result.data?.error || "Unknown error"}`
      );
      return Response.json({
        success: false,
        error: result.data?.error || "Failed to send review request",
      });
    }
  } catch (error) {
    console.error("[AutoReviewRequest] Fatal error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});