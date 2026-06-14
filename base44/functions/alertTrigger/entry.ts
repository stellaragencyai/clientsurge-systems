import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

/**
 * Trigger alerts for high-intent leads/conversations
 * Called automatically when ConversationThread or LeadEvent is created
 * Supports toast + email + SMS notifications (async, non-blocking)
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST only" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { trigger_type, lead_id, conversation_id, phone_number, intent, message } = payload;

    if (!trigger_type || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine alert type and priority
    const isBooking = intent === "booking" || message.toLowerCase().includes("book");
    const isUrgent =
      message.toLowerCase().includes("urgent") ||
      message.toLowerCase().includes("now") ||
      message.toLowerCase().includes("asap");

    const alertType = isBooking ? "booking" : "lead";
    const priority = isUrgent ? "high" : "medium";

    // Create alert record
    const alert = await base44.entities.Alert.create({
      type: alertType,
      message,
      phone_number,
      lead_id,
      conversation_id,
      intent: intent || "unknown",
      priority,
      source: trigger_type === "twilio" ? "twilio" : "webhook",
      read_status: false,
      notification_sent: false,
      notification_channels: [],
    });

    // Fire notifications asynchronously (don't wait, don't block response)
    // This ensures Twilio webhook returns quickly
    notifyAdmin(alert, base44).catch((err) => {
      console.error("[alertTrigger] Notification failed (async):", err);
      // Fail silently - don't break the webhook
    });

    return Response.json({
      success: true,
      alert_id: alert.id,
      type: alertType,
      priority,
    });
  } catch (error) {
    console.error("[alertTrigger] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Send notifications to admin asynchronously
 * Does not block the webhook response
 */
async function notifyAdmin(alert, base44) {
  const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
  const adminPhone = Deno.env.get("ADMIN_NOTIFICATION_PHONE");

  const channels = [];

  // Email notification (async, non-blocking)
  if (adminEmail) {
    try {
      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `[${alert.priority.toUpperCase()}] ${alert.type === "booking" ? "📅 Booking" : "📞 Lead"} Alert`,
        body: `
          <h2>${alert.message}</h2>
          <p><strong>Phone:</strong> ${alert.phone_number || "N/A"}</p>
          <p><strong>Intent:</strong> ${alert.intent || "unknown"}</p>
          <p><strong>Priority:</strong> ${alert.priority}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          ${alert.conversation_id ? `<p><strong>Conversation ID:</strong> ${alert.conversation_id}</p>` : ""}
        `,
      });
      channels.push("email");
    } catch (err) {
      console.error("[alertTrigger] Email failed (async):", err);
    }
  }

  // SMS notification (async, non-blocking) — high priority only
  if (adminPhone && alert.priority === "high") {
    try {
      await base44.functions.invoke("sendSMS", {
        to: adminPhone,
        message: `[${alert.type.toUpperCase()}] ${alert.message} | ${alert.phone_number || "unknown"} | ${alert.intent}`,
      });
      channels.push("sms");
    } catch (err) {
      console.error("[alertTrigger] SMS failed (async):", err);
    }
  }

  // Toast in dashboard (via alert UI polling — already added when alert is created)
  channels.push("toast");

  // Update alert with sent channels
  if (channels.length > 0) {
    try {
      await base44.entities.Alert.update(alert.id, {
        notification_sent: true,
        notification_channels: channels,
      });
    } catch (err) {
      console.error("[alertTrigger] Update notification channels failed:", err);
    }
  }
}