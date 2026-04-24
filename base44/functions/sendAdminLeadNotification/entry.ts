/**
 * sendAdminLeadNotification
 * Triggered by entity automation on Leads create.
 * Sends a rich HTML email to the admin via Resend.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

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

    const toEmail = settings.lead_notification_email;
    if (!toEmail) {
      console.warn('No lead_notification_email configured in AdminSettings — skipping notification.');
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
        <a href="https://clientsurge.base44.app/admin/leads/${lead.id}" style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          View Lead in Dashboard →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: settings.resend_from_email || 'notifications@clientsurge.com',
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

    console.log(`Lead notification sent to ${toEmail} for lead ${lead_id}`);
    return Response.json({ success: true, sent_to: toEmail });

  } catch (error) {
    console.error('sendAdminLeadNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});