import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);
    const { email, full_name, business_name, scheduled_date, scheduled_time } = await req.json();

    if (!email || !full_name || !scheduled_date || !scheduled_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dateObj = new Date(`${scheduled_date}T12:00:00`);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const [hour, minute] = scheduled_time.split(':');
    const h = parseInt(hour, 10);
    const formattedTime = `${h > 12 ? h - 12 : h}:${minute} ${h >= 12 ? 'PM' : 'AM'} (Arizona Time)`;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return Response.json({ error: 'Resend credentials not configured' }, { status: 500 });
    }

    const emailBody = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #6b3f1f, #9a5c2e); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #f5e6d0; margin: 0; font-size: 24px;">How To Prepare For Your Demo</h1>
    <p style="color: rgba(245,230,208,0.75); margin: 8px 0 0;">ClientSurge Systems</p>
  </div>
  <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi <strong>${full_name}</strong>,</p>
    <p>Before we meet on <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong>, here are the three most helpful things to bring to the call.</p>
    <div style="background: #fdf8f0; border: 1px solid #c8965c; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <ol style="margin: 0; padding-left: 18px; line-height: 1.8; color: #444;">
        <li>Your current booking link or scheduling process</li>
        <li>A rough sense of how many leads you receive in a typical month</li>
        <li>The biggest bottleneck you want fixed first for ${business_name || 'your business'}</li>
      </ol>
    </div>
    <p>We will use that information to tailor the walkthrough, show the fastest automation wins, and make the demo as specific to your business as possible.</p>
    <p style="margin-top: 24px;">See you soon,<br/><strong>The ClientSurge Systems Team</strong></p>
    <p style="font-size: 12px; color: #999; margin-top: 24px;">Need help before the call? Reply to this email or call <a href="tel:+16025843227">(602) 584-3227</a></p>
  </div>
</body>
</html>`;

    const response = await resendFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ClientSurge Systems <system@clientsurgesystems.com>',
        to: [email],
        subject: `How to prepare for your ${formattedDate} demo`,
        html: emailBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.message || 'Email send failed' }, { status: 500 });
    }

    return Response.json({ success: true, email_id: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
