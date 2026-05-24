const SMS_OPT_OUT_FOOTER = "Reply STOP to opt out.";
const TERMINAL_SUCCESS_STATUSES = new Set(["sent", "delivered", "suppressed", "cancelled"]);
const RETRYABLE_OUTBOX_STATUSES = new Set(["failed", "suppressed", "needs_manual_review"]);
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const SMS_STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const DEFAULT_MAX_ATTEMPTS = 3;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePhoneNumber(value) {
  const digits = cleanString(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return cleanString(value).startsWith("+") ? cleanString(value) : `+${digits}`;
}

export function normalizeRecipient(channel, recipient) {
  if (channel === "sms") return normalizePhoneNumber(recipient);
  return cleanString(recipient).toLowerCase();
}

export function appendSmsOptOutFooter(body = "") {
  const text = cleanString(body);
  if (/reply\s+stop/i.test(text) || /text\s+stop/i.test(text)) return text;
  return `${text}\n\n${SMS_OPT_OUT_FOOTER}`;
}

export function buildCommunicationIdempotencyKey({
  provider,
  channel,
  source = "manual",
  recipient,
  messageType = "transactional",
  sourceRecordId = "unknown",
  templateKey = "default",
}) {
  const normalized = normalizeRecipient(channel, recipient);
  return [
    cleanString(provider || (channel === "sms" ? "twilio" : "resend")),
    cleanString(channel),
    cleanString(source),
    normalized,
    cleanString(messageType),
    cleanString(templateKey),
    cleanString(sourceRecordId),
  ].join(":");
}

function serviceEntities(base44) {
  return base44?.asServiceRole?.entities || base44?.entities || {};
}

async function filterEntity(entity, query, sort = "-created_date", limit = 1) {
  if (!entity?.filter) return [];
  return entity.filter(query, sort, limit).catch(() => []);
}

async function listEntity(entity, sort = "-created_date", limit = 100) {
  if (!entity?.list) return [];
  return entity.list(sort, limit).catch(() => []);
}

async function getEntity(entity, id) {
  if (!id) return null;
  if (entity?.get) return entity.get(id).catch(() => null);
  const matches = await filterEntity(entity, { id }, "-created_date", 1);
  return matches?.[0] || null;
}

async function createEntity(entity, payload) {
  if (!entity?.create) return { ...payload, id: payload.id || null };
  return entity.create(payload);
}

async function updateEntity(entity, id, payload) {
  if (!entity?.update || !id) return null;
  return entity.update(id, payload);
}

function safeJson(value) {
  try {
    return JSON.stringify(value || {});
  } catch (_) {
    return "{}";
  }
}

function parseJson(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (_) {
    return {};
  }
}

function getLeadOptOutSnapshot(lead = {}) {
  return {
    consent_given: Boolean(lead.consent_given || lead.sms_consent || lead.sms_consent_given),
    consent_given_at: lead.consent_given_at || lead.sms_consent_given_at || null,
    consent_source: lead.consent_source || lead.sms_consent_source || null,
    consent_text_version: lead.consent_text_version || null,
    sms_opted_out: Boolean(lead.sms_opted_out || lead.unsubscribed || lead.status === "opted_out"),
    email_suppressed: Boolean(lead.email_suppressed || lead.email_unsubscribed || lead.unsubscribed),
  };
}

function isWithinQuietHours(now = new Date()) {
  const phoenixTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Phoenix" }));
  const hour = phoenixTime.getHours();
  return hour < 8 || hour >= 21;
}

export function evaluateCommunicationCompliance({
  channel,
  messageType = "transactional",
  recipient,
  body,
  lead = {},
  consentBasis,
  consentSnapshot,
  enforceQuietHours = true,
  now = new Date(),
}) {
  const snapshot = {
    ...getLeadOptOutSnapshot(lead),
    ...(consentSnapshot || {}),
  };
  const normalizedRecipient = normalizeRecipient(channel, recipient);

  if (!normalizedRecipient) {
    return { allowed: false, reason: "missing_recipient", consent_snapshot: snapshot };
  }

  if (!cleanString(body)) {
    return { allowed: false, reason: "empty_message_body", consent_snapshot: snapshot };
  }

  if (channel === "sms") {
    if (snapshot.sms_opted_out) {
      return {
        allowed: false,
        reason: "sms_opted_out",
        unsubscribe_blocked: true,
        consent_snapshot: snapshot,
      };
    }

    const explicitConsent =
      snapshot.consent_given === true ||
      snapshot.sms_consent === true ||
      snapshot.sms_marketing_consent === true ||
      consentBasis === "explicit_sms_consent";

    if (messageType === "marketing" && !explicitConsent) {
      return {
        allowed: false,
        reason: "missing_sms_marketing_consent",
        consent_snapshot: snapshot,
      };
    }

    if (messageType === "marketing" && enforceQuietHours && isWithinQuietHours(now)) {
      return {
        allowed: false,
        reason: "quiet_hours",
        quiet_hours_blocked: true,
        consent_snapshot: snapshot,
      };
    }
  }

  if (channel === "email" && snapshot.email_suppressed) {
    return {
      allowed: false,
      reason: "email_suppressed",
      unsubscribe_blocked: true,
      consent_snapshot: snapshot,
    };
  }

  return { allowed: true, reason: "allowed", consent_snapshot: snapshot };
}

function isRetryableError(error) {
  const status = Number(error?.status || error?.statusCode || error?.code || 0);
  if (RETRYABLE_STATUS_CODES.has(status)) return true;
  const message = String(error?.message || "");
  return /\b(408|409|425|429|500|502|503|504)\b/.test(message);
}

function computeNextRetryAt({ attempts, now }) {
  const delayMinutes = Math.min(24 * 60, 15 * Math.pow(2, Math.max(0, attempts - 1)));
  return new Date(new Date(now).getTime() + delayMinutes * 60 * 1000).toISOString();
}

function communicationEventPayload({
  channel,
  provider,
  status,
  eventType,
  recipient,
  subject,
  body,
  providerMessageId,
  errorMessage,
  leadId,
  orderId,
  clientProjectId,
  source,
  sourceRecordId,
  templateKey,
  messageType,
  outboxId,
  metadata,
  now,
}) {
  const eventStatus = status === "suppressed" ? "suppressed" : status;
  return {
    lead_id: leadId || undefined,
    order_id: orderId || undefined,
    client_project_id: clientProjectId || undefined,
    context_id: sourceRecordId || leadId || orderId || undefined,
    context_type: source || undefined,
    channel,
    direction: "outbound",
    event_type: eventType || (channel === "sms" ? (status === "sent" ? "sms_sent" : "sms_failed") : (status === "sent" ? "email_sent" : "email_failed")),
    provider,
    status: eventStatus,
    subject: subject || recipient,
    message_body: body,
    provider_message_id: providerMessageId || null,
    error_message: errorMessage || null,
    failed_at: status === "failed" || status === "suppressed" ? now : undefined,
    metadata_json: safeJson({
      ...(metadata || {}),
      outbox_id: outboxId || null,
      source,
      source_record_id: sourceRecordId,
      template_key: templateKey,
      message_type: messageType,
      recipient_normalized: normalizeRecipient(channel, recipient),
      timestamp: now,
    }),
  };
}

export async function writeCommunicationEvent(base44, payload) {
  const entities = serviceEntities(base44);
  return createEntity(entities.CommunicationEvent, payload).catch((error) => {
    console.warn("[communicationOutbox] CommunicationEvent write failed:", error.message);
    return null;
  });
}

export async function sendCommunicationViaOutbox({
  base44,
  channel,
  provider = channel === "sms" ? "twilio" : "resend",
  recipient,
  subject = "",
  body,
  html,
  from,
  lead = {},
  leadId,
  orderId,
  clientProjectId,
  businessId,
  source = "manual",
  sourceRecordId,
  templateKey = "default",
  messageType = "transactional",
  consentBasis,
  consentSnapshot,
  enforceQuietHours,
  metadata = {},
  idempotencyKey,
  providerSend,
  allowRetryFailed = false,
  now = new Date().toISOString(),
}) {
  if (!base44) throw new Error("base44 client is required");
  if (!providerSend) throw new Error("providerSend is required");

  const entities = serviceEntities(base44);
  const nowDate = new Date(now);
  const normalizedRecipient = normalizeRecipient(channel, recipient);
  const resolvedLeadId = leadId || lead?.id || null;
  const resolvedSourceRecordId = sourceRecordId || resolvedLeadId || orderId || normalizedRecipient || "unknown";
  const resolvedIdempotencyKey = idempotencyKey || buildCommunicationIdempotencyKey({
    provider,
    channel,
    source,
    recipient,
    messageType,
    sourceRecordId: resolvedSourceRecordId,
    templateKey,
  });
  const outboundBody = channel === "sms" ? appendSmsOptOutFooter(body) : cleanString(body || html);

  const existing = await filterEntity(
    entities.CommunicationOutbox,
    { idempotency_key: resolvedIdempotencyKey },
    "-created_date",
    1
  );
  const existingOutbox = existing?.[0] || null;
  if (existingOutbox && (!allowRetryFailed || !RETRYABLE_OUTBOX_STATUSES.has(existingOutbox.status))) {
    return {
      success: TERMINAL_SUCCESS_STATUSES.has(existingOutbox.status),
      duplicate: true,
      suppressed: existingOutbox.status === "suppressed",
      outbox: existingOutbox,
      provider_message_id: existingOutbox.provider_message_id || null,
      status: existingOutbox.status,
    };
  }

  const compliance = evaluateCommunicationCompliance({
    channel,
    messageType,
    recipient,
    body: outboundBody,
    lead,
    consentBasis,
    consentSnapshot,
    enforceQuietHours,
    now: nowDate,
  });

  const baseOutboxPayload = {
    channel,
    provider,
    recipient,
    recipient_normalized: normalizedRecipient,
    business_id: businessId || undefined,
    client_project_id: clientProjectId || undefined,
    order_id: orderId || undefined,
    lead_id: resolvedLeadId || undefined,
    template_key: templateKey,
    source,
    source_record_id: resolvedSourceRecordId,
    subject: subject || undefined,
    message_body: outboundBody,
    html_body: html || undefined,
    from_address: from || undefined,
    message_type: messageType,
    consent_basis: consentBasis || (messageType === "transactional" ? "transactional_relationship" : "unspecified"),
    consent_snapshot: safeJson(compliance.consent_snapshot),
    idempotency_key: resolvedIdempotencyKey,
    status: "queued",
    attempts: existingOutbox ? (existingOutbox.attempts || 0) : 0,
    max_attempts: existingOutbox?.max_attempts || DEFAULT_MAX_ATTEMPTS,
    metadata_json: safeJson(metadata),
    created_at: existingOutbox?.created_at || now,
  };

  let outbox = existingOutbox;
  if (!outbox) {
    outbox = await createEntity(entities.CommunicationOutbox, baseOutboxPayload);
  }

  if (!compliance.allowed) {
    const update = {
      status: "suppressed",
      suppression_reason: compliance.reason,
      last_error: compliance.reason,
      quiet_hours_blocked: Boolean(compliance.quiet_hours_blocked),
      unsubscribe_blocked: Boolean(compliance.unsubscribe_blocked),
      failed_at: now,
    };
    await updateEntity(entities.CommunicationOutbox, outbox.id, update).catch(() => {});

    const event = await writeCommunicationEvent(base44, communicationEventPayload({
      channel,
      provider,
      status: "suppressed",
      eventType: channel === "sms" ? "sms_suppressed" : "email_suppressed",
      recipient,
      subject,
      body: outboundBody,
      errorMessage: compliance.reason,
      leadId: resolvedLeadId,
      orderId,
      clientProjectId,
      source,
      sourceRecordId: resolvedSourceRecordId,
      templateKey,
      messageType,
      outboxId: outbox.id,
      metadata,
      now,
    }));

    if (event?.id) {
      await updateEntity(entities.CommunicationOutbox, outbox.id, { communication_event_id: event.id }).catch(() => {});
    }

    return {
      success: false,
      suppressed: true,
      reason: compliance.reason,
      outbox: { ...outbox, ...update, communication_event_id: event?.id },
      status: "suppressed",
    };
  }

  const nextAttempts = (outbox.attempts || 0) + 1;
  await updateEntity(entities.CommunicationOutbox, outbox.id, {
    status: "sending",
    attempts: nextAttempts,
    last_error: null,
  }).catch(() => {});

  try {
    const sendResult = await providerSend({
      channel,
      provider,
      recipient: normalizedRecipient,
      subject,
      body: outboundBody,
      html,
      from,
      idempotencyKey: resolvedIdempotencyKey,
      metadata,
    });
    const providerMessageId = sendResult?.provider_message_id || sendResult?.messageId || sendResult?.sid || sendResult?.id || null;
    const providerStatus = sendResult?.provider_status || sendResult?.status || "sent";
    const update = {
      status: "sent",
      provider_message_id: providerMessageId,
      provider_status: providerStatus,
      attempts: nextAttempts,
      sent_at: now,
      last_error: null,
      next_retry_at: null,
      retryable: false,
    };
    await updateEntity(entities.CommunicationOutbox, outbox.id, update).catch(() => {});

    const event = await writeCommunicationEvent(base44, communicationEventPayload({
      channel,
      provider,
      status: "sent",
      recipient,
      subject,
      body: outboundBody,
      providerMessageId,
      leadId: resolvedLeadId,
      orderId,
      clientProjectId,
      source,
      sourceRecordId: resolvedSourceRecordId,
      templateKey,
      messageType,
      outboxId: outbox.id,
      metadata,
      now,
    }));

    if (event?.id) {
      await updateEntity(entities.CommunicationOutbox, outbox.id, { communication_event_id: event.id }).catch(() => {});
    }

    return {
      success: true,
      outbox: { ...outbox, ...update, communication_event_id: event?.id },
      event,
      provider_message_id: providerMessageId,
      provider_status: providerStatus,
      status: "sent",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || "Provider send failed");
    const retryable = isRetryableError(error);
    const update = {
      status: "failed",
      attempts: nextAttempts,
      last_error: errorMessage,
      failed_at: now,
      next_retry_at: retryable ? computeNextRetryAt({ attempts: nextAttempts, now }) : null,
      retryable,
    };
    await updateEntity(entities.CommunicationOutbox, outbox.id, update).catch(() => {});

    const event = await writeCommunicationEvent(base44, communicationEventPayload({
      channel,
      provider,
      status: "failed",
      recipient,
      subject,
      body: outboundBody,
      errorMessage,
      leadId: resolvedLeadId,
      orderId,
      clientProjectId,
      source,
      sourceRecordId: resolvedSourceRecordId,
      templateKey,
      messageType,
      outboxId: outbox.id,
      metadata: { ...metadata, retryable },
      now,
    }));

    if (event?.id) {
      await updateEntity(entities.CommunicationOutbox, outbox.id, { communication_event_id: event.id }).catch(() => {});
    }

    return {
      success: false,
      failed: true,
      retryable,
      error: errorMessage,
      outbox: { ...outbox, ...update, communication_event_id: event?.id },
      status: "failed",
    };
  }
}

export async function sendTwilioSmsProvider({
  recipient,
  body,
  from,
  env = (name) => globalThis?.Deno?.env?.get?.(name),
  fetchImpl = fetch,
}) {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const fromNumber = from || env("TWILIO_PHONE_NUMBER");
  const statusCallbackUrl = env("TWILIO_SMS_STATUS_CALLBACK_URL");

  if (!accountSid || !authToken || !fromNumber) {
    const missing = [
      !accountSid ? "TWILIO_ACCOUNT_SID" : null,
      !authToken ? "TWILIO_AUTH_TOKEN" : null,
      !fromNumber ? "TWILIO_PHONE_NUMBER" : null,
    ].filter(Boolean);
    const error = new Error(`Twilio credentials missing: ${missing.join(", ")}`);
    error.status = 500;
    throw error;
  }

  const params = {
    From: fromNumber,
    To: recipient,
    Body: body,
  };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const response = await fetchImpl(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`Twilio error: ${data?.message || response.status}`);
    error.status = response.status;
    error.provider_response = data;
    throw error;
  }

  return {
    provider_message_id: data.sid,
    provider_status: data.status || "queued",
    raw: data,
  };
}

