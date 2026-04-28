import { sendEmailMessage, sendTwilioSms } from "./installRuntime.js";

const SERVICE_KEY = "missed_call_text_back";
const FOLLOW_UP_STEPS = [
  { index: 1, key: "sms_2m", channel: "sms", delayMinutes: 2 },
  { index: 2, key: "email_10m", channel: "email", delayMinutes: 10 },
  { index: 3, key: "sms_1h", channel: "sms", delayMinutes: 60 },
  { index: 4, key: "email_24h", channel: "email", delayMinutes: 24 * 60 },
];

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value) {
  const digits = cleanString(value).replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.startsWith("+")) return digits;
  return value ? String(value).trim() : "";
}

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function addMinutes(iso, minutes) {
  const base = iso ? new Date(iso) : new Date();
  return new Date(base.getTime() + minutes * 60 * 1000).toISOString();
}

function getStepByIndex(index) {
  return FOLLOW_UP_STEPS.find((step) => step.index === Number(index)) || null;
}

function getNextStep(index) {
  return FOLLOW_UP_STEPS.find((step) => step.index === Number(index) + 1) || null;
}

function isTerminalLeadStatus(status) {
  return ["Booked", "Closed"].includes(cleanString(status));
}

function getLeadEmail(lead) {
  return cleanString(lead?.email);
}

function extractLeadRuntime(lead) {
  const raw = safeJsonParse(lead?.automation_context_json, {});
  const missedCall = raw.missed_call_recovery || {};
  return {
    root: raw,
    missedCall,
  };
}

function buildMissedCallContextPatch({
  lead,
  runtime,
  callSid,
  callStatus,
  callerPhone,
  businessPhone,
  now,
  nextFollowUpAt,
  lastMessageSent,
  followUpStep,
  sequenceState,
  stopReason,
  initialEventId,
}) {
  const root = { ...(runtime?.root || {}) };
  const current = { ...(runtime?.missedCall || {}) };
  const history = Array.isArray(current.history) ? [...current.history] : [];

  if (lastMessageSent) {
    history.push(lastMessageSent);
  }

  root.missed_call_recovery = {
    ...current,
    lead_id: lead.id,
    call_sid: callSid || current.call_sid || null,
    call_status: callStatus || current.call_status || "missed",
    caller_phone: callerPhone || current.caller_phone || normalizePhone(lead.phone),
    business_phone: businessPhone || current.business_phone || null,
    created_at: current.created_at || now,
    updated_at: now,
    initial_triggered_at: current.initial_triggered_at || now,
    initial_event_id: initialEventId || current.initial_event_id || null,
    sequence_state: sequenceState || current.sequence_state || "active",
    stop_reason: stopReason || current.stop_reason || null,
    follow_up_step: followUpStep ?? current.follow_up_step ?? 0,
    next_follow_up_at: nextFollowUpAt ?? current.next_follow_up_at ?? null,
    last_message_sent: lastMessageSent || current.last_message_sent || null,
    history,
  };

  return {
    automation_context_json: JSON.stringify(root),
  };
}

export function getMissedCallFieldsFromLead(lead) {
  const runtime = extractLeadRuntime(lead);
  const context = runtime.missedCall;
  return {
    call_sid: context.call_sid || null,
    call_status: context.call_status || null,
    followUpStep: Number(context.follow_up_step || 0),
    nextFollowUpAt: context.next_follow_up_at || lead?.next_follow_up_at || null,
    lastMessageSent: context.last_message_sent || null,
    sequenceState: context.sequence_state || null,
    stopReason: context.stop_reason || null,
  };
}

export async function createCommunicationEvent(base44, event) {
  return base44.asServiceRole.entities.CommunicationEvent.create(event);
}

export function buildEvent({
  leadId,
  orderId,
  channel = "internal",
  direction = "system",
  eventType,
  provider = "internal",
  status = "processed",
  subject,
  messageBody,
  errorMessage,
  metadata,
}) {
  return {
    lead_id: leadId,
    order_id: orderId || undefined,
    service_key: SERVICE_KEY,
    channel,
    direction,
    event_type: eventType,
    provider,
    status,
    subject,
    message_body: messageBody,
    error_message: errorMessage,
    metadata_json: metadata ? JSON.stringify(metadata) : undefined,
  };
}

