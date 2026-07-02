import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const results = {};

    // ── 1. Verify Twilio webhook settings match secrets ──
    const [settings] = await svc.entities.AdminSettings.list('-created_date', 1);

    const twilioWebhooks = {
      voice_webhook_url: settings?.voice_webhook_url || '',
      sms_webhook_url: settings?.sms_webhook_url || '',
      missed_call_webhook_url: settings?.missed_call_webhook_url || '',
      sms_status_callback_url: settings?.sms_status_callback_url || '',
    };

    const twilioSecretUrls = {
      voice_webhook_url: Deno.env.get('TWILIO_VOICE_WEBHOOK_URL') || '',
      sms_webhook_url: Deno.env.get('TWILIO_INBOUND_SMS_WEBHOOK_URL') || '',
      missed_call_webhook_url: Deno.env.get('TWILIO_MISSED_CALL_WEBHOOK_URL') || '',
      sms_status_callback_url: Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL') || '',
    };

    results.twilio = {
      settings_db: twilioWebhooks,
      secrets: twilioSecretUrls,
      mismatches: {},
      all_configured: true,
    };

    // Normalize: some env values may include the var name as a prefix
    const normalizeUrl = (val) => {
      if (!val) return '';
      // Strip "ENV_VAR_NAME https://..." pattern down to just the URL
      const match = val.match(/(https?:\/\/[^\s]+)/);
      return match ? match[1] : val;
    };

    for (const [key, dbVal] of Object.entries(twilioWebhooks)) {
      const secretVal = normalizeUrl(twilioSecretUrls[key]);
      const normalizedDb = normalizeUrl(dbVal);
      if (!normalizedDb || !secretVal) {
        results.twilio.all_configured = false;
        results.twilio.mismatches[key] = 'MISSING_VALUE';
      } else if (normalizedDb !== secretVal) {
        results.twilio.mismatches[key] = 'MISMATCH';
      }
    }

    // ── 2. Verify Resend webhook settings ──
    const resendWebhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = settings?.resend_from_email || Deno.env.get('RESEND_FROM_EMAIL');

    results.resend = {
      webhook_secret_set: !!resendWebhookSecret,
      api_key_set: !!resendApiKey,
      from_email: resendFromEmail,
      enabled_in_settings: settings?.resend_enabled || false,
    };

    // ── 3. Verify Stripe webhook secret ──
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeTestWebhookSecret = Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET');

    results.stripe = {
      webhook_secret_set: !!stripeWebhookSecret,
      test_webhook_secret_set: !!stripeTestWebhookSecret,
      secret_key_set: !!stripeSecretKey,
      mode: Deno.env.get('STRIPE_MODE') || 'live',
    };

    // ── 4. Live ping Twilio API ──
    try {
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      if (twilioSid && twilioToken) {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`, {
          headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`) },
        });
        results.twilio.api_ping = res.ok;
        if (res.ok) {
          const body = await res.json();
          results.twilio.account_status = body.status;
          results.twilio.phone_number = settings?.twilio_from_number || Deno.env.get('TWILIO_FROM_NUMBER');
        }
      } else {
        results.twilio.api_ping = false;
        results.twilio.api_error = 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set';
      }
    } catch (e) {
      results.twilio.api_ping = false;
      results.twilio.api_error = e.message;
    }

    // ── 5. Live ping Resend API ──
    try {
      if (resendApiKey) {
        const res = await fetch('https://api.resend.com/domains', {
          headers: { 'Authorization': `Bearer ${resendApiKey}` },
        });
        results.resend.api_ping = res.ok;
        if (res.ok) {
          const domains = await res.json();
          results.resend.domains = Array.isArray(domains?.data)
            ? domains.data.map((d) => ({ name: d.name, status: d.status }))
            : [];
        }
      } else {
        results.resend.api_ping = false;
        results.resend.api_error = 'RESEND_API_KEY not set';
      }
    } catch (e) {
      results.resend.api_ping = false;
      results.resend.api_error = e.message;
    }

    // ── 6. Overall health summary ──
    const allHealthy =
      results.twilio.all_configured &&
      results.twilio.api_ping &&
      results.resend.api_ping &&
      results.stripe.webhook_secret_set;

    return Response.json({
      overall_healthy: allHealthy,
      twilio: results.twilio,
      resend: results.resend,
      stripe: results.stripe,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[verifyWebhookSettings] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});