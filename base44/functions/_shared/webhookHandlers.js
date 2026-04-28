import {
  findPaidOrderByConfiguredPhone,
  MISSED_CALL_TRIGGER_STATUSES,
} from "./installRuntime.js";
import {
  createOrReuseMissedCallLead,
  handleInboundReplyStop,
  runMissedCallInitialResponse,
} from "./missedCallRecovery.js";

export async function handleTrustedTwilioStatusWebhook({ base44, formData }) {
  const messageId = formData.get("MessageSid");
  const messageStatus = formData.get("MessageStatus");

  if (messageId && messageStatus) {
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter({
      provider_message_id: messageId,
    });

    if (events.length === 0) {
      return {
        success: true,
        message: "Event not found",
      };
    }

    const event = events[0];
    const statusMap = {
      queued: "pending",
      sending: "pending",
      sent: "sent",
      delivered: "delivered",
      failed: "failed",
      undelivered: "failed",
      received: "received",
    };

    const mappedStatus = statusMap[String(messageStatus)] || String(messageStatus);

    await base44.entities.CommunicationEvent.update(event.id, {
      status: mappedStatus,
    });

    return {
      success: true,
      event_id: event.id,
      status: mappedStatus,
      handled_as: "message_status",
    };
  }

  const callSid = formData.get("CallSid");
  const callStatus = String(formData.get("CallStatus") || "");
  const toPhone = String(formData.get("To") || "");
  const fromPhone = String(formData.get("From") || "");
  const callerName = String(formData.get("CallerName") || "");

  if (!callSid || !callStatus || !toPhone || !fromPhone) {
    return {
      error: "Missing Twilio message or call status payload",
      status: 400,
    };
  }

  if (!MISSED_CALL_TRIGGER_STATUSES.includes(callStatus)) {
    return {
      success: true,
      ignored: true,
      call_status: callStatus,
      handled_as: "call_status",
    };
  }

  const order = await findPaidOrderByConfiguredPhone({
    base44,
    businessPhone: toPhone,
    serviceKey: "missed_call_text_back",
  });

  if (!order) {
    return {
      success: true,
      ignored: true,
      reason: "No matching paid order with missed call text-back configured for this Twilio number.",
      handled_as: "call_status",
    };
  }

  const now = new Date().toISOString();
  const { lead, created, duplicatePrevented } = await createOrReuseMissedCallLead({
    base44,
    order,
    callerPhone: fromPhone,
    callerName,
    callSid,
    callStatus,
    businessPhone: toPhone,
    now,
  });

  await runMissedCallInitialResponse({
    base44,
    order,
    lead,
    sharedConfig: order.install_configuration?.shared || {},
    now,
  });

  return {
    success: true,
    handled_as: "call_status",
    lead_id: lead.id,
    lead_created: created,
    duplicate_prevented: duplicatePrevented,
    call_status: callStatus,
    call_sid: callSid,
  };
}

export async function handleTrustedTwilioSmsWebhook({ base44, formData }) {
  const fromPhone = String(formData.get("From") || "");
  const body = String(formData.get("Body") || "");

  if (!fromPhone) {
    return {
      error: "Missing From in Twilio SMS payload",
      status: 400,
    };
  }

  return handleInboundReplyStop({
    base44,
    fromPhone,
    body,
    now: new Date().toISOString(),
  });
}

export async function handleTrustedResendWebhook({ base44, payload }) {
  const { type, data } = payload;
  const { email_id } = data || {};

  if (!email_id) {
    return {
      error: "No email_id in webhook",
      status: 400,
    };
  }

  const statusMap = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "opened",
    "email.bounced": "failed",
    "email.complained": "failed",
  };

  const status = statusMap[type] || "processed";

  const events = await base44.entities.CommunicationEvent.filter({
    provider_message_id: email_id,
  });

  if (events.length > 0) {
    await base44.entities.CommunicationEvent.update(events[0].id, {
      status,
    });
  }

  return {
    success: true,
    status,
    updated_event_id: events[0]?.id || null,
  };
}
