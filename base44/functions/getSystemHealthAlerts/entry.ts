import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns real-time health alerts for a specific order
 * Checks Twilio, Resend, and webhook delivery status
 */

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('order_id');
    const clientId = url.searchParams.get('client_id');

    if (!orderId && !clientId) {
      return Response.json({ error: 'order_id or client_id required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const alerts = [];

    // Fetch order/client config
    let config = null;
    if (orderId) {
      const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
      config = orders?.[0]?.install_configuration;
    }

    if (!config && clientId) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
      config = clients?.[0]?.install_configuration;
    }

    // Check Twilio delivery in last 24h
    const twilioEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider: 'twilio', created_date: { $gte: new Date(Date.now() - 86400000).toISOString() } },
      '-created_date',
      100
    );

    const twilioFailureRate = twilioEvents.length > 0
      ? (twilioEvents.filter(e => e.status === 'failed').length / twilioEvents.length)
      : 0;

    if (twilioFailureRate > 0.05) { // >5% failure rate
      alerts.push({
        id: 'twilio_failures',
        severity: twilioFailureRate > 0.15 ? 'critical' : 'warning',
        title: 'SMS Delivery Issues',
        message: `${Math.round(twilioFailureRate * 100)}% of SMS messages failed in the last 24 hours. Check your Twilio account.`,
        action: 'Review SMS Status',
        action_url: '/portal/sms-logs',
      });
    }

    // Check Resend delivery in last 24h
    const resendEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider: 'resend', created_date: { $gte: new Date(Date.now() - 86400000).toISOString() } },
      '-created_date',
      100
    );

    const resendBounces = resendEvents.filter(e => e.event_type === 'email_bounced').length;
    if (resendBounces > 5) {
      alerts.push({
        id: 'email_bounces',
        severity: 'warning',
        title: 'Email Delivery: Hard Bounces',
        message: `${resendBounces} recipients have hard-bounced. Review your email list quality.`,
        action: 'View Bounced Addresses',
        action_url: '/portal/email-bounces',
      });
    }

    // Check webhook registration status
    if (config && config.shared) {
      const businessPhone = config.shared.twilio_business_phone;
      if (!businessPhone) {
        alerts.push({
          id: 'missing_twilio_phone',
          severity: 'warning',
          title: 'Twilio Phone Missing',
          message: 'Your Twilio business phone is not configured. SMS features are inactive.',
          action: 'Configure Now',
          action_url: '/portal/setup/credentials',
        });
      }
    }

    // Check if any critical service is down
    const integrationHealth = await base44.asServiceRole.entities.IntegrationHealth.filter(
      { status: 'down' },
      '-updated_date',
      5
    );

    integrationHealth.forEach(health => {
      alerts.push({
        id: `integration_${health.service_name}`,
        severity: 'critical',
        title: `${health.service_name} Service Down`,
        message: `The ${health.service_name} integration is currently unavailable. Automations may be delayed.`,
        action: null,
      });
    });

    return Response.json({ success: true, alerts, alert_count: alerts.length });
  } catch (error) {
    console.error('getSystemHealthAlerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});