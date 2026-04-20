import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { entity_id, data: client } = payload;

    if (!client || !client.email) {
      return Response.json({ error: 'No client email' }, { status: 400 });
    }

    // Generate unique webhook URL tied to their record ID
    const webhookUrl = `https://grinning-apex-flow-growth.base44.app/api/functions/createLeadAndDispatch?client_id=${entity_id}`;

    const emailBody = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #2d2d2d;">

  <div style="border-bottom: 3px solid #9a5c2e; padding-bottom: 20px; margin-bottom: 28px;">
    <p style="font-size: 13px; font-weight: 700; color: #9a5c2e; text-transform: uppercase; letter-spacing: 1px; margin: 0;">ClientSurge Systems</p>
  </div>

  <p style="font-size: 16px; margin-bottom: 6px;">Hey ${client.owner_name || 'there'},</p>

  <p style="font-size: 15px; line-height: 1.6; color: #444;">
    Your automation system is getting set up — and we're just one step away from having leads flow in automatically from your website.
  </p>

  <p style="font-size: 15px; line-height: 1.6; color: #444;">
    Below is your <strong>unique webhook URL</strong>. All you need to do is paste it into your website's contact form settings under <strong>Webhooks</strong> or <strong>Notifications</strong> (your web designer can help with this if needed — it takes about 2 minutes):
  </p>

  <div style="background: #f9f4ef; border: 2px solid #c8965c; border-radius: 10px; padding: 18px 22px; margin: 24px 0;">
    <p style="font-size: 11px; font-weight: 700; color: #9a5c2e; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Your Unique Webhook URL</p>
    <code style="font-size: 13px; word-break: break-all; color: #2d2d2d; font-family: 'Courier New', monospace;">${webhookUrl}</code>
  </div>

  <p style="font-size: 15px; line-height: 1.6; color: #444;">
    Once this is connected, every new lead from your website will be instantly captured into your system, triggering an automatic SMS follow-up within 60 seconds. No more missed leads. 🎯
  </p>

  <p style="font-size: 15px; line-height: 1.6; color: #444;">
    If you're not sure where to find the webhooks setting on your contact form, just reply to this email and I'll send you a quick walkthrough for your specific platform.
  </p>

  <p style="font-size: 15px; line-height: 1.6; color: #444; margin-top: 28px;">
    Talk soon,<br/>
    <strong>Nolan</strong><br/>
    <span style="color: #9a5c2e; font-size: 13px;">ClientSurge Systems</span>
  </p>

  <div style="border-top: 1px solid #e8ddd0; margin-top: 32px; padding-top: 16px;">
    <p style="font-size: 12px; color: #aaa; margin: 0;">
      ClientSurge Systems · nolan@clientsurgesystems.com<br/>
      Questions? Reply directly to this email.
    </p>
  </div>

</div>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client.email,
      from_name: 'Nolan @ ClientSurge Systems',
      subject: `📎 Your Webhook URL — Paste This Into Your Website`,
      body: emailBody,
    });

    return Response.json({ success: true, webhook_url: webhookUrl, sent_to: client.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});