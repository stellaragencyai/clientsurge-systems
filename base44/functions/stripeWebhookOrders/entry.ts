import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

if (stripeSecretKey.startsWith("sk_test_")) {
  console.warn("[STRIPE] Running in TEST MODE. Switch to sk_live_ before going live.");
} else if (!stripeSecretKey) {
  console.error("[STRIPE] STRIPE_SECRET_KEY is not set.");
} else {
  console.info("[STRIPE] Live mode key detected.");
}

function maskSecret(secret = "") {
  if (!secret) return "missing";
  if (secret.length <= 8) return `${secret.slice(0, 2)}***`;
  return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
}

async function resolveStripeAccountSummary() {
  if (!stripe) return { secret_present: false, livemode: null };
  try {
    const account = await stripe.accounts.retrieve();
    return {
      secret_present: true,
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : "sk_live_",
      secret_fingerprint: maskSecret(stripeSecretKey),
      livemode: Boolean(account?.livemode),
      account_id: account?.id || null,
    };
  } catch (error) {
    return {
      secret_present: true,
      livemode: null,
      account_lookup_error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Initialize paid order in the install pipeline
async function initializePaidOrder({ base44, order, stripeCustomerId }) {
  console.log(`[stripeWebhookOrders] Initializing order ${order.id}`);

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    payment_status: "paid",
    stripe_customer_id: stripeCustomerId || null,
    pipeline_status: "Ready for Install",
    install_initialized_at: new Date().toISOString(),
  });

  // Create or link ClientProject
  let clientProject;
  const existing = await base44.asServiceRole.entities.ClientProject.filter(
    { order_id: order.id },
    "-created_date",
    1
  ).catch(() => []);

  if (existing?.length > 0) {
    clientProject = existing[0];
    console.log(`[stripeWebhookOrders] Linked to existing project ${clientProject.id}`);
  } else {
    clientProject = await base44.asServiceRole.entities.ClientProject.create({
      order_id: order.id,
      business_name: order.business_name,
      client_email: order.customer_email,
      client_name: order.customer_name,
      status: "Configuring",
      plan: order.plan_type || "Custom Services",
    });
    console.log(`[stripeWebhookOrders] Created project ${clientProject.id}`);
  }

  await base44.asServiceRole.entities.Order.update(order.id, {
    client_id: clientProject.id,
  });

  return { order: updatedOrder, project: clientProject };
}

// Sync subscription fields from Stripe to Order entity
async function syncSubscriptionFields({ base44, stripeSubscription, eventType, fallbackOrderId = "" }) {
  if (!stripeSubscription) return;
  const orderId = stripeSubscription.metadata?.order_id || fallbackOrderId;
  if (!orderId) {
    console.warn("[syncSubscription] No order_id in subscription metadata", { subscriptionId: stripeSubscription.id });
    return;
  }
  const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
  if (!order) {
    console.warn("[syncSubscription] Order not found", { orderId });
    return;
  }
  const updates = {
    stripe_subscription_id: stripeSubscription.id,
    subscription_status: eventType === "customer.subscription.deleted" ? "canceled" : stripeSubscription.status,
    billing_status: eventType === "customer.subscription.deleted" ? "canceled" : stripeSubscription.status,
    current_period_start: stripeSubscription.current_period_start
      ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
      : null,
  };
  await base44.asServiceRole.entities.Order.update(orderId, updates);
  console.log("[syncSubscription] Updated", { orderId, status: updates.subscription_status });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!stripe) {
    console.error("[stripeWebhookOrders] Stripe not configured", { requestId });
    return new Response("Webhook Error: Stripe is not configured", { status: 500 });
  }

  if (!webhookSecret) {
    console.error("[stripeWebhookOrders] STRIPE_WEBHOOK_SECRET missing", { requestId });
    return new Response("Webhook Error: STRIPE_WEBHOOK_SECRET is missing", { status: 500 });
  }

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripeWebhookOrders] Signature error", { requestId, message: err instanceof Error ? err.message : String(err) });
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`, { status: 400 });
  }

  console.log("[stripeWebhookOrders] event received", {
    requestId,
    eventId: event.id,
    eventType: event.type,
    stripeAccount: await resolveStripeAccountSummary(),
  });

  const base44 = createClientFromRequest(req);

  // ── checkout.session.completed ───────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    const orderId = session.metadata?.order_id || "";
    const orders = orderId
      ? [await base44.asServiceRole.entities.Order.get(orderId).catch(() => null)].filter(Boolean)
      : await base44.asServiceRole.entities.Order.filter({ stripe_session_id: sessionId });

    console.log("[stripeWebhookOrders] checkout.session.completed lookup", {
      requestId, eventId: event.id, sessionId, orderId, customerId, subscriptionId,
      sessionLivemode: session.livemode,
      metadata: session.metadata || {},
      matchedOrderIds: (orders || []).map((o) => o.id),
    });

    if (orders && orders.length > 0) {
      const order = orders[0];
      try {
        const initialized = await initializePaidOrder({ base44, order, stripeCustomerId: customerId });

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
          await syncSubscriptionFields({
            base44, stripeSubscription: subscription, eventType: event.type,
            fallbackOrderId: initialized.order.id,
          });
        }

        console.log("[stripeWebhookOrders] order marked paid", {
          requestId, eventId: event.id, orderId: order.id, sessionId, subscriptionId,
        });

        // ── Customer confirmation email ────────────────────────────────────────
        try {
          await base44.asServiceRole.functions.invoke("sendOrderConfirmationEmail", {
            customer_email: session.customer_details?.email || order.customer_email,
            customer_name: session.metadata?.customer_name || order.customer_name,
            business_name: session.metadata?.business_name || order.business_name,
            order_id: order.id,
            items: order.items || [],
            total_setup: order.total_setup,
            total_monthly: order.total_monthly,
          });
          console.log("[stripeWebhookOrders] customer confirmation email sent", { orderId: order.id });
        } catch (emailError) {
          console.error("[stripeWebhookOrders] customer confirmation email failed", {
            orderId: order.id,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }

        // ── Customer SMS confirmation ──────────────────────────────────────────
        if (order.customer_phone) {
          try {
            const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
            const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
            const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
            if (accountSid && authToken && fromNumber) {
              const smsBody = `Hi ${order.customer_name || "there"}! Your ClientSurge order is confirmed. Our team will begin setup within 1 business day. Questions? Reply here or email support@clientsurgesystems.com. Reply STOP to unsubscribe.`;
              await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ To: order.customer_phone, From: fromNumber, Body: smsBody }),
              });
              console.log("[stripeWebhookOrders] order confirmation SMS sent", { orderId: order.id });
            }
          } catch (smsError) {
            console.error("[stripeWebhookOrders] order confirmation SMS failed", {
              orderId: order.id,
              error: smsError instanceof Error ? smsError.message : String(smsError),
            });
          }
        }

        // ── Initialize Install OS (checklists + steps per service) ────────────
        try {
          const installOSResult = await base44.asServiceRole.functions.invoke("initializeInstallOS", {
            order_id: order.id,
          });
          console.log("[stripeWebhookOrders] initializeInstallOS complete", {
            orderId: order.id,
            install_os_id: installOSResult?.install_os_id,
            checklist_ids: installOSResult?.checklist_ids,
            steps_created: installOSResult?.steps_created,
            already_initialized: installOSResult?.already_initialized,
          });
        } catch (installOSErr) {
          console.error("[stripeWebhookOrders] initializeInstallOS failed (non-blocking)", {
            orderId: order.id,
            error: installOSErr instanceof Error ? installOSErr.message : String(installOSErr),
          });
        }

        // ── Credentials intake email (with setup link) ────────────────────────
        try {
          const appUrl = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";
          const credentialsUrl = `${appUrl}/setup/credentials?order_id=${order.id}`;
          const customerName = session.metadata?.customer_name || order.customer_name || "there";
          const businessName = session.metadata?.business_name || order.business_name || "your business";
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: session.customer_details?.email || order.customer_email,
            from_name: "ClientSurge Systems",
            subject: "⚡ Action Required: Complete Your Setup (5 min)",
            body: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#0A1628;font-size:26px;margin:0 0 8px;font-weight:800;">Payment Confirmed — One More Step!</h1>
    <p style="color:#666;font-size:15px;margin:0;">Hi ${customerName}, your order for <strong>${businessName}</strong> is confirmed. We need a few details to start building your systems.</p>
  </div>
  <div style="background:linear-gradient(135deg,#0A1628 0%,#003B8F 100%);border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
    <p style="color:#fff;font-size:14px;margin:0 0 20px;line-height:1.6;">Click below to complete your 5-minute setup intake form. This is what our team needs to configure your automations.</p>
    <a href="${credentialsUrl}" style="display:inline-block;background:linear-gradient(135deg,#00AEEF,#0077CC);color:#fff;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px;">Complete My Setup →</a>
  </div>
  <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:24px;">
    <p style="font-size:13px;font-weight:700;color:#333;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">What You'll Provide:</p>
    <ul style="font-size:13px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
      <li>Business name, phone, and hours</li>
      <li>Logo and brand colors</li>
      <li>Booking link and notification email</li>
      <li>Any existing lead sources or integrations</li>
    </ul>
  </div>
  <p style="font-size:13px;color:#999;text-align:center;">Questions? Reply to this email or contact <a href="mailto:support@clientsurgesystems.com" style="color:#0077CC;">support@clientsurgesystems.com</a></p>
</div>`,
          });
          console.log("[stripeWebhookOrders] credentials intake email sent", { orderId: order.id });
        } catch (credEmailErr) {
          console.error("[stripeWebhookOrders] credentials intake email failed", {
            orderId: order.id,
            error: credEmailErr instanceof Error ? credEmailErr.message : String(credEmailErr),
          });
        }

        // ── Admin purchase notification ────────────────────────────────────────
        try {
          await base44.asServiceRole.functions.invoke("sendAdminPurchaseNotification", {
            customer_name: session.metadata?.customer_name || order.customer_name,
            customer_email: session.customer_details?.email || order.customer_email,
            customer_phone: order.customer_phone || "",
            business_name: session.metadata?.business_name || order.business_name,
            order_id: order.id,
            items: order.items || [],
            total_setup: order.total_setup,
            total_monthly: order.total_monthly,
          });
          console.log("[stripeWebhookOrders] admin purchase notification sent", { orderId: order.id });
        } catch (adminErr) {
          console.error("[stripeWebhookOrders] admin purchase notification failed", {
            orderId: order.id,
            error: adminErr instanceof Error ? adminErr.message : String(adminErr),
          });
        }

      } catch (error) {
        console.error("[stripeWebhookOrders] pipeline init failed", {
          requestId, eventId: event.id, orderId: order.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't throw — return 200 to prevent Stripe retry loop
      }
    } else {
      console.warn("[stripeWebhookOrders] no order matched checkout.session.completed", {
        requestId, eventId: event.id, sessionId, orderId, metadata: session.metadata || {},
      });
    }
  }

  // ── Subscription lifecycle ───────────────────────────────────────────────────
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscriptionFields({ base44, stripeSubscription: event.data.object, eventType: event.type });
  }

  // ── Invoice payment events ───────────────────────────────────────────────────
  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
        expand: ["items.data.price"],
      });
      await syncSubscriptionFields({
        base44, stripeSubscription: subscription, eventType: event.type,
        fallbackOrderId: invoice.metadata?.order_id || "",
      });
    }

    // ── Set billing_status: "past_due" on payment failure ─────────────────────
    if (event.type === "invoice.payment_failed") {
      const orderId = invoice.metadata?.order_id || invoice.subscription_details?.metadata?.order_id || "";
      if (orderId) {
        await base44.asServiceRole.entities.Order.update(orderId, {
          billing_status: "past_due",
        }).catch((err) => console.error("[stripeWebhookOrders] Failed to set past_due", { orderId, error: err.message }));
        console.log("[stripeWebhookOrders] billing_status set to past_due", { orderId });

        // ── USE CASE #6: Trigger voice recovery call to client ─────────────
        try {
          const [settings] = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
          if (settings?.payment_recovery_voice_enabled) {
            const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
            if (order?.customer_phone) {
              const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
              const phoneNumberId = settings?.elevenlabs_phone_number_ids?.general
                || settings?.elevenlabs_phone_number_ids?.med_spa;
              // Use a dedicated payment recovery agent if configured, else fallback to general
              const agentId = settings?.elevenlabs_agent_ids?.payment_recovery
                || settings?.elevenlabs_agent_ids?.general;

              if (elevenLabsKey && phoneNumberId && agentId) {
                const firstName = (order.customer_name || "").split(" ")[0] || "there";
                const callRes = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": elevenLabsKey,
                  },
                  body: JSON.stringify({
                    agent_id: agentId,
                    agent_phone_number_id: phoneNumberId,
                    to_number: order.customer_phone,
                    conversation_initiation_client_data: {
                      conversation_config_override: {
                        agent: {
                          first_message: `Hi ${firstName}, this is a quick heads-up from ClientSurge Systems. We noticed your subscription payment didn't go through and we want to make sure your automation systems stay running. I can help you sort this out right now — do you have 60 seconds?`,
                        },
                      },
                    },
                  }),
                });

                if (callRes.ok) {
                  const callData = await callRes.json();
                  await base44.asServiceRole.entities.CommunicationEvent.create({
                    order_id: orderId,
                    channel: "voice",
                    direction: "outbound",
                    event_type: "voice_call_initiated",
                    provider: "elevenlabs",
                    status: "sent",
                    subject: "Payment Recovery Voice Call",
                    metadata_json: JSON.stringify({ trigger: "payment_failed", conversation_id: callData?.conversation_id, order_id: orderId }),
                  });
                  console.log("[stripeWebhookOrders] Payment recovery voice call initiated", { orderId, conversation_id: callData?.conversation_id });
                } else {
                  const err = await callRes.json().catch(() => ({}));
                  console.error("[stripeWebhookOrders] Payment recovery call failed", { orderId, error: err });
                }
              } else {
                console.log("[stripeWebhookOrders] Payment recovery voice: missing agent/phone config — skipping");
              }
            }
          }
        } catch (voiceErr) {
          console.error("[stripeWebhookOrders] Payment recovery voice call error (non-blocking)", { orderId, error: voiceErr.message });
        }
        // ──────────────────────────────────────────────────────────────────────
      }
    }
  }

  return Response.json({ received: true });
});