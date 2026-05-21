import { loadAdminSettings } from "./adminSettings.js";
import { twilioFetch } from "./providerFetch.js";

function buildResult({
  integrationId,
  name,
  derivedStatus,
  statusLabel,
  statusReason,
  configured,
  missingConfiguration = [],
  provider,
  testedAt,
}) {
  return {
    integration_id: integrationId,
    name,
    provider,
    configured,
    missing_configuration: missingConfiguration,
    derived_status: derivedStatus,
    status_label: statusLabel,
    status_reason: statusReason,
    connected: derivedStatus === "healthy",
    status: statusLabel,
    message: statusReason,
    tested_at: testedAt,
  };
}

function inferWebhookProvider(webhookUrl) {
  if (!webhookUrl) {
    return "internal";
  }

  const normalized = webhookUrl.toLowerCase();
  if (normalized.includes("zapier")) {
    return "zapier";
  }
  if (normalized.includes("n8n")) {
    return "n8n";
  }
  return "internal";
}

async function logProviderTestOutcome({
  base44,
  actor,
  integrationId,
  provider,
  result,
}) {
  const status = result.derived_status === "error" ? "failed" : "processed";

  await base44.asServiceRole.entities.CommunicationEvent.create({
    channel: "internal",
    direction: "system",
    event_type: "status_update",
    provider,
    status,
    subject: `Provider test: ${result.name}`,
    message_body: result.status_reason,
    error_message: status === "failed" ? result.status_reason : undefined,
    metadata_json: JSON.stringify({
      context_type: "provider_test",
      integration_id: integrationId,
      actor_email: actor?.email || null,
      derived_status: result.derived_status,
      configured: result.configured,
      missing_configuration: result.missing_configuration,
      tested_at: result.tested_at,
    }),
  });
}

async function testTwilio({ settings, fetchImpl, env, testedAt }) {
  const missingConfiguration = [];
  if (!settings?.twilio_enabled) {
    missingConfiguration.push("Twilio is disabled");
  }
  if (!settings?.twilio_from_number) {
    missingConfiguration.push("Twilio from number missing");
  }

  if (missingConfiguration.length > 0) {
    return buildResult({
      integrationId: "twilio",
      name: "Twilio SMS",
      derivedStatus: "disabled",
      statusLabel: "Disabled",
      statusReason: missingConfiguration.join(". "),
      configured: false,
      missingConfiguration,
      provider: "twilio",
      testedAt,
    });
  }

  const accountSid = env.get("TWILIO_ACCOUNT_SID");
  const authToken = env.get("TWILIO_AUTH_TOKEN");

  if (!accountSid || !authToken) {
    return buildResult({
      integrationId: "twilio",
      name: "Twilio SMS",
      derivedStatus: "error",
      statusLabel: "Error",
      statusReason: "Twilio credentials missing from environment.",
      configured: true,
      missingConfiguration: [],
      provider: "twilio",
      testedAt,
    });
  }

  try {
    const twilioRequest = fetchImpl === fetch ? twilioFetch : fetchImpl;
    const response = await twilioRequest(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
      }
    );

    if (!response.ok) {
      return buildResult({
        integrationId: "twilio",
        name: "Twilio SMS",
        derivedStatus: "error",
        statusLabel: "Error",
        statusReason: `Twilio account check failed with HTTP ${response.status}.`,
        configured: true,
        missingConfiguration: [],
        provider: "twilio",
        testedAt,
      });
    }

    return buildResult({
      integrationId: "twilio",
      name: "Twilio SMS",
      derivedStatus: "healthy",
      statusLabel: "Healthy",
      statusReason: "Twilio credentials validated successfully.",
      configured: true,
      missingConfiguration: [],
      provider: "twilio",
      testedAt,
    });
  } catch (error) {
    return buildResult({
      integrationId: "twilio",
      name: "Twilio SMS",
      derivedStatus: "error",
      statusLabel: "Error",
      statusReason: error instanceof Error ? error.message : "Twilio test failed.",
      configured: true,
      missingConfiguration: [],
      provider: "twilio",
      testedAt,
    });
  }
}

