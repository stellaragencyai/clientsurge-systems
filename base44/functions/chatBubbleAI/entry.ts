import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `You are a friendly, concise sales assistant for ClientSurge Systems — a done-for-you AI lead automation agency.

ClientSurge helps local service businesses (med spas, dental, HVAC, roofing, contractors, etc.) by:
- Sending instant AI-powered SMS responses to new leads (within seconds)
- Automated follow-up sequences (Day 1, 3, 7)
- Missed call text-back recovery
- Qualified lead to booking prompt automation
- 8-step nurture email sequences
- Lead reactivation for old/dead leads

Pricing: Starter $497/mo + $797 setup, Growth $997/mo + $1,297 setup, Elite $1,997/mo + $2,497 setup. No contracts. 5-7 business day setup.

You answer questions clearly and briefly (2-4 sentences max). 
If someone asks to book a demo, see a demo, talk to someone, get started, or wants pricing details — respond EXACTLY with the special token: [TRIGGER_BOOKING]
Do NOT include any other text with [TRIGGER_BOOKING], just that token alone.
Keep all other answers friendly, confident, and concise.`;

// ── In-memory rate limiter ──────────────────────────────────────────────────
// Keyed by IP. Each entry: { count: number, windowStart: number }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 10;       // max messages per window
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_MESSAGE_HISTORY = 20;  // cap conversation length to limit token burn

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Fresh window
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

// Periodically prune stale entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);
// ────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      console.warn(`[chatBubbleAI] Rate limit hit for IP: ${ip}`);
      return Response.json(
        { reply: "You're sending messages pretty fast! Take a breath, then feel free to book a free demo and we'll answer everything live. 😊" },
        { status: 429 }
      );
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages array required' }, { status: 400 });
    }

    // Cap conversation history to limit token usage
    const trimmedMessages = messages.slice(-MAX_MESSAGE_HISTORY);

    const conversationContext = `${SYSTEM_PROMPT}\n\n${trimmedMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\nAssistant:`;

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
