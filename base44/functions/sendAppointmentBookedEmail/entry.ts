import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, lead_name, lead_email, business_name, client_email } = await req.json();

    if (!lead_id || !lead_email || !client_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subject = `✅ Appointment Booked: ${lead_name}`;
    const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #2d2d2d; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .content { padding: 20px; background: #f9f7f5; margin: 20px 0; border-radius: 8px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #9a5c2e; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
    a { color: #9a5c2e; text-decoration: none; }
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
      
      <p><strong>${lead_name}</strong> from <strong>${business_name}</strong> has successfully booked an appointment.</p>
      
      <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981;">
        <div class="metric">
          <div class="metric-label">Lead Name</div>
          <div class="metric-value" style="color: #2d2d2d; font-size: 16px;">${lead_name}</div>
        </div>
        <br />
        <div class="metric">
          <div class="metric-label">Business</div>
          <div class="metric-value" style="color: #2d2d2d; font-size: 16px;">${business_name}</div>
        </div>
        <br />
        <div class="metric">
          <div class="metric-label">Email</div>
          <div class="metric-value" style="color: #2d2d2d; font-size: 16px;">${lead_email}</div>
        </div>
      </div>

      <p style="margin-top: 20px;">This is a key milestone in your sales pipeline. The lead is now confirmed and ready for their appointment.</p>

      <p style="text-align: center; margin-top: 30px;">
        <a href="#" style="background: linear-gradient(135deg, #6b3f1f, #9a5c2e); color: white; padding: 10px 20px; border-radius: 6px; display: inline-block;">
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

    return Response.json({ success: true, message: 'Appointment booked email sent' });
  } catch (error) {
    console.error('Error sending appointment email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});