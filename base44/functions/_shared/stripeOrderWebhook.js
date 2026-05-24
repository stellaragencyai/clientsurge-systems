import { initializePaidOrderInstallPipeline } from "./installPipeline.js";
import { normalizePackageKey } from "../../../src/lib/salesCatalog.js";
import { buildPaymentRecoveryEmail } from "./paymentRecoveryEmail.js";
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
  sendTwilioSmsProvider,
} from "./communicationOutbox.js";

function getStripeSecretKey({ livemode = null } = {}) {
  try {
    if (livemode === false) {
      return Deno.env.get("STRIPE_SECRET_KEY") || "";
    }

    return (
      Deno.env.get("STRIPE_LIVE_SECRET_KEY") ||
      Deno.env.get("STRIPE_SECRET_KEY") ||
      ""
    );
  } catch {
    return "";
  }
}

function getWebhookSecrets() {
  try {
    return [
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
      Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET") || "",
    ].filter(Boolean);
  } catch {
    return [];
  }
}

async function getBase44Client(req) {
  const { createClientFromRequest } = await import("npm:@base44/sdk@0.8.25");
  return createClientFromRequest(req);
}

async function getStripeClient(options = {}) {
  const stripeSecretKey = getStripeSecretKey(options);
  if (!stripeSecretKey) {
    return null;
  }

  const { default: Stripe } = await import("npm:stripe@14");
  return new Stripe(stripeSecretKey);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asConsentBoolean(value) {
  return value === true || String(value || "").toLowerCase() === "true";
}

function encodeBasicAuth(value) {
  if (typeof btoa === "function") {
    return btoa(value);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  }

  throw new Error("No base64 encoder available");
}

function shouldIgnoreInviteError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("registered") ||
    message.includes("invited")
  );
}

function buildCommunicationEvent({
  provider = "stripe",
  channel = "webhook",
  direction = "system",
  eventType = "workflow_triggered",
  status = "processed",
  providerMessageId,
  subject,
  messageBody,
  order = null,
  metadata = {},
}) {
  return {
    channel,
    direction,
    event_type: eventType,
    provider,
    status,
    subject,
    message_body: messageBody,
    provider_message_id: providerMessageId,
    order_id: order?.id,
    client_id: order?.client_id,
    client_project_id: order?.client_project_id,
    onboarding_client_id: order?.onboarding_client_id,
    context_type: "stripe_webhook",
    context_id: providerMessageId,
    metadata_json: JSON.stringify(metadata),
  };
}

async function findCommunicationEvent(base44, providerMessageId) {
  if (!providerMessageId) {
    return null;
  }

  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { provider_message_id: providerMessageId },
    "-created_date",
    5
  ).catch(() => []);

  return (events || [])[0] || null;
}

async function createCommunicationEvent(base44, payload) {
  return base44.asServiceRole.entities.CommunicationEvent.create(payload).catch(
    () => null
  );
}

function getEntity(base44, name) {
  return base44?.asServiceRole?.entities?.[name] || null;
}

function safeErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || "Unknown error");
}

function computeNextRetryAt(attempts, now = new Date()) {
  const delayMinutes = Math.min(60, Math.max(1, Number(attempts || 1) * 5));
  return new Date(now.getTime() + delayMinutes * 60 * 1000).toISOString();
}

function buildSafeStripeEventSummary(event) {
  const object = event?.data?.object || {};

  return {
    event_id: event?.id || "",
    event_type: event?.type || "",
    livemode: Boolean(event?.livemode),
    object_id: object?.id || "",
    object_type: object?.object || "",
    checkout_session_id: event?.type === "checkout.session.completed" ? object?.id || "" : "",
    subscription_id: cleanString(object?.subscription || object?.id),
    payment_intent_id: cleanString(object?.payment_intent || object?.id),
    customer: cleanString(object?.customer),
    customer_email: cleanString(
      object?.customer_details?.email ||
        object?.customer_email ||
        object?.receipt_email
    ),
    metadata_order_id: cleanString(object?.metadata?.order_id),
  };
}

async function findPaymentEvent(base44, eventId) {
  const PaymentEvent = getEntity(base44, "PaymentEvent");
  if (!PaymentEvent || !eventId) {
    return null;
  }

  const matches = await PaymentEvent.filter(
    { provider: "stripe", event_id: eventId },
    "-created_date",
    5
  ).catch(() => []);

  return matches?.[0] || null;
}

async function writePaymentEvent(base44, event, patch = {}) {
  const PaymentEvent = getEntity(base44, "PaymentEvent");
  if (!PaymentEvent || !event?.id) {
    return null;
  }

  const existing = await findPaymentEvent(base44, event.id);
  const summary = buildSafeStripeEventSummary(event);
  const payload = {
    event_id: event.id,
    provider: "stripe",
    event_type: event.type,
    customer_email: patch.customer_email || summary.customer_email || "",
    checkout_session_id:
      patch.checkout_session_id || summary.checkout_session_id || "",
    subscription_id: patch.subscription_id || summary.subscription_id || "",
    payment_intent_id:
      patch.payment_intent_id || summary.payment_intent_id || "",
    raw_event_summary: summary,
    ...patch,
  };

  if (existing) {
    return PaymentEvent.update(existing.id, {
      ...payload,
      attempts:
        typeof patch.attempts === "number"
          ? patch.attempts
          : Number(existing.attempts || 0),
      retry_count:
        typeof patch.retry_count === "number"
          ? patch.retry_count
          : Number(existing.retry_count || 0),
    }).catch(() => existing);
  }

  return PaymentEvent.create({
    status: "received",
    fulfillment_status: "pending",
    attempts: 0,
    retry_count: 0,
    recovery_required: false,
    ...payload,
  }).catch(() => null);
}

