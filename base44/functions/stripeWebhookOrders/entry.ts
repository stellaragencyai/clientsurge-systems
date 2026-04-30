import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
// syncSubscriptionFromStripe will be called if needed

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    // Find the order and mark it paid
    const orderId = session.metadata?.order_id || "";
    const orders = orderId
      ? [await base44.asServiceRole.entities.Order.get(orderId).catch(() => null)].filter(Boolean)
      : await base44.asServiceRole.entities.Order.filter({ stripe_session_id: sessionId });
    if (!orders || orders.length === 0) {
      console.error(`[Webhook] No order found for session ${sessionId} (order_id metadata: "${orderId}"). Cannot process payment.`);
      return Response.json({ received: true, warning: "Order not found" });
    }

    if (orders && orders.length > 0) {
      const order = orders[0];

      // Mark order as paid FIRST — before pipeline, so it's never orphaned
      try {
        await base44.asServiceRole.entities.Order.update(order.id, {
          payment_status: "paid",
          order_status: "paid_setup_in_progress",
        });
        console.log(`Order ${order.id} marked as paid`);
      } catch (updateError) {
        console.error(`Order ${order.id} payment status update failed:`, updateError.message);
      }

      // Trigger install pipeline via dedicated function
      try {
        await base44.asServiceRole.functions.invoke("installPipeline", {
          action: "initialize",
          order_id: order.id,
        });

        if (subscriptionId) {
          console.log(`Subscription ${subscriptionId} created with order`);
        }
        console.log(`Order ${order.id} marked as paid and installation pipeline initialized`);
      } catch (error) {
        console.warn(`Order ${order.id} payment processed but install pipeline error:`, error.message);
        // Don't fail webhook - order is still paid
      }

      // Initialize Client Installation OS + checklists (non-blocking)
      try {
        console.log(`[Webhook] Initializing Client Installation OS for order ${order.id}`);
        await base44.asServiceRole.functions.invoke("initializeInstallOS", {
          order_id: order.id,
        });
        console.log(`[Webhook] Client Installation OS initialized successfully for order ${order.id}`);
      } catch (osError) {
        console.warn(`[Webhook] Client Installation OS init failed for order ${order.id}: ${osError.message}`);
        // Non-blocking: don't fail webhook if checklist initialization fails
      }

      // Send onboarding email to client (non-blocking)
      try {
        console.log(`[Webhook] Sending onboarding email for order ${order.id}`);
        await base44.asServiceRole.functions.invoke("sendClientWelcomeEmail", {
          order_id: order.id,
        });
        console.log(`[Webhook] Onboarding email sent successfully for order ${order.id}`);
      } catch (emailError) {
        console.warn(`[Webhook] Onboarding email failed for order ${order.id}: ${emailError.message}`);
        // Non-blocking: don't fail webhook if email fails
      }

      // Send admin notification (non-blocking)
      try {
        const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
        if (adminEmail) {
          console.log(`[Webhook] Sending admin notification for order ${order.id}`);
          
          const servicesList = order.items?.map((i) => `${i.product_name} (${i.service_key})`).join(", ") || "—";
          
          const body = `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 580px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; color: white;">✓ New Order Received</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666; width: 160px;">Customer</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${order.customer_name || "—"}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Email</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${order.customer_email || "—"}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Business</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${order.business_name || "—"}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Order ID</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${order.id}</td>
      </tr>
    </table>

    <div style="background: #f9f9f9; border-left: 4px solid #9a5c2e; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #9a5c2e; font-size: 13px; text-transform: uppercase;">Services Ordered</p>
      <p style="margin: 0; color: #333; font-size: 13px; line-height: 1.6;">${servicesList}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Selected Package</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${order.selected_package_type || "Custom"}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Detected Package</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${order.package_type || "Custom"}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Setup Total</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: 700;">$${order.total_setup || 0}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Monthly Total</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: 700;">$${order.total_monthly || 0}/mo</td>
      </tr>
    </table>

    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">Order automatically transitioned to "Paid → Ready for Install"</p>
    </div>
  </div>
</div>`;

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `✓ New Order — ${order.business_name || order.customer_name} ($${order.total_setup} setup)`,
            body,
            from_name: "ClientSurge Systems",
          });

          console.log(`[Webhook] Admin notified of new order ${order.id}`);
        }
      } catch (adminEmailError) {
        console.warn(`[Webhook] Admin notification failed for order ${order.id}: ${adminEmailError.message}`);
        // Non-blocking: don't fail webhook if admin email fails
      }
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    console.log(`Subscription event: ${event.type}`, event.data.object.id);
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    console.log(`Invoice event: ${event.type}`, invoice.id);

    // ── Payment Failed: pause campaigns + update order + notify admin ──
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const stripeCustomerId = invoice.customer;
      console.log(`Payment failed for Stripe customer: ${stripeCustomerId}`);

      // Find the order by stripe_customer_id
      const orders = stripeCustomerId
        ? await base44.asServiceRole.entities.Order.filter({ stripe_customer_id: stripeCustomerId })
        : [];

      if (orders?.length > 0) {
        const order = orders[0];

        // 1. Mark order payment_status as failed
        await base44.asServiceRole.entities.Order.update(order.id, { payment_status: "failed" });
        console.log(`Order ${order.id} marked as payment failed`);

        const normalizedCustomerEmail = normalizeEmail(order.customer_email);
        const dripCampaigns = await base44.asServiceRole.entities.DripCampaign.filter({ status: "active" }, "-created_date", 5000);
        const nurtureCampaigns = await base44.asServiceRole.entities.NurtureCampaign.filter({ status: "active" }, "-created_date", 5000);
        const matchingDripCampaigns = (dripCampaigns || []).filter((campaign) =>
          normalizeEmail(campaign.lead_email) === normalizedCustomerEmail
        );
        const matchingNurtureCampaigns = (nurtureCampaigns || []).filter((campaign) =>
          normalizeEmail(campaign.lead_email) === normalizedCustomerEmail
        );

        const pauseResults = await Promise.allSettled([
          ...matchingDripCampaigns.map(c =>
            base44.asServiceRole.entities.DripCampaign.update(c.id, { status: "paused", stop_reason: "manual_pause", notes: (c.notes || "") + `\n[Payment Failed: ${new Date().toISOString()}] Paused due to failed payment for order ${order.id}.` })
          ),
          ...matchingNurtureCampaigns.map(c =>
            base44.asServiceRole.entities.NurtureCampaign.update(c.id, { status: "paused", notes: (c.notes || "") + `\n[Payment Failed: ${new Date().toISOString()}] Paused due to failed payment for order ${order.id}.` })
          ),
        ]);
        console.log(`Paused ${matchingDripCampaigns.length} drip + ${matchingNurtureCampaigns.length} nurture campaigns`);

        // 3. Notify admin via email
        const adminEmail = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#dc2626;padding:20px 28px;border-radius:10px 10px 0 0;">
    <h2 style="color:white;margin:0;font-size:18px;">⚠️ Payment Failed — Client Action Required</h2>
  </div>
  <div style="padding:28px;border:1px solid #fca5a5;border-top:none;border-radius:0 0 10px 10px;background:#fff5f5;">
    <table style="font-size:14px;color:#333;width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#888;width:140px;">Customer</td><td>${order.customer_name || "—"}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#888;">Email</td><td>${order.customer_email || "—"}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#888;">Business</td><td>${order.business_name || "—"}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#888;">Order ID</td><td>${order.id}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#888;">Stripe Customer</td><td>${stripeCustomerId}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#888;">Invoice Amount</td><td>$${((invoice.amount_due || 0) / 100).toFixed(2)}</td></tr>
    </table>
    <div style="margin-top:20px;padding:14px;background:#fee2e2;border-radius:8px;border-left:4px solid #dc2626;">
      <p style="margin:0;font-size:13px;color:#7f1d1d;font-weight:600;">Actions Taken Automatically</p>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#991b1b;line-height:1.8;">
        <li>Order payment_status set to <strong>failed</strong></li>
          <li>${matchingDripCampaigns.length} drip campaign(s) paused</li>
          <li>${matchingNurtureCampaigns.length} nurture campaign(s) paused</li>
        </ul>
      </div>
    <p style="margin-top:16px;font-size:13px;color:#555;">The client's portal now shows a payment failed banner prompting them to update their payment method. Campaigns will remain paused until payment is resolved.</p>
    <div style="margin-top:20px;text-align:center;">
      <a href="https://dashboard.stripe.com/customers/${stripeCustomerId}" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:9999px;">View in Stripe →</a>
    </div>
  </div>
</div>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: "nolan@clientsurgesystems.com",
          from_name: "ClientSurge Systems",
          subject: `⚠️ Payment Failed — ${order.business_name || order.customer_name} (${order.customer_email})`,
          body: adminEmail,
        });

        const failedPauseCount = pauseResults.filter((result) => result.status === "rejected").length;
        if (failedPauseCount > 0) {
          console.warn(`Failed to pause ${failedPauseCount} campaign(s) for order ${order.id}`);
        }

        console.log(`Admin notified of payment failure for order ${order.id}`);
      }
    }
  }

  return Response.json({ received: true });
});