export async function sendResendEmailProvider({
  recipient,
  subject,
  body,
  html,
  from,
  idempotencyKey,
  env = (name) => globalThis?.Deno?.env?.get?.(name),
  fetchImpl = fetch,
}) {
  const apiKey = env("RESEND_API_KEY");
  const fromEmail = from || env("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";
  if (!apiKey) {
    const error = new Error("Resend API key missing");
    error.status = 500;
    throw error;
  }

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: fromEmail.includes("<") ? fromEmail : `ClientSurge Systems <${fromEmail}>`,
      to: recipient,
      subject,
      html: html || body,
      text: cleanString(body || html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`Resend error: ${data?.message || response.status}`);
    error.status = response.status;
    error.provider_response = data;
    throw error;
  }

  return {
    provider_message_id: data.id,
    provider_status: "sent",
    raw: data,
  };
}

function getOutboxMetadata(outbox) {
  return parseJson(outbox?.metadata_json);
}

async function findLeadForOutbox(entities, outbox) {
  if (!outbox?.lead_id) return {};
  const candidates = [entities.WebsiteLead, entities.Leads, entities.Lead].filter(Boolean);
  for (const entity of candidates) {
    const lead = await getEntity(entity, outbox.lead_id);
    if (lead) return lead;
  }
  return {};
}