async function markPaymentEventProcessing(base44, event, patch = {}) {
  const existing = await findPaymentEvent(base44, event.id);
  const attempts = Number(existing?.attempts || 0) + 1;

  return writePaymentEvent(base44, event, {
    ...patch,
    status: "processing",
    attempts,
    retry_count: Math.max(0, attempts - 1),
    last_error: "",
    next_retry_at: "",
    failed_at: "",
    recovery_required: false,
  });
}

async function markPaymentEventProcessed(base44, event, patch = {}) {
  return writePaymentEvent(base44, event, {
    ...patch,
    status: "processed",
    fulfillment_status: patch.fulfillment_status || "completed",
    install_job_status: patch.install_job_status || "completed",
    processed_at: new Date().toISOString(),
    last_error: "",
    next_retry_at: "",
    recovery_required: false,
  });
}

async function markPaymentEventFailed(base44, event, error, patch = {}) {
  const existing = await findPaymentEvent(base44, event.id);
  const attempts = Number(existing?.attempts || patch.attempts || 1);
  const now = new Date();

  return writePaymentEvent(base44, event, {
    ...patch,
    status: "failed",
    fulfillment_status: patch.fulfillment_status || "failed",
    install_job_status: patch.install_job_status || "failed",
    attempts,
    retry_count: Math.max(0, attempts - 1),
    last_error: safeErrorMessage(error),
    next_retry_at: computeNextRetryAt(attempts, now),
    failed_at: now.toISOString(),
    recovery_required: true,
    recommended_next_action:
      patch.recommended_next_action ||
      "Retry the Stripe webhook after confirming the install pipeline is available. If retry fails again, inspect linked resources before manual fulfillment.",
  });
}

async function findFulfillmentJob(base44, lockKey) {
  const FulfillmentJob = getEntity(base44, "FulfillmentJob");
  if (!FulfillmentJob || !lockKey) {
    return null;
  }

  const matches = await FulfillmentJob.filter({ lock_key: lockKey }, "-created_date", 10).catch(() => []);
  return matches?.[0] || null;
}

async function writeFulfillmentJob(base44, job, patch = {}) {
  const FulfillmentJob = getEntity(base44, "FulfillmentJob");
  if (!FulfillmentJob) {
    return null;
  }

  const now = new Date().toISOString();
  if (job?.id) {
    return FulfillmentJob.update(job.id, {
      ...patch,
      updated_at: now,
    }).catch(() => job);
  }

  return FulfillmentJob.create({
    ...patch,
    created_at: patch.created_at || now,
    updated_at: now,
  }).catch(() => null);
}

async function getOrCreateFulfillmentJob(base44, { order, event, lockKey }) {
  const existing = await findFulfillmentJob(base44, lockKey);
  if (existing) {
    return writeFulfillmentJob(base44, existing, {
      status: existing.status === "completed" ? "completed" : "running",
      attempts: Number(existing.attempts || 0) + (existing.status === "completed" ? 0 : 1),
      recovery_required: false,
      last_error: "",
    });
  }

  return writeFulfillmentJob(base44, null, {
    job_id: `fulfillment:${lockKey}`,
    order_id: order.id,
    source_event_id: event.id,
    job_type: "install_pipeline_start",
    status: "running",
    attempts: 1,
    lock_key: lockKey,
    recovery_required: false,
  });
}

async function markFulfillmentJobCompleted(base44, job, result) {
  if (!job) {
    return null;
  }

  return writeFulfillmentJob(base44, job, {
    status: "completed",
    completed_at: new Date().toISOString(),
    recovery_required: false,
    last_error: "",
    result_summary: {
      order_id: result?.order?.id || job.order_id,
      client_id: result?.client?.id || "",
      client_project_id: result?.clientProject?.id || "",
      onboarding_client_id: result?.onboardingClient?.id || "",
    },
  });
}

async function markFulfillmentJobFailed(base44, job, error) {
  if (!job) {
    return null;
  }

  return writeFulfillmentJob(base44, job, {
    status: "failed",
    failed_at: new Date().toISOString(),
    recovery_required: true,
    last_error: safeErrorMessage(error),
    recommended_next_action:
      "Retry webhook fulfillment after checking the order, ClientProject, OnboardingClient, portal invite, and install pipeline logs.",
  });
}

async function markOrderFulfillmentState(base44, orderId, patch) {
  if (!orderId) {
    return null;
  }

  return base44.asServiceRole.entities.Order.update(orderId, patch).catch(() => null);
}

