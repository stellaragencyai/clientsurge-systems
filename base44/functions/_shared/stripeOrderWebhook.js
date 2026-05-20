import { initializePaidOrderInstallPipeline } from "./installPipeline.js";
import { normalizePackageKey } from "../../../src/lib/salesCatalog.js";

function getStripeSecretKey() {
  try {
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

async function getStripeClient() {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    return null;
  }

  const { default: Stripe } = await import("npm:stripe@14");
  return new Stripe(stripeSecretKey);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
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

  await base44.asServiceRole.functions.invoke("sendOrderConfirmationEmail", {
    order_id: order.id,
    portal_activation_url: buildPortalUrl(portalActivationUrl),
  });

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
  const order = await resolveOrderFromCheckoutSession(base44, session);

  if (!order) {
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
  if (existingEvent) {
    return { success: true, duplicate: true, order_id: order.id };
  }

  const now = new Date().toISOString();
  const subscriptionId = cleanString(session?.subscription);
  const stripe = subscriptionId ? await getStripeClient() : null;
  const subscription = subscriptionId
    ? await stripe?.subscriptions.retrieve(subscriptionId)
    : null;

  const initialized = await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: cleanString(session?.customer),
    eventSource: `${source}:${event.type}`,
    now,
  });

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
    payment_status: "paid",
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
  await ensureAdminPurchaseNotification(base44, updatedOrder);

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
  });

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
    }

    return Response.json({
      received: true,
      source,
      event_type: event.type,
      result,
    });
  } catch (error) {
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

    return Response.json({
      received: true,
      source,
      event_type: event.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