function defaultProviderSendForOutbox(outbox, overrides = {}) {
  if (outbox.channel === "sms") {
    return (payload) => sendTwilioSmsProvider({
      ...payload,
      from: payload.from || outbox.from_address,
      env: overrides.env,
      fetchImpl: overrides.fetchImpl,
    });
  }
  return (payload) => sendResendEmailProvider({
    ...payload,
    from: payload.from || outbox.from_address,
    env: overrides.env,
    fetchImpl: overrides.fetchImpl,
  });
}

export async function retryCommunicationOutboxRecord({
  base44,
  outbox,
  outboxId,
  manual = false,
  adminEmail = null,
  dryRun = false,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  providerSend,
  env,
  fetchImpl,
  now = new Date().toISOString(),
}) {
  const entities = serviceEntities(base44);
  const record = outbox || await getEntity(entities.CommunicationOutbox, outboxId);
  if (!record) {
    return { success: false, skipped: true, reason: "outbox_not_found" };
  }

  if (["sent", "delivered", "cancelled"].includes(record.status)) {
    return { success: false, skipped: true, reason: `status_${record.status}_not_retryable`, outbox_id: record.id };
  }

  const attemptLimit = Number(record.max_attempts || maxAttempts || DEFAULT_MAX_ATTEMPTS);
  if ((record.attempts || 0) >= attemptLimit) {
    await updateEntity(entities.CommunicationOutbox, record.id, {
      status: "needs_manual_review",
      last_error: record.last_error || "Max retry attempts exceeded",
      retryable: false,
    }).catch(() => {});
    return { success: false, skipped: true, reason: "max_attempts_exceeded", outbox_id: record.id };
  }

  const metadata = {
    ...getOutboxMetadata(record),
    retry: true,
    manual_retry: manual,
    retry_requested_by: adminEmail,
    original_outbox_id: record.id,
  };
  const lead = await findLeadForOutbox(entities, record);

  if (dryRun) {
    return {
      success: true,
      dry_run: true,
      outbox_id: record.id,
      would_retry: true,
      attempts: record.attempts || 0,
    };
  }

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: record.channel,
    provider: record.provider,
    recipient: record.recipient || record.recipient_normalized,
    subject: record.subject || "",
    body: record.message_body || "",
    html: record.html_body || undefined,
    from: record.from_address || undefined,
    lead,
    leadId: record.lead_id,
    orderId: record.order_id,
    clientProjectId: record.client_project_id,
    businessId: record.business_id,
    source: record.source || "communication_outbox_retry",
    sourceRecordId: record.source_record_id || record.id,
    templateKey: record.template_key || "retry",
    messageType: record.message_type || "transactional",
    consentBasis: record.consent_basis,
    consentSnapshot: parseJson(record.consent_snapshot),
    metadata,
    idempotencyKey: record.idempotency_key,
    providerSend: providerSend || defaultProviderSendForOutbox(record, { env, fetchImpl }),
    allowRetryFailed: true,
    now,
  });

  await writeCommunicationEvent(base44, {
    context_type: "CommunicationOutbox",
    context_id: record.id,
    channel: "internal",
    direction: "system",
    event_type: "delivery_status_updated",
    provider: "internal",
    status: result.success ? "processed" : "failed",
    subject: manual ? "Manual communication outbox retry" : "Communication outbox retry",
    message_body: result.success
      ? `Retry sent for ${record.channel} outbox ${record.id}.`
      : `Retry blocked or failed for ${record.channel} outbox ${record.id}: ${result.reason || result.error || result.status}`,
    error_message: result.success ? null : result.reason || result.error || result.status,
    metadata_json: safeJson({
      outbox_id: record.id,
      retried_outbox_id: result.outbox?.id || record.id,
      manual,
      requested_by: adminEmail,
      duplicate: Boolean(result.duplicate),
      suppressed: Boolean(result.suppressed),
      status: result.status,
      timestamp: now,
    }),
  });

  return {
    ...result,
    outbox_id: record.id,
    retried: result.success,
    manual,
  };
}