async function sendPaymentRecoveryEmail({ base44, order, invoice }) {
  if (!order?.customer_email) {
    return { sent: false, reason: "missing_customer_email" };
  }

  const paymentUpdateUrl = cleanString(invoice?.hosted_invoice_url || invoice?.invoice_pdf);
  const payload = buildPaymentRecoveryEmail({
    order,
    invoice,
    paymentUpdateUrl,
    fromEmail: Deno.env.get("RESEND_FROM_EMAIL"),
    replyToEmail: Deno.env.get("ADMIN_EMAIL"),
  });

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "email",
    provider: "resend",
    recipient: Array.isArray(payload.to) ? payload.to[0] : payload.to,
    subject: payload.subject,
    body: payload.html || payload.text || "",
    html: payload.html,
    from: payload.from,
    orderId: order.id,
    source: "stripeOrderWebhook",
    sourceRecordId: order.id,
    templateKey: "payment_recovery_email",
    messageType: "transactional",
    consentBasis: "transactional_relationship",
    metadata: { invoice_id: invoice?.id, payment_update_url_present: Boolean(paymentUpdateUrl) },
    providerSend: (providerPayload) => sendResendEmailProvider({
      ...providerPayload,
      env: (name) => Deno.env.get(name),
      fetchImpl: fetch,
    }),
  });

  if (!result.success) {
    throw new Error(`Resend payment recovery failed: ${result.reason || result.error || result.status}`);
  }

  return {
    sent: true,
    to: payload.to,
    payment_update_url_present: Boolean(paymentUpdateUrl),
  };
}

function buildPortalUrl(activationLink) {
  return (
    cleanString(activationLink) ||
    `${Deno.env.get("APP_URL") || "https://clientsurgesystems.com"}/client-portal`
  );
}

function buildBillingPatchFromSubscription(subscription) {
  if (!subscription) {
    return {};
  }

  return {
    stripe_subscription_id: subscription.id,
    subscription_id: subscription.id,
    subscription_status: subscription.status || "",
    billing_status: subscription.status || "",
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  };
}

async function resolveOrderFromCheckoutSession(base44, session) {
  const metadataOrderId = cleanString(session?.metadata?.order_id);
  if (metadataOrderId) {
    const direct = await base44.asServiceRole.entities.Order.get(metadataOrderId).catch(
      () => null
    );
    if (direct) {
      return direct;
    }
  }

  const sessionId = cleanString(session?.id);
  if (sessionId) {
    const bySession = await base44.asServiceRole.entities.Order.filter(
      { stripe_session_id: sessionId },
      "-created_date",
      5
    ).catch(() => []);
    if (bySession?.length) {
      return bySession[0];
    }
  }

  const customerEmail = cleanString(
    session?.customer_details?.email || session?.customer_email
  ).toLowerCase();
  if (!customerEmail) {
    return null;
  }

  const byEmail = await base44.asServiceRole.entities.Order.filter(
    { customer_email: customerEmail },
    "-created_date",
    20
  ).catch(() => []);

  const scoped = (byEmail || []).filter(
    (order) =>
      cleanString(order.customer_email).toLowerCase() === customerEmail &&
      (!session?.metadata?.business_name ||
        cleanString(order.business_name).toLowerCase() ===
          cleanString(session.metadata.business_name).toLowerCase())
  );

  return scoped[0] || byEmail?.[0] || null;
}

async function resolveOrderFromSubscription(base44, subscriptionId, fallbackOrderId = "") {
  const directOrderId = cleanString(fallbackOrderId);
  if (directOrderId) {
    const direct = await base44.asServiceRole.entities.Order.get(directOrderId).catch(
      () => null
    );
    if (direct) {
      return direct;
    }
  }

  const bySubscription = await base44.asServiceRole.entities.Order.filter(
    { stripe_subscription_id: subscriptionId },
    "-created_date",
    10
  ).catch(() => []);

  return bySubscription?.[0] || null;
}

async function resolveOrderFromPaymentIntent(base44, paymentIntent) {
  const metadataOrderId = cleanString(paymentIntent?.metadata?.order_id);
  if (metadataOrderId) {
    const direct = await base44.asServiceRole.entities.Order.get(metadataOrderId).catch(
      () => null
    );
    if (direct) {
      return direct;
    }
  }

  const paymentIntentId = cleanString(paymentIntent?.id);
  if (paymentIntentId) {
    const byPaymentIntent = await base44.asServiceRole.entities.Order.filter(
      { stripe_payment_intent_id: paymentIntentId },
      "-created_date",
      10
    ).catch(() => []);
    if (byPaymentIntent?.length) {
      return byPaymentIntent[0];
    }
  }

  const customerEmail = cleanString(paymentIntent?.receipt_email).toLowerCase();
  if (!customerEmail) {
    return null;
  }

  const byEmail = await base44.asServiceRole.entities.Order.filter(
    { customer_email: customerEmail },
    "-created_date",
    20
  ).catch(() => []);

  return byEmail?.[0] || null;
}

