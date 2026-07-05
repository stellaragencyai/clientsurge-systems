import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function appendSmsOptOut(message) {
  if (!message) return "";
  const trimmed = message.trim();
  if (/\bSTOP\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  if (cleaned.length === 10) {
    if (cleaned[0] === '0' || cleaned[0] === '1') return null;
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const tenDigits = cleaned.slice(1);
    if (tenDigits[0] === '0' || tenDigits[0] === '1') return null;
    return `+${cleaned}`;
  }
  if (cleaned.length >= 11 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

// ── Tenant Scope Guardrail (inlined — no local imports in Deno deploy) ──
const SYSTEM_INTERNAL_TRIGGERS = ["admin_notification", "system_internal", "internal_test", "test_lead", "smoke_test", "demo"];

function isSystemInternal(trigger_name) {
  if (!trigger_name) return false;
  const tn = String(trigger_name).toLowerCase();
  return SYSTEM_INTERNAL_TRIGGERS.some((s) => tn.includes(s));
}

async function resolveTenantScope(base44, ctx = {}) {
  const { client_id, client_project_id, lead_id, website_lead_id, order_id, onboarding_client_id, trigger_name } = ctx;

  if (client_id) {
    return { ok: true, client_id, client_project_id: client_project_id || null, source: "explicit" };
  }
  if (isSystemInternal(trigger_name)) {
    return { ok: true, client_id: null, client_project_id: client_project_id || null, source: "system_internal", system_internal: true };
  }
  if (lead_id) {
    try {
      const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
      if (lead?.client_id) {
        return { ok: true, client_id: lead.client_id, client_project_id: lead.client_project_id || client_project_id || null, source: "leads" };
      }
    } catch (_) {}
  }
  if (website_lead_id) {
    try {
      const wl = await base44.asServiceRole.entities.WebsiteLead.get(website_lead_id);
      if (wl?.client_id) {
        return { ok: true, client_id: wl.client_id, client_project_id: wl.client_project_id || client_project_id || null, source: "website_lead" };
      }
    } catch (_) {}
  }
  if (order_id) {
    try {
      const project = await base44.asServiceRole.entities.ClientProject.filter({ order_id }, "-created_date", 1);
      if (project?.[0]?.client_id) {
        return { ok: true, client_id: project[0].client_id, client_project_id: project[0].id || client_project_id || null, source: "order_to_project" };
      }
    } catch (_) {}
  }
  return { ok: false, client_id: null, client_project_id: null, error: "missing_client_id_tenant_scope", source: "unresolved", context: { lead_id, website_lead_id, order_id, trigger_name } };
}

async function logTenantScopeBlock(base44, ctx = {}) {
  const now = new Date().toISOString();
  const { lead_id, channel = "sms", trigger_name = "unknown", to_address, provider = "twilio" } = ctx;
  const baseRecord = { lead_id: lead_id || null, client_id: null, client_project_id: null, tenant_scope_status: "missing_client_id", tenant_scope_error: "missing_client_id_tenant_scope" };
  try {
    await base44.asServiceRole.entities.CommunicationLog.create({ ...baseRecord, channel, provider, direction: "outbound", trigger_name, to_address: to_address || null, delivery_status: "skipped", error_message: "missing_client_id_tenant_scope", failed_at: now, environment: "production" });
  } catch (e) { console.error("[sendSMS] tenant scope block log failed:", e.message); }
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({ ...baseRecord, channel, direction: "outbound", event_type: "tenant_scope_blocked", provider, status: "failed", subject: "Outbound send blocked — missing client_id", error_message: "missing_client_id_tenant_scope", metadata_json: JSON.stringify({ trigger_name, to_address }) });
  } catch (e) { console.error("[sendSMS] tenant scope event log failed:", e.message); }
}

Deno.serve(async (req) => {
  try {
    const { phone, message, leadId, clientId, clientProjectId, websiteLeadId, orderId, triggerName } = await req.json();

    if (!phone || !message) {
      return json({ error: 'Phone and message required' }, 400);
    }

    const base44 = createClientFromRequest(req);

    // ── TENANT SCOPE GUARDRAIL ──
    // Block the send if client_id cannot be resolved and this is not a system-internal event.
    const scope = await resolveTenantScope(base44, {
      client_id: clientId,
      client_project_id: clientProjectId,
      lead_id: leadId,
      website_lead_id: websiteLeadId,
      order_id: orderId,
      trigger_name: triggerName,
    });

    if (!scope.ok) {
      await logTenantScopeBlock(base44, {
        lead_id: leadId,
        channel: "sms",
        trigger_name: triggerName || "sendSMS",
        to_address: phone,
        provider: "twilio",
      });
      return json({ error: 'missing_client_id_tenant_scope', sms_sent: false, reason: 'missing_client_id_tenant_scope' }, 403);
    }

    // ── E.164 NORMALIZATION ──
    const rawPhone = phone;
    const normalizedPhone = normalizePhoneToE164(rawPhone);

    if (!normalizedPhone) {
      if (leadId) {
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: leadId,
            client_id: scope.client_id,
            client_project_id: scope.client_project_id,
            tenant_scope_status: scope.system_internal ? "system_internal" : "scoped",
            channel: 'sms',
            direction: 'outbound',
            event_type: 'sms_skipped',
            provider: 'twilio',
            status: 'failed',
            subject: 'SMS skipped — invalid phone number',
            error_message: 'invalid_phone_number',
            metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: null }),
          });
        } catch (_) {}
      }
      return json({ error: 'Invalid phone number', sms_sent: false, reason: 'invalid_phone_number', raw_phone: rawPhone, normalized_phone: null }, 400);
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      return json({ error: 'Twilio credentials not configured' }, 500);
    }

    // ── Resolve From number from AdminSettings (source of truth) ──
    let fromNumber = null;
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      if (settings?.[0]?.twilio_from_number) {
        fromNumber = settings[0].twilio_from_number;
      }
    } catch (e) {
      console.warn('[sendSMS] AdminSettings load failed:', e.message);
    }
    if (!fromNumber) {
      fromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER');
    }
    if (fromNumber) {
      const digits = String(fromNumber).replace(/\D/g, '');
      if (digits.length === 10) fromNumber = `+1${digits}`;
      else if (digits.length === 11 && digits.startsWith('1')) fromNumber = `+${digits}`;
      else if (digits.length > 0) fromNumber = `+${digits}`;
      else fromNumber = null;
    }
    if (fromNumber === '+18778123630') {
      return json({ error: 'Twilio sender +18778123630 is BLOCKED. Use +16025843227.' }, 500);
    }
    if (!fromNumber) {
      return json({ error: 'Twilio FROM number not configured.' }, 500);
    }

    // ── Per-client from number override (future: ClientAccountConfig.messaging_config) ──
    // TODO: when per-client Twilio numbers are configured, resolve from ClientAccountConfig here.
    const providerFromNumber = fromNumber;

    // ── Consent guard ──
    if (leadId) {
      try {
        const lead = await base44.asServiceRole.entities.Leads.get(leadId);
        if (lead) {
          if (lead.do_not_contact === true) {
            return json({ error: 'Lead has do_not_contact flag', sms_sent: false, reason: 'do_not_contact', safe_to_continue: true }, 200);
          }
          if (lead.consent_given === false) {
            return json({ error: 'Lead has not given consent', sms_sent: false, reason: 'consent_not_given', safe_to_continue: true }, 200);
          }
        }
      } catch (_) {}
    }

    const auth = btoa(`${accountSid}:${authToken}`);
    const statusCallbackUrl = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL');

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: normalizedPhone,
        Body: appendSmsOptOut(message),
        ...(statusCallbackUrl && { StatusCallback: statusCallbackUrl }),
      }).toString(),
    });

    const data = await response.json();

    const tenantScopeStatus = scope.system_internal ? "system_internal" : "scoped";

    if (!response.ok) {
      if (leadId) {
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: leadId,
            client_id: scope.client_id,
            client_project_id: scope.client_project_id,
            tenant_scope_status: tenantScopeStatus,
            channel: 'sms',
            direction: 'outbound',
            event_type: 'sms_failed',
            provider: 'twilio',
            status: 'failed',
            message_body: message,
            provider_from_number: providerFromNumber,
            error_message: data.message || `Twilio error ${response.status}`,
            metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: normalizedPhone }),
          });
        } catch (_) {}
      }
      return json({ error: 'Failed to send SMS', details: data, normalized_phone: normalizedPhone }, 500);
    }

    // ── Log success with tenant scope ──
    if (leadId) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: leadId,
          client_id: scope.client_id,
          client_project_id: scope.client_project_id,
          tenant_scope_status: tenantScopeStatus,
          channel: 'sms',
          direction: 'outbound',
          event_type: 'sms_sent',
          provider: 'twilio',
          status: 'sent',
          message_body: message,
          provider_from_number: providerFromNumber,
          provider_message_id: data.sid || null,
          metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: normalizedPhone }),
        });

        await base44.entities.Messages.create({
          lead_id: leadId,
          client_id: scope.client_id,
          client_project_id: scope.client_project_id,
          tenant_scope_status: tenantScopeStatus,
          direction: 'outbound',
          channel: 'sms',
          message_text: message,
          status: 'sent',
          provider_from_number: providerFromNumber,
        });
      } catch (_) {}
    }

    return json({ success: true, messageSid: data.sid, normalized_phone: normalizedPhone, client_id: scope.client_id });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});