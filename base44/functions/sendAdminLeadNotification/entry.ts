/**
 * sendAdminLeadNotification — self-contained (no _shared imports)
 * Sends a rich HTML lead notification email to the admin via Resend.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

function allowAnonymousAutomation(req) {
  const secret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (!secret) return true;
  const auth = req.headers.get("authorization") || "";
  const [scheme, token] = auth.split(/\s+/, 2);
  const candidate = (scheme?.toLowerCase() === "bearer" ? token?.trim() : "") || req.headers.get("x-automation-secret") || "";
  return constantTimeEqual(candidate, secret);
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationPayload = !!(body?.event?.entity_id || body?.data?.id);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") return json({ error: "Forbidden: Admin only" }, 403);
    if (!user && (!isAutomationPayload || !allowAnonymousAutomation(req))) {
      return json({ error: "Forbidden: Trusted automation only" }, 403);
    }

    const lead_id = body?.lead_id || body?.event?.entity_id || body?.data?.id;
    if (!lead_id) return json({ error: "lead_id required" }, 400);

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) return json({ error: "Lead not found" }, 404);

    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1).catch(() => []);
    const settings = settingsRecords?.[0] || {};
    if (!settings.resend_enabled) {
      return json({ skipped: true, reason: "Resend is disabled in AdminSettings" });
    }

    const toEmail = settings.lead_notification_email ||
      Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ||
      Deno.env.get("ADMIN_EMAIL");
    if (!toEmail) {
      console.warn("[sendAdminLeadNotification] No notification email configured — skipping");
      return json({ skipped: true, reason: "No notification email configured" });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not set" }, 500);

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";

    const submittedAt = new Date(lead.created_date).toLocaleString("en-US", {
      timeZone: "America/Phoenix", month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const industryTags = Array.isArray(lead.industry_tags)
      ? lead.industry_tags.map(esc).filter(Boolean).join(", ")
      : "";
    const isRoofingLead = /roof/i.test(`${lead.business_type || ""} ${industryTags}`);

    const appUrl = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";

    const htmlBody = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#003B8F,#00AEEF);padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">ClientSurge Systems</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">New Lead Submitted 🎯</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;width:130px;font-weight:600;">Name</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;">${esc(lead.full_name) || "—"}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;font-weight:600;">Business</td><td style="padding:8px 6px;color:#1a1a1a;">${esc(lead.business_name) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Email</td><td style="padding:8px 0;color:#1a1a1a;">${esc(lead.email) || "—"}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;font-weight:600;">Phone</td><td style="padding:8px 6px;color:#1a1a1a;">${esc(lead.phone) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Business Type</td><td style="padding:8px 0;color:#1a1a1a;">${esc(lead.business_type) || "—"}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;font-weight:600;">Industry Tags</td><td style="padding:8px 6px;color:#1a1a1a;">${industryTags || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Website</td><td style="padding:8px 0;color:#1a1a1a;">${esc(lead.website || lead.website_url) || "—"}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;font-weight:600;">Source</td><td style="padding:8px 6px;color:#1a1a1a;">${esc(lead.source) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Problem</td><td style="padding:8px 0;color:#1a1a1a;">${esc(lead.problem) || "—"}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;font-weight:600;">Submitted</td><td style="padding:8px 6px;color:#888;font-size:12px;">${submittedAt}</td></tr>
      </table>
      <div style="margin-top:24px;">
        <a href="${appUrl}/admin/leads/${lead.id}" style="display:inline-block;background:linear-gradient(135deg,#003B8F,#00AEEF);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">View Lead in Dashboard →</a>
      </div>
    </div>
  </div>
</body></html>`;

    const subject = `${isRoofingLead ? "New Roofing Lead" : "New Lead"}: ${esc(lead.full_name)} - ${esc(lead.business_name || lead.business_type || "Unknown")}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromEmail.includes("@") && !fromEmail.includes("<") ? `ClientSurge Systems <${fromEmail}>` : fromEmail, to: toEmail, subject, html: htmlBody }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[sendAdminLeadNotification] Resend error:", err);
      return json({ error: err?.message || "Resend failed" }, 500);
    }

    const resendData = await res.json().catch(() => ({}));

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: "sent",
      subject: `Lead notification sent to ${toEmail}`,
      provider_message_id: resendData?.id,
      metadata_json: JSON.stringify({ target: "admin_notification", to_email: toEmail }),
    }).catch(() => null);

    console.log(`[sendAdminLeadNotification] Sent to ${toEmail} for lead ${lead_id}`);
    return json({ success: true, sent_to: toEmail, email_id: resendData?.id || null });
  } catch (error) {
    console.error("[sendAdminLeadNotification] error:", error);
    return json({ error: error.message }, 500);
  }
});