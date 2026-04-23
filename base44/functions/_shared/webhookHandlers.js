import {
  executeOrderServiceRuntime,
  findPaidOrderByConfiguredPhone,
  MISSED_CALL_TRIGGER_STATUSES,
  RuntimeExecutionError,
} from "./installRuntime.js";

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

  try {
    const result = await executeOrderServiceRuntime({
      base44,
      order,
      serviceKey: "missed_call_text_back",
      runtimeType: "missed_call_live",
      recipientPhone: fromPhone,
      runtimeData: {
        caller_name: callerName,
        caller_phone: fromPhone,
        call_sid: callSid,
        call_status: callStatus,
      },
      consentGranted: true,
    });

    return {
      success: true,
      runtime_result: result,
      handled_as: "call_status",
    };
  } catch (error) {
    if (error instanceof RuntimeExecutionError) {
      return {
        success: true,
        blocked: true,
        error: error.message,
        details: error.details,
        handled_as: "call_status",
      };
    }

    throw error;
  }
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
