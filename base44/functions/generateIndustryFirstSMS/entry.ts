import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

// ─────────────────────────────────────────────
// INDUSTRY SYSTEM PROMPTS (inline — no local imports)
// ─────────────────────────────────────────────
const INDUSTRY_PROMPTS = {
  med_spa: {
    rep_name: "Sarah",
    system: `You are Sarah, a warm sales rep for ClientSurge Systems. You specialize in med spas (Botox, fillers, laser, facials).
Generate a first outreach SMS to a med spa owner/manager who just submitted an inquiry about AI lead automation.
Focus on: speed of response to new leads, lost bookings from slow follow-up, easy ROI (2 extra appointments = pays for itself).
Tone: warm, friendly, curious — not salesy.`,
  },
  dental: {
    rep_name: "Marcus",
    system: `You are Marcus, a professional sales rep for ClientSurge Systems. You specialize in dental and orthodontic practices.
Generate a first outreach SMS to a dental practice owner who just submitted an inquiry about AI lead automation.
Focus on: new patient inquiry response speed, no-show reduction, front desk overwhelm.
Tone: polished, trustworthy, data-oriented.`,
  },
  chiropractic: {
    rep_name: "Jordan",
    system: `You are Jordan, an energetic sales rep for ClientSurge Systems. You specialize in chiropractic and PT clinics.
Generate a first outreach SMS to a clinic owner who just submitted an inquiry about AI lead automation.
Focus on: patients in pain who won't wait, after-hours missed calls, competitor speed advantage.
Tone: energetic, empathetic, direct.`,
  },
  hvac: {
    rep_name: "Tyler",
    system: `You are Tyler, a direct sales rep for ClientSurge Systems. You specialize in HVAC and home service businesses.
Generate a first outreach SMS to an HVAC/home service business owner who just submitted an inquiry about AI lead automation.
Focus on: losing jobs during peak season because crews are busy, competitor response speed, estimate follow-up.
Tone: no-nonsense, practical, ROI-first.`,
  },
  roofing: {
    rep_name: "Derek",
    system: `You are Derek, a confident sales rep for ClientSurge Systems. You specialize in roofing and restoration companies.
Generate a first outreach SMS to a roofing contractor who just submitted an inquiry about AI lead automation.
Focus on: first responder wins the job, storm season speed, lost estimates never followed up.
Tone: bold, competitive, direct.`,
  },
  contractors: {
    rep_name: "Alex",
    system: `You are Alex, a practical sales rep for ClientSurge Systems. You specialize in general contractors and trade businesses.
Generate a first outreach SMS to a contractor who just submitted an inquiry about AI lead automation.
Focus on: estimate ghosting, slow lead response losing jobs to competitors, follow-up gap.
Tone: no-fluff, practical, results-oriented.`,
  },
  general: {
    rep_name: "Nolan",
    system: `You are Nolan, a helpful sales rep for ClientSurge Systems — AI automation for service businesses.
Generate a first outreach SMS to a business owner who just submitted an inquiry about AI lead automation.
Ask a qualifying question about their biggest lead management challenge.
Tone: friendly, curious, professional.`,
  },
};

const MAX_SMS_CHARS = 160;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, industry_key } = await req.json();

    if (!lead_id) {
      return secureJson({ error: 'lead_id required' }, { status: 400 });
    }

    // Fetch lead
    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id });
    if (!leads || leads.length === 0) {
      return secureJson({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];
    const industryKey = industry_key || lead.assigned_agent_name?.replace('sales_rep_', '') || 'general';
    const promptConfig = INDUSTRY_PROMPTS[industryKey] || INDUSTRY_PROMPTS.general;

    const firstName = (lead.full_name || '').split(' ')[0] || 'there';
    const problem = lead.problem || '';
    const businessName = lead.business_name || '';

    const userPrompt = `Lead details:
- First name: ${firstName}
- Business: ${businessName}
- Their problem/inquiry: ${problem}

Write a single SMS message (under 160 characters). Include their first name. End with a question. Sign off as "${promptConfig.rep_name} @ ClientSurge". No hashtags, no emojis required, keep it conversational.`;

    console.log(`[generateIndustryFirstSMS] Generating SMS for ${firstName} | Industry: ${industryKey}`);

    // First attempt
    let smsText = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: userPrompt,
      model: 'gpt_5_mini',
      response_json_schema: {
        type: 'object',
        properties: {
          sms: { type: 'string' },
        },
      },
      file_urls: null,
      add_context_from_internet: false,
    });

    // Extract text
    let sms = (typeof smsText === 'object' && smsText.sms) ? smsText.sms : String(smsText);

    // Enforce 160 char limit — retry once if too long
    if (sms.length > MAX_SMS_CHARS) {
      console.log(`[generateIndustryFirstSMS] SMS too long (${sms.length} chars), retrying with shorten instruction`);
      const retryResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${userPrompt}\n\nIMPORTANT: The previous attempt was too long. This MUST be under 160 characters total. Be very concise.`,
        model: 'gpt_5_mini',
        response_json_schema: {
          type: 'object',
          properties: {
            sms: { type: 'string' },
          },
        },
        file_urls: null,
        add_context_from_internet: false,
      });
      sms = (typeof retryResult === 'object' && retryResult.sms) ? retryResult.sms : String(retryResult);
    }

    // Hard truncate as final safety net
    if (sms.length > MAX_SMS_CHARS) {
      sms = sms.substring(0, MAX_SMS_CHARS - 3) + '...';
    }

    console.log(`[generateIndustryFirstSMS] Generated (${sms.length} chars): ${sms}`);

    // Log to CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'ai_generated',
      provider: 'internal',
      status: 'pending',
      message_body: sms,
      metadata_json: JSON.stringify({ industry_key: industryKey, agent: promptConfig.rep_name, char_count: sms.length }),
    });

    return secureJson({ success: true, sms, industry_key: industryKey, char_count: sms.length });
  } catch (error) {
    console.error('[generateIndustryFirstSMS] Error:', error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});