export async function logMissedCallEvent(base44, params) {
  return createCommunicationEvent(base44, buildEvent(params));
}

export async function stopMissedCallSequence({ base44, lead, reason, now = new Date().toISOString(), note }) {
  const runtime = extractLeadRuntime(lead);
  const updatedLead = await base44.asServiceRole.entities.Leads.update(lead.id, {
    next_follow_up_at: null,
    ...buildMissedCallContextPatch({
      lead,
      runtime,
      now,
      nextFollowUpAt: null,
      followUpStep: runtime.missedCall.follow_up_step || 0,
      sequenceState: "stopped",
      stopReason: reason,
    }),
  });

  await logMissedCallEvent(base44, {
    leadId: lead.id,
    orderId: runtime.missedCall.order_id,
    eventType: "workflow_triggered",
    subject: "Missed call recovery stopped",
    messageBody: note || `Sequence stopped: ${reason}`,
    metadata: {
      source: "missed_call_recovery",
      action: "stop_triggered",
      reason,
      stopped_at: now,
    },
  });

  return updatedLead;
}

export async function findLeadByMissedCall({ base44, callSid, callerPhone }) {
  if (callSid) {
    const byCallSid = await base44.asServiceRole.entities.CommunicationEvent.filter({
      service_key: SERVICE_KEY,
      event_type: "lead_created",
    }, "-created_date", 100);

    const matchedEvent = (byCallSid || []).find((event) => {
      const metadata = safeJsonParse(event.metadata_json, {});
      return metadata.call_sid === callSid;
    });

    if (matchedEvent?.lead_id) {
      const lead = await base44.asServiceRole.entities.Leads.get(matchedEvent.lead_id);
      if (lead) return lead;
    }
  }

  const normalizedCaller = normalizePhone(callerPhone);
  if (!normalizedCaller) return null;

  const leads = await base44.asServiceRole.entities.Leads.filter({ phone: normalizedCaller }, "-created_date", 20);
  return leads?.[0] || null;
}

export async function createOrReuseMissedCallLead({
  base44,
  order,
  callerPhone,
  callerName,
  callSid,
  callStatus,
  businessPhone,
  now = new Date().toISOString(),
}) {
  const normalizedCallerPhone = normalizePhone(callerPhone);
  const existingLead = await findLeadByMissedCall({ base44, callSid, callerPhone: normalizedCallerPhone });

  if (existingLead) {
    await logMissedCallEvent(base44, {
      leadId: existingLead.id,
      orderId: order.id,
      eventType: "workflow_triggered",
      subject: "Missed call duplicate prevented",
      messageBody: `Existing lead ${existingLead.id} reused for missed call sequence.`,
      metadata: {
        source: "missed_call_recovery",
        action: "duplicate_prevented",
        call_sid: callSid || null,
        caller_phone: normalizedCallerPhone,
        timestamp: now,
      },
    });

    return { lead: existingLead, created: false, duplicatePrevented: true };
  }

  const businessName = cleanString(order.business_name) || cleanString(order.customer_name) || "Unknown Business";
  const lead = await base44.asServiceRole.entities.Leads.create({
    full_name: cleanString(callerName) || "Missed Caller",
    business_name: businessName,
    email: "unknown@example.com",
    phone: normalizedCallerPhone,
    business_type: "Missed Call",
    problem: "Inbound missed call needs recovery",
    source: "missed_call_text_back",
    intake_type: "contact_inquiry",
    status: "Contacted",
    last_contacted_at: now,
    next_follow_up_at: addMinutes(now, 2),
    ...buildMissedCallContextPatch({
      lead: { id: "pending", phone: normalizedCallerPhone },
      runtime: { root: {}, missedCall: { order_id: order.id } },
      callSid,
      callStatus: callStatus || "missed",
      callerPhone: normalizedCallerPhone,
      businessPhone,
      now,
      nextFollowUpAt: addMinutes(now, 2),
      followUpStep: 0,
      sequenceState: "active",
    }),
  });

  await base44.asServiceRole.entities.Leads.update(lead.id, {
    ...buildMissedCallContextPatch({
      lead,
      runtime: { root: safeJsonParse(lead.automation_context_json, {}), missedCall: { order_id: order.id } },
      callSid,
      callStatus: callStatus || "missed",
      callerPhone: normalizedCallerPhone,
      businessPhone,
      now,
      nextFollowUpAt: addMinutes(now, 2),
      followUpStep: 0,
      sequenceState: "active",
    }),
  });

  const event = await logMissedCallEvent(base44, {
    leadId: lead.id,
    orderId: order.id,
    eventType: "lead_created",
    subject: "Missed call lead created",
    messageBody: `Lead created for missed call from ${normalizedCallerPhone}.`,
    metadata: {
      source: "missed_call_recovery",
      call_sid: callSid || null,
      call_status: callStatus || "missed",
      caller_phone: normalizedCallerPhone,
      timestamp: now,
      missed_call_status: "missed",
    },
  });

  await base44.asServiceRole.entities.Leads.update(lead.id, {
    ...buildMissedCallContextPatch({
      lead,
      runtime: extractLeadRuntime(lead),
      callSid,
      callStatus: callStatus || "missed",
      callerPhone: normalizedCallerPhone,
      businessPhone,
      now,
      nextFollowUpAt: addMinutes(now, 2),
      followUpStep: 0,
      sequenceState: "active",
      initialEventId: event.id,
    }),
  });

  return { lead: await base44.asServiceRole.entities.Leads.get(lead.id), created: true, duplicatePrevented: false };
}