export async function ensurePortalInvite(base44, order) {
  const providerMessageId = `portal_invite:${order.id}`;
  const existingEvent = await findCommunicationEvent(base44, providerMessageId);
  if (existingEvent) {
    return {
      alreadyRecorded: true,
      activation_link: null,
    };
  }

  if (!base44.users?.inviteUser || !order?.customer_email) {
    return {
      alreadyRecorded: false,
      activation_link: null,
    };
  }

  try {
    const inviteResult = await base44.users.inviteUser(order.customer_email, "user");
    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        provider: "internal",
        channel: "internal",
        providerMessageId,
        subject: "Portal invite created",
        messageBody: `Portal invitation created for ${order.customer_email}.`,
        order,
        metadata: {
          order_id: order.id,
          email: order.customer_email,
          activation_link_present: Boolean(inviteResult?.activation_link),
        },
      })
    );

    return {
      alreadyRecorded: false,
      activation_link: inviteResult?.activation_link || null,
    };
  } catch (error) {
    if (shouldIgnoreInviteError(error)) {
      await createCommunicationEvent(
        base44,
        buildCommunicationEvent({
          provider: "internal",
          channel: "internal",
          providerMessageId,
          subject: "Portal invite already active",
          messageBody: `Portal invite skipped for ${order.customer_email}; user already exists or was previously invited.`,
          order,
          metadata: {
            order_id: order.id,
            email: order.customer_email,
          },
        })
      );

      return {
        alreadyRecorded: true,
        activation_link: null,
      };
    }

    throw error;
  }
}

export async function ensureConfirmationEmail(base44, order, portalActivationUrl) {
  const providerMessageId = `order_confirmation:${order.id}`;
  const existingEvent = await findCommunicationEvent(base44, providerMessageId);
  if (existingEvent) {
    return { alreadyRecorded: true };
  }

  try {
    await base44.asServiceRole.functions.invoke("sendOrderConfirmationEmail", {
      order_id: order.id,
      portal_activation_url: buildPortalUrl(portalActivationUrl),
    });
  } catch (error) {
    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        provider: "resend",
        channel: "email",
        direction: "outbound",
        eventType: "email_failed",
        status: "failed",
        providerMessageId,
        subject: "Order confirmation email failed",
        messageBody: error instanceof Error ? error.message : String(error),
        order,
        metadata: {
          order_id: order.id,
          email: order.customer_email,
        },
      })
    );

    return { alreadyRecorded: false, email_failed: true };
  }

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      provider: "resend",
      channel: "email",
      direction: "outbound",
      eventType: "email_sent",
      providerMessageId,
      subject: "Order confirmation sent",
      messageBody: `Order confirmation email sent to ${order.customer_email}.`,
      order,
      metadata: {
        order_id: order.id,
        email: order.customer_email,
      },
    })
  );

  return { alreadyRecorded: false };
}

function buildCheckoutConfirmationSms(order, portalActivationUrl) {
  const planName = cleanString(
    order.pricing_summary?.package_name || order.plan_type || "ClientSurge system"
  );
  const businessName = cleanString(order.business_name || order.customer_name);
  const portalUrl = buildPortalUrl(portalActivationUrl);
  const businessSuffix = businessName ? ` for ${businessName}` : "";

  return `ClientSurge received your ${planName} order${businessSuffix}. Setup details are on the way: ${portalUrl}. Reply STOP to opt out.`;
}

function resolveCheckoutSmsConsent({ order, session }) {
  const orderConsent = asConsentBoolean(order?.sms_consent_granted);
  const metadataConsent = asConsentBoolean(session?.metadata?.sms_consent_granted);

  return {
    granted: orderConsent || metadataConsent,
    source:
      cleanString(order?.sms_consent_source) ||
      cleanString(session?.metadata?.sms_consent_source) ||
      "",
  };
}

export async function ensureCheckoutConfirmationSms({
  base44,
  order,
  session,
  portalActivationUrl,
}) {
  const providerMessageId = `checkout_sms_confirmation:${order.id}`;
  const existingEvent = await findCommunicationEvent(base44, providerMessageId);
  if (existingEvent) {
    return { alreadyRecorded: true };
  }

  const toPhone = cleanString(order.customer_phone || session?.metadata?.customer_phone);
  const consent = resolveCheckoutSmsConsent({ order, session });
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER") || "";
  const skippedReason = !toPhone
    ? "missing_customer_phone"
    : !consent.granted
    ? "sms_consent_not_granted"
    : !fromPhone
    ? "twilio_not_configured"
    : "";

  if (skippedReason) {
    await base44.asServiceRole.entities.Order.update(order.id, {
      checkout_sms_confirmation_status: "skipped",
      checkout_sms_confirmation_skipped_reason: skippedReason,
    }).catch(() => null);

    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        provider: "twilio",
        channel: "sms",
        direction: "system",
        eventType: "workflow_triggered",
        status: "processed",
        providerMessageId,
        subject: "Checkout SMS confirmation skipped",
        messageBody: `Checkout SMS confirmation skipped: ${skippedReason}.`,
        order,
        metadata: {
          order_id: order.id,
          reason: skippedReason,
          consent_source: consent.source,
        },
      })
    );

    return { sent: false, reason: skippedReason };
  }

  const messageBody = buildCheckoutConfirmationSms(order, portalActivationUrl);
  const smsResult = await sendCommunicationViaOutbox({
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: toPhone,
    body: messageBody,
    from: fromPhone,
    orderId: order.id,
    source: "stripeOrderWebhook",
    sourceRecordId: order.id,
    templateKey: "checkout_sms_confirmation",
    messageType: "transactional",
    consentBasis: "checkout_sms_consent",
    consentSnapshot: {
      consent_given: true,
      consent_source: consent.source,
    },
    metadata: { order_id: order.id, consent_source: consent.source },
    providerSend: (providerPayload) => sendTwilioSmsProvider({
      ...providerPayload,
      env: (name) => Deno.env.get(name),
      fetchImpl: fetch,
    }),
  });

  if (!smsResult.success) {
    await base44.asServiceRole.entities.Order.update(order.id, {
      checkout_sms_confirmation_status: "failed",
      checkout_sms_confirmation_skipped_reason: smsResult.reason || smsResult.error || "twilio_send_failed",
    }).catch(() => null);

    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        provider: "twilio",
        channel: "sms",
        direction: "outbound",
        eventType: "sms_failed",
        status: "failed",
        providerMessageId,
        subject: "Checkout SMS confirmation failed",
        messageBody: smsResult.reason || smsResult.error || "Twilio outbox send failed",
        order,
        metadata: {
          order_id: order.id,
          outbox_id: smsResult.outbox?.id || "",
        },
      })
    );

    return { sent: false, reason: smsResult.reason || smsResult.error || "twilio_send_failed" };
  }

  const sentAt = new Date().toISOString();
  await base44.asServiceRole.entities.Order.update(order.id, {
    checkout_sms_confirmation_sent_at: sentAt,
    checkout_sms_confirmation_message_sid: cleanString(smsResult.provider_message_id),
    checkout_sms_confirmation_status: "sent",
    checkout_sms_confirmation_skipped_reason: "",
  }).catch(() => null);

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      provider: "twilio",
      channel: "sms",
      direction: "outbound",
      eventType: "sms_sent",
      status: "sent",
      providerMessageId,
      subject: "Checkout SMS confirmation sent",
      messageBody,
      order,
      metadata: {
        order_id: order.id,
        twilio_message_sid: cleanString(smsResult.provider_message_id),
        outbox_id: smsResult.outbox?.id || "",
        consent_source: consent.source,
      },
    })
  );

  return { sent: true, message_sid: cleanString(smsResult.provider_message_id), outbox_id: smsResult.outbox?.id };
}

