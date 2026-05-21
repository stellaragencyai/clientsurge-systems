// redeployed 2026-05-02
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";

// Inline: allow scheduler/automation calls that have no authenticated user
function allowAnonymousAutomation(req) {
  const ua = req.headers.get('user-agent') || '';
  const auth = req.headers.get('authorization') || '';
  return ua.includes('base44') || auth.startsWith('Bearer ');
}

const LEAD_LIMIT = 5000;
const BUSINESS_TZ = 'America/Phoenix';
const PHOENIX_OFFSET = '-07:00';

function getPhoenixDayStart(reference = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return new Date(`${year}-${month}-${day}T00:00:00${PHOENIX_OFFSET}`);
}

function formatPhoenixDate(reference = new Date()) {
  return reference.toLocaleDateString('en-US', { timeZone: BUSINESS_TZ });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Allow scheduled runs (no user) or admin users
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!user && !allowAnonymousAutomation(req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const notificationEmail =
      settings?.lead_notification_email ||
      Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ||
      Deno.env.get('ADMIN_EMAIL');

    if (!notificationEmail) {
      console.error(
        '[sendDailyDigest] No admin email resolved. ' +
        `AdminSettings.lead_notification_email=${settings?.lead_notification_email ?? 'not set'}, ` +
        `ADMIN_NOTIFICATION_EMAIL env=${Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'not set'}, ` +
        `ADMIN_EMAIL env=${Deno.env.get('ADMIN_EMAIL') ?? 'not set'}`
      );
      return Response.json(
        { error: 'No admin notification email configured. Set AdminSettings.lead_notification_email or ADMIN_NOTIFICATION_EMAIL secret.' },
        { status: 400 }
      );
    }

    const emailSource =
      settings?.lead_notification_email ? 'AdminSettings' :
      Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ? 'ADMIN_NOTIFICATION_EMAIL env' :
      'ADMIN_EMAIL env';
    console.log(`[sendDailyDigest] Resolved notification email from: ${emailSource}`);

    const allLeads = await base44.asServiceRole.entities.Leads.list('-updated_date', LEAD_LIMIT);
    const now = Date.now();
    const dayMs = 86400000;
    const startOfToday = getPhoenixDayStart();

    const newToday = allLeads.filter(l => new Date(l.created_date).getTime() >= startOfToday.getTime()).length;
    const hotLeads = allLeads.filter(l => l.activation_priority === 'Hot' && l.status !== 'Booked' && l.status !== 'Closed');
    const overdueFollowUp = allLeads.filter(l => {
      const isActive = !['Booked', 'Closed'].includes(l.status);
      const nextFollowUpAt = l.next_follow_up_at ? new Date(l.next_follow_up_at).getTime() : null;
      if (nextFollowUpAt) {
        return isActive && nextFollowUpAt <= now;
      }
      const noContact = !l.last_contacted_at || (now - new Date(l.last_contacted_at).getTime()) > dayMs;
      return isActive && noContact;
    });
    const replied = allLeads.filter(l => l.status === 'Replied');

    const hotRows = hotLeads.slice(0, 5).map(l =>
      `<tr><td style="padding:6px 12px;">${l.full_name}</td><td style="padding:6px 12px;">${l.business_name}</td><td style="padding:6px 12px;">${l.status}</td><td style="padding:6px 12px;">${l.lead_score ?? 0}</td></tr>`
    ).join('');

    const body = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#9a5c2e;">📊 Daily Lead Digest — ${formatPhoenixDate()}</h2>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
    <div style="background:#eff6ff;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:32px;font-weight:bold;color:#1d4ed8;">${newToday}</div>
      <div style="font-size:12px;color:#3b82f6;">New leads today</div>
    </div>
    <div style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:32px;font-weight:bold;color:#dc2626;">${hotLeads.length}</div>
      <div style="font-size:12px;color:#ef4444;">Hot leads needing outreach</div>
    </div>
    <div style="background:#fffbeb;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:32px;font-weight:bold;color:#d97706;">${overdueFollowUp.length}</div>
      <div style="font-size:12px;color:#f59e0b;">Overdue follow-ups</div>
    </div>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:32px;font-weight:bold;color:#16a34a;">${replied.length}</div>
      <div style="font-size:12px;color:#22c55e;">Replied (need qualification)</div>
    </div>
  </div>

  ${hotLeads.length > 0 ? `
  <h3 style="color:#7a4825;">🔥 Top Hot Leads — Act Now</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:#fef3e2;">
      <th style="padding:8px 12px;text-align:left;">Name</th>
      <th style="padding:8px 12px;text-align:left;">Business</th>
      <th style="padding:8px 12px;text-align:left;">Status</th>
      <th style="padding:8px 12px;text-align:left;">Score</th>
    </tr></thead>
    <tbody>${hotRows}</tbody>
  </table>
  ` : ''}

  <p style="color:#6b7280;font-size:12px;margin-top:24px;">
    This digest is sent daily at 8am. Manage leads at your admin dashboard.
  </p>
</div>`;

    console.log(`[sendDailyDigest] Preparing digest — total leads: ${allLeads.length}, new today: ${newToday}, hot: ${hotLeads.length}, overdue: ${overdueFollowUp.length}, replied: ${replied.length}`);

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    }
    const fromEmail = settings?.resend_from_email || Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@clientsurgesystems.com';

    try {
      const res = await resendFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: notificationEmail,
          subject: `Daily Lead Digest — ${newToday} new, ${hotLeads.length} hot, ${overdueFollowUp.length} overdue`,
          html: body,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Resend error ${res.status}`);
      }
      console.log(`[sendDailyDigest] ✓ Digest sent successfully to ${notificationEmail}`);
    } catch (emailError) {
      console.error(`[sendDailyDigest] ✗ SendEmail failed: ${emailError.message}`);
      throw emailError;
    }

    return Response.json({ success: true, stats: { newToday, hot: hotLeads.length, overdue: overdueFollowUp.length, replied: replied.length } });
  } catch (error) {
    console.error('[sendDailyDigest] sendDailyDigest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});