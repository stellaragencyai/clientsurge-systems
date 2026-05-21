import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);
    const { full_name, business_name, email, phone, scheduled_date, scheduled_time, biggest_issue, industry } = await req.json();

    if (!full_name || !email || !scheduled_date || !scheduled_time) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'system@clientsurgesystems.com';

    if (!resendApiKey) {
      return secureJson({ error: 'Resend credentials not configured' }, { status: 500 });
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
    const formattedTime = `${h > 12 ? h - 12 : h}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;

    const emailBody = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a1510; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #c8965c; margin: 0; font-size: 22px;">New Demo Booked</h1>
  </div>
  <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <div style="background: #fdf8f0; border-left: 4px solid #c8965c; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #6b3f1f;">${formattedDate} at ${formattedTime}</p>
    </div>
    <h3 style="color: #333; margin-top: 0;">Contact Info</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #666; width: 140px;">Name</td><td style="padding: 6px 0; font-weight: 600;">${full_name}</td></tr>
      <tr><td style="padding: 6px 0; color: #666;">Business</td><td style="padding: 6px 0; font-weight: 600;">${business_name || 'Not provided'}</td></tr>
      <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding: 6px 0; color: #666;">Phone</td><td style="padding: 6px 0;"><a href="tel:${phone}">${phone || 'Not provided'}</a></td></tr>
      <tr><td style="padding: 6px 0; color: #666;">Industry</td><td style="padding: 6px 0;">${industry || 'Not provided'}</td></tr>
      <tr><td style="padding: 6px 0; color: #666;">Challenge</td><td style="padding: 6px 0;">${biggest_issue || 'Not provided'}</td></tr>
    </table>
    <p style="margin-top: 24px; font-size: 13px; color: #888;">Add this to your calendar and prepare for their specific challenge.</p>
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
        to: [adminEmail],
        subject: `New Demo: ${business_name || full_name} - ${formattedDate} at ${formattedTime}`,
        html: emailBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return secureJson({ error: data.message || 'Email send failed' }, { status: 500 });
    }

    return secureJson({ success: true });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