export async function processCommunicationOutboxRetries({
  base44,
  now = new Date().toISOString(),
  dryRun = false,
  limit = 50,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  providerSend,
  env,
  fetchImpl,
}) {
  const entities = serviceEntities(base44);
  const all = await listEntity(entities.CommunicationOutbox, "next_retry_at", 500);
  const due = (all || [])
    .filter((item) => item.status === "failed")
    .filter((item) => item.retryable !== false)
    .filter((item) => item.next_retry_at && new Date(item.next_retry_at).getTime() <= new Date(now).getTime())
    .slice(0, limit);

  const summary = {
    success: true,
    dry_run: dryRun,
    eligible: due.length,
    retried: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  for (const outbox of due) {
    const result = await retryCommunicationOutboxRecord({
      base44,
      outbox,
      dryRun,
      maxAttempts,
      providerSend,
      env,
      fetchImpl,
      now,
    });
    summary.results.push({
      outbox_id: outbox.id,
      success: Boolean(result.success),
      skipped: Boolean(result.skipped),
      reason: result.reason || result.error || result.status || null,
    });
    if (result.success && !result.dry_run) summary.retried++;
    else if (result.skipped) summary.skipped++;
    else if (!result.success) summary.failed++;
  }

  return summary;
}

export async function listCommunicationOutboxItems({
  base44,
  filters = {},
  limit = 100,
}) {
  const entities = serviceEntities(base44);
  const records = await listEntity(entities.CommunicationOutbox, "-created_at", Math.min(Number(limit) || 100, 500));
  const matches = (records || []).filter((item) => {
    return Object.entries(filters || {}).every(([key, value]) => {
      if (value == null || value === "") return true;
      if (key === "failed_or_suppressed") {
        return value ? ["failed", "suppressed", "needs_manual_review"].includes(item.status) : true;
      }
      if (key === "date_from") {
        return new Date(item.created_at || item.created_date || 0).getTime() >= new Date(value).getTime();
      }
      if (key === "date_to") {
        return new Date(item.created_at || item.created_date || 0).getTime() <= new Date(value).getTime();
      }
      return String(item[key] || "") === String(value);
    });
  });

  return {
    success: true,
    count: matches.length,
    items: matches.slice(0, limit),
  };
}

export function mapTwilioDeliveryStatus(messageStatus) {
  const statusMap = {
    queued: "queued",
    accepted: "queued",
    sending: "sending",
    sent: "sent",
    delivered: "delivered",
    failed: "failed",
    undelivered: "failed",
  };
  return statusMap[String(messageStatus || "").toLowerCase()] || null;
}

export function mapResendDeliveryStatus(type) {
  const statusMap = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "sent",
    "email.clicked": "sent",
    "email.bounced": "failed",
    "email.complained": "failed",
  };
  return statusMap[type] || "sent";
}

