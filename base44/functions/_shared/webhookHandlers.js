import {
  executeOrderServiceRuntime,
  findPaidOrderByConfiguredPhone,
  MISSED_CALL_TRIGGER_STATUSES,
  RuntimeExecutionError,
} from "./installRuntime.js";
import { buildProviderCallbackEvent, PROVIDER_PROOF_MODE } from "./providerProof.js";

async function createCallbackEvent(base44, event) {
  return base44.asServiceRole.entities.CommunicationEvent.create(event);
}

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

    await createCallbackEvent(
      base44,
      buildProviderCallbackEvent({
        sourceEvent: event,
        status: mappedStatus,
        provider: "twilio",
        callbackType: "message_status",
        subject: `Twilio delivery callback: ${mappedStatus}`,
        messageBody: `Twilio updated provider message ${messageId} to ${mappedStatus}.`,
        metadata: {
          raw_status: String(messageStatus),
          provider_message_id: messageId,
          proof_mode: PROVIDER_PROOF_MODE.LIVE,
        },
      })
    );

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

  const duplicateContextId = `${order.id}:twilio:missed_call_status:${callSid}`;
  const existingCallbacks = await base44.asServiceRole.entities.CommunicationEvent.filter({
    order_id: order.id,
    context_type: "provider_callback",
    context_id: duplicateContextId,
  });

  if (existingCallbacks.length > 0) {
    return {
      success: true,
      duplicate_suppressed: true,
      order_id: order.id,
      call_sid: callSid,
      handled_as: "call_status",
    };
  }

  await createCallbackEvent(
    base44,
    buildProviderCallbackEvent({
      sourceEvent: {
        id: `twilio-call-${callSid}`,
        order_id: order.id,
        client_id: order.client_id,
        client_project_id: order.client_project_id,
        onboarding_client_id: order.onboarding_client_id,
        service_key: "missed_call_text_back",
        channel: "webhook",
        provider_message_id: callSid,
      },
      status: "processed",
      provider: "twilio",
      callbackType: "missed_call_status",
      subject: "Twilio missed-call webhook received",
      messageBody: `Twilio reported ${callStatus} for a missed-call candidate on ${toPhone}.`,
      metadata: {
        call_sid: callSid,
        call_status: callStatus,
        caller_phone: fromPhone,
        caller_name: callerName,
        business_phone: toPhone,
        proof_kind: "twilio_missed_call_webhook",
        proof_mode: PROVIDER_PROOF_MODE.LIVE,
      },
    })
  );

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

    await createCallbackEvent(
      base44,
      buildProviderCallbackEvent({
        sourceEvent: events[0],
        status,
        provider: "resend",
        callbackType: type,
        subject: `Resend webhook: ${type}`,
        messageBody: `Resend reported ${type} for provider message ${email_id}.`,
        metadata: {
          provider_message_id: email_id,
          resend_type: type,
          proof_mode: PROVIDER_PROOF_MODE.LIVE,
        },
      })
    );
  }

  return {
    success: true,
    status,
    updated_event_id: events[0]?.id || null,
  };
}
