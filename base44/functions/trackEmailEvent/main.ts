import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  buildWebhookAuthErrorResponse,
  verifySvixWebhookRequest,
} from "../_shared/webhookSecurity.js";

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  failed: 5,
  bounced: 6,
  unsubscribed: 7,
};
const TERMINAL_STATUSES = new Set(["failed", "bounced", "unsubscribed"]);
const ADVANCED_CRM_STAGES = new Set([
  "Replied",
  "Audit Booked",
  "Audit Completed",
  "Proposal Sent",
  "Won Pending Payment",
  "Won",
]);

function clean(value: unknown, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function headerValue(data: Record<string, unknown>, requestedName: string) {
  const headers = data?.headers;
  if (headers && !Array.isArray(headers) && typeof headers === "object") {
    const target = requestedName.toLowerCase();
    for (const [name, value] of Object.entries(headers)) {
      if (name.toLowerCase() === target) return clean(value, 500);
    }
  }
  if (Array.isArray(headers)) {
    const target = requestedName.toLowerCase();
    const match = headers.find((item) =>
      String(item?.name || item?.key || "").toLowerCase() === target
    );
    return clean(match?.value, 500);
  }
  return "";
}

function nextStatus(current: string, candidate: string) {
  const existing = current || "pending";
  if (existing === "unsubscribed") return existing;
  if (existing === "bounced" && candidate !== "unsubscribed") return existing;
  if (TERMINAL_STATUSES.has(existing) && !TERMINAL_STATUSES.has(candidate)) return existing;
  return (STATUS_RANK[candidate] ?? 0) >= (STATUS_RANK[existing] ?? 0) ? candidate : existing;
}

async function updateCampaignMetrics(base44: ReturnType<typeof createClientFromRequest>, campaignId: string) {
  const recipients = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
    { campaign_id: campaignId },
    "-created_date",
    5000,
  );
  const metrics = {
    total_recipients: recipients.length,
    total_sent: recipients.filter((item: Record<string, unknown>) =>
      ["sent", "delivered", "opened", "clicked", "bounced", "unsubscribed"].includes(String(item.status || ""))
    ).length,
    total_delivered: recipients.filter((item: Record<string, unknown>) =>
      ["delivered", "opened", "clicked"].includes(String(item.status || ""))
    ).length,
    total_opened: recipients.filter((item: Record<string, unknown>) => Boolean(item.opened_at)).length,
    total_clicked: recipients.filter((item: Record<string, unknown>) => Boolean(item.clicked_at)).length,
    total_unsubscribed: recipients.filter((item: Record<string, unknown>) =>
      item.status === "unsubscribed" || Boolean(item.unsubscribed_at)
    ).length,
    total_bounced: recipients.filter((item: Record<string, unknown>) => item.status === "bounced").length,
  };
  await base44.asServiceRole.entities.EmailCampaign.update(campaignId, metrics);
}

