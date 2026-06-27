import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

/**
 * Triggers an ElevenLabs outbound voice call to a HOT lead via Twilio.
 * Called by: onLeadCreated (for HOT leads), or manually from admin panel.
 */
const QUIET_HOURS_START = 20;
const QUIET_HOURS_END = 8;
const MAX_RETRY_ATTEMPTS = 3;

function isQuietHours() {
  const nowUTC = new Date();
  const phoenixHour = (nowUTC.getUTCHours() - 7 + 24) % 24;
  return phoenixHour >= QUIET_HOURS_START || phoenixHour < QUIET_HOURS_END;
}

async function initiateElevenLabsCall(apiKey, payload, attempt = 1) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      // Retry on rate limit (429) or server errors (5xx)
      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRY_ATTEMPTS) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(`[triggerVoiceCallToLead] Retrying after ${backoffMs}ms (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, backoffMs));
        return initiateElevenLabsCall(apiKey, payload, attempt + 1);
      }
      return { ok: false, result };
    }

    return { ok: true, result };
  } catch (err) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.warn(`[triggerVoiceCallToLead] Network error, retrying after ${backoffMs}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, backoffMs));
      return initiateElevenLabsCall(apiKey, payload, attempt + 1);
    }
    return { ok: false, result: { detail: err.message } };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return secureJson({ error: 'lead_id required' }, { status: 400 });
    }

    if (isQuietHours()) {
      return secureJson({ skipped: true, reason: 'quiet_hours' });
    }

    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id });
    if (!leads || leads.length === 0) {
      return secureJson({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    if (!lead.phone) {
      return secureJson({ skipped: true, reason: 'no_phone_number' });
    }

    if (lead.voice_call_attempted) {
      return secureJson({ skipped: true, reason: 'already_attempted' });
    }

    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings?.[0];

    if (!adminSettings?.voice_calls_enabled) {
      return secureJson({ skipped: true, reason: 'voice_calls_disabled' });
    }

    const industryKey = (lead.assigned_agent_name || 'general').replace('sales_rep_', '');
    const agentId = adminSettings?.elevenlabs_agent_ids?.[industryKey]
      || adminSettings?.elevenlabs_agent_ids?.general
      || adminSettings?.elevenlabs_agent_ids?.med_spa;
    const phoneNumberId = adminSettings?.elevenlabs_phone_number_ids?.[industryKey]
      || adminSettings?.elevenlabs_phone_number_ids?.general
      || adminSettings?.elevenlabs_phone_number_ids?.med_spa;

    if (!agentId) {
      return secureJson({ skipped: true, reason: 'no_agent_id_configured' });
    }
    if (!phoneNumberId) {
      return secureJson({ skipped: true, reason: 'no_phone_number_id_configured' });
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      return secureJson({ error: 'ELEVENLABS_API_KEY not set' }, { status: 500 });
    }

    const callPayload = {
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: lead.phone,
      conversation_initiation_client_data: {
        conversation_config_override: {
          agent: {
            first_message: `Hi ${(lead.full_name || '').split(' ')[0] || 'there'}! This is Sarah calling from ClientSurge Systems. You recently reached out about automating your lead follow-up — did I catch you at a good time?`,
          },
        },
      },
    };

    const { ok, result } = await initiateElevenLabsCall(elevenLabsApiKey, callPayload);

    if (!ok) {
      console.error('[triggerVoiceCallToLead] ElevenLabs API error:', result);
      await base44.asServiceRole.entities.Leads.update(lead_id, {
        voice_call_attempted: true,
        voice_call_outcome: 'failed',
      });
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id,
        channel: 'voice',
        direction: 'outbound',
        event_type: 'voice_call_initiated',
        provider: 'elevenlabs',
        status: 'failed',
        error_message: result?.detail || JSON.stringify(result),
        metadata_json: JSON.stringify({ industry_key: industryKey, agent_id }),
      });
      return secureJson({ error: 'ElevenLabs call failed', detail: result }, { status: 500 });
    }

    await Promise.all([
      base44.asServiceRole.entities.Leads.update(lead_id, {
        voice_call_attempted: true,
        voice_call_outcome: 'not_attempted',
        last_contacted_at: new Date().toISOString(),
      }),
      base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id,
        channel: 'voice',
        direction: 'outbound',
        event_type: 'voice_call_initiated',
        provider: 'elevenlabs',
        status: 'sent',
        metadata_json: JSON.stringify({
          industry_key: industryKey,
          agent_id: agentId,
          phone_number_id: phoneNumberId,
          conversation_id: result?.conversation_id,
          call_sid: result?.call_sid,
        }),
      }),
    ]);

    return secureJson({
      success: true,
      lead_id,
      industry_key: industryKey,
      conversation_id: result?.conversation_id,
      call_sid: result?.call_sid,
    });
  } catch (error) {
    console.error('[triggerVoiceCallToLead] Error:', error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});