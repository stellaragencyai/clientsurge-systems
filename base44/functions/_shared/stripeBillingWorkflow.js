import {
  buildCommunicationEvent,
  initializePaidOrderInstallPipeline,
} from "./installPipeline.js";
import {
  buildSubscriptionSummary,
  syncSubscriptionFromStripe,
} from "./subscriptionSync.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveStripeIdentifier(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && typeof value.id === "string") {
    return value.id;
  }

  return "";
}

async function findOrderForCheckoutSession({ base44, session }) {
  const metadataOrderId = cleanString(session?.metadata?.order_id);
  if (metadataOrderId) {
    const directOrder = await base44.asServiceRole.entities.Order.get(metadataOrderId).catch(() => null);
    if (directOrder) {
      return directOrder;
    }
  }

  const sessionId = cleanString(session?.id);
  if (!sessionId) {
    return null;
  }

  const orders = await base44.asServiceRole.entities.Order.filter({ stripe_session_id: sessionId });
  return orders?.[0] || null;
}

async function maybeCreateBillingEvent({
  base44,
  order,
  providerMessageId,
  eventType = "status_update",
  subject,
  messageBody,
  metadata = {},
}) {
  if (providerMessageId) {
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter({
      provider_message_id: providerMessageId,
    });

    if (existing?.length) {
      return existing[0];
    }
  }

  return base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order,
      provider: "stripe",
      event_type: eventType,
      status: "processed",
      subject,
      message_body: messageBody,
      metadata,
      provider_message_id: providerMessageId || undefined,
    })
  );
}