async function testEmail({ base44, actor, settings, testedAt }) {
  const missingConfiguration = [];
  const resendConfigured = Boolean(settings?.resend_enabled && settings?.resend_from_email);
  const gmailConfigured = Boolean(settings?.gmail_enabled && settings?.gmail_from_email);

  if (!resendConfigured && !gmailConfigured) {
    missingConfiguration.push("No email provider enabled");
  }
  if (settings?.resend_enabled && !settings?.resend_from_email) {
    missingConfiguration.push("Resend from email missing");
  }
  if (settings?.gmail_enabled && !settings?.gmail_from_email) {
    missingConfiguration.push("Gmail from email missing");
  }

  const provider = resendConfigured ? "resend" : gmailConfigured ? "gmail" : "internal";

  if (missingConfiguration.length > 0) {
    return buildResult({
      integrationId: "email",
      name: "Resend Email",
      derivedStatus: "disabled",
      statusLabel: "Disabled",
      statusReason: missingConfiguration.join(". "),
      configured: false,
      missingConfiguration,
      provider,
      testedAt,
    });
  }

  try {
    await base44.integrations.Core.SendEmail({
      to: actor.email,
      subject: "Test Email from ClientSurge Systems",
      body: "This is a test email to verify your email provider is configured.",
    });

    return buildResult({
      integrationId: "email",
      name: "Resend Email",
      derivedStatus: "healthy",
      statusLabel: "Healthy",
      statusReason: "Test email sent successfully.",
      configured: true,
      missingConfiguration: [],
      provider,
      testedAt,
    });
  } catch (error) {
    return buildResult({
      integrationId: "email",
      name: "Resend Email",
      derivedStatus: "error",
      statusLabel: "Error",
      statusReason: error instanceof Error ? error.message : "Email provider test failed.",
      configured: true,
      missingConfiguration: [],
      provider,
      testedAt,
    });
  }
}

async function testWebhook({ settings, fetchImpl, testedAt }) {
  const missingConfiguration = [];
  if (!settings?.webhook_enabled) {
    missingConfiguration.push("Webhook delivery is disabled");
  }
  if (!settings?.webhook_url) {
    missingConfiguration.push("Webhook URL missing");
  }

  const provider = inferWebhookProvider(settings?.webhook_url);

  if (missingConfiguration.length > 0) {
    return buildResult({
      integrationId: "webhook",
      name: "Webhook Delivery",
      derivedStatus: "disabled",
      statusLabel: "Disabled",
      statusReason: missingConfiguration.join(". "),
      configured: false,
      missingConfiguration,
      provider,
      testedAt,
    });
  }

  try {
    const response = await fetchImpl(settings.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test",
        timestamp: testedAt,
        message: "Test webhook payload",
      }),
    });

    if (!response.ok) {
      return buildResult({
        integrationId: "webhook",
        name: "Webhook Delivery",
        derivedStatus: "error",
        statusLabel: "Error",
        statusReason: `Webhook responded with HTTP ${response.status}.`,
        configured: true,
        missingConfiguration: [],
        provider,
        testedAt,
      });
    }

    return buildResult({
      integrationId: "webhook",
      name: "Webhook Delivery",
      derivedStatus: "healthy",
      statusLabel: "Healthy",
      statusReason: "Webhook responded successfully.",
      configured: true,
      missingConfiguration: [],
      provider,
      testedAt,
    });
  } catch (error) {
    return buildResult({
      integrationId: "webhook",
      name: "Webhook Delivery",
      derivedStatus: "error",
      statusLabel: "Error",
      statusReason: error instanceof Error ? error.message : "Webhook test failed.",
      configured: true,
      missingConfiguration: [],
      provider,
      testedAt,
    });
  }
}

export async function runProviderConnectionTests({
  base44,
  actor,
  providerType,
  fetchImpl = fetch,
  env = Deno.env,
}) {
  const { settings } = await loadAdminSettings(base44);
  const testedAt = new Date().toISOString();
  const results = {};
  const shouldRun = (key) => providerType === key || providerType === "all";

  if (shouldRun("twilio")) {
    results.twilio = await testTwilio({
      settings,
      fetchImpl,
      env,
      testedAt,
    });
    await logProviderTestOutcome({
      base44,
      actor,
      integrationId: "twilio",
      provider: results.twilio.provider,
      result: results.twilio,
    });
  }

  if (shouldRun("email")) {
    results.email = await testEmail({
      base44,
      actor,
      settings,
      testedAt,
    });
    await logProviderTestOutcome({
      base44,
      actor,
      integrationId: "email",
      provider: results.email.provider,
      result: results.email,
    });
  }

  if (shouldRun("webhook")) {
    results.webhook = await testWebhook({
      settings,
      fetchImpl,
      testedAt,
    });
    await logProviderTestOutcome({
      base44,
      actor,
      integrationId: "webhook",
      provider: results.webhook.provider,
      result: results.webhook,
    });
  }

  return {
    results,
    testedAt,
  };
}
