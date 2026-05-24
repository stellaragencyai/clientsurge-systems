import {
  executeOrderServiceRuntime,
  findPaidOrderByConfiguredPhone,
  MISSED_CALL_TRIGGER_STATUSES,
  RuntimeExecutionError,
} from "./installRuntime.js";
import { buildCommunicationEvent } from "./installPipeline.js";
import {
  applyEmailSuppression,
  mapResendDeliveryStatus,
  mapTwilioDeliveryStatus,
  updateOutboxDeliveryStatus,
} from "./communicationOutbox.js";

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

    await updateOutboxDeliveryStatus({
      base44,
      provider: "twilio",
      providerMessageId: messageId,
      providerStatus: String(messageStatus),
      status: mapTwilioDeliveryStatus(messageStatus) || mappedStatus,
    });

    return {
      success: true,
      event_id: event.id,
      status: mappedStatus,
      handled_as: "message_status",
    };
  }

  const callSid = String(formData.get("CallSid") || "");
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

  const existingCallEvents = await base44.asServiceRole.entities.CommunicationEvent.filter({
    provider: "twilio",
    event_type: "missed_call_webhook_received",
    provider_message_id: callSid,
  });

  if (existingCallEvents.length > 0) {
    return {
      success: true,
      duplicate: true,
      call_sid: callSid,
      handled_as: "call_status",
      existing_event_id: existingCallEvents[0].id,
    };
  }

  const callReceivedEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order,
      channel: "phone",
      direction: "inbound",
      event_type: "missed_call_webhook_received",
      provider: "twilio",
      provider_message_id: callSid,
      status: "received",
      subject: "Missed call webhook received",
      message_body: `Missed call webhook received from ${fromPhone} with status ${callStatus}.`,
      service_key: "missed_call_text_back",
      metadata: {
        call_sid: callSid,
        call_status: callStatus,
        to_phone: toPhone,
        from_phone: fromPhone,
        caller_name: callerName,
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
      call_event_id: callReceivedEvent.id,
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
    "email.clicked": "clicked",
    "email.bounced": "failed",
    "email.complained": "failed",
  };

  const status = statusMap[type] || "processed";
  const outboxStatus = mapResendDeliveryStatus(type);
  const engagementAt = new Date().toISOString();
  const updateLeadEngagement = async ({ leadId, email }) => {
    const candidateEntities = [
      base44.asServiceRole.entities.SpaLead,
      base44.asServiceRole.entities.WebsiteLead,
      base44.asServiceRole.entities.Leads,
      base44.asServiceRole.entities.Lead,
    ].filter(Boolean);

    for (const entity of candidateEntities) {
      if (leadId) {
        await entity.update?.(leadId, {
          last_engagement_at: engagementAt,
        }).catch(() => {});
      }

      if (!leadId && email) {
        const leads = await entity.filter?.({ email }).catch(() => []);
        if (leads?.[0]?.id) {
          await entity.update?.(leads[0].id, {
            last_engagement_at: engagementAt,
          }).catch(() => {});
        }
      }
    }
  };

  const events = await base44.asServiceRole.entities.CommunicationEvent.filter({
    provider_message_id: email_id,
  });

  if (events.length > 0) {
    const update = {
      status,
    };

    if (type === "email.bounced") {
      update.failure_reason = data?.bounce?.message || data?.reason || "resend_email_bounced";
      update.failed_at = engagementAt;
    }

    if (type === "email.complained") {
      update.failure_reason = data?.complaint?.complaint_feedback_type || data?.reason || "resend_email_complaint";
      update.failed_at = engagementAt;
    }

    if (type === "email.opened" || type === "email.clicked") {
      update.last_engagement_at = engagementAt;
      update.engagement_type = type === "email.clicked" ? "clicked" : "opened";
    }

    await base44.asServiceRole.entities.CommunicationEvent.update(events[0].id, update);

    await updateOutboxDeliveryStatus({
      base44,
      provider: "resend",
      providerMessageId: email_id,
      providerStatus: type,
      status: outboxStatus,
      failureReason: update.failure_reason || null,
      metadata: {
        resend_type: type,
        to: data?.to?.[0] || null,
      },
      now: engagementAt,
    });

    if (type === "email.opened" || type === "email.clicked") {
      const event = events[0];
      const leadEmail = data?.to?.[0] || null;
      await updateLeadEngagement({ leadId: event?.lead_id, email: leadEmail });
    }
  }

  if (events.length === 0) {
    await updateOutboxDeliveryStatus({
      base44,
      provider: "resend",
      providerMessageId: email_id,
      providerStatus: type,
      status: outboxStatus,
      failureReason:
        type === "email.bounced"
          ? data?.bounce?.message || data?.reason || "resend_email_bounced"
          : type === "email.complained"
            ? data?.complaint?.complaint_feedback_type || data?.reason || "resend_email_complaint"
            : null,
      metadata: {
        resend_type: type,
        to: data?.to?.[0] || null,
      },
      now: engagementAt,
    });
  }

  if (type === "email.bounced" || type === "email.complained") {
    await applyEmailSuppression({
      base44,
      email: data?.to?.[0] || data?.email || null,
      reason: type === "email.complained" ? "complaint" : "bounce",
      providerMessageId: email_id,
      now: engagementAt,
    }).catch((error) => {
      console.warn("[receiveResendWebhook] Email suppression update failed:", error.message);
    });
  }

  return {
    success: true,
    status,
    outbox_status: outboxStatus,
    updated_event_id: events[0]?.id || null,
  };
}
