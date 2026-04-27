import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `You are a friendly, concise sales assistant for ClientSurge Systems — a done-for-you AI lead automation agency.

ClientSurge helps local service businesses (med spas, dental, HVAC, roofing, contractors, etc.) by:
- Sending instant AI-powered SMS responses to new leads (within seconds)
- Automated follow-up sequences (Day 1, 3, 7)
- Missed call text-back recovery
- Qualified lead to booking prompt automation
- 8-step nurture email sequences
- Lead reactivation for old/dead leads

Pricing: Starter $197/mo, Growth $349/mo, Pro $469/mo. Setup fee applies. No contracts. 5-7 day setup.

You answer questions clearly and briefly (2-4 sentences max). 
If someone asks to book a demo, see a demo, talk to someone, get started, or wants pricing details — respond EXACTLY with the special token: [TRIGGER_BOOKING]
Do NOT include any other text with [TRIGGER_BOOKING], just that token alone.
Keep all other answers friendly, confident, and concise.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages array required' }, { status: 400 });
    }

    const conversationContext = `${SYSTEM_PROMPT}\n\n${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\nAssistant:`;

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: conversationContext,
    });

    const replyText = typeof reply === 'string' ? reply.trim() : String(reply).trim();

    return Response.json({ reply: replyText });
  } catch (error) {
    console.error('chatBubbleAI error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});