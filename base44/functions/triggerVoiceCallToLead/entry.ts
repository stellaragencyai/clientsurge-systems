import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggers an ElevenLabs outbound voice call to a HOT lead via Twilio.
 *
 * Prerequisites (manual one-time setup in dashboards):
 * 1. ElevenLabs Dashboard → Agents → Create agent → copy agent_id
 *    → save to AdminSettings.elevenlabs_agent_ids.med_spa (etc.)
 * 2. ElevenLabs Dashboard → Phone Numbers → Import Twilio number
 *    (enter Twilio Account SID + Auth Token) → copy phone_number_id
 *    → save to AdminSettings.elevenlabs_phone_number_ids.med_spa (etc.)
 * 3. Set ELEVENLABS_API_KEY secret (already done ✅)
 * 4. Enable AdminSettings.voice_calls_enabled = true
 *
 * Called by: onLeadCreated (for HOT leads), or manually from admin panel
 */

const QUIET_HOURS_START = 20; // 8pm local
const QUIET_HOURS_END = 8;    // 8am local

function isQuietHours() {
  // Phoenix time (MST = UTC-7, no DST)
  const nowUTC = new Date();
  const phoenixHour = (nowUTC.getUTCHours() - 7 + 24) % 24;
  return phoenixHour >= QUIET_HOURS_START || phoenixHour < QUIET_HOURS_END;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return secureJson({ error: 'lead_id required' }, { status: 400 });
    }

    // 1. Quiet hours guard
    if (isQuietHours()) {
      console.log('[triggerVoiceCallToLead] Quiet hours — skipping voice call');
      return secureJson({ skipped: true, reason: 'quiet_hours' });
    }

    // 2. Fetch lead
    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id });
    if (!leads || leads.length === 0) {
      return secureJson({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    if (!lead.phone) {
      return secureJson({ skipped: true, reason: 'no_phone_number' });
    }

    // 3. Check if already attempted
    if (lead.voice_call_attempted) {
      console.log('[triggerVoiceCallToLead] Voice call already attempted for lead', lead_id);
      return secureJson({ skipped: true, reason: 'already_attempted' });
    }

    // 4. Load admin settings
    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings?.[0];

    if (!adminSettings?.voice_calls_enabled) {
      console.log('[triggerVoiceCallToLead] Voice calls disabled in AdminSettings');
      return secureJson({ skipped: true, reason: 'voice_calls_disabled' });
    }

    // 5. Determine industry → get ElevenLabs agent_id + phone_number_id
    const industryKey = (lead.assigned_agent_name || 'general').replace('sales_rep_', '');
    const agentId = adminSettings?.elevenlabs_agent_ids?.[industryKey]
      || adminSettings?.elevenlabs_agent_ids?.med_spa; // fallback to med_spa for now
    const phoneNumberId = adminSettings?.elevenlabs_phone_number_ids?.[industryKey]
      || adminSettings?.elevenlabs_phone_number_ids?.general
      || adminSettings?.elevenlabs_phone_number_ids?.med_spa;

    if (!agentId) {
      console.error(`[triggerVoiceCallToLead] No ElevenLabs agent_id configured for industry: ${industryKey}`);
      return secureJson({
        skipped: true,
        reason: 'no_agent_id_configured',
        fix: `Go to ElevenLabs dashboard → Agents → create agent → save the agent_id to AdminSettings.elevenlabs_agent_ids.${industryKey}`,
      });
    }

    if (!phoneNumberId) {
      console.error('[triggerVoiceCallToLead] No ElevenLabs phone_number_id configured');
      return secureJson({
        skipped: true,
        reason: 'no_phone_number_id_configured',
        fix: 'Go to ElevenLabs dashboard → Phone Numbers → import your Twilio number → save the phone_number_id to AdminSettings.elevenlabs_phone_number_ids',
      });
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      return secureJson({ error: 'ELEVENLABS_API_KEY not set' }, { status: 500 });
    }

    console.log(`[triggerVoiceCallToLead] Calling ${lead.phone} | Industry: ${industryKey} | Agent: ${agentId} | PhoneNumberId: ${phoneNumberId}`);

    // 6. Initiate outbound call via ElevenLabs Twilio integration
    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
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
      }),
    });

    const result = await response.json();

    if (!response.ok) {
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
        metadata_json: JSON.stringify({ industry_key: industryKey, agent_id: agentId }),
      });
      return secureJson({ error: 'ElevenLabs call failed', detail: result }, { status: 500 });
    }

    console.log('[triggerVoiceCallToLead] Call initiated successfully:', result);

    // 7. Update lead + log event
    await Promise.all([
      base44.asServiceRole.entities.Leads.update(lead_id, {
        voice_call_attempted: true,
        voice_call_outcome: 'not_attempted', // will be updated by webhook when call ends
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