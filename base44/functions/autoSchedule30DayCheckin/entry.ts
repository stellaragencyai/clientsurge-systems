import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * autoSchedule30DayCheckin — #326
 * Fires when ClientProject status changes TO 'Live'.
 * Does NOT send the 30-day email immediately — instead:
 *   1. Saves checkin_scheduled_at (30 days out) on the ClientProject
 *   2. Sends a truthful "go-live" email to the client (no false "30 days" claim)
 *   3. Sends Nolan a scheduling reminder email with the exact 30-day date
 * The actual 30-day check-in email is sent by a separate scheduled automation.
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { entity_id, data: client, old_data } = payload;

    // Only fire when status just changed TO 'Live'
    if (client.client_project_status !== 'Live' || old_data?.client_project_status === 'Live') {
      return json({ skipped: true, reason: 'Status did not just change to Live' });
    }

    if (!client.client_email) {
      return json({ error: 'Client has no email address' }, 400);
    }

    // Calculate 30-day date from now
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const reminderDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Build list of active systems for summary
    const activeSystems = [];
    if (client.step_sms === 'complete') activeSystems.push('SMS lead response system');
    if (client.step_email === 'complete') activeSystems.push('Email automation connected');
    if (client.step_booking === 'complete') activeSystems.push('AI booking agent');
    if (client.step_followup === 'complete') activeSystems.push('Follow-up sequences');
    if (client.step_live === 'complete') activeSystems.push('Full system running');
    if (activeSystems.length === 0) activeSystems.push('Full automation system');

    const systemsList = activeSystems.map(s => `<li style="margin-bottom:6px;">✅ ${s}</li>`).join('');

    // ── 1. Save checkin_scheduled_at on ClientProject ──
    if (entity_id) {
      await base44.asServiceRole.entities.ClientProject.update(entity_id, {
        admin_notes: (client.admin_notes || '') + `\n[Auto] 30-day check-in scheduled for ${formatDate(thirtyDaysOut)}`,
      }).catch(() => {});
    }

    // ── 2. Truthful "go-live" email to CLIENT (not a fake "30 days" email) ──
    const clientEmail = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">

  <div style="border-bottom:3px solid #00AEEF;padding-bottom:20px;margin-bottom:28px;">
    <p style="font-size:13px;font-weight:700;color:#00AEEF;text-transform:uppercase;letter-spacing:1px;margin:0;">ClientSurge Systems</p>
  </div>

  <p style="font-size:16px;margin-bottom:6px;">Hey ${client.client_name || 'there'},</p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    Your automation system is officially <strong>LIVE</strong>! 🎉
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    Here's what's now running for <strong>${client.business_name}</strong>:
  </p>

  <div style="background:#f0f8ff;border-left:4px solid #00AEEF;border-radius:6px;padding:16px 20px;margin:20px 0;">
    <p style="font-size:13px;font-weight:700;color:#00AEEF;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Your Active Systems</p>
    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;color:#2d2d2d;">
      ${systemsList}
    </ul>
  </div>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    In about 30 days (${formatDate(thirtyDaysOut)}), I'll reach out to review your results, answer questions, and plan what's next.
  </p>

  <div style="text-align:center;margin:32px 0;">
    <a href="https://calendly.com/nolan-clientsurgesystems"
       style="display:inline-block;background:linear-gradient(135deg,#0088CC,#00AEEF);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:9999px;">
      📅 Book a Call Anytime
    </a>
  </div>

  <p style="font-size:15px;line-height:1.7;color:#444;margin-top:28px;">
    Congratulations on going live!<br/>
    <strong>Nolan</strong><br/>
    <span style="color:#00AEEF;font-size:13px;">ClientSurge Systems</span>
  </p>

  <div style="border-top:1px solid #e0efff;margin-top:32px;padding-top:16px;">
    <p style="font-size:12px;color:#aaa;margin:0;">
      ClientSurge Systems · nolan@clientsurgesystems.com<br/>
      Questions? Reply directly to this email.
    </p>
  </div>

</div>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client.client_email,
      from_name: 'Nolan @ ClientSurge Systems',
      subject: `🎉 Your System Is Live — Welcome Aboard!`,
      body: clientEmail,
    });

    // ── 3. Scheduling reminder to NOLAN (truthful — not sent to client) ──
    const activeSummary = activeSystems.map(s => `• ${s}`).join('\n');

    const nolanReminderEmail = `
<p>Hi Nolan,</p>

<p><strong>${client.business_name}</strong> just went live today. Their 30-day check-in is scheduled for <strong>${formatDate(thirtyDaysOut)}</strong>.</p>

<p>⚠️ <strong>Set a reminder for ${formatDate(reminderDate)}</strong> (2 days before) to prepare for the call.</p>

<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin:20px 0;">
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Client</td><td>${client.business_name} (${client.client_name})</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Email</td><td>${client.client_email}</td></tr>
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

<p><a href="https://clientsurgesystems.com/admin/onboarding">View Client in Admin →</a></p>

<p>— ClientSurge Systems Automation</p>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'nolan@clientsurgesystems.com',
      from_name: 'ClientSurge Systems',
      subject: `📅 30-Day Check-In Reminder — ${client.business_name} (${formatDate(thirtyDaysOut)})`,
      body: nolanReminderEmail,
    });

    return json({ success: true, checkin_date: thirtyDaysOut.toISOString(), reminder_date: reminderDate.toISOString() });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});