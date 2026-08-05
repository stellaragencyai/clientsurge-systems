import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function safeResendFrom() {
  const configured = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return "ClientSurge Systems <system@clientsurgesystems.com>";
}

function prepFocusForIndustry(industrySlug = '') {
  const slug = String(industrySlug || '').toLowerCase();
  if (slug === 'roofing') return 'storm leads, roof repair leads, quote requests, missed inspection requests, and estimate follow-up';
  if (slug === 'hvac') return 'after-hours AC/heating leads, emergency calls, appointment booking, seasonal demand spikes, and maintenance plan opportunities';
  if (slug === 'dental') return 'new-patient calls, appointment requests, front desk overload, recall/follow-up, and missed patient inquiries';
  if (slug === 'med_spa' || slug === 'med-spa') return 'consultation requests, aesthetic treatment inquiries, missed DMs/calls, booking handoff, and lead nurture';
  if (slug === 'plumbing') return 'emergency leaks, drain repair, water heater calls, urgent missed calls, and dispatch handoff expectations';
  return 'lead capture, follow-up, booking handoff, and missed-call recovery';
}

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);
    const { email, full_name, business_name, scheduled_date, scheduled_time, industry_slug } = await req.json();

    if (!email || !full_name || !scheduled_date || !scheduled_time) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
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
    const prepFocus = prepFocusForIndustry(industry_slug);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return secureJson({ error: 'Resend credentials not configured' }, { status: 500 });
    }

    const emailBody = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #6b3f1f, #9a5c2e); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #f5e6d0; margin: 0; font-size: 24px;">How To Prepare For Your Free Automation Audit</h1>
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
        <li>Any notes about ${prepFocus}</li>
      </ol>
    </div>
    <p>We will use that information to tailor the audit around ${prepFocus}, then make the next steps as specific to your business as possible.</p>
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
        from: safeResendFrom(),
        to: [email],
        subject: `How to prepare for your ${formattedDate} Free Automation Audit`,
        html: emailBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return secureJson({ error: data.message || 'Email send failed' }, { status: 500 });
    }

    return secureJson({ success: true, email_id: data.id });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});