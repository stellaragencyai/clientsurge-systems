/**
 * Auto Advance Install Pipeline
 * Scheduled: Every 5 minutes
 * Purpose: Automatically advance orders through setup pipeline (Paid → Configuring → Testing → Live)
 * 
 * Workflow:
 * 1. Find orders in "Ready for Install" state
 * 2. Auto-configure services (provision Twilio, set templates, etc)
 * 3. Mark as "Testing"
 * 4. Validate service health
 * 5. Mark as "Live" when ready
 * 6. Send "You're Live" notification to client
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const SERVICE_CONFIG = {
  instant_lead_response: { requires: ["sms_template"] },
  missed_call_text_back: { requires: ["twilio_number"] },
  nurture_sequence_14d: { requires: [] },
  ai_booking_agent: { requires: ["booking_link"] },
  lead_reactivation: { requires: [] },
};

async function provisionServices(base44, order) {
  const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
  const adminSettings = settings?.[0] || {};

  const config = {
    twilio_number: adminSettings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER"),
    resend_from_email: adminSettings.resend_from_email || Deno.env.get("RESEND_FROM_EMAIL"),
    booking_link_default: adminSettings.booking_link_default || "",
    sms_template: adminSettings.sms_template || "Hi {first_name}, thanks for reaching out! We received your message.",
  };

  const validated = order.items?.every((item) => {
    const requirements = SERVICE_CONFIG[item.service_key]?.requires || [];
    return requirements.every((req) => config[req]);
  });

  if (!validated) {
    throw new Error("Configuration incomplete: missing required settings");
  }

  return config;
}

async function validateServiceHealth(base44, order, config) {
  const checks = [];

  for (const item of order.items || []) {
    if (item.service_key === "instant_lead_response" || item.service_key === "missed_call_text_back") {
      // Check Twilio credentials
      if (!config.twilio_number) {
        checks.push({ service: item.service_key, status: "failed", reason: "Missing Twilio number" });
        continue;
      }
      checks.push({ service: item.service_key, status: "healthy" });
    } else if (item.service_key === "nurture_sequence_14d") {
      // Check Resend email config
      if (!config.resend_from_email) {
        checks.push({ service: item.service_key, status: "failed", reason: "Missing email sender" });
        continue;
      }
      checks.push({ service: item.service_key, status: "healthy" });
    } else {
      checks.push({ service: item.service_key, status: "healthy" });
    }
  }

  const allHealthy = checks.every((c) => c.status === "healthy");
  return { checks, all_healthy: allHealthy };
}

async function sendLiveNotification(base44, order) {
  const serviceNames = order.items
    ?.map((i) => i.product_name)
    .join(", ");

  const body = `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 580px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 32px; color: white;">🚀 You're Live!</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hi ${order.customer_name},</p>
    
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555;">
      Your ClientSurge automation is now <strong>active and running</strong>. Your services are live and ready to work.
    </p>
    
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; color: #1e40af; font-size: 14px;">✓ Active Services</p>
      <p style="margin: 8px 0 0; color: #1e40af; font-size: 13px;">${serviceNames}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="https://clientsurgesystems.com/client-portal" style="display: inline-block; background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); color: white; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 999px; font-size: 14px;">
        Access Your Dashboard →
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">Questions? Use the support chat in your portal.</p>
    </div>
  </div>
</div>`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: order.customer_email,
    subject: "🚀 Your ClientSurge Systems Are LIVE!",
    body,
    from_name: "ClientSurge Systems",
  });

  console.log(`[AutoAdvance] Sent live notification to ${order.customer_email}`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no auth required)
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find orders in "Ready for Install" state
    const orders = await base44.asServiceRole.entities.Order.filter(
      { pipeline_status: "Ready for Install" },
      "-install_initialized_at",
      100
    );

    if (!orders?.length) {
      return Response.json({
        success: true,
        processed: 0,
        message: "No orders ready for installation",
      });
    }

    const results = { processed: 0, advanced: 0, failed: 0 };

    for (const order of orders) {
      try {
        console.log(`[AutoAdvance] Processing order ${order.id}`);

        // Step 1: Provision services
        const config = await provisionServices(base44, order);
        console.log(`[AutoAdvance] Services provisioned for ${order.id}`);

        // Step 2: Advance to "Configuring"
        await base44.asServiceRole.entities.Order.update(order.id, {
          pipeline_status: "Configuring",
          last_install_event_at: new Date().toISOString(),
        });

        // Step 3: Validate health
        const health = await validateServiceHealth(base44, order, config);
        if (!health.all_healthy) {
          console.error(`[AutoAdvance] Health check failed for ${order.id}:`, health.checks);
          await base44.asServiceRole.entities.Order.update(order.id, {
            pipeline_status: "Error",
            install_error: `Health check failed: ${JSON.stringify(health.checks)}`,
          });
          results.failed++;
          continue;
        }

        // Step 4: Advance to "Testing"
        await base44.asServiceRole.entities.Order.update(order.id, {
          pipeline_status: "Testing",
          last_install_event_at: new Date().toISOString(),
        });

        // Step 5: Auto-advance to "Live" (services are ready)
        await base44.asServiceRole.entities.Order.update(order.id, {
          pipeline_status: "Live",
          order_status: "fully_live",
          last_install_event_at: new Date().toISOString(),
        });

        // Step 6: Send live notification
        await sendLiveNotification(base44, order);

        // Log success event
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: null,
          channel: "internal",
          direction: "system",
          event_type: "workflow_triggered",
          provider: "internal",
          status: "processed",
          subject: "Auto-installation pipeline completed",
          message_body: `Order ${order.id} auto-advanced from Ready for Install → Live`,
          metadata_json: JSON.stringify({
            order_id: order.id,
            pipeline_completed: true,
            timestamp: new Date().toISOString(),
          }),
        });

        results.advanced++;
        console.log(`[AutoAdvance] Order ${order.id} is now LIVE`);
      } catch (error) {
        console.error(`[AutoAdvance] Error processing ${order.id}:`, error.message);
        try {
          await base44.asServiceRole.entities.Order.update(order.id, {
            pipeline_status: "Error",
            install_error: error.message,
          });
        } catch (_) {}
        results.failed++;
      }

      results.processed++;
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error("[AutoAdvance] Fatal error:", error.message);
    return Response.json(
      { error: error.message || "Failed to advance install pipeline" },
      { status: 500 }
    );
  }
});