export async function ensureAdminPurchaseNotification(base44, order) {
  const providerMessageId = `admin_purchase_notification:${order.id}`;
  const existingEvent = await findCommunicationEvent(base44, providerMessageId);
  if (existingEvent) {
    return { alreadyRecorded: true };
  }

  await base44.asServiceRole.functions.invoke("sendAdminPurchaseNotification", {
    order_id: order.id,
    customer_name: order.business_name || order.customer_name,
    customer_email: order.customer_email,
    package_key: order.pricing_summary?.package_key || order.package_key || order.package_type,
    setup_fee: order.total_setup,
    monthly_rate: order.total_monthly,
  }).catch(() => null);

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      provider: "internal",
      channel: "notification",
      direction: "outbound",
      eventType: "admin_purchase_notification",
      providerMessageId,
      subject: "Admin purchase notification queued",
      messageBody: `Admin purchase notification queued for order ${order.id}.`,
      order,
      metadata: {
        order_id: order.id,
        email: order.customer_email,
      },
    })
  );

  return { alreadyRecorded: false };
}

export async function processCheckoutSessionCompleted({
  base44,
  event,
  source,
}) {
  const session = event.data.object;
  const existingPaymentEvent = await findPaymentEvent(base44, event.id);
  if (existingPaymentEvent?.status === "processed") {
    await markPaymentEventProcessed(base44, event, {
      fulfillment_status: existingPaymentEvent.fulfillment_status || "completed",
      install_job_status: existingPaymentEvent.install_job_status || "completed",
      order_id: existingPaymentEvent.order_id || "",
      customer_email: existingPaymentEvent.customer_email || "",
      processed_at: existingPaymentEvent.processed_at || new Date().toISOString(),
      recovery_required: false,
    });
    return {
      success: true,
      duplicate: true,
      order_id: existingPaymentEvent.order_id,
    };
  }

  await markPaymentEventProcessing(base44, event, {
    fulfillment_status: "pending",
    install_job_status: "pending",
    checkout_session_id: cleanString(session?.id),
    customer_email: cleanString(
      session?.customer_details?.email || session?.customer_email
    ),
    subscription_id: cleanString(session?.subscription),
    payment_intent_id: cleanString(session?.payment_intent),
  });

  const order = await resolveOrderFromCheckoutSession(base44, session);

  if (!order) {
    await markPaymentEventFailed(base44, event, "checkout.session.completed did not match a pre-created Order.", {
      fulfillment_status: "needs_manual_review",
      install_job_status: "needs_manual_review",
      checkout_session_id: session?.id || "",
      customer_email: cleanString(session?.customer_details?.email || session?.customer_email),
      subscription_id: cleanString(session?.subscription),
      payment_intent_id: cleanString(session?.payment_intent),
      recommended_next_action:
        "Find or recreate the Order for this paid checkout session, then replay the Stripe event or manually initialize fulfillment.",
    });
    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        providerMessageId: event.id,
        status: "failed",
        subject: "Stripe checkout event unmatched",
        messageBody: "checkout.session.completed did not match a pre-created Order.",
        metadata: {
          source,
          event_id: event.id,
          event_type: event.type,
          stripe_session_id: session?.id || "",
          metadata: session?.metadata || {},
        },
      })
    );

    return { success: false, reason: "order_not_found" };
  }

  const existingEvent = await findCommunicationEvent(base44, event.id);
  if (existingEvent && !existingPaymentEvent?.recovery_required) {
    await markPaymentEventProcessed(base44, event, {
      order_id: order.id,
      customer_email: order.customer_email,
      checkout_session_id: cleanString(session?.id),
      subscription_id: cleanString(session?.subscription),
      payment_intent_id: cleanString(session?.payment_intent),
    });
    return { success: true, duplicate: true, order_id: order.id };
  }

  const now = new Date().toISOString();
  const subscriptionId = cleanString(session?.subscription);
  const stripe = subscriptionId ? await getStripeClient({ livemode: event.livemode }) : null;
  const subscription = subscriptionId
    ? await stripe?.subscriptions.retrieve(subscriptionId)
    : null;

  const lockKey = `stripe:${event.type}:${session?.id || event.id}:${order.id}`;
  const job = await getOrCreateFulfillmentJob(base44, { order, event, lockKey });
  if (job?.status === "completed") {
    await markPaymentEventProcessed(base44, event, {
      order_id: order.id,
      customer_email: order.customer_email,
      checkout_session_id: cleanString(session?.id),
      subscription_id: subscriptionId,
      payment_intent_id: cleanString(session?.payment_intent),
      fulfillment_status: "completed",
      install_job_status: "completed",
    });
    return { success: true, duplicate: true, order_id: order.id };
  }

  await markOrderFulfillmentState(base44, order.id, {
    payment_status: "paid",
    stripe_event_id: event.id,
    stripe_session_id: cleanString(session?.id) || order.stripe_session_id,
    stripe_customer_id: cleanString(session?.customer) || order.stripe_customer_id,
    stripe_subscription_id: subscriptionId || order.stripe_subscription_id,
    stripe_payment_intent_id:
      cleanString(session?.payment_intent) || order.stripe_payment_intent_id,
    fulfillment_status: "running",
    fulfillment_job_id: job?.job_id || "",
    fulfillment_lock_key: lockKey,
    fulfillment_source_event_id: event.id,
    fulfillment_attempts: Number(order.fulfillment_attempts || 0) + 1,
    fulfillment_last_error: "",
    fulfillment_recovery_required: false,
  });

  let initialized;
  try {
    initialized = await initializePaidOrderInstallPipeline({
      base44,
      order: {
        ...order,
        payment_status: "paid",
        stripe_event_id: event.id,
        stripe_session_id: cleanString(session?.id) || order.stripe_session_id,
        stripe_customer_id: cleanString(session?.customer) || order.stripe_customer_id,
        stripe_subscription_id: subscriptionId || order.stripe_subscription_id,
        stripe_payment_intent_id:
          cleanString(session?.payment_intent) || order.stripe_payment_intent_id,
      },
      stripeCustomerId: cleanString(session?.customer),
      eventSource: `${source}:${event.type}`,
      now,
    });
  } catch (error) {
    const message = safeErrorMessage(error);
    await markFulfillmentJobFailed(base44, job, error);
    await markOrderFulfillmentState(base44, order.id, {
      payment_status: "paid",
      stripe_event_id: event.id,
      stripe_session_id: cleanString(session?.id) || order.stripe_session_id,
      stripe_customer_id: cleanString(session?.customer) || order.stripe_customer_id,
      stripe_subscription_id: subscriptionId || order.stripe_subscription_id,
      stripe_payment_intent_id:
        cleanString(session?.payment_intent) || order.stripe_payment_intent_id,
      fulfillment_status: "failed",
      fulfillment_job_id: job?.job_id || "",
      fulfillment_lock_key: lockKey,
      fulfillment_source_event_id: event.id,
      fulfillment_last_error: message,
      fulfillment_failed_at: new Date().toISOString(),
      fulfillment_recovery_required: true,
      fulfillment_recommended_next_action:
        "Retry the Stripe webhook. If it fails again, inspect linked Client, ClientProject, OnboardingClient, and install pipeline records before manual activation.",
      pipeline_status: order.pipeline_status || "Error",
      pipeline_error: message,
      last_install_event_at: now,
    });
    await markPaymentEventFailed(base44, event, error, {
      order_id: order.id,
      customer_email: order.customer_email,
      checkout_session_id: cleanString(session?.id),
      subscription_id: subscriptionId,
      payment_intent_id: cleanString(session?.payment_intent),
      fulfillment_status: "failed",
      install_job_status: "failed",
    });
    throw error;
  }

  const packageKey = normalizePackageKey(
    order.pricing_summary?.package_key ||
      session?.metadata?.package_key ||
      order.selected_package_type ||
      order.package_type
  );
  const orderPatch = {
    stripe_event_id: event.id,
    stripe_session_id: cleanString(session?.id) || initialized.order.stripe_session_id,
    stripe_customer_id:
      cleanString(session?.customer) || initialized.order.stripe_customer_id,
    stripe_payment_intent_id:
      cleanString(session?.payment_intent) || initialized.order.stripe_payment_intent_id,
    payment_status: "paid",
    fulfillment_status: "completed",
    fulfillment_job_id: job?.job_id || initialized.order.fulfillment_job_id,
    fulfillment_lock_key: lockKey,
    fulfillment_source_event_id: event.id,
    fulfillment_completed_at: now,
    fulfillment_last_error: "",
    fulfillment_recovery_required: false,
    selected_package_type: packageKey || initialized.order.selected_package_type,
    package_type: packageKey || initialized.order.package_type,
    plan_type:
      initialized.order.pricing_summary?.package_name ||
      initialized.order.plan_type ||
      initialized.order.business_name,
    ...buildBillingPatchFromSubscription(subscription),
  };

  const updatedOrder = await base44.asServiceRole.entities.Order.update(
    initialized.order.id,
    orderPatch
  );

  const portalInvite = await ensurePortalInvite(base44, updatedOrder);
  await ensureConfirmationEmail(
    base44,
    updatedOrder,
    portalInvite.activation_link
  );
  await ensureCheckoutConfirmationSms({
    base44,
    order: updatedOrder,
    session,
    portalActivationUrl: portalInvite.activation_link,
  });
  await ensureAdminPurchaseNotification(base44, updatedOrder);
  await markFulfillmentJobCompleted(base44, job, initialized);

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      providerMessageId: event.id,
      subject: "Stripe checkout processed",
      messageBody: `checkout.session.completed processed for order ${updatedOrder.id}.`,
      order: updatedOrder,
      metadata: {
        source,
        event_id: event.id,
        event_type: event.type,
        stripe_session_id: session?.id || "",
        stripe_subscription_id: subscriptionId,
      },
    })
  );
  await markPaymentEventProcessed(base44, event, {
    order_id: updatedOrder.id,
    customer_email: updatedOrder.customer_email,
    checkout_session_id: cleanString(session?.id),
    subscription_id: subscriptionId,
    payment_intent_id: cleanString(session?.payment_intent),
    fulfillment_status: "completed",
    install_job_status: "completed",
  });

  return { success: true, order_id: updatedOrder.id };
}

