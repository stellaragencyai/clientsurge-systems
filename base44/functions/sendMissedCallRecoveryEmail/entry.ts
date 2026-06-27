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
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== 'admin') {
      return secureJson({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { lead_id, lead_name, lead_phone, business_name, client_email } = await req.json();

    if (!lead_id || !lead_phone || !client_email) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return secureJson({ error: 'Lead not found' }, { status: 404 });
    }
    if (lead.phone !== lead_phone) {
      return secureJson({ error: 'lead_phone does not match lead record' }, { status: 400 });
    }

    const subject = `📞 Missed Call Recovered: ${lead_name}`;
    const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #2d2d2d; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #003B8F 0%, #00AEEF 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .content { padding: 20px; background: #f9f7f5; margin: 20px 0; border-radius: 8px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #00AEEF; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
    a { color: #00AEEF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📞 Missed Call Recovered!</h1>
      <p>Your system automatically recovered a missed call</p>
    </div>

    <div class="content">
      <h2 style="color: #2d2d2d; margin-top: 0;">Quick Recovery</h2>
      
      <p>A missed call from <strong>${escapeHtml(lead_name)}</strong> (${escapeHtml(business_name)}) was automatically recovered before the lead was lost.</p>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e;"><strong>⚡ What happened:</strong> When the call was missed, your system immediately sent an SMS follow-up, bringing the lead back into the conversation.</p>
      </div>

      <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #00AEEF;">
        <div class="metric">
          <div class="metric-label">Lead Name</div>
          <div class="metric-value" style="color: #2d2d2d; font-size: 16px;">${escapeHtml(lead_name)}</div>
        </div>
        <br />
        <div class="metric">
          <div class="metric-label">Business</div>
          <div class="metric-value" style="color: #2d2d2d; font-size: 16px;">${escapeHtml(business_name)}</div>
        </div>
        <br />
        <div class="metric">
          <div class="metric-label">Phone</div>
          <div class="metric-value" style="color: #2d2d2d; font-size: 16px;">${escapeHtml(lead_phone)}</div>
        </div>
      </div>

      <p style="margin-top: 20px;">This lead would have been lost without automatic text-back recovery. Your system is working to prevent dropped opportunities.</p>
    </div>

    <div class="footer">
      <p>ClientSurge Systems · Missed Call Recovery Notification</p>
      <p>This email was sent because your system automatically recovered a missed call via SMS follow-up.</p>
    </div>
  </div>
</body>
</html>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client_email,
      from_name: 'ClientSurge Systems',
      subject,
      body,
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'email_sent',
      provider: 'internal',
      status: 'sent',
      subject,
      message_body: 'Missed call recovery notification sent to client.',
      metadata_json: JSON.stringify({
        target: 'missed_call_recovery_notification',
        client_email,
      }),
    });

    return secureJson({ success: true, message: 'Missed call recovery email sent' });
  } catch (error) {
    console.error('[sendMissedCallRecoveryEmail] Error sending missed call email:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});