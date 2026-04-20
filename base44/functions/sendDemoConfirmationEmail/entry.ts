import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    <h1 style="color: #f5e6d0; margin: 0; font-size: 24px;">Demo Confirmed</h1>
    <p style="color: rgba(245,230,208,0.75); margin: 8px 0 0;">ClientSurge Systems</p>
  </div>
  <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi <strong>${full_name}</strong>,</p>
    <p>Your free 15-minute demo has been scheduled. Here are your details:</p>
    <div style="background: #fdf8f0; border: 1px solid #c8965c; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 0 0 8px;"><strong>Time:</strong> ${formattedTime}</p>
      <p style="margin: 0 0 8px;"><strong>Duration:</strong> 15 minutes</p>
      <p style="margin: 0;"><strong>Business:</strong> ${business_name || 'Your business'}</p>
    </div>
    <p><strong>What to expect:</strong></p>
    <ul style="color: #555; line-height: 1.8;">
      <li>Live walkthrough of your automation system</li>
      <li>Demo of instant lead response and follow-up</li>
      <li>Your personalized booking timeline</li>
      <li>Q&A about your specific challenges</li>
    </ul>
    <p>We'll send you a calendar invite and meeting link shortly.</p>
    <p style="margin-top: 24px;">Talk soon,<br/><strong>The ClientSurge Systems Team</strong></p>
    <p style="font-size: 12px; color: #999; margin-top: 24px;">Need to reschedule? Reply to this email or call <a href="tel:+16025874608">(602) 587-4608</a></p>
  </div>
</body>
</html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ClientSurge Systems <system@clientsurgesystems.com>',
        to: [email],
        subject: `Demo Confirmed - ${formattedDate} at ${formattedTime}`,
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
