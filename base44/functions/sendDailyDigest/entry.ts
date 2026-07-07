import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function allowAnonymousAutomation(req) {
  const ua = req.headers.get('user-agent') || '';
  const auth = req.headers.get('authorization') || '';
  const sharedSecret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (sharedSecret && auth.includes(`Bearer ${sharedSecret}`)) return true;
  if (req.headers.get('x-internal') === 'true') return true;
  return ua.includes('base44') || ua.includes('Base44') || auth.startsWith('Bearer ');
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

/**
 * Creates a SystemExecutionLog record directly via the entity SDK.
 * This replaces the old logAutomationExecution calls that required client_deployment_id.
 */
async function logSystemEvent(base44, params) {
  try {
    const log = await base44.asServiceRole.entities.SystemExecutionLog.create({
      job_key: 'daily_business_digest',
      job_name: 'Daily Business Digest',
      execution_status: params.execution_status,
      trigger_event: params.trigger_event || 'scheduled_daily',
      started_at: params.started_at || new Date().toISOString(),
      completed_at: params.completed_at || null,
      execution_time_ms: params.execution_time_ms || null,
      recipient: params.recipient || null,
      recipient_count: params.recipient_count || 0,
      deployment_count: params.deployment_count || 0,
      lead_count: params.lead_count || 0,
      error_message: params.error_message || null,
      error_code: params.error_code || null,
      metadata: params.metadata || null,
    });
    return log;
  } catch (err) {
    console.warn('[sendDailyDigest] SystemExecutionLog creation failed:', err.message);
    return null;
  }
}

Deno.serve(async (req) => {
  const _obsStartTime = Date.now();
  const _startedAt = new Date(_obsStartTime).toISOString();
  try {
    if (req.method !== 'POST') {
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return secureJson({ error: 'Forbidden' }, { status: 403 });
    }
    if (!user && !allowAnonymousAutomation(req)) {
      return secureJson({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;

    const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const notificationEmail =
      settings?.lead_notification_email ||
      Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ||
      Deno.env.get('ADMIN_EMAIL');

    // ── Log digest_started ──
    await logSystemEvent(base44, {
      execution_status: 'running',
      trigger_event: dryRun ? 'manual_test' : 'scheduled_daily',
      started_at: _startedAt,
      metadata: { event: 'digest_started', dry_run: dryRun, timestamp: _startedAt },
    });

    if (!notificationEmail) {
      // ── Log digest_skipped — no recipient configured ──
      await logSystemEvent(base44, {
        execution_status: 'skipped',
        trigger_event: dryRun ? 'manual_test' : 'scheduled_daily',
        started_at: _startedAt,
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - _obsStartTime,
        error_message: 'No admin notification email configured. Set AdminSettings.lead_notification_email or ADMIN_NOTIFICATION_EMAIL secret.',
        error_code: 'config_missing',
        metadata: { event: 'digest_skipped', reason: 'no_recipient_email', dry_run: dryRun },
      });
      return secureJson(
        { skipped: true, reason: 'no_recipient_email', message: 'No admin notification email configured.' },
        { status: 400 }
      );
    }

    // ── Resolve deployments ──
    let deploymentCount = 0;
    let liveDep = null;
    try {
      const allDeployments = await base44.asServiceRole.entities.ClientDeployment.filter(
        { deployment_status: 'live' }, '-created_date', 50
      );
      deploymentCount = allDeployments?.length || 0;
      liveDep = (allDeployments || []).find(d => (d.activated_modules || []).includes('daily_digest'));

      if (liveDep) {
        const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
          deployment_id: liveDep.id, module_key: 'daily_digest'
        });
        if (permRes.data?.authorized !== true) {
          // ── Log digest_skipped — module not authorized ──
          await logSystemEvent(base44, {
            execution_status: 'skipped',
            trigger_event: dryRun ? 'manual_test' : 'scheduled_daily',
            started_at: _startedAt,
            completed_at: new Date().toISOString(),
            execution_time_ms: Date.now() - _obsStartTime,
            recipient: notificationEmail,
            deployment_count: deploymentCount,
            error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
            error_code: permRes.data?.reason || 'module_not_authorized',
            metadata: { event: 'digest_skipped', reason: 'module_not_authorized', dry_run: dryRun },
          });
          return secureJson({ skipped: true, reason: permRes.data?.reason, message: 'daily_digest not authorized' }, { status: 403 });
        }
      } else {
        // ── Log digest_skipped — no live deployment with daily_digest ──
        await logSystemEvent(base44, {
          execution_status: 'skipped',
          trigger_event: dryRun ? 'manual_test' : 'scheduled_daily',
          started_at: _startedAt,
          completed_at: new Date().toISOString(),
          execution_time_ms: Date.now() - _obsStartTime,
          recipient: notificationEmail,
          deployment_count: deploymentCount,
          error_message: 'No live deployment with daily_digest module activated',
          error_code: 'no_authorized_deployment',
          metadata: { event: 'digest_skipped', reason: 'no_live_deployment_with_daily_digest', dry_run: dryRun },
        });
        return secureJson({ skipped: true, reason: 'no_live_deployment_with_daily_digest', deployment_count: deploymentCount }, { status: 200 });
      }
    } catch (err) {
      console.warn('[sendDailyDigest] Deployment resolution failed:', err.message);
      // Continue — we can still generate a digest from all leads
    }

    // ── Fetch leads and compute stats ──
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

    const digestMetadata = {
      lead_count: allLeads.length,
      new_today: newToday,
      hot_leads: hotLeads.length,
      overdue_follow_ups: overdueFollowUp.length,
      replied: replied.length,
      recipient: notificationEmail,
      dry_run: dryRun,
    };

    // ── Log digest_generated ──
    await logSystemEvent(base44, {
      execution_status: 'running',
      trigger_event: dryRun ? 'manual_test' : 'scheduled_daily',
      started_at: _startedAt,
      recipient: notificationEmail,
      recipient_count: 1,
      deployment_count: deploymentCount,
      lead_count: allLeads.length,
      metadata: { event: 'digest_generated', ...digestMetadata },
    });

    const subject = `Daily Lead Digest — ${newToday} new, ${hotLeads.length} hot, ${overdueFollowUp.length} overdue${dryRun ? ' [DRY RUN]' : ''}`;

    const body_html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  ${dryRun ? '<p style="background:#fef3c7;color:#92400e;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:bold;text-align:center;">⚠️ DRY RUN — No email was sent. This is a test payload.</p>' : ''}
  <h2 style="color:#003B8F;">📊 Daily Lead Digest — ${formatPhoenixDate()}</h2>
  
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
  <h3 style="color:#003B8F;">🔥 Top Hot Leads — Act Now</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:#eff6ff;">
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

    // ── DRY RUN: return payload without sending ──
    if (dryRun) {
      await logSystemEvent(base44, {
        execution_status: 'test_mode',
        trigger_event: 'manual_test',
        started_at: _startedAt,
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - _obsStartTime,
        recipient: notificationEmail,
        recipient_count: 1,
        deployment_count: deploymentCount,
        lead_count: allLeads.length,
        metadata: { event: 'digest_generated', ...digestMetadata, dry_run: true },
      });
      return secureJson({
        dry_run: true,
        email_sent: false,
        recipient: notificationEmail,
        subject,
        html_preview: body_html.substring(0, 500) + '...',
        stats: { newToday, hot: hotLeads.length, overdue: overdueFollowUp.length, replied: replied.length, total: allLeads.length },
        log_created: true,
      });
    }

    // ── REAL SEND ──
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      await logSystemEvent(base44, {
        execution_status: 'failed',
        trigger_event: 'scheduled_daily',
        started_at: _startedAt,
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - _obsStartTime,
        recipient: notificationEmail,
        lead_count: allLeads.length,
        error_message: 'RESEND_API_KEY not set',
        error_code: 'config_missing',
        metadata: { event: 'digest_failed', reason: 'resend_key_missing', ...digestMetadata },
      });
      return secureJson({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    }
    const fromEmail = settings?.resend_from_email || Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@clientsurgesystems.com';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: notificationEmail,
        subject,
        html: body_html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = err?.message || `Resend error ${res.status}`;
      await logSystemEvent(base44, {
        execution_status: 'failed',
        trigger_event: 'scheduled_daily',
        started_at: _startedAt,
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - _obsStartTime,
        recipient: notificationEmail,
        lead_count: allLeads.length,
        error_message: errMsg,
        error_code: 'resend_api_error',
        metadata: { event: 'digest_failed', resend_status: res.status, ...digestMetadata },
      });
      throw new Error(errMsg);
    }

    const result = await res.json().catch(() => ({}));

    // ── Log digest_sent ──
    await logSystemEvent(base44, {
      execution_status: 'completed',
      trigger_event: 'scheduled_daily',
      started_at: _startedAt,
      completed_at: new Date().toISOString(),
      execution_time_ms: Date.now() - _obsStartTime,
      recipient: notificationEmail,
      recipient_count: 1,
      deployment_count: deploymentCount,
      lead_count: allLeads.length,
      metadata: { event: 'digest_sent', provider_message_id: result?.id, ...digestMetadata },
    });

    return secureJson({
      success: true,
      email_sent: true,
      provider_message_id: result?.id,
      stats: { newToday, hot: hotLeads.length, overdue: overdueFollowUp.length, replied: replied.length, total: allLeads.length },
      log_created: true,
    });
  } catch (error) {
    console.error('[sendDailyDigest] error:', error);
    // ── Log digest_failed ──
    await logSystemEvent(base44, {
      execution_status: 'failed',
      trigger_event: 'scheduled_daily',
      started_at: _startedAt,
      completed_at: new Date().toISOString(),
      execution_time_ms: Date.now() - _obsStartTime,
      error_message: error.message,
      error_code: error.message.includes('Resend') ? 'resend_api_error' : 'digest_send_failed',
      metadata: { event: 'digest_failed', error: error.message, dry_run: dryRun },
    });
    return secureJson({ error: error.message }, { status: 500 });
  }
});