async function processSubscriptionLifecycle({
  base44,
  event,
  source,
}) {
  const subscription = event.data.object;
  const order = await resolveOrderFromSubscription(
    base44,
    cleanString(subscription?.id),
    cleanString(subscription?.metadata?.order_id)
  );

  if (!order) {
    return { success: false, reason: "order_not_found" };
  }

  const providerMessageId = `${event.id}:${order.id}`;
  const existingEvent = await findCommunicationEvent(base44, providerMessageId);
  if (existingEvent) {
    return { success: true, duplicate: true, order_id: order.id };
  }

  const nextBillingStatus =
    event.type === "customer.subscription.deleted"
      ? "canceled"
      : cleanString(subscription?.status) || order.billing_status;

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    stripe_event_id: event.id,
    ...buildBillingPatchFromSubscription(subscription),
    billing_status: nextBillingStatus,
  });

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      providerMessageId,
      subject: "Stripe subscription synchronized",
      messageBody: `${event.type} synchronized to order ${order.id}.`,
      order: updatedOrder,
      metadata: {
        source,
        event_id: event.id,
        event_type: event.type,
        stripe_subscription_id: subscription?.id || "",
        status: subscription?.status || "",
      },
    })
  );

  return { success: true, order_id: updatedOrder.id };
}

