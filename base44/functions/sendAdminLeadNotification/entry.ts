/**
 * sendAdminLeadNotification
 * Triggered by entity automation on Leads create.
 * Sends a rich HTML email to the admin via Resend.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";
// Inlined from _shared/automationSecurity.js (relative imports not supported in deployed Deno runtime)
function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
function getBearerToken(req) {
  const authorization = req.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return "";
  return token.trim();
}
function allowAnonymousAutomation(req) {
  const configuredSecret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (!configuredSecret) return true;
  const candidateSecret = req.headers.get("x-automation-secret") || getBearerToken(req);
  return constantTimeEqual(candidateSecret || "", configuredSecret);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationPayload = !!(body?.event?.entity_id || body?.data?.id);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }
    if (!user && (!isAutomationPayload || !allowAnonymousAutomation(req))) {
      return Response.json({ error: 'Forbidden: Trusted automation only' }, { status: 403 });
    }

    // Support both direct call (lead_id) and entity automation payload (event.entity_id)
    const lead_id = body?.lead_id || body?.event?.entity_id || body?.data?.id;

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const settings = settingsRecords?.[0] || {};
    if (!settings.resend_enabled) {
      return Response.json({ skipped: true, reason: 'Resend is disabled in AdminSettings' });
    }

    const toEmail = settings.lead_notification_email || Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || Deno.env.get('ADMIN_EMAIL');
    if (!toEmail) {
      console.warn('No lead_notification_email configured in AdminSettings or env — skipping notification.');
      return Response.json({ skipped: true, reason: 'No notification email configured' });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    }

    const submittedAt = new Date(lead.created_date).toLocaleString('en-US', {
      timeZone: 'America/Phoenix',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    lead.full_name = escapeHtml(lead.full_name || '');
    lead.business_name = escapeHtml(lead.business_name || '');
    lead.email = escapeHtml(lead.email || '');
    lead.phone = escapeHtml(lead.phone || '');
    lead.business_type = escapeHtml(lead.business_type || '');
    lead.source = escapeHtml(lead.source || '');
    lead.problem = escapeHtml(lead.problem || '');

    const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#6b3f1f,#9a5c2e);padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">ClientSurge Systems</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">New Lead Submitted 🎯</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;width:130px;vertical-align:top;font-weight:600;">Name</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;">${lead.full_name || '—'}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;vertical-align:top;font-weight:600;">Business</td><td style="padding:8px 6px;color:#1a1a1a;">${lead.business_name || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;vertical-align:top;font-weight:600;">Email</td><td style="padding:8px 0;color:#1a1a1a;">${lead.email || '—'}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;vertical-align:top;font-weight:600;">Phone</td><td style="padding:8px 6px;color:#1a1a1a;">${lead.phone || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;vertical-align:top;font-weight:600;">Business Type</td><td style="padding:8px 0;color:#1a1a1a;">${lead.business_type || '—'}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;vertical-align:top;font-weight:600;">Source</td><td style="padding:8px 6px;color:#1a1a1a;">${lead.source || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;vertical-align:top;font-weight:600;">Problem</td><td style="padding:8px 0;color:#1a1a1a;">${lead.problem || '—'}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;vertical-align:top;font-weight:600;">Submitted</td><td style="padding:8px 6px;color:#888;font-size:12px;">${submittedAt}</td></tr>
      </table>
      <div style="margin-top:24px;">
        <a href="https://clientsurgesystems.com/admin/leads/${lead.id}" style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          View Lead in Dashboard →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

    const res = await resendFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ClientSurge Systems <${settings.resend_from_email || 'notifications@clientsurgesystems.com'}>`,
        to: toEmail,
        subject: `🎯 New Lead: ${lead.full_name} — ${lead.business_name || lead.business_type || 'Unknown'}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Resend error:', err);
      return Response.json({ error: err?.message || 'Resend failed' }, { status: 500 });
    }

    const resendData = await res.json().catch(() => ({}));

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'email_sent',
      provider: 'resend',
      status: 'sent',
      subject: `Lead notification sent to ${toEmail}`,
      message_body: 'Admin lead notification email sent successfully.',
      provider_message_id: resendData?.id,
      metadata_json: JSON.stringify({ target: 'admin_notification', to_email: toEmail }),
    });

    console.log(`Lead notification sent to ${toEmail} for lead ${lead_id}`);
    return Response.json({ success: true, sent_to: toEmail, email_id: resendData?.id || null });

  } catch (error) {
    console.error('sendAdminLeadNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});