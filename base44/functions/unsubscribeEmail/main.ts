import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { verifyEmailUnsubscribeToken } from "../_shared/emailUnsubscribe.ts";

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function page({ title, message, token, complete = false }: { title: string; message: string; token?: string; complete?: boolean }) {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | ClientSurge Systems</title></head>
<body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif"><main style="max-width:560px;margin:64px auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 12px 40px rgba(15,23,42,.08)"><p style="color:#0284c7;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em">ClientSurge Systems</p><h1 style="font-size:28px;margin:12px 0">${escapeHtml(title)}</h1><p style="line-height:1.65;color:#475569">${escapeHtml(message)}</p>${complete ? "" : `<form method="post" style="margin-top:24px"><input type="hidden" name="token" value="${escapeHtml(token || "")}"><input type="hidden" name="List-Unsubscribe" value="One-Click"><button type="submit" style="border:0;border-radius:999px;background:#075985;color:white;font-weight:700;padding:13px 22px;cursor:pointer">Unsubscribe this email</button></form>`}<p style="font-size:12px;color:#94a3b8;margin-top:28px">Phoenix, Arizona · support@clientsurgesystems.com</p></main></body></html>`, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

async function readToken(req: Request) {
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token") || "";
  if (queryToken) return queryToken;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return String(body?.token || "");
  }
  const text = await req.text().catch(() => "");
  return new URLSearchParams(text).get("token") || "";
}

async function applyUnsubscribe(base44: ReturnType<typeof createClientFromRequest>, token: string) {
  const payload = await verifyEmailUnsubscribeToken(token);
  const recipient = await base44.asServiceRole.entities.EmailCampaignRecipient.get(payload.recipient_id);
  if (!recipient || recipient.campaign_id !== payload.campaign_id || recipient.lead_id !== payload.lead_id) {
    throw new Error("Unsubscribe record no longer matches the signed request");
  }
  if (String(recipient.email || "").trim().toLowerCase() !== payload.email) {
    throw new Error("Unsubscribe email does not match the signed request");
  }

  const now = new Date().toISOString();
  if (recipient.status !== "unsubscribed") {
    await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, {
      status: "unsubscribed",
      unsubscribed_at: now,
      suppression_reason: "user_unsubscribed",
    });
  }

  const lead = await base44.asServiceRole.entities.Leads.get(payload.lead_id).catch(() => null);
  if (lead && String(lead.email || "").trim().toLowerCase() === payload.email) {
    await base44.asServiceRole.entities.Leads.update(lead.id, {
      email_unsubscribed: true,
      email_unsubscribed_at: now,
      do_not_contact: true,
      do_not_contact_at: now,
      do_not_contact_reason: "Email unsubscribe request",
      outreach_status: "unsubscribed",
      next_follow_up_at: null,
      next_followup_at: null,
    });
  }

  const campaignRecipients = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
    { campaign_id: payload.campaign_id },
    "-created_date",
    1000,
  ).catch(() => []);
  const totalUnsubscribed = (campaignRecipients || []).filter((item: Record<string, unknown>) =>
    item.status === "unsubscribed" || Boolean(item.unsubscribed_at)
  ).length;
  await base44.asServiceRole.entities.EmailCampaign.update(payload.campaign_id, {
    total_unsubscribed: totalUnsubscribed,
  }).catch(() => null);

  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: payload.lead_id,
    channel: "email",
    direction: "inbound",
    event_type: "unsubscribed",
    provider: "internal",
    status: "processed",
    campaign_id: payload.campaign_id,
    campaign_recipient_id: payload.recipient_id,
    subject: "Email unsubscribe request",
    message_body: "Recipient requested no further ClientSurge outreach email.",
    metadata_json: JSON.stringify({ source: "signed_one_click_unsubscribe" }),
  }).catch(() => null);

  return payload;
}

Deno.serve(async (req) => {
  if (!["GET", "POST"].includes(req.method)) {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const token = await readToken(req);
    if (!token) {
      return req.method === "GET"
        ? page({ title: "Unsubscribe link unavailable", message: "This unsubscribe link is incomplete. Reply to the email or contact support@clientsurgesystems.com for help.", complete: true })
        : json({ error: "token is required" }, 400);
    }

    if (req.method === "GET") {
      await verifyEmailUnsubscribeToken(token);
      return page({
        title: "Stop ClientSurge outreach emails?",
        message: "Confirm below and this email address will be placed on the ClientSurge suppression list. Transactional messages connected to an existing purchase may still be sent when required.",
        token,
      });
    }

    const base44 = createClientFromRequest(req);
    const payload = await applyUnsubscribe(base44, token);
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      return page({
        title: "You are unsubscribed",
        message: `${payload.email} will not receive additional ClientSurge outreach campaigns.`,
        complete: true,
      });
    }
    return json({ success: true, email: payload.email, unsubscribed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unsubscribe failed";
    console.error("[unsubscribeEmail]", message);
    return req.headers.get("accept")?.includes("text/html")
      ? page({ title: "We could not process this link", message: "The link may be invalid or expired. Reply to the original email or contact support@clientsurgesystems.com and we will suppress the address manually.", complete: true })
      : json({ error: message }, 400);
  }
});
