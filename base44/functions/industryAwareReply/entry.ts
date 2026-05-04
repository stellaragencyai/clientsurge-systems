import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─────────────────────────────────────────────
// INDUSTRY SYSTEM PROMPTS (inline — no local imports)
// ─────────────────────────────────────────────
const INDUSTRY_PROMPTS = {
  med_spa: {
    rep_name: "Sarah",
    system: `You are Sarah, a warm and professional sales rep for ClientSurge Systems specializing in med spas and aesthetic clinics.
You are having an SMS conversation with a med spa owner/manager.
Your goal: qualify them, handle objections, and guide them toward booking a free 15-minute demo call.
Key angles: faster lead response, auto follow-up, 2 extra bookings/month covers the cost.
If they say they're ready to book: tell them you'll send a scheduling link.
If they say STOP/unsubscribe: respond ONLY with "Got it [Name]. You've been removed. No more messages from us."
Keep all replies under 160 characters. Be warm and conversational, not salesy.`,
  },
  dental: {
    rep_name: "Marcus",
    system: `You are Marcus, a polished sales rep for ClientSurge Systems specializing in dental and orthodontic practices.
You are having an SMS conversation with a dental practice owner or office manager.
Your goal: qualify them, handle objections, and guide them toward booking a free demo.
Key angles: new patient inquiry speed, no-show reduction, front desk relief.
If they're ready to book: tell them you'll send a scheduling link.
If they say STOP/unsubscribe: respond ONLY with "Understood [Name]. You've been removed. No further messages."
Keep all replies under 160 characters. Be professional and data-oriented.`,
  },
  chiropractic: {
    rep_name: "Jordan",
    system: `You are Jordan, an energetic sales rep for ClientSurge Systems specializing in chiropractic and PT clinics.
You are having an SMS conversation with a clinic owner or practice manager.
Your goal: qualify them, handle objections, and get them to book a demo.
Key angles: patients in pain won't wait, after-hours missed calls, speed wins over competitors.
If they're ready to book: tell them you'll send a scheduling link.
If they say STOP: respond ONLY with "No problem [Name]. You've been removed from our list."
Keep all replies under 160 characters. Be direct and empathetic.`,
  },
  hvac: {
    rep_name: "Tyler",
    system: `You are Tyler, a direct sales rep for ClientSurge Systems specializing in HVAC and home service businesses.
You are having an SMS conversation with an HVAC or home service business owner.
Your goal: qualify them, handle objections, and get them to book a demo.
Key angles: losing jobs during peak season, competitor response speed, estimate follow-up gap.
If they're ready to book: tell them you'll send a scheduling link.
If they say STOP: respond ONLY with "Got it [Name]. Won't message you again."
Keep all replies under 160 characters. Be blunt and practical.`,
  },
  roofing: {
    rep_name: "Derek",
    system: `You are Derek, a confident sales rep for ClientSurge Systems specializing in roofing and restoration companies.
You are having an SMS conversation with a roofing contractor or restoration company owner.
Your goal: qualify them, handle objections, and get them to book a demo.
Key angles: first responder wins the job, storm season speed, unclosed estimates leaving money on the table.
If they're ready to book: tell them you'll send a scheduling link.
If they say STOP: respond ONLY with "Understood [Name]. Taking you off our list now."
Keep all replies under 160 characters. Be bold and competitive.`,
  },
  contractors: {
    rep_name: "Alex",
    system: `You are Alex, a practical sales rep for ClientSurge Systems specializing in contractors and trade businesses.
You are having an SMS conversation with a general contractor or trades business owner.
Your goal: qualify them, handle objections, and get them to book a demo.
Key angles: estimate ghosting, slow lead response losing jobs to competitors, zero follow-up system.
If they're ready to book: tell them you'll send a scheduling link.
If they say STOP: respond ONLY with "No problem [Name]. Removing you now."
Keep all replies under 160 characters. No jargon — be real and results-focused.`,
  },
  general: {
    rep_name: "Nolan",
    system: `You are Nolan, a helpful sales rep for ClientSurge Systems — AI automation for service businesses.
You are having an SMS conversation with a business owner who inquired about AI lead automation.
Your goal: learn about their business, identify their biggest pain point, and guide them to book a 15-min demo.
Key angles: speed of lead response, automated follow-up, ROI (1-2 extra jobs/month covers the cost).
If they're ready to book: tell them you'll send a scheduling link.
If they say STOP: respond ONLY with "Got it. You've been removed from our list."
Keep all replies under 160 characters. Be friendly and curious.`,
  },
};

