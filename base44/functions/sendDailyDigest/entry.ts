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

Deno.serve(async (req) => {
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

    const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const notificationEmail =
      settings?.lead_notification_email ||
      Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ||
      Deno.env.get('ADMIN_EMAIL');

    if (!notificationEmail) {
      return secureJson(
        { error: 'No admin notification email configured. Set AdminSettings.lead_notification_email or ADMIN_NOTIFICATION_EMAIL secret.' },
        { status: 400 }
      );
    }

    // ── DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
    // Daily digest runs across all leads; we check the first deployment that has daily_digest module
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    try {
      const allDeployments = await base44.asServiceRole.entities.ClientDeployment.filter(
        { deployment_status: 'live' }, '-created_date', 50
      );
      // Find the first deployment that has daily_digest in activated_modules
      const liveDep = (allDeployments || []).find(d => (d.activated_modules || []).includes('daily_digest'));
      if (liveDep) {
        const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
          deployment_id: liveDep.id, module_key: 'daily_digest'
        });
        if (permRes.data?.authorized !== true) {
          await base44.asServiceRole.functions.invoke('logAutomationExecution', {
            client_deployment_id: liveDep.id, client_id: liveDep.client_id,
            module_key: 'daily_digest', trigger_event: 'scheduled_daily',
            execution_status: 'blocked',
            error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
            error_code: permRes.data?.reason || 'module_not_authorized',
            started_at: new Date(_obsStartTime).toISOString(),
            completed_at: new Date().toISOString(),
            execution_time_ms: Date.now() - _obsStartTime,
          }).catch(() => {});
          return secureJson({ blocked: true, reason: permRes.data?.reason, message: 'daily_digest not authorized' }, { status: 403 });
        }
        _obsCtx = { deployment_id: liveDep.id, client_id: liveDep.client_id, module_key: 'daily_digest', trigger_event: 'scheduled_daily' };
        // Log digest_started
        try {
          await base44.asServiceRole.functions.invoke('logAutomationExecution', {
            ..._obsCtx,
            execution_status: 'queued',
            response_data: JSON.stringify({ event: 'digest_started', deployment_count: allDeployments?.length || 0, timestamp: new Date(_obsStartTime).toISOString() }),
          });
        } catch (_) {}
      } else {
        // No live deployment with daily_digest — log digest_skipped
        try {
          await base44.asServiceRole.functions.invoke('logAutomationExecution', {
            module_key: 'daily_digest', trigger_event: 'scheduled_daily',
            execution_status: 'blocked',
            error_message: 'No live deployment with daily_digest module activated',
            error_code: 'no_authorized_deployment',
            response_data: JSON.stringify({ event: 'digest_skipped', deployment_count: allDeployments?.length || 0, reason: 'no_live_deployment_with_daily_digest' }),
          });
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[sendDailyDigest] Observability init failed:', err.message);
    }

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
    };

    // Log digest_generated
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'running',
          response_data: JSON.stringify({ event: 'digest_generated', ...digestMetadata }),
        });
      } catch (_) {}
    }

    const body = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
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

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
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
        subject: `Daily Lead Digest — ${newToday} new, ${hotLeads.length} hot, ${overdueFollowUp.length} overdue`,
        html: body,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `Resend error ${res.status}`);
    }

    const result = await res.json().catch(() => ({}));

    // ── DEPLOYMENT OBSERVABILITY: Log successful execution ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'completed',
          external_provider_reference: result?.id || null,
          execution_time_ms: Date.now() - _obsStartTime,
          response_data: JSON.stringify({ event: 'digest_sent', ...digestMetadata, provider_message_id: result?.id }),
        });
      } catch (_) {}
    }

    return secureJson({ success: true, stats: { newToday, hot: hotLeads.length, overdue: overdueFollowUp.length, replied: replied.length } });
  } catch (error) {
    console.error('[sendDailyDigest] error:', error);
    // ── DEPLOYMENT OBSERVABILITY: Log failed execution + trigger health check ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'failed',
          error_message: error.message,
          error_code: error.message.includes('Resend') ? 'resend_api_error' : 'digest_send_failed',
          execution_time_ms: Date.now() - _obsStartTime,
          response_data: JSON.stringify({ event: 'digest_failed', error: error.message }),
        });
        await base44.asServiceRole.functions.invoke('calculateDeploymentHealth', { deployment_id: _obsCtx.deployment_id });
      } catch (_) {}
    }
    return secureJson({ error: error.message }, { status: 500 });
  }
});