function buildOrderConfirmationEmail({ order, subscription }) {
  const planLabel =
    subscription?.plan_type ||
    order?.plan_type ||
    order?.pricing_summary?.package_name ||
    "Custom Service Bundle";
  const selectedServices =
    order?.items
      ?.filter((item) => item.tracking_enabled)
      .map((item) => item.product_name)
      .join(", ") || "your selected services";

  return {
    subject: `Order confirmed for ${order.business_name || order.customer_name || "your business"}`,
    body: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:620px;margin:0 auto;color:#1a1a1a;">
  <div style="background:linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 65%,#c8965c 100%);padding:32px 28px;border-radius:16px 16px 0 0;">
    <p style="margin:0 0 8px;color:#f5d9a8;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Order Confirmed</p>
    <h1 style="margin:0;color:white;font-size:28px;line-height:1.2;">We're reviewing your setup</h1>
  </div>
  <div style="border:1px solid #ead8c6;border-top:none;border-radius:0 0 16px 16px;padding:28px;background:#fffdfb;">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${order.customer_name || "there"},</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#5a4635;">
      Your ClientSurge order has been paid successfully. This email confirms the order and the next setup steps. Stripe may also send a payment receipt separately, depending on the billing configuration for this account.
    </p>
    <div style="background:#f8f3eb;border:1px solid #ead8c6;border-radius:12px;padding:16px;margin-bottom:18px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a5c2e;">Order Summary</p>
      <p style="margin:0 0 4px;font-size:14px;color:#1a1209;"><strong>Business:</strong> ${order.business_name || "Not provided"}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#1a1209;"><strong>Plan:</strong> ${planLabel}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#1a1209;"><strong>Services:</strong> ${selectedServices}</p>
      <p style="margin:0;font-size:14px;color:#1a1209;"><strong>Billing:</strong> Setup $${Number(order.total_setup || 0).toFixed(2)} and recurring $${Number(order.total_monthly || 0).toFixed(2)}/mo</p>
    </div>
    <div style="background:#eef7ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1d4ed8;">What Happens Next</p>
      <ol style="margin:0;padding-left:18px;color:#1f2937;font-size:14px;line-height:1.7;">
        <li>Your paid order is queued in our canonical install workspace.</li>
        <li>We complete configuration, provider review, and guided testing for each included service.</li>
        <li>Your client portal reflects real billing and setup status as the order moves forward.</li>
      </ol>
    </div>
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">You can review progress in your client portal after your account is linked.</p>
  </div>
</div>`,
  };
}

async function maybeSendOrderConfirmationEmail({
  base44,
  order,
  subscription,
  providerMessageId,
}) {
  const confirmationMessageId = providerMessageId ? `${providerMessageId}:order_confirmation` : "";
  if (confirmationMessageId) {
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter({
      provider_message_id: confirmationMessageId,
    });

    if (existing?.length) {
      return { sent: false, reason: "already_sent" };
    }
  }

  const email = buildOrderConfirmationEmail({ order, subscription });
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: order.customer_email,
    subject: email.subject,
    body: email.body,
    from_name: "ClientSurge Systems",
  });

  await base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order,
      channel: "email",
      direction: "outbound",
      provider: "internal",
      event_type: "email_sent",
      status: "sent",
      subject: "Order confirmation email sent",
      message_body: `Order confirmation email sent to ${order.customer_email}.`,
      metadata: {
        context_type: "billing_confirmation",
        stripe_subscription_id: order.stripe_subscription_id || null,
      },
      provider_message_id: confirmationMessageId || undefined,
    })
  );

  return { sent: true };
}

async function maybeInitializeInstallOs({ base44, orderId }) {
  if (!orderId) {
    return { initialized: false, reason: "missing_order_id" };
  }

  const invokeInstallOs = base44?.asServiceRole?.functions?.invoke;
  if (typeof invokeInstallOs !== "function") {
    return { initialized: false, reason: "invoke_unavailable" };
  }

  try {
    await invokeInstallOs("initializeInstallOS", {
      order_id: orderId,
    });
    return { initialized: true };
  } catch (error) {
    console.warn(
      `[Stripe Billing] initializeInstallOS failed for order ${orderId}: ${error.message}`
    );
    return { initialized: false, reason: error.message };
  }
}

export async function handleCheckoutSessionCompleted({
  base44,
  session,
  eventId = "",
  stripeSubscriptionLoader,
  now = new Date().toISOString(),
}) {
  const order = await findOrderForCheckoutSession({ base44, session });
  if (!order) {
    return {
      success: false,
      reason: "order_not_found",
    };
  }

  const stripeCustomerId = resolveStripeIdentifier(session.customer);
  const stripeSubscriptionId = resolveStripeIdentifier(session.subscription);
  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    stripe_session_id: cleanString(session.id) || order.stripe_session_id,
    stripe_customer_id: stripeCustomerId || order.stripe_customer_id || undefined,
    stripe_subscription_id: stripeSubscriptionId || order.stripe_subscription_id || undefined,
    payment_status: session.payment_status === "paid" ? "paid" : order.payment_status,
    billing_status: stripeSubscriptionId ? (order.billing_status || "active") : order.billing_status,
    order_status:
      session.payment_status === "paid"
        ? "paid_setup_in_progress"
        : order.order_status,
  });

  await maybeCreateBillingEvent({
    base44,
    order: updatedOrder,
    providerMessageId: eventId || cleanString(session.id),
    subject: "Stripe checkout completed",
    messageBody: `Stripe checkout completed for order ${updatedOrder.id}.`,
    metadata: {
      stripe_event_type: "checkout.session.completed",
      stripe_session_id: cleanString(session.id),
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null,
    },
  });

  const initialized = await initializePaidOrderInstallPipeline({
    base44,
    order: updatedOrder,
    stripeCustomerId,
    eventSource: "stripe.checkout.session.completed",
    now,
  });

  let syncedSubscription = null;
  let syncedOrder = initialized.order;
  if (stripeSubscriptionId && typeof stripeSubscriptionLoader === "function") {
    const stripeSubscription = await stripeSubscriptionLoader(stripeSubscriptionId);
    if (stripeSubscription) {
      const syncResult = await syncSubscriptionFromStripe({
        base44,
        stripeSubscription,
        eventType: "checkout.session.completed",
        fallbackOrderId: initialized.order.id,
        sourceEventId: eventId ? `${eventId}:subscription_sync` : "",
        now,
      });
      syncedSubscription = syncResult.subscription || null;
      syncedOrder = syncResult.order || syncedOrder;
    }
  }

  await maybeInitializeInstallOs({
    base44,
    orderId: syncedOrder.id,
  });

  await maybeSendOrderConfirmationEmail({
    base44,
    order: syncedOrder,
    subscription: buildSubscriptionSummary(syncedSubscription),
    providerMessageId: eventId || cleanString(session.id),
  });

  return {
    success: true,
    order: syncedOrder,
    subscription: syncedSubscription,
  };
}

async function findOrderForInvoice({ base44, stripeInvoice }) {
  const subscriptionId = cleanString(resolveStripeIdentifier(stripeInvoice.subscription));
  if (subscriptionId) {
    const ordersBySubscription = await base44.asServiceRole.entities.Order.filter({
      stripe_subscription_id: subscriptionId,
    });
    if (ordersBySubscription?.length) {
      return ordersBySubscription[0];
    }
  }

  const customerId = cleanString(resolveStripeIdentifier(stripeInvoice.customer));
  if (!customerId) {
    return null;
  }

  const ordersByCustomer = await base44.asServiceRole.entities.Order.filter({
    stripe_customer_id: customerId,
  });

  return ordersByCustomer?.[0] || null;
}

export async function handleInvoiceLifecycleEvent({
  base44,
  stripe,
  stripeInvoice,
  eventType,
  eventId = "",
  now = new Date().toISOString(),
}) {
  const order = await findOrderForInvoice({ base44, stripeInvoice });
  if (!order) {
    return {
      success: false,
      reason: "order_not_found",
    };
  }

  let syncedSubscription = null;
  let workingOrder = order;
  const subscriptionId = cleanString(resolveStripeIdentifier(stripeInvoice.subscription));
  if (subscriptionId) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const syncResult = await syncSubscriptionFromStripe({
      base44,
      stripeSubscription,
      eventType,
      fallbackOrderId: order.id,
      sourceEventId: eventId ? `${eventId}:subscription_sync` : "",
      now,
    });

    syncedSubscription = syncResult.subscription || null;
    workingOrder = syncResult.order || order;
  }

  const nextPaymentStatus =
    eventType === "invoice.payment_failed" ? "failed" : "paid";
  const nextBillingStatus =
    syncedSubscription?.status ||
    (eventType === "invoice.payment_failed" ? "past_due" : workingOrder.billing_status || "active");
  const nextOrder = await base44.asServiceRole.entities.Order.update(workingOrder.id, {
    payment_status: nextPaymentStatus,
    billing_status: nextBillingStatus,
    last_install_event_at: now,
  });

  await maybeCreateBillingEvent({
    base44,
    order: nextOrder,
    providerMessageId: eventId || cleanString(stripeInvoice.id),
    subject:
      eventType === "invoice.payment_failed"
        ? "Stripe payment failed"
        : "Stripe payment succeeded",
    messageBody:
      eventType === "invoice.payment_failed"
        ? `Stripe marked invoice ${stripeInvoice.id} as payment failed.`
        : `Stripe marked invoice ${stripeInvoice.id} as paid.`,
    metadata: {
      stripe_event_type: eventType,
      stripe_invoice_id: cleanString(stripeInvoice.id),
      stripe_customer_id: cleanString(resolveStripeIdentifier(stripeInvoice.customer)) || null,
      stripe_subscription_id: subscriptionId || null,
      amount_due: stripeInvoice.amount_due || 0,
      amount_paid: stripeInvoice.amount_paid || 0,
    },
  });

  return {
    success: true,
    order: nextOrder,
    subscription: syncedSubscription,
  };
}
