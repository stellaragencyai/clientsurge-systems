import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { provider_type } = await req.json();

    if (!provider_type) {
      return Response.json({ error: 'provider_type required' }, { status: 400 });
    }

    const results = {};

    // Test Twilio
    if (provider_type === 'twilio' || provider_type === 'all') {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

      if (accountSid && authToken) {
        try {
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
            {
              headers: {
                Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              },
            }
          );

          results.twilio = {
            connected: response.ok,
            status: response.ok ? 'Connected' : 'Failed',
            message: response.ok ? 'Twilio credentials valid' : 'Invalid credentials',
          };
        } catch (err) {
          results.twilio = {
            connected: false,
            status: 'Error',
            message: err.message,
          };
        }
      } else {
        results.twilio = {
          connected: false,
          status: 'Not Configured',
          message: 'Twilio credentials missing',
        };
      }
    }

    // Test Email (Resend)
    if (provider_type === 'email' || provider_type === 'all') {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: 'Test Email from ClientSurge Systems',
          body: 'This is a test email to verify your email provider is configured.',
        });

        results.email = {
          connected: true,
          status: 'Connected',
          message: 'Test email sent successfully',
        };
      } catch (err) {
        results.email = {
          connected: false,
          status: 'Error',
          message: err.message,
        };
      }
    }

    // Test Webhook
    if (provider_type === 'webhook' || provider_type === 'all') {
      const settings = await base44.asServiceRole.entities.AdminSettings.list();
      const adminSettings = settings.length > 0 ? settings[0] : null;

      if (adminSettings?.webhook_url) {
        try {
          const response = await fetch(adminSettings.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'test',
              timestamp: new Date().toISOString(),
              message: 'Test webhook payload',
            }),
          });

          results.webhook = {
            connected: response.ok,
            status: response.ok ? 'Connected' : `HTTP ${response.status}`,
            message: response.ok ? 'Webhook responded' : 'Webhook failed',
          };

          // Update last test result
          await base44.entities.AdminSettings.update(adminSettings.id, {
            last_webhook_test_result: response.ok ? 'success' : 'failed',
            last_webhook_test_at: new Date().toISOString(),
          });
        } catch (err) {
          results.webhook = {
            connected: false,
            status: 'Error',
            message: err.message,
          };
        }
      } else {
        results.webhook = {
          connected: false,
          status: 'Not Configured',
          message: 'Webhook URL not set',
        };
      }
    }

    return Response.json({
      success: true,
      results,
      tested_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
