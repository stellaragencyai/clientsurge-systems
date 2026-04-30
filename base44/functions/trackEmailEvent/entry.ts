/**
 * trackEmailEvent — webhook handler for Resend email events.
 *
 * Handles:
 *  - email.delivered
 *  - email.opened
 *  - email.clicked
 *  - email.bounced
 *  - email.complained (unsubscribe)
 *
 * Updates EmailCampaignRecipient and EmailCampaign aggregate metrics.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildWebhookAuthErrorResponse,
  verifySvixWebhookRequest,
} from "../_shared/webhookSecurity.js";

async function updateCampaignMetrics(base44, campaignId) {
  // Get all recipients for this campaign and recalculate totals
  const recipients = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
    { campaign_id: campaignId },
    "-created_date",
    5000
  );

  const metrics = {
    total_recipients: recipients.length,
    total_sent: recipients.filter(r => ["sent", "delivered", "opened", "clicked"].includes(r.status)).length,
    total_delivered: recipients.filter(r => ["delivered", "opened", "clicked"].includes(r.status)).length,
    total_opened: recipients.filter(r => r.opened_at).length,
    total_clicked: recipients.filter(r => r.clicked_at).length,
    total_unsubscribed: recipients.filter(r => r.unsubscribed_at).length,
    total_bounced: recipients.filter(r => r.status === "bounced").length,
  };

  await base44.asServiceRole.entities.EmailCampaign.update(campaignId, metrics);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawPayload = await req.text();
    const verification = await verifySvixWebhookRequest({
      payload: rawPayload,
      headers: req.headers,
      secret: Deno.env.get("RESEND_WEBHOOK_SECRET"),
    });
    const user = verification.ok ? null : await base44.auth.me().catch(() => null);

    if (!verification.ok && (!user || user.role !== "admin")) {
      return buildWebhookAuthErrorResponse({
        provider: "resend",
        code: verification.code,
      });
    }

    let body = {};
    try {
      body = rawPayload ? JSON.parse(rawPayload) : {};
    } catch {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Resend webhook payload structure
    const eventType = body?.type;
    const data = body?.data || {};

    if (!eventType) {
      return Response.json({ error: "Missing event type" }, { status: 400 });
    }

    // Extract campaign and recipient IDs from headers or custom fields
    const campaignId = data?.headers?.["X-Campaign-ID"] || data?.tags?.campaign_id;
    const recipientId = data?.headers?.["X-Recipient-ID"] || data?.tags?.recipient_id;

    // If no tracking IDs, try to find recipient by Resend message ID
    let recipient = null;
    if (recipientId) {
      recipient = await base44.asServiceRole.entities.EmailCampaignRecipient.get(recipientId);
    } else if (data?.email_id) {
      const found = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
        { resend_message_id: data.email_id },
        "-created_date",
        1
      );
      recipient = found?.[0];
    }

    if (!recipient) {
      console.log(`trackEmailEvent: No recipient found for event ${eventType}`);
      return Response.json({ success: true, skipped: true, reason: "Recipient not found" });
    }

    if (campaignId && recipient.campaign_id && recipient.campaign_id !== campaignId) {
      return Response.json({ error: "Recipient campaign mismatch" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updates = {};

    switch (eventType) {
      case "email.delivered":
        updates.status = "delivered";
        updates.delivered_at = now;
        break;

      case "email.opened":
        updates.status = "opened";
        if (!recipient.opened_at) {
          updates.opened_at = now;
        }
        updates.open_count = (recipient.open_count || 0) + 1;
        break;

      case "email.clicked":
        updates.status = "clicked";
        if (!recipient.clicked_at) {
          updates.clicked_at = now;
        }
        updates.click_count = (recipient.click_count || 0) + 1;
        // Also mark as opened if not already
        if (!recipient.opened_at) {
          updates.opened_at = now;
        }
        break;

      case "email.bounced":
        updates.status = "bounced";
        updates.bounced_at = now;
        updates.error_message = data?.bounce?.message || "Email bounced";
        break;

      case "email.complained":
      case "email.unsubscribed":
        updates.status = "unsubscribed";
        updates.unsubscribed_at = now;
        break;

      default:
        console.log(`trackEmailEvent: Unhandled event type ${eventType}`);
        return Response.json({ success: true, skipped: true, reason: `Unhandled event: ${eventType}` });
    }

    // Update recipient record
    await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, updates);

    // Update campaign aggregate metrics
    const finalCampaignId = recipient.campaign_id || campaignId;
    if (finalCampaignId) {
      await updateCampaignMetrics(base44, finalCampaignId);
    }

    // Log communication event for significant events
    if (["email.opened", "email.clicked", "email.bounced", "email.complained"].includes(eventType)) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: recipient.lead_id,
        channel: "email",
        direction: "inbound",
        event_type: "status_update",
        provider: "resend",
        status: "processed",
        subject: `Email ${eventType.split(".")[1]} — campaign tracking`,
        metadata_json: JSON.stringify({
          campaign_id: finalCampaignId,
          recipient_id: recipient.id,
          email_event_type: eventType,
        }),
      });
    }

    return Response.json({ success: true, event: eventType, recipient_id: recipient.id });

  } catch (error) {
    console.error("trackEmailEvent error:", error);
    return Response.json({ error: error.message || "Failed to process event" }, { status: 500 });
  }
});
