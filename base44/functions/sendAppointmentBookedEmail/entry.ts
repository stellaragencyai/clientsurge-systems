import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { lead_id, lead_name, lead_email, business_name, client_email } = await req.json();

    if (!lead_id || !lead_email || !client_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    if (lead.email !== lead_email) {
      return Response.json({ error: 'lead_email does not match lead record' }, { status: 400 });
    }

    const subject = `✅ Appointment Booked: ${lead_name}`;
    const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #2d2d2d; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #005B99 0%, #0077B6 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .content { padding: 20px; background: #f9f7f5; margin: 20px 0; border-radius: 8px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #0077B6; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
    a { color: #0077B6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Appointment Booked!</h1>
      <p>A new lead has confirmed their appointment</p>
    </div>

    <div class="content">
      <h2 style="color: #2d2d2d; margin-top: 0;">Booking Confirmed</h2>
      
      <p><strong>${escapeHtml(lead_name)}</strong> from <strong>${escapeHtml(business_name)}</strong> has successfully booked an appointment.</p>
      
      <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981;">
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
          <div class="metric-label">Email</div>
          <div class="metric-value" style="color: #2d2d2d; font-size: 16px;">${escapeHtml(lead_email)}</div>
        </div>
      </div>

      <p style="margin-top: 20px;">This is a key milestone in your sales pipeline. The lead is now confirmed and ready for their appointment.</p>

      <p style="text-align: center; margin-top: 30px;">
        <a href="#" style="background: linear-gradient(135deg, #005B99, #0077B6); color: white; padding: 10px 20px; border-radius: 6px; display: inline-block;">
          View Lead Details
        </a>
      </p>
    </div>

    <div class="footer">
      <p>ClientSurge Systems · Automated Appointment Notification</p>
      <p>This email was sent because an appointment was booked via your lead automation system.</p>
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
      message_body: 'Appointment booked notification sent to client.',
      metadata_json: JSON.stringify({
        target: 'appointment_booked_notification',
        client_email,
      }),
    });

    return Response.json({ success: true, message: 'Appointment booked email sent' });
  } catch (error) {
    console.error('Error sending appointment email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