export async function updateOutboxDeliveryStatus({
  base44,
  provider,
  providerMessageId,
  providerStatus,
  status,
  failureReason,
  metadata = {},
  now = new Date().toISOString(),
}) {
  if (!providerMessageId) return { success: false, reason: "missing_provider_message_id" };
  const entities = serviceEntities(base44);
  const outboxes = await filterEntity(
    entities.CommunicationOutbox,
    { provider_message_id: providerMessageId },
    "-created_date",
    1
  );
  const events = await filterEntity(
    entities.CommunicationEvent,
    { provider_message_id: providerMessageId },
    "-created_date",
    1
  );

  const mappedStatus = status || providerStatus || "sent";
  const outboxUpdate = {
    provider_status: providerStatus || mappedStatus,
    status: mappedStatus,
    last_error: mappedStatus === "failed" ? failureReason || providerStatus || "provider_delivery_failed" : null,
    delivered_at: mappedStatus === "delivered" ? now : undefined,
    failed_at: mappedStatus === "failed" ? now : undefined,
  };

  if (outboxes[0]?.id) {
    const existingMetadata = parseJson(outboxes[0].metadata_json);
    await updateEntity(entities.CommunicationOutbox, outboxes[0].id, {
      ...outboxUpdate,
      metadata_json: safeJson({
        ...existingMetadata,
        delivery_update: {
          provider,
          provider_status: providerStatus,
          status: mappedStatus,
          failure_reason: failureReason || null,
          updated_at: now,
          ...metadata,
        },
      }),
    }).catch(() => {});
  }

  if (events[0]?.id) {
    const existingMetadata = parseJson(events[0].metadata_json);
    const eventStatus =
      providerStatus === "email.clicked"
        ? "clicked"
        : providerStatus === "email.opened"
          ? "opened"
          : mappedStatus === "queued" || mappedStatus === "sending"
            ? "pending"
            : mappedStatus;
    await updateEntity(entities.CommunicationEvent, events[0].id, {
      status: eventStatus,
      error_message: mappedStatus === "failed" ? failureReason || events[0].error_message || providerStatus : null,
      failure_reason: mappedStatus === "failed" ? failureReason || providerStatus : events[0].failure_reason,
      failed_at: mappedStatus === "failed" ? now : events[0].failed_at,
      last_engagement_at: providerStatus === "email.opened" || providerStatus === "email.clicked" ? now : events[0].last_engagement_at,
      engagement_type: providerStatus === "email.clicked" ? "clicked" : providerStatus === "email.opened" ? "opened" : events[0].engagement_type,
      metadata_json: safeJson({
        ...existingMetadata,
        delivery_update: {
          provider,
          provider_status: providerStatus,
          status: mappedStatus,
          failure_reason: failureReason || null,
          updated_at: now,
          ...metadata,
        },
      }),
    }).catch(() => {});
  }

  return {
    success: true,
    status: mappedStatus,
    outbox_id: outboxes[0]?.id || null,
    event_id: events[0]?.id || null,
  };
}

