import { secureJson } from "../_shared/response.ts";
/**
 * Missed Call Text-Back Handler
 * Triggered when a call comes in and no one answers
 * Sends automatic SMS to reopen conversation
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import crypto from "node:crypto";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";

async function validateTwilioSignature(req, rawBody) {
  const webhookKey = Deno.env.get("TWILIO_WEBHOOK_KEY");
  const providedWebhookKey = new URL(req.url).searchParams.get("twilio_webhook_key");
  if (webhookKey && providedWebhookKey && webhookKey === providedWebhookKey) {
    console.log("[MissedCall] Twilio webhook key valid");
    return { valid: true, key_validated: true };
  }

  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!token) {
    console.error("[MissedCall] TWILIO_AUTH_TOKEN is not set — cannot validate signature");
    return { valid: false, missing_token: true };
  }

  const signature = req.headers.get("X-Twilio-Signature");
  if (!signature) {
    console.warn("[MissedCall] X-Twilio-Signature header is missing");
    return { valid: false, missing_signature: true };
  }

  console.log("[MissedCall] Validating Twilio signature...");

  const originalUrl = new URL(req.url);
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const detectedHost = forwardedHost || req.headers.get("host") || originalUrl.host;
  const host = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(detectedHost)
    ? "client-surge-systems-copy-a9653cae.base44.app"
    : detectedHost;
  const protocol = forwardedProto || originalUrl.protocol.replace(":", "");
  const url = `${protocol}://${host}${originalUrl.pathname}${originalUrl.search}`;
  const params = new URLSearchParams(rawBody);
  const toSign =
    url +
    Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join("");

  const computed = crypto.createHmac("sha1", token).update(toSign).digest("base64");

  if (computed !== signature) {
    console.warn("[MissedCall] Signature invalid — request rejected");
    return { valid: false };
  }

  console.log("[MissedCall] Signature valid");
  return { valid: true };
}

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

const DEFAULT_MISSED_CALL_SMS = "Hi {first_name}, we missed your call! Text back or reply to this message and we'll get right back to you.";

function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `+${digits.length === 10 ? "1" : ""}${digits}`;
}

function normalizeInboundSmsBody(body) {
  if (!body) return "";
  return String(body).trim().substring(0, 1000);
}

async function findWebsiteLeadByPhone(base44, phoneNumber) {
  if (!phoneNumber) return null;

  try {
    const matches = await base44.asServiceRole.entities.WebsiteLead.filter(
      {
        phone_number: phoneNumber,
        lead_status: { $nin: ["closed", "ignored"] },
        booking_status: { $ne: "booked" },
      },
      "-created_date",
      1
    );

    return matches?.[0] || null;
  } catch (error) {
    console.error(`[InboundSms] WebsiteLead lookup failed: ${error.message}`);
    return null;
  }
}

async function isInboundSmsAlreadyProcessed(base44, messageSid) {
  if (!messageSid) return false;

  try {
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {
        provider_message_id: messageSid,
        event_type: "sms_received",
      },
      "-created_date",
      1
    );

    return Boolean(existing?.length);
  } catch (error) {
    console.error(`[InboundSms] Idempotency check failed: ${error.message}`);
    return false;
  }
}

function emptyTwilioResponse() {
  return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8", "X-Frame-Options": "DENY" },
  });
}

function voiceTwilioResponse() {
  return new Response(
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>Thanks for calling. We missed you, and we are sending a text now.</Say></Response>",
    {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8", "X-Frame-Options": "DENY" },
    }
  );
}

function mapTwilioStatus(twilioStatus) {
  switch (twilioStatus) {
    case "delivered": return "delivered";
    case "failed":
    case "undelivered": return "failed";
    case "sent": return "sent";
    case "queued":
    case "accepted":
    case "sending": return "pending";
    default: return null;
  }
}

async function handleSmsStatusCallback(base44, formData) {
  const messageSid = formData.get("MessageSid") || "";
  const messageStatus = formData.get("MessageStatus") || "";
  const errorCode = formData.get("ErrorCode") || null;
  const errorMessage = formData.get("ErrorMessage") || null;
  const to = formData.get("To") || "";
  const from = formData.get("From") || "";

  console.log(`[SmsStatusCallback] SID=${messageSid} status=${messageStatus} errorCode=${errorCode || "none"}`);

  if (!messageSid) {
    return secureJson({ error: "Missing MessageSid" }, { status: 400 });
  }

  const mappedStatus = mapTwilioStatus(messageStatus);
  if (!mappedStatus) {
    return secureJson({ status: "ok_noop" });
  }

  const matches = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { provider_message_id: messageSid },
    "-created_date",
    1
  );

  if (!matches?.length) {
    console.warn(`[SmsStatusCallback] No CommunicationEvent found for SID ${messageSid}`);
    // Twilio can deliver status callbacks before our send path finishes writing
    // the CommunicationEvent. Return a retryable error so the next attempt can
    // attach to the event instead of silently losing delivery state.
    return secureJson({ error: "CommunicationEvent not ready", retry: true }, { status: 503 });
  }

  const event = matches[0];
  if (event.status === mappedStatus && ["delivered", "failed"].includes(mappedStatus)) {
    return secureJson({ status: "ok_idempotent" });
  }

  let existingMeta = {};
  try {
    existingMeta = JSON.parse(event.metadata_json || "{}");
  } catch (_) {}

  await base44.asServiceRole.entities.CommunicationEvent.update(event.id, {
    status: mappedStatus,
    error_message: errorCode
      ? `Twilio ${messageStatus} (code ${errorCode}): ${errorMessage || ""}`
      : mappedStatus === "delivered"
        ? null
        : event.error_message,
    metadata_json: JSON.stringify({
      ...existingMeta,
      twilio_delivery: {
        message_status: messageStatus,
        error_code: errorCode,
        error_message: errorMessage,
        to,
        from,
        updated_at: new Date().toISOString(),
      },
    }),
  });

  console.log(`[SmsStatusCallback] Updated CommunicationEvent ${event.id} -> status=${mappedStatus}`);
  return secureJson({ status: "ok_updated", event_id: event.id, mapped_status: mappedStatus });
}

async function handleInboundSms(base44, formData) {
  const messageSid = formData.get("MessageSid");
  const fromNumber = normalizePhoneNumber(formData.get("From"));
  const toNumber = normalizePhoneNumber(formData.get("To"));
  const body = normalizeInboundSmsBody(formData.get("Body"));
  const now = new Date().toISOString();

  console.log(`[InboundSms] Received SMS ${messageSid} from ${fromNumber} to ${toNumber}`);

  const errors = [];
  if (!messageSid) errors.push("MessageSid is required");
  if (!fromNumber) errors.push("From is required");
  if (!toNumber) errors.push("To is required");
  if (!body) errors.push("Body is required");

  if (errors.length) {
    console.warn("[InboundSms] Invalid payload", errors);
    return secureJson({ error: "Invalid SMS payload", details: errors }, { status: 400 });
  }

  if (await isInboundSmsAlreadyProcessed(base44, messageSid)) {
    console.log(`[InboundSms] Duplicate MessageSid skipped: ${messageSid}`);
    return emptyTwilioResponse();
  }

  const websiteLead = await findWebsiteLeadByPhone(base44, fromNumber);

  if (websiteLead) {
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(websiteLead.id, {
        reply_status: "responded",
        lead_status: "responded",
        last_message_sent: now,
        next_follow_up_at: null,
        follow_up_step: 999,
        automation_enabled: false,
      });
      console.log(`[InboundSms] Marked WebsiteLead ${websiteLead.id} as responded`);
    } catch (error) {
      console.error(`[InboundSms] WebsiteLead update failed: ${error.message}`);
    }
  }

  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_type: websiteLead ? "website_lead" : "inbound_sms_unmatched",
      context_id: websiteLead?.id,
      channel: "sms",
      direction: "inbound",
      event_type: "sms_received",
      provider: "twilio",
      status: websiteLead ? "received" : "unmatched",
      subject: websiteLead
        ? `[TWILIO SMS] Reply from ${fromNumber}`
        : `[TWILIO SMS] Unmatched inbound from ${fromNumber}`,
      message_body: body,
      provider_message_id: messageSid,
      metadata_json: JSON.stringify({
        from: fromNumber,
        to: toNumber,
        message_sid: messageSid,
        timestamp: now,
        trigger: "inbound_sms_webhook",
        matched_website_lead_id: websiteLead?.id || null,
        automation_stopped: Boolean(websiteLead),
      }),
    });
    console.log(`[InboundSms] Logged SMS ${messageSid}`);
  } catch (error) {
    console.error(`[InboundSms] CommunicationEvent create failed: ${error.message}`);
  }

  return emptyTwilioResponse();
}

function formatSmsTemplate(template, lead) {
  return template
    .replace("{first_name}", lead.first_name || lead.full_name?.split(" ")[0] || "there")
    .replace("{business_name}", lead.business_name || "our business");
}

async function sendTwilioSms(toNumber, messageBody) {
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
  if (!statusCallbackUrl) {
    console.warn("[MissedCall] TWILIO_SMS_STATUS_CALLBACK_URL missing — SMS delivery tracking disabled");
  }

  console.log(`[MissedCall] Sending SMS to ${toNumber}`);

  const params = { From: TWILIO_FROM_NUMBER, To: toNumber, Body: appendSmsOptOut(messageBody) };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const response = await twilioFetch(TWILIO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Twilio] Error: ${response.status} - ${error}`);
    throw new Error(`Twilio SMS failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[MissedCall] SMS sent. SID: ${data.sid}`);
  return data.sid;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    // Read raw body for signature validation (must be done before formData)
    const rawBody = await req.text();

    // Validate Twilio signature before processing anything
    const sigResult = await validateTwilioSignature(req, rawBody);
    if (sigResult.missing_token) {
      return secureJson({ error: "Server configuration error" }, { status: 500 });
    }
    if (!sigResult.valid) {
      return secureJson({
        error: "Forbidden",
        reason: sigResult.missing_signature ? "missing_signature" : "invalid_signature",
      }, { status: 403 });
    }

    // Parse Twilio webhook payload
    const formData = new URLSearchParams(rawBody);
    const base44 = createClientFromRequest(req);
    if (formData.get("MessageStatus")) {
      return await handleSmsStatusCallback(base44, formData);
    }

    if (formData.get("MessageSid") && formData.get("Body")) {
      return await handleInboundSms(base44, formData);
    }

    const callSid = formData.get("CallSid");
    const fromNumber = formData.get("From");
    const callStatus = formData.get("CallStatus");

    console.log(`[MissedCall] Webhook received. Status: ${callStatus}, From: ${fromNumber}`);

    if (callSid) {
      const existingCallEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { provider_message_id: callSid },
        "-created_date",
        1
      ).catch(() => []);

      if (existingCallEvents?.length) {
        console.log(`[MissedCall] Duplicate CallSid skipped: ${callSid}`);
        return voiceTwilioResponse();
      }
    }

    const missedCallStatuses = new Set(["ringing", "no-answer", "failed", "busy"]);
    if (!missedCallStatuses.has(callStatus)) {
      console.log(`[MissedCall] Call status ${callStatus} does not require text-back`);
      return voiceTwilioResponse();
    }

    if (!fromNumber) {
      return secureJson({ error: "Missing phone number" }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(fromNumber);
    if (!normalizedPhone) {
      return secureJson({ error: "Invalid phone number" }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────
    // STEP 1: Find or create lead in Leads entity (for missed-call processor)
    // ─────────────────────────────────────────────────────────
    let lead;
    const now = new Date().toISOString();
    
    try {
      const leads = await base44.asServiceRole.entities.Leads.filter(
        { phone: normalizedPhone },  
        "-last_contacted_at",
        1
      );
      
      if (leads && leads.length > 0) {
        lead = leads[0];
        console.log(`[MissedCall] Found existing lead ${lead.id}`);
      } else {
        // Create new lead with "Contacted" status so processMissedCallFollowUps will pick it up
        lead = await base44.asServiceRole.entities.Leads.create({
          full_name: "Unknown Caller",
          business_name: "Unknown Business",
          email: "unknown@example.com",
          phone: normalizedPhone,
          business_type: "Unknown",
          problem: "Missed call inbound",
          source: "twilio_missed_call",
          status: "Contacted",
          activation_priority: "Hot",
          last_contacted_at: now,
        });
        console.log(`[MissedCall] Created new lead ${lead.id} from missed call`);
      }
    } catch (e) {
      console.error(`[MissedCall] Lead lookup/creation failed: ${e.message}`);
      // Continue anyway — SMS will still be sent
      lead = null;
    }

    // #11: Dedup — check if we already sent a text-back for this CallSid
    if (callSid && lead) {
      try {
        const existingEvent = await base44.asServiceRole.entities.CommunicationEvent.filter(
          { provider_message_id: callSid },
          "-created_date",
          1
        );
        if (existingEvent && existingEvent.length > 0) {
          console.log(`[MissedCall] CallSid ${callSid} already processed — skipping duplicate`);
          return secureJson({ message: "Already processed", callSid });
        }
      } catch (e) {
        console.warn(`[MissedCall] Dedup check failed: ${e.message} — proceeding anyway`);
      }
    }

    // Get SMS template from settings
    let smsTemplate = DEFAULT_MISSED_CALL_SMS;
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.filter({}, null, 1);
      if (settings && settings.length > 0 && settings[0].missed_call_sms_template) {
        smsTemplate = settings[0].missed_call_sms_template;
      }
    } catch (e) {
      console.warn(`[MissedCall] Settings fetch failed: ${e.message}`);
    }

    // Format message
    const messageBody = appendSmsOptOut(
      lead
        ? formatSmsTemplate(smsTemplate, lead)
        : smsTemplate.replace("{first_name}", "there").replace("{business_name}", "our business")
    );

    // ── DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    if (lead?.client_id) {
      try {
        const deps = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: lead.client_id, deployment_status: { $in: ["live", "onboarding", "configuring", "ready"] } },
          "-created_date", 1
        );
        const dep = deps?.[0] || null;
        if (dep) {
          const permRes = await base44.asServiceRole.functions.invoke("checkModulePermission", {
            deployment_id: dep.id, module_key: "missed_call_text_back",
          });
          if (permRes.data?.authorized !== true) {
            await base44.asServiceRole.functions.invoke("logAutomationExecution", {
              client_deployment_id: dep.id, client_id: lead.client_id,
              module_key: "missed_call_text_back", trigger_event: "missed_call_webhook",
              execution_status: "blocked",
              error_message: `Module not authorized (reason: ${permRes.data?.reason || "unknown"})`,
              error_code: permRes.data?.reason || "module_not_authorized",
              lead_id: lead.id,
            }).catch(() => {});
            return voiceTwilioResponse();
          }
          _obsCtx = {
            deployment_id: dep.id, client_id: lead.client_id,
            module_key: "missed_call_text_back", trigger_event: "missed_call_webhook",
            lead_id: lead.id,
          };
        }
      } catch (_obsErr) {
        console.warn("[MissedCall] Observability init failed:", _obsErr.message);
      }
    }

    // Send SMS
    const messageSid = await sendTwilioSms(normalizedPhone, messageBody);

    // ── DEPLOYMENT OBSERVABILITY: Log successful execution ──
    if (_obsCtx) {
      await base44.asServiceRole.functions.invoke("logAutomationExecution", {
        ..._obsCtx, execution_status: "completed",
        external_provider_reference: messageSid,
        execution_time_ms: Date.now() - _obsStartTime,
      }).catch(() => {});
    }

    // ─────────────────────────────────────────────────────────
    // STEP 2: Update lead and log missed-call inbound event
    // ─────────────────────────────────────────────────────────
    if (lead) {
      try {
        // Update lead: ensure activation_priority stays Hot and last_contacted_at is current
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          status: "Contacted",
          activation_priority: "Hot",
          last_contacted_at: now,
        });
        console.log(`[MissedCall] Updated lead ${lead.id} — status=Contacted, priority=Hot`);
      } catch (e) {
        console.error(`[MissedCall] Failed to update lead: ${e.message}`);
      }

      // ─────────────────────────────────────────────────────────
      // STEP 3: Log inbound missed call event
      // ─────────────────────────────────────────────────────────
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          context_type: "lead",
          context_id: lead.id,
          channel: "webhook",
          direction: "inbound",
          event_type: "workflow_triggered",
          provider: "twilio",
          status: "received",
          subject: `[TWILIO] Missed call from ${normalizedPhone}`,
          message_body: `Missed call (no answer / failed). Automated text-back sent.`,
          provider_message_id: callSid,
          metadata_json: JSON.stringify({
            service_key: "missed_call_text_back",
            event_name: "missed_call",
            inbound_call_sid: callSid,
            caller_phone: normalizedPhone,
            call_status: callStatus,
            sms_response_sent: messageSid,
            timestamp: now,
            trigger: "missed_call_webhook",
          }),
        });
        console.log(`[MissedCall] Logged missed-call event for lead ${lead.id}`);
      } catch (e) {
        console.warn(`[MissedCall] Failed to log event: ${e.message}`);
      }

      // ─────────────────────────────────────────────────────────
      // STEP 4: Log outbound SMS response
      // ─────────────────────────────────────────────────────────
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          context_type: "lead",
          context_id: lead.id,
          channel: "sms",
          direction: "outbound",
          event_type: "sms_sent",
          provider: "twilio",
          status: "sent",
          message_body: messageBody,
          provider_message_id: messageSid,
          metadata_json: JSON.stringify({
            service_key: "missed_call_text_back",
            trigger: "missed_call_webhook",
            timestamp: now,
          }),
        });
        console.log(`[MissedCall] Logged SMS response for lead ${lead.id}`);
      } catch (e) {
        console.warn(`[MissedCall] Failed to log SMS event: ${e.message}`);
      }
    } else {
      console.log(`[MissedCall] No lead created/found for ${normalizedPhone}, SMS sent anyway`);
    }

    return voiceTwilioResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[MissedCall] Handler error: ${message}`);
    return secureJson({ error: message }, { status: 500 });
  }
});