import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

const MAX_RECIPIENTS = 100;

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

function normalizeRecipients(recipients: unknown) {
  return Array.isArray(recipients)
    ? recipients
        .map((email) => String(email || '').trim().toLowerCase())
        .filter((email) => email.includes('@'))
    : [];
}

async function logBroadcast(base44: any, payload: Record<string, unknown>) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    channel: 'email',
    direction: 'outbound',
    event_type: payload.event_type || 'email_sent',
    provider: 'resend',
    status: payload.status || 'sent',
    subject: payload.subject,
    message_body: payload.message_body,
    metadata_json: JSON.stringify(payload.metadata || {}),
    environment: payload.environment || 'production',
    dashboard_truth_status: payload.dashboard_truth_status || 'trusted',
  }).catch((error: any) => {
    console.error('[resendBroadcast] failed to log CommunicationEvent', error?.message || error);
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      subject,
      html_body,
      scheduled_at,
      campaign_name,
      segment_filter,
      dry_run = true,
      confirm_send = false,
    } = body;
    const recipients = normalizeRecipients(body.recipients);

    if (!recipients.length || !subject || !html_body) {
      return json({ success: false, error: 'Recipients, subject, and body required' }, { status: 400 });
    }

    if (recipients.length > MAX_RECIPIENTS) {
      return json(
        { success: false, error: `Recipient limit exceeded. Max ${MAX_RECIPIENTS} per broadcast.` },
        { status: 400 }
      );
    }

    const sendGateEnabled = String(Deno.env.get('BROADCAST_SEND_ENABLED') || '').toLowerCase() === 'true';
    const shouldSend = dry_run !== true && confirm_send === true && sendGateEnabled;

    if (!shouldSend) {
      await logBroadcast(base44, {
        event_type: 'email_skipped',
        status: 'processed',
        subject,
        message_body: '[dry-run or gated broadcast] body omitted from send',
        environment: 'internal',
        dashboard_truth_status: 'warning',
        metadata: {
          campaign_name,
          recipient_count: recipients.length,
          scheduled_at,
          segment_filter,
          dry_run: dry_run === true,
          confirm_send,
          send_gate_enabled: sendGateEnabled,
          skipped_reason: dry_run === true ? 'dry_run' : !confirm_send ? 'confirm_send_required' : 'broadcast_send_gate_disabled',
          requested_by: user.email || user.id || 'admin',
        },
      });

      return json({
        success: true,
        sent: false,
        dry_run: dry_run === true,
        recipient_count: recipients.length,
        message: 'Broadcast was not sent. Dry-run/gate protection is active.',
      });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return json({ success: false, error: 'Resend API key not configured' }, { status: 500 });
    }

    const senderEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@clientsurgesystems.com';
    const payload: Record<string, unknown> = {
      from: `ClientSurge Systems <${senderEmail}>`,
      subject,
      html: html_body,
      to: recipients,
      reply_to: Deno.env.get('ADMIN_EMAIL') || 'support@clientsurgesystems.com',
    };

    if (scheduled_at) payload.scheduled_at = scheduled_at;

    const response = await resendFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      await logBroadcast(base44, {
        event_type: 'email_failed',
        status: 'failed',
        subject,
        message_body: '[failed broadcast] body omitted from dashboard log',
        dashboard_truth_status: 'blocked',
        metadata: {
          campaign_name,
          recipient_count: recipients.length,
          scheduled_at,
          segment_filter,
          error: data,
          requested_by: user.email || user.id || 'admin',
        },
      });
      return json({ success: false, error: 'Failed to send broadcast', details: data }, { status: 502 });
    }

    await logBroadcast(base44, {
      event_type: 'email_sent',
      status: 'sent',
      subject,
      message_body: '[broadcast sent] body omitted from dashboard log',
      dashboard_truth_status: 'trusted',
      metadata: {
        campaign_name,
        recipient_count: recipients.length,
        scheduled_at,
        segment_filter,
        broadcast_id: data.id,
        requested_by: user.email || user.id || 'admin',
      },
    });

    return json({
      success: true,
      sent: true,
      broadcast_id: data.id,
      recipient_count: recipients.length,
      scheduled: Boolean(scheduled_at),
      message: `Broadcast ${scheduled_at ? 'scheduled' : 'sent'} to ${recipients.length} recipients`,
    });
  } catch (error: any) {
    console.error('[resendBroadcast]', error?.message || error);
    return json({ success: false, error: error?.message || 'Broadcast failed' }, { status: 500 });
  }
});