async function processInvoiceEvent({ base44, event, source }) {
  const invoice = event.data.object;
  const order = await resolveOrderFromSubscription(
    base44,
    cleanString(invoice?.subscription),
    cleanString(invoice?.metadata?.order_id)
  );

  if (!order) {
    return { success: false, reason: "order_not_found" };
  }

  const providerMessageId = `${event.id}:${order.id}`;
  const existingEvent = await findCommunicationEvent(base44, providerMessageId);
  if (existingEvent) {
    return { success: true, duplicate: true, order_id: order.id };
  }

  const nextBillingStatus =
    event.type === "invoice.payment_failed" ? "past_due" : "active";
  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    stripe_event_id: event.id,
    billing_status: nextBillingStatus,
    payment_status: event.type === "invoice.payment_failed" ? "payment_failed" : order.payment_status,
  });

  let recoveryEmail = null;
  if (event.type === "invoice.payment_failed") {
    try {
      recoveryEmail = await sendPaymentRecoveryEmail({
        base44,
        order: updatedOrder,
        invoice,
      });
    } catch (error) {
      recoveryEmail = {
        sent: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      providerMessageId,
      subject: "Stripe invoice event synchronized",
      messageBody: `${event.type} synchronized to order ${order.id}.`,
      order: updatedOrder,
      metadata: {
        source,
        event_id: event.id,
        event_type: event.type,
        stripe_invoice_id: invoice?.id || "",
        stripe_subscription_id: invoice?.subscription || "",
        recovery_email: recoveryEmail,
      },
    })
  );

  if (event.type === "invoice.payment_failed") {
    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        provider: "resend",
        channel: "email",
        direction: "outbound",
        eventType: recoveryEmail?.sent ? "email_sent" : "email_failed",
        status: recoveryEmail?.sent ? "sent" : "failed",
        providerMessageId: `payment_recovery:${event.id}:${order.id}`,
        subject: recoveryEmail?.sent
          ? "Payment recovery email sent"
          : "Payment recovery email failed",
        messageBody: recoveryEmail?.sent
          ? `Payment recovery email sent to ${updatedOrder.customer_email}.`
          : `Payment recovery email not sent: ${recoveryEmail?.reason || "unknown"}.`,
        order: updatedOrder,
        metadata: {
          source,
          event_id: event.id,
          event_type: event.type,
          stripe_invoice_id: invoice?.id || "",
          payment_update_url_present: Boolean(
            invoice?.hosted_invoice_url || invoice?.invoice_pdf
          ),
          recovery_email: recoveryEmail,
        },
      })
    );
  }

  return { success: true, order_id: updatedOrder.id };
}