function communicationEventType(eventType: string) {
  return {
    "email.opened": "email_opened",
    "email.clicked": "email_clicked",
    "email.bounced": "email_bounced",
    "email.failed": "email_failed",
    "email.complained": "unsubscribed",
    "email.unsubscribed": "unsubscribed",
  }[eventType] || "status_update";
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const rawPayload = await req.text();
    const verification = await verifySvixWebhookRequest({
      payload: rawPayload,
      headers: req.headers,
      secret: Deno.env.get("RESEND_WEBHOOK_SECRET"),
    });
    if (!verification.ok) {
      return buildWebhookAuthErrorResponse({
        provider: "resend",
        code: verification.code,
      });
    }

    let body: Record<string, unknown> = {};
    try {
      body = rawPayload ? JSON.parse(rawPayload) : {};
    } catch {
      return secureJson({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType = clean(body?.type, 100);
    const data = body?.data && typeof body.data === "object"
      ? body.data as Record<string, unknown>
      : {};
    if (!eventType) return secureJson({ error: "Missing event type" }, { status: 400 });

    const supported = new Set([
      "email.delivered",
      "email.opened",
      "email.clicked",
      "email.bounced",
      "email.failed",
      "email.complained",
      "email.unsubscribed",
    ]);
    if (!supported.has(eventType)) {
      return secureJson({ success: true, skipped: true, reason: `Unhandled event: ${eventType}` });
    }

    const base44 = createClientFromRequest(req);
    const campaignId =
      headerValue(data, "X-ClientSurge-Campaign-ID") ||
      headerValue(data, "X-Campaign-ID") ||
      clean((data?.tags as Record<string, unknown>)?.campaign_id, 120);
    const recipientId =
      headerValue(data, "X-ClientSurge-Recipient-ID") ||
      headerValue(data, "X-Recipient-ID") ||
      clean((data?.tags as Record<string, unknown>)?.recipient_id, 120);
    const messageId = clean(data?.email_id || data?.id, 200);

    let recipient: Record<string, unknown> | null = null;
    if (recipientId) {
      recipient = await base44.asServiceRole.entities.EmailCampaignRecipient.get(recipientId).catch(() => null);
    }
    if (!recipient && messageId) {
      const found = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
        { resend_message_id: messageId },
        "-created_date",
        1,
      );
      recipient = found?.[0] || null;
    }
    if (!recipient) {
      return secureJson({ success: true, skipped: true, reason: "Recipient not found" });
    }
    if (campaignId && recipient.campaign_id && recipient.campaign_id !== campaignId) {
      return secureJson({ error: "Recipient campaign mismatch" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {};
    let candidateStatus = String(recipient.status || "pending");

    if (eventType === "email.delivered") {
      candidateStatus = "delivered";
      updates.delivered_at = recipient.delivered_at || now;
    } else if (eventType === "email.opened") {
      candidateStatus = "opened";
      updates.opened_at = recipient.opened_at || now;
      updates.open_count = Number(recipient.open_count || 0) + 1;
    } else if (eventType === "email.clicked") {
      candidateStatus = "clicked";
      updates.clicked_at = recipient.clicked_at || now;
      updates.click_count = Number(recipient.click_count || 0) + 1;
      updates.opened_at = recipient.opened_at || now;
    } else if (eventType === "email.bounced") {
      candidateStatus = "bounced";
      updates.bounced_at = recipient.bounced_at || now;
      updates.error_message = clean(
        (data?.bounce as Record<string, unknown>)?.message ||
        (data?.bounce as Record<string, unknown>)?.type ||
        "Email bounced",
        1000,
      );
      updates.suppression_reason = "provider_bounce";
    } else if (eventType === "email.failed") {
      candidateStatus = "failed";
      updates.error_message = clean(
        (data?.failed as Record<string, unknown>)?.reason || data?.error || "Provider delivery failed",
        1000,
      );
    } else if (eventType === "email.complained" || eventType === "email.unsubscribed") {
      candidateStatus = "unsubscribed";
      updates.unsubscribed_at = recipient.unsubscribed_at || now;
      updates.suppression_reason = eventType === "email.complained"
        ? "provider_spam_complaint"
        : "provider_unsubscribe";
    }

    updates.status = nextStatus(String(recipient.status || "pending"), candidateStatus);
    await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, updates);

    if (recipient.lead_id) {
      const lead = await base44.asServiceRole.entities.Leads.get(recipient.lead_id).catch(() => null);
      if (lead) {
        const leadPatch: Record<string, unknown> = { last_activity_at: now };
        if (["email.opened", "email.clicked"].includes(eventType)) {
          leadPatch.outreach_status = lead.outreach_status === "contacted"
            ? "contacted"
            : lead.outreach_status;
          if (!ADVANCED_CRM_STAGES.has(String(lead.crm_stage || "")) &&
              !["Replied", "Interested", "Follow Up Later"].includes(String(lead.status || ""))) {
            leadPatch.crm_stage = "Opened / Clicked";
          }
        }
        if (eventType === "email.bounced" || eventType === "email.failed") {
          leadPatch.email_bounced = true;
          leadPatch.email_bounced_at = now;
          leadPatch.outreach_status = "bounced";
          leadPatch.next_follow_up_at = null;
          leadPatch.next_followup_at = null;
        }
        if (eventType === "email.complained" || eventType === "email.unsubscribed") {
          Object.assign(leadPatch, {
            email_unsubscribed: true,
            email_unsubscribed_at: now,
            do_not_contact: true,
            do_not_contact_at: now,
            do_not_contact_reason: eventType === "email.complained"
              ? "Email spam complaint"
              : "Provider unsubscribe event",
            outreach_status: "unsubscribed",
            next_follow_up_at: null,
            next_followup_at: null,
          });
        }
        await base44.asServiceRole.entities.Leads.update(recipient.lead_id, leadPatch).catch(() => null);
      }
    }

    const finalCampaignId = clean(recipient.campaign_id || campaignId, 120);
    if (finalCampaignId) await updateCampaignMetrics(base44, finalCampaignId);

    if (eventType !== "email.delivered") {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: recipient.lead_id,
        channel: "email",
        direction: "inbound",
        event_type: communicationEventType(eventType),
        provider: "resend",
        provider_message_id: messageId || recipient.resend_message_id || null,
        status: "processed",
        campaign_id: finalCampaignId || null,
        campaign_recipient_id: recipient.id,
        subject: `Campaign email ${eventType.split(".")[1]}`,
        metadata_json: JSON.stringify({
          email_event_type: eventType,
          webhook_event_id: clean(body?.id, 200),
          clicked_url: clean((data?.click as Record<string, unknown>)?.link, 1000),
        }),
      }).catch(() => null);
    }

    return secureJson({
      success: true,
      event: eventType,
      recipient_id: recipient.id,
      status: updates.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process event";
    console.error("[trackEmailEvent]", message);
    return secureJson({ error: message }, { status: 500 });
  }
});