export async function applySmsOptOut({
  base44,
  phone,
  keyword,
  providerMessageId,
  now = new Date().toISOString(),
}) {
  const entities = serviceEntities(base44);
  const normalizedPhone = normalizePhoneNumber(phone);
  const matches = await filterEntity(entities.WebsiteLead, { phone_number: normalizedPhone }, "-created_date", 50);
  for (const lead of matches || []) {
    await updateEntity(entities.WebsiteLead, lead.id, {
      sms_opted_out: true,
      sms_opted_out_at: now,
      sms_opt_out_keyword: keyword,
      sms_opt_out_source: "twilio_inbound_sms",
      automation_enabled: false,
      cadence_paused: true,
      cadence_paused_reason: "sms_opt_out",
      follow_up_step: 999,
      next_follow_up_at: null,
    }).catch(() => {});
  }

  await writeCommunicationEvent(base44, {
    context_type: "sms_opt_out",
    channel: "sms",
    direction: "inbound",
    event_type: "sms_opt_out",
    provider: "twilio",
    status: "processed",
    subject: `[STOP] Opt-out from ${normalizedPhone}`,
    message_body: keyword,
    provider_message_id: providerMessageId || null,
    metadata_json: safeJson({
      from: normalizedPhone,
      keyword,
      leads_updated: matches?.length || 0,
      timestamp: now,
    }),
  });

  return { success: true, phone: normalizedPhone, leads_updated: matches?.length || 0 };
}