async function processPaymentIntentFailed({ base44, event, source }) {
  const paymentIntent = event.data.object;
  const order = await resolveOrderFromPaymentIntent(base44, paymentIntent);

  if (!order) {
    return { success: false, reason: "order_not_found" };
  }

  const providerMessageId = `${event.id}:${order.id}`;
  const existingEvent = await findCommunicationEvent(base44, providerMessageId);
  if (existingEvent) {
    return { success: true, duplicate: true, order_id: order.id };
  }

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    stripe_event_id: event.id,
    stripe_payment_intent_id: paymentIntent?.id || order.stripe_payment_intent_id,
    payment_status: "payment_failed",
    billing_status: "past_due",
  });

  let recoveryEmail = null;
  try {
    recoveryEmail = await sendPaymentRecoveryEmail({
      base44,
      order: updatedOrder,
      invoice: {
        id: paymentIntent?.invoice || "",
        amount_due: paymentIntent?.amount || paymentIntent?.amount_received || 0,
      },
    });
  } catch (error) {
    recoveryEmail = {
      sent: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      providerMessageId,
      subject: "Stripe payment intent failed",
      messageBody: `payment_intent.payment_failed synchronized to order ${order.id}.`,
      order: updatedOrder,
      metadata: {
        source,
        event_id: event.id,
        event_type: event.type,
        stripe_payment_intent_id: paymentIntent?.id || "",
        stripe_invoice_id: paymentIntent?.invoice || "",
        recovery_email: recoveryEmail,
      },
    })
  );

  await createCommunicationEvent(
    base44,
    buildCommunicationEvent({
      provider: "resend",
      channel: "email",
      direction: "outbound",
      eventType: recoveryEmail?.sent ? "email_sent" : "email_failed",
      status: recoveryEmail?.sent ? "sent" : "failed",
      providerMessageId: `payment_recovery:${event.id}:${order.id}`,
      subject: recoveryEmail?.sent
        ? "Payment recovery email sent"
        : "Payment recovery email failed",
      messageBody: recoveryEmail?.sent
        ? `Payment recovery email sent to ${updatedOrder.customer_email}.`
        : `Payment recovery email not sent: ${recoveryEmail?.reason || "unknown"}.`,
      order: updatedOrder,
      metadata: {
        source,
        event_id: event.id,
        event_type: event.type,
        stripe_payment_intent_id: paymentIntent?.id || "",
        recovery_email: recoveryEmail,
      },
    })
  );

  return { success: true, order_id: updatedOrder.id };
}

export async function handleCanonicalStripeWebhook(
  req,
  { source = "stripeWebhookOrders" } = {}
) {
  const stripe = await getStripeClient();

  if (!stripe) {
    return new Response("Stripe is not configured", { status: 500 });
  }

  const webhookSecrets = getWebhookSecrets();

  if (webhookSecrets.length === 0) {
    return new Response("Stripe webhook secret is missing", { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  let signatureError;
  try {
    for (const webhookSecret of webhookSecrets) {
      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          webhookSecret
        );
        break;
      } catch (error) {
        signatureError = error;
      }
    }
  } catch (error) {
    signatureError = error;
  }

  if (!event) {
    return new Response(
      `Webhook Error: ${signatureError instanceof Error ? signatureError.message : String(signatureError)}`,
      { status: 400 }
    );
  }

  const base44 = await getBase44Client(req);

  try {
    let result = { success: true, ignored: true };

    if (event.type === "checkout.session.completed") {
      result = await processCheckoutSessionCompleted({ base44, event, source });
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      result = await processSubscriptionLifecycle({ base44, event, source });
    } else if (
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.paid"
    ) {
      result = await processInvoiceEvent({ base44, event, source });
    } else if (event.type === "payment_intent.payment_failed") {
      result = await processPaymentIntentFailed({ base44, event, source });
    }

    const shouldRetry =
      result?.success === false &&
      (event.type === "checkout.session.completed" ||
        event.type === "invoice.payment_failed" ||
        event.type === "payment_intent.payment_failed");

    return Response.json(
      {
        received: true,
        source,
        event_type: event.type,
        result,
      },
      { status: shouldRetry ? 500 : 200 }
    );
  } catch (error) {
    await markPaymentEventFailed(base44, event, error, {
      fulfillment_status:
        event.type === "checkout.session.completed" ? "failed" : "not_required",
      install_job_status:
        event.type === "checkout.session.completed" ? "failed" : "not_required",
    });
    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        providerMessageId: event.id,
        status: "failed",
        subject: "Stripe webhook processing failed",
        messageBody: error instanceof Error ? error.message : String(error),
        metadata: {
          source,
          event_id: event.id,
          event_type: event.type,
        },
      })
    );

    return Response.json(
      {
        received: true,
        source,
        event_type: event.type,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
