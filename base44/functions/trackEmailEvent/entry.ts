import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

// ── Svix signature verification ──
async function verifySvixWebhookRequest({ payload, headers, secret }) {
  if (!secret) {
    return { ok: false, code: "missing_secret" };
  }

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, code: "missing_svix_headers" };
  }

  const now = Math.floor(Date.now() / 1000);
  const age = now - parseInt(svixTimestamp, 10);
  if (Math.abs(age) > 300) {
    return { ok: false, code: "stale_timestamp" };
  }

  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));
  const expectedSig =
    "v1," +
    Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const signatures = svixSignature.split(" ");
  const isValid = signatures.some((s) => s === expectedSig);

  return { ok: isValid, code: isValid ? null : "signature_mismatch" };
}

function buildWebhookAuthErrorResponse({ provider, code }) {
  const messages = {
    missing_secret: `${provider} webhook secret not configured`,
    missing_svix_headers: `Missing ${provider} Svix signature headers`,
    stale_timestamp: `${provider} webhook timestamp too old`,
    signature_mismatch: `Invalid ${provider} webhook signature`,
  };
  const message = messages[code] || `${provider} webhook authentication failed`;
  return Response.json({ error: message, code }, { status: 401 });
}

/**
 * trackEmailEvent — webhook handler for Resend email events.
 * Handles: email.delivered, opened, clicked, bounced, complained.
 * Updates EmailCampaignRecipient and EmailCampaign aggregate metrics.
 */
async function updateCampaignMetrics(base44, campaignId) {
  const recipients = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
    { campaign_id: campaignId },
    "-created_date",
    5000
  );

  const metrics = {
    total_recipients: recipients.length,
    total_sent: recipients.filter((r) => ["sent", "delivered", "opened", "clicked"].includes(r.status)).length,
    total_delivered: recipients.filter((r) => ["delivered", "opened", "clicked"].includes(r.status)).length,
    total_opened: recipients.filter((r) => r.opened_at).length,
    total_clicked: recipients.filter((r) => r.clicked_at).length,
    total_unsubscribed: recipients.filter((r) => r.unsubscribed_at).length,
    total_bounced: recipients.filter((r) => r.status === "bounced").length,
  };

  await base44.asServiceRole.entities.EmailCampaign.update(campaignId, metrics);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
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
      return secureJson({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType = body?.type;
    const data = body?.data || {};

    if (!eventType) {
      return secureJson({ error: "Missing event type" }, { status: 400 });
    }

    const campaignId = data?.headers?.["X-Campaign-ID"] || data?.tags?.campaign_id;
    const recipientId = data?.headers?.["X-Recipient-ID"] || data?.tags?.recipient_id;

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
      return secureJson({ success: true, skipped: true, reason: "Recipient not found" });
    }

    if (campaignId && recipient.campaign_id && recipient.campaign_id !== campaignId) {
      return secureJson({ error: "Recipient campaign mismatch" }, { status: 400 });
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
        if (!recipient.opened_at) updates.opened_at = now;
        updates.open_count = (recipient.open_count || 0) + 1;
        break;
      case "email.clicked":
        updates.status = "clicked";
        if (!recipient.clicked_at) updates.clicked_at = now;
        updates.click_count = (recipient.click_count || 0) + 1;
        if (!recipient.opened_at) updates.opened_at = now;
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
        return secureJson({ success: true, skipped: true, reason: `Unhandled event: ${eventType}` });
    }

    await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, updates);

    if (recipient.lead_id) {
      const leadPatch = {};
      if (eventType === "email.opened" || eventType === "email.clicked") {
        leadPatch.crm_stage = "Opened / Clicked";
        leadPatch.outreach_status = "contacted";
        leadPatch.last_activity_at = now;
      }
      if (eventType === "email.clicked") {
        leadPatch.ai_intent = "pricing_interest";
      }
      if (eventType === "email.bounced") {
        leadPatch.email_bounced = true;
        leadPatch.outreach_status = "bounced";
        leadPatch.last_activity_at = now;
      }
      if (eventType === "email.complained" || eventType === "email.unsubscribed") {
        leadPatch.email_unsubscribed = true;
        leadPatch.do_not_contact = true;
        leadPatch.outreach_status = "do_not_contact";
        leadPatch.last_activity_at = now;
      }
      if (Object.keys(leadPatch).length > 0) {
        await base44.asServiceRole.entities.Leads.update(recipient.lead_id, leadPatch).catch(() => null);
      }
    }

    const finalCampaignId = recipient.campaign_id || campaignId;
    if (finalCampaignId) {
      await updateCampaignMetrics(base44, finalCampaignId);
    }

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

    return secureJson({ success: true, event: eventType, recipient_id: recipient.id });
  } catch (error) {
    console.error("[trackEmailEvent] error:", error);
    return secureJson({ error: error.message || "Failed to process event" }, { status: 500 });
  }
});