export async function applyEmailSuppression({
  base44,
  email,
  reason,
  providerMessageId,
  now = new Date().toISOString(),
}) {
  const entities = serviceEntities(base44);
  const normalizedEmail = normalizeRecipient("email", email);
  if (!normalizedEmail) return { success: false, reason: "missing_email" };

  const candidateEntities = [
    entities.WebsiteLead,
    entities.Leads,
    entities.Lead,
  ].filter(Boolean);
  let updated = 0;

  for (const entity of candidateEntities) {
    const matches = await filterEntity(entity, { email: normalizedEmail }, "-created_date", 50);
    for (const lead of matches || []) {
      await updateEntity(entity, lead.id, {
        email_suppressed: true,
        email_suppressed_at: now,
        email_suppression_reason: reason,
      }).then(() => {
        updated++;
      }).catch(() => {});
    }
  }

  await writeCommunicationEvent(base44, {
    context_type: "email_suppression",
    channel: "email",
    direction: "inbound",
    event_type: reason === "complaint" ? "provider_complaint_received" : "provider_bounce_received",
    provider: "resend",
    status: "processed",
    subject: `[RESEND] ${reason} for ${normalizedEmail}`,
    message_body: reason,
    provider_message_id: providerMessageId || null,
    metadata_json: safeJson({
      email: normalizedEmail,
      reason,
      leads_updated: updated,
      timestamp: now,
    }),
  });

  return { success: true, email: normalizedEmail, leads_updated: updated };
}

export function isSmsStopKeyword(body = "") {
  return SMS_STOP_KEYWORDS.has(cleanString(body).toUpperCase());
}
