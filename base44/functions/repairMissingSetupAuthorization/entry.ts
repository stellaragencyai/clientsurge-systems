import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { buildSignedSetupUrl } from '../_shared/setupLinkToken.ts';

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Request-ID': String(data.request_id || ''),
    },
  });
}

function isAdmin(user: any) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

function isProductionOrder(order: any) {
  return order?.payment_status === 'paid' &&
    !order?.dashboard_excluded &&
    !['smoke', 'demo', 'internal', 'qa'].includes(String(order?.environment || '').toLowerCase());
}

function getAppUrl() {
  return Deno.env.get('APP_URL') ||
    Deno.env.get('VITE_BASE44_APP_BASE_URL') ||
    'https://clientsurgesystems.com';
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: 'Forbidden — admin only', request_id: requestId }, 403);

    const body = await req.json().catch(() => ({}));
    const requestedOrderId = String(body.order_id || '').trim();

    let order: any = null;
    if (requestedOrderId) {
      order = await base44.asServiceRole.entities.Order.get(requestedOrderId).catch(() => null);
    } else {
      const orders = await base44.asServiceRole.entities.Order.list('-created_date', 500).catch(() => []);
      order = (Array.isArray(orders) ? orders : []).find(isProductionOrder) || null;
    }

    if (!order) return json({ error: 'No matching production paid order found', request_id: requestId }, 404);
    if (!isProductionOrder(order)) {
      return json({ error: 'Order is not a production-trusted paid order', order_id: order.id, request_id: requestId }, 400);
    }

    const accepted = await base44.asServiceRole.entities.SetupAuthorization.filter(
      { order_id: order.id, authorization_status: 'accepted' },
      '-created_date',
      1,
    ).catch(() => []);

    if (accepted?.length > 0) {
      return json({
        success: true,
        verified: true,
        action: 'none',
        order_id: order.id,
        authorization_id: accepted[0].id,
        accepted_at: accepted[0].accepted_at,
        accepted_by_email: accepted[0].accepted_by_email,
        request_id: requestId,
      });
    }

    const customerEmail = String(order.customer_email || '').trim().toLowerCase();
    if (!customerEmail) {
      return json({ error: 'Order is missing customer_email; setup authorization cannot be requested', order_id: order.id, request_id: requestId }, 422);
    }

    const setupUrl = await buildSignedSetupUrl(getAppUrl(), order.id, customerEmail);
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ error: 'RESEND_API_KEY missing', request_id: requestId }, 500);

    const fromRaw = Deno.env.get('RESEND_FROM_EMAIL') || 'system@clientsurgesystems.com';
    const from = fromRaw.includes('<') ? fromRaw : `ClientSurge Systems <${fromRaw}>`;
    const supportEmail = Deno.env.get('CLIENTSURGE_SUPPORT_EMAIL') || 'support@clientsurgesystems.com';
    const businessName = String(order.business_name || 'your business');

    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111827;">
      <h1 style="margin:0 0 12px;font-size:26px;color:#0F172A;">Setup authorization required</h1>
      <p style="font-size:15px;line-height:1.65;color:#334155;">Your ClientSurge order for <strong>${businessName}</strong> is paid and ready for onboarding. We cannot begin account configuration until you approve the setup scope.</p>
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;padding:20px;margin:22px 0;">
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#1E3A8A;">Review the authorized setup actions and provide approval using the secure link below.</p>
        <a href="${setupUrl}" style="display:inline-block;background:#0F172A;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:700;">Review and authorize setup →</a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#64748B;">This secure link is tied to order ${order.id}. Questions? Contact ${supportEmail}.</p>
    </div>`;

    const text = [
      'Setup authorization required',
      '',
      `Your ClientSurge order for ${businessName} is paid and ready for onboarding.`,
      'We cannot begin configuration until you approve the setup scope.',
      '',
      `Review and authorize setup: ${setupUrl}`,
      '',
      `Questions? Contact ${supportEmail}`,
    ].join('\n');

    const sendResponse = await resendFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        reply_to: supportEmail,
        to: customerEmail,
        subject: 'Action required: authorize your ClientSurge setup',
        html,
        text,
      }),
    });

    if (!sendResponse.ok) {
      const detail = await sendResponse.text().catch(() => String(sendResponse.status));
      throw new Error(`Resend error ${sendResponse.status}: ${detail}`);
    }

    const sentAt = new Date().toISOString();
    await base44.asServiceRole.entities.CommunicationEvent.create({
      event_type: 'setup_authorization_requested',
      channel: 'email',
      status: 'sent',
      environment: 'production',
      order_id: order.id,
      client_id: order.client_id || '',
      client_project_id: order.client_project_id || '',
      recipient: customerEmail,
      occurred_at: sentAt,
      metadata: { request_id: requestId, source: 'repairMissingSetupAuthorization' },
    }).catch((error: Error) => console.warn('[repairMissingSetupAuthorization] CommunicationEvent write failed:', error.message));

    const sessions = await base44.asServiceRole.entities.ActivationWizardSession.filter(
      { order_id: order.id }, '-created_date', 1,
    ).catch(() => []);

    if (sessions?.length > 0) {
      await base44.asServiceRole.entities.ActivationWizardSession.update(sessions[0].id, {
        status: 'awaiting_setup_authorization',
        last_updated_at: sentAt,
      }).catch((error: Error) => console.warn('[repairMissingSetupAuthorization] Session update failed:', error.message));
    }

    return json({
      success: true,
      verified: false,
      action: 'authorization_email_sent',
      order_id: order.id,
      sent_to: customerEmail,
      sent_at: sentAt,
      request_id: requestId,
    });
  } catch (error) {
    console.error('[repairMissingSetupAuthorization]', error?.message || error, `request_id=${requestId}`);
    return json({ error: error?.message || 'Unknown error', request_id: requestId }, 500);
  }
});
