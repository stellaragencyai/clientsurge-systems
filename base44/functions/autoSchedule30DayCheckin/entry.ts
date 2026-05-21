import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { entity_id, data: client, old_data } = payload;

    // Only fire when status just changed TO 'Live'
    if (client.status !== 'Live' || old_data?.status === 'Live') {
      return secureJson({ skipped: true, reason: 'Status did not just change to Live' });
    }

    if (!client.email) {
      return secureJson({ error: 'Client has no email address' }, { status: 400 });
    }

    // Calculate 30-day date from today
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const reminderDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // 2 days before

    const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Build list of active systems for summary
    const activeSystems = [];
    if (client.step_twilio) activeSystems.push('Dedicated business phone number (Twilio)');
    if (client.step_lead_sources) activeSystems.push('Lead sources connected & flowing');
    if (client.step_instant_response) activeSystems.push('Instant SMS response system (fires in 60s)');
    if (client.step_followup_sequence) activeSystems.push('Multi-day follow-up sequence');
    if (client.step_missed_call) activeSystems.push('Missed call text-back');
    if (client.step_messages_customized) activeSystems.push('Custom branded messages');
    if (activeSystems.length === 0) activeSystems.push('Full automation system');

    const systemsList = activeSystems.map(s => `<li style="margin-bottom:6px;">✅ ${s}</li>`).join('');

    // ── Email to CLIENT ──────────────────────────────────────────
    const clientEmail = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">

  <div style="border-bottom:3px solid #9a5c2e;padding-bottom:20px;margin-bottom:28px;">
    <p style="font-size:13px;font-weight:700;color:#9a5c2e;text-transform:uppercase;letter-spacing:1px;margin:0;">ClientSurge Systems</p>
  </div>

  <p style="font-size:16px;margin-bottom:6px;">Hey ${client.owner_name || 'there'},</p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    Your system has officially been <strong>live for 30 days</strong> — and it's been working hard behind the scenes for you. 🎉
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    Here's a quick look at everything that's been running for <strong>${client.business_name}</strong>:
  </p>

  <div style="background:#f9f4ef;border-left:4px solid #9a5c2e;border-radius:6px;padding:16px 20px;margin:20px 0;">
    <p style="font-size:13px;font-weight:700;color:#9a5c2e;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Your Active Systems</p>
    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;color:#2d2d2d;">
      ${systemsList}
    </ul>
  </div>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    I'd love to jump on a quick 20-minute call to review your results, answer any questions, and map out what's next for your system.
  </p>

  <div style="text-align:center;margin:32px 0;">
    <a href="https://calendly.com/nolan-clientsurgesystems"
       style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:9999px;">
      📅 Book Your 30-Day Check-In Call
    </a>
  </div>

  <p style="font-size:14px;color:#888;text-align:center;margin-top:-16px;">
    <a href="https://calendly.com/nolan-clientsurgesystems" style="color:#9a5c2e;">https://calendly.com/nolan-clientsurgesystems</a>
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;margin-top:28px;">
    Looking forward to connecting,<br/>
    <strong>Nolan</strong><br/>
    <span style="color:#9a5c2e;font-size:13px;">ClientSurge Systems</span>
  </p>

  <div style="border-top:1px solid #e8ddd0;margin-top:32px;padding-top:16px;">
    <p style="font-size:12px;color:#aaa;margin:0;">
      ClientSurge Systems · nolan@clientsurgesystems.com<br/>
      Questions? Reply directly to this email.
    </p>
  </div>

</div>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client.email,
      from_name: 'Nolan @ ClientSurge Systems',
      subject: `🎉 Your System Has Been Live 30 Days — Let's Review Your Results`,
      body: clientEmail,
    });

    // ── Reminder Email to NOLAN (scheduled reminder note in email) ──
    // We send Nolan an email now that tells him to follow up on the exact reminder date
    const activeSummary = activeSystems.map(s => `• ${s}`).join('\n');

    const nolanReminderEmail = `
<p>Hi Nolan,</p>

<p><strong>${client.business_name}</strong> just went live today. Their 30-day check-in is coming up on <strong>${formatDate(thirtyDaysOut)}</strong>.</p>

<p>⚠️ <strong>Set a reminder for ${formatDate(reminderDate)}</strong> (2 days before) to prepare for the call.</p>

<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin:20px 0;">
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Client</td><td>${client.business_name} (${client.owner_name})</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Email</td><td>${client.email}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Phone</td><td>${client.phone || '—'}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Industry</td><td>${client.industry || '—'}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Monthly Rate</td><td>${client.monthly_rate ? '$' + client.monthly_rate + '/mo' : '—'}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">30-Day Check-In</td><td><strong>${formatDate(thirtyDaysOut)}</strong></td></tr>
</table>

<p><strong>What to review on the call:</strong></p>
<ul style="font-size:14px;line-height:1.8;">
  <li>Total leads captured in first 30 days</li>
  <li>Instant response open rate &amp; reply rate</li>
  <li>Follow-up sequence performance</li>
  <li>Any missed calls recovered</li>
  <li>Client satisfaction &amp; questions</li>
  <li>Upsell opportunity: plan upgrade or additional services</li>
</ul>

<p><strong>Active systems running for this client:</strong></p>
<pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:13px;">${activeSummary}</pre>

<p>The client has already received their 30-day email with your Calendly link to book the call.</p>

<p><a href="https://clientsurgesystems.com/admin/onboarding">View Client in Admin →</a></p>

<p>— ClientSurge Systems Automation</p>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'nolan@clientsurgesystems.com',
      from_name: 'ClientSurge Systems',
      subject: `📅 30-Day Check-In Reminder — ${client.business_name} (${formatDate(thirtyDaysOut)})`,
      body: nolanReminderEmail,
    });

    return secureJson({ success: true, checkin_date: thirtyDaysOut.toISOString(), reminder_date: reminderDate.toISOString() });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});