function interpolate(template, values) {
  return String(template || "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => values[key] ?? "");
}

function getBusinessName(order) {
  return cleanString(order?.business_name) || cleanString(order?.customer_name) || "the business";
}

function getBookingLink(order) {
  return cleanString(order?.install_configuration?.services?.ai_booking_agent?.booking_link)
    || cleanString(order?.install_configuration?.shared?.booking_link)
    || cleanString(order?.booking_link)
    || cleanString(order?.metadata?.booking_link)
    || "";
}

export function buildMissedCallMessage({ order, lead, step, sharedConfig }) {
  const businessName = getBusinessName(order);
  const bookingLink = getBookingLink(order);
  const values = {
    business_name: businessName,
    booking_link: bookingLink,
    caller_name: cleanString(lead.full_name) || "there",
    business_phone: cleanString(sharedConfig?.twilio_business_phone),
  };

  if (step.index === 1) {
    const template = cleanString(order?.install_configuration?.services?.missed_call_text_back?.sms_template)
      || `Sorry we missed your call. This is ${businessName}. You can text us here or book here: ${bookingLink}`;
    return interpolate(template, values);
  }

  if (step.channel === "sms") {
    return step.index === 3
      ? `Just following up from ${businessName}. If you still need help, reply here or book here: ${bookingLink}`
      : `Quick follow-up from ${businessName}. Reply here if you still need anything.`;
  }

  return step.index === 2
    ? `<p>We missed your call to ${businessName}.</p><p>You can reply to this email or book here: <a href="${bookingLink}">${bookingLink}</a></p>`
    : `<p>Final follow-up from ${businessName}.</p><p>If you still want help, book here: <a href="${bookingLink}">${bookingLink}</a></p>`;
}

export function getMissedCallEmailSubject({ order, step }) {
  const businessName = getBusinessName(order);
  return step.index === 2
    ? `${businessName} missed your call`
    : `${businessName} checking back in`;
}

export async function runMissedCallInitialResponse({
  base44,
  order,
  lead,
  sharedConfig,
  now = new Date().toISOString(),
}) {
  const step = FOLLOW_UP_STEPS[0];
  const messageBody = buildMissedCallMessage({ order, lead, step, sharedConfig });
  const runtime = extractLeadRuntime(lead);

  await logMissedCallEvent(base44, {
    leadId: lead.id,
    orderId: order.id,
    eventType: "runtime_attempt_started",
    subject: "Missed call recovery started",
    messageBody: "Initial missed-call recovery sequence started.",
    metadata: {
      source: "missed_call_recovery",
      action: "initial_response_started",
      timestamp: now,
    },
  });

  try {
    const sendResult = await sendTwilioSms({
      to: normalizePhone(lead.phone),
      from: cleanString(sharedConfig?.twilio_business_phone),
      body: messageBody,
    });

    const lastMessageSent = {
      step_key: step.key,
      channel: "sms",
      sent_at: now,
      provider_message_id: sendResult.provider_message_id,
    };

    const nextStep = getNextStep(step.index);
    const nextFollowUpAt = nextStep ? addMinutes(now, nextStep.delayMinutes - step.delayMinutes) : null;

    await base44.asServiceRole.entities.Leads.update(lead.id, {
      status: lead.status === "New" ? "Contacted" : lead.status,
      last_contacted_at: now,
      next_follow_up_at: nextFollowUpAt,
      ...buildMissedCallContextPatch({
        lead,
        runtime,
        now,
        nextFollowUpAt,
        lastMessageSent,
        followUpStep: step.index,
        sequenceState: "active",
      }),
    });

    await logMissedCallEvent(base44, {
      leadId: lead.id,
      orderId: order.id,
      channel: "sms",
      direction: "outbound",
      eventType: "provider_send_succeeded",
      provider: "twilio",
      status: sendResult.provider_status || "sent",
      subject: "Missed call SMS #1 sent",
      messageBody,
      metadata: {
        source: "missed_call_recovery",
        action: "sms_sent",
        step_key: step.key,
        provider_message_id: sendResult.provider_message_id,
        timestamp: now,
      },
    });
  } catch (error) {
    await logMissedCallEvent(base44, {
      leadId: lead.id,
      orderId: order.id,
      channel: "sms",
      direction: "outbound",
      eventType: "provider_send_failed",
      provider: "twilio",
      status: "failed",
      subject: "Missed call SMS #1 failed",
      messageBody,
      errorMessage: error instanceof Error ? error.message : "SMS send failed",
      metadata: {
        source: "missed_call_recovery",
        action: "send_failure",
        step_key: step.key,
        timestamp: now,
      },
    });
    throw error;
  }

  const email = getLeadEmail(lead);
  if (!email || email === "unknown@example.com") {
    await logMissedCallEvent(base44, {
      leadId: lead.id,
      orderId: order.id,
      channel: "email",
      direction: "system",
      eventType: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: "Missed call email skipped",
      messageBody: "No lead email available, initial email skipped.",
      metadata: {
        source: "missed_call_recovery",
        action: "email_skipped",
        reason: "missing_email",
        timestamp: now,
      },
    });
  }
}

export async function handleInboundReplyStop({ base44, fromPhone, body, now = new Date().toISOString() }) {
  const lead = await findLeadByMissedCall({ base44, callerPhone: fromPhone });
  if (!lead) {
    return { success: true, ignored: true, reason: "No matching missed-call lead found." };
  }

  await logMissedCallEvent(base44, {
    leadId: lead.id,
    eventType: "sms_received",
    channel: "sms",
    direction: "inbound",
    provider: "twilio",
    status: "received",
    subject: "Missed call reply received",
    messageBody: cleanString(body),
    metadata: {
      source: "missed_call_recovery",
      action: "reply_received",
      timestamp: now,
    },
  });

  const updated = await base44.asServiceRole.entities.Leads.update(lead.id, {
    status: "Replied",
    last_contacted_at: now,
  });

  await stopMissedCallSequence({
    base44,
    lead: updated,
    reason: "reply_received",
    now,
    note: "Inbound SMS reply received, all follow-ups stopped.",
  });

  return { success: true, lead_id: lead.id, stopped: true, reason: "reply_received" };
}

export async function handleBookingStop({ base44, lead, now = new Date().toISOString() }) {
  return stopMissedCallSequence({
    base44,
    lead,
    reason: "booking_recorded",
    now,
    note: "Booking recorded, all missed-call follow-ups stopped.",
  });
}

export function shouldStopForLead(lead) {
  if (!lead) return { stop: true, reason: "lead_missing" };
  if (isTerminalLeadStatus(lead.status)) return { stop: true, reason: `lead_status_${lead.status.toLowerCase()}` };
  const fields = getMissedCallFieldsFromLead(lead);
  if (fields.sequenceState === "stopped") return { stop: true, reason: fields.stopReason || "sequence_stopped" };
  if (lead.status === "Replied") return { stop: true, reason: "reply_received" };
  return { stop: false };
}

export async function processMissedCallFollowUps({ base44, now = new Date().toISOString() }) {
  const leads = await base44.asServiceRole.entities.Leads.list("-created_date", 500);
  const dueLeads = (leads || []).filter((lead) => {
    const fields = getMissedCallFieldsFromLead(lead);
    if (!fields.nextFollowUpAt) return false;
    const dueAt = new Date(fields.nextFollowUpAt).getTime();
    return !Number.isNaN(dueAt) && dueAt <= new Date(now).getTime();
  });

  const results = [];

  for (const lead of dueLeads) {
    const runtime = extractLeadRuntime(lead);
    const stopCheck = shouldStopForLead(lead);
    if (stopCheck.stop) {
      await stopMissedCallSequence({ base44, lead, reason: stopCheck.reason, now, note: `Stop condition met before send: ${stopCheck.reason}` });
      results.push({ lead_id: lead.id, skipped: true, reason: stopCheck.reason });
      continue;
    }

    const currentStep = getStepByIndex((runtime.missedCall.follow_up_step || 0) + 1);
    if (!currentStep) {
      await stopMissedCallSequence({ base44, lead, reason: "sequence_complete", now, note: "Missed-call sequence completed." });
      results.push({ lead_id: lead.id, completed: true });
      continue;
    }

    if (currentStep.channel === "email" && (!getLeadEmail(lead) || getLeadEmail(lead) === "unknown@example.com")) {
      const nextStep = getNextStep(currentStep.index);
      const nextFollowUpAt = nextStep ? addMinutes(runtime.missedCall.initial_triggered_at || now, nextStep.delayMinutes) : null;
      await base44.asServiceRole.entities.Leads.update(lead.id, {
        next_follow_up_at: nextFollowUpAt,
        ...buildMissedCallContextPatch({
          lead,
          runtime,
          now,
          nextFollowUpAt,
          followUpStep: currentStep.index,
          sequenceState: nextStep ? "active" : "stopped",
          stopReason: nextStep ? null : "sequence_complete",
        }),
      });

      await logMissedCallEvent(base44, {
        leadId: lead.id,
        orderId: runtime.missedCall.order_id,
        channel: "email",
        direction: "system",
        eventType: "workflow_triggered",
        provider: "internal",
        status: "processed",
        subject: `Missed call ${currentStep.key} skipped`,
        messageBody: "Lead has no email, email step skipped.",
        metadata: {
          source: "missed_call_recovery",
          action: "email_skipped",
          step_key: currentStep.key,
          reason: "missing_email",
          timestamp: now,
        },
      });

      results.push({ lead_id: lead.id, skipped: true, reason: "missing_email", step: currentStep.key });
      continue;
    }

    const order = runtime.missedCall.order_id
      ? await base44.asServiceRole.entities.Order.get(runtime.missedCall.order_id)
      : null;
    if (!order) {
      await stopMissedCallSequence({ base44, lead, reason: "missing_order", now, note: "No order linked to missed-call sequence." });
      results.push({ lead_id: lead.id, skipped: true, reason: "missing_order" });
      continue;
    }

    const sharedConfig = order.install_configuration?.shared || {};
    const messageBody = buildMissedCallMessage({ order, lead, step: currentStep, sharedConfig });
    const nextStep = getNextStep(currentStep.index);
    const nextFollowUpAt = nextStep
      ? addMinutes(runtime.missedCall.initial_triggered_at || now, nextStep.delayMinutes)
      : null;

    const duplicateEvents = await base44.asServiceRole.entities.CommunicationEvent.filter({
      lead_id: lead.id,
      service_key: SERVICE_KEY,
      event_type: "provider_send_succeeded",
    }, "-created_date", 50);
    const alreadySent = (duplicateEvents || []).some((event) => {
      const metadata = safeJsonParse(event.metadata_json, {});
      return metadata.step_key === currentStep.key;
    });

    if (alreadySent) {
      await logMissedCallEvent(base44, {
        leadId: lead.id,
        orderId: order.id,
        eventType: "workflow_triggered",
        provider: "internal",
        status: "processed",
        subject: `Missed call duplicate prevented for ${currentStep.key}`,
        messageBody: "Idempotency guard prevented duplicate send.",
        metadata: {
          source: "missed_call_recovery",
          action: "duplicate_prevented",
          step_key: currentStep.key,
          timestamp: now,
        },
      });

      await base44.asServiceRole.entities.Leads.update(lead.id, {
        next_follow_up_at: nextFollowUpAt,
        ...buildMissedCallContextPatch({
          lead,
          runtime,
          now,
          nextFollowUpAt,
          followUpStep: currentStep.index,
          sequenceState: nextStep ? "active" : "stopped",
          stopReason: nextStep ? null : "sequence_complete",
        }),
      });

      results.push({ lead_id: lead.id, skipped: true, reason: "duplicate_prevented", step: currentStep.key });
      continue;
    }

    try {
      let sendResult;
      if (currentStep.channel === "sms") {
        sendResult = await sendTwilioSms({
          to: normalizePhone(lead.phone),
          from: cleanString(sharedConfig.twilio_business_phone),
          body: messageBody,
        });
      } else {
        sendResult = await sendEmailMessage({
          base44: base44.asServiceRole,
          to: getLeadEmail(lead),
          subject: getMissedCallEmailSubject({ order, step: currentStep }),
          body: messageBody,
        });
      }

      const lastMessageSent = {
        step_key: currentStep.key,
        channel: currentStep.channel,
        sent_at: now,
        provider_message_id: sendResult.provider_message_id,
      };

      await base44.asServiceRole.entities.Leads.update(lead.id, {
        status: lead.status === "New" ? "Contacted" : lead.status,
        last_contacted_at: now,
        next_follow_up_at: nextFollowUpAt,
        ...buildMissedCallContextPatch({
          lead,
          runtime,
          now,
          nextFollowUpAt,
          lastMessageSent,
          followUpStep: currentStep.index,
          sequenceState: nextStep ? "active" : "stopped",
          stopReason: nextStep ? null : "sequence_complete",
        }),
      });

      await logMissedCallEvent(base44, {
        leadId: lead.id,
        orderId: order.id,
        channel: currentStep.channel,
        direction: "outbound",
        eventType: "provider_send_succeeded",
        provider: currentStep.channel === "sms" ? "twilio" : "resend",
        status: sendResult.provider_status || (currentStep.channel === "sms" ? "sent" : "processed"),
        subject: `Missed call ${currentStep.key} sent`,
        messageBody,
        metadata: {
          source: "missed_call_recovery",
          action: `${currentStep.channel}_sent`,
          step_key: currentStep.key,
          provider_message_id: sendResult.provider_message_id,
          timestamp: now,
        },
      });

      results.push({ lead_id: lead.id, sent: true, step: currentStep.key, channel: currentStep.channel });
    } catch (error) {
      await logMissedCallEvent(base44, {
        leadId: lead.id,
        orderId: order.id,
        channel: currentStep.channel,
        direction: "outbound",
        eventType: "provider_send_failed",
        provider: currentStep.channel === "sms" ? "twilio" : "resend",
        status: "failed",
        subject: `Missed call ${currentStep.key} failed`,
        messageBody,
        errorMessage: error instanceof Error ? error.message : "Send failed",
        metadata: {
          source: "missed_call_recovery",
          action: "send_failure",
          step_key: currentStep.key,
          timestamp: now,
        },
      });
      results.push({ lead_id: lead.id, failed: true, step: currentStep.key, error: error instanceof Error ? error.message : "Send failed" });
    }
  }

  return {
    success: true,
    processed: results.length,
    results,
  };
}