const MAX_SMS_CHARS = 160;
const CONVERSATION_HISTORY_LIMIT = 5;

// Detect booking intent from reply
function hasBookingIntent(intentClassification) {
  return ['booking_ready', 'availability_interest'].includes(intentClassification);
}

// Detect opt-out
function isOptOut(message) {
  const clean = message.trim().toUpperCase();
  return ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].some(w => clean.includes(w));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, inbound_message } = await req.json();

    if (!lead_id || !inbound_message) {
      return Response.json({ error: 'lead_id and inbound_message required' }, { status: 400 });
    }

    // 1. Fetch lead
    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];
    const firstName = (lead.full_name || '').split(' ')[0] || 'there';

    // 2. Check opt-out first
    if (isOptOut(inbound_message)) {
      const agentName = lead.assigned_agent_name || 'general';
      const industryKey = agentName.replace('sales_rep_', '');
      const config = INDUSTRY_PROMPTS[industryKey] || INDUSTRY_PROMPTS.general;
      const optOutReply = `Got it ${firstName}. You've been removed. No more messages from us. — ${config.rep_name}`;

      await base44.asServiceRole.entities.Leads.update(lead_id, { status: 'Closed' });

      return Response.json({ success: true, reply: optOutReply, action: 'opted_out' });
    }

    // 3. Determine industry + agent config
    const agentName = lead.assigned_agent_name || 'sales_rep_general';
    const industryKey = agentName.replace('sales_rep_', '') || 'general';
    const config = INDUSTRY_PROMPTS[industryKey] || INDUSTRY_PROMPTS.general;

    // 4. Load conversation history (last N events)
    const history = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      '-created_date',
      CONVERSATION_HISTORY_LIMIT
    );

    const conversationContext = history
      .reverse()
      .map(e => {
        const role = e.direction === 'inbound' ? 'Lead' : config.rep_name;
        return `${role}: ${e.message_body || ''}`;
      })
      .join('\n');

    // 5. Generate reply
    const prompt = `${config.system}

CONVERSATION HISTORY (most recent last):
${conversationContext || '(no prior messages)'}

Lead just replied: "${inbound_message}"

Generate your next SMS reply. Under 160 characters. Be conversational.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5_mini',
      response_json_schema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          detected_intent: {
            type: 'string',
            enum: ['booking_ready', 'pricing_interest', 'objection', 'not_interested', 'question', 'other'],
          },
        },
      },
      file_urls: null,
      add_context_from_internet: false,
    });

    let reply = result?.reply || result;
    if (typeof reply !== 'string') reply = String(reply);

    // Hard truncate
    if (reply.length > MAX_SMS_CHARS) {
      reply = reply.substring(0, MAX_SMS_CHARS - 3) + '...';
    }

    const detectedIntent = result?.detected_intent || 'other';

    console.log(`[industryAwareReply] Lead: ${firstName} | Intent: ${detectedIntent} | Reply (${reply.length} chars): ${reply}`);

    // 6. Log inbound message
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: 'sms',
      direction: 'inbound',
      event_type: 'sms_received',
      provider: 'twilio',
      status: 'received',
      message_body: inbound_message,
    });

    // 7. Log AI reply
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'ai_generated',
      provider: 'internal',
      status: 'pending',
      message_body: reply,
      metadata_json: JSON.stringify({ industry_key: industryKey, detected_intent: detectedIntent }),
    });

    // 8. Update lead intent + status
    const updates = {
      ai_intent: detectedIntent,
      ai_last_classification: inbound_message.substring(0, 200),
      last_contacted_at: new Date().toISOString(),
    };
    if (detectedIntent === 'not_interested') {
      updates.status = 'Closed';
    } else if (detectedIntent === 'booking_ready') {
      updates.status = 'Booking Prompt Sent';
    } else if (lead.status === 'New') {
      updates.status = 'Replied';
    }
    await base44.asServiceRole.entities.Leads.update(lead_id, updates);

    return Response.json({
      success: true,
      reply,
      detected_intent: detectedIntent,
      action: hasBookingIntent(detectedIntent) ? 'send_booking_link' : 'send_reply',
      industry_key: industryKey,
    });
  } catch (error) {
    console.error('[industryAwareReply] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});