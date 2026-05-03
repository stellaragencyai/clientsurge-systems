import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SALES_PROMPT = `You are a friendly, concise sales assistant for ClientSurge Systems — a done-for-you AI lead automation agency.

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

const SUPPORT_PROMPT = `You are a warm, concise installation support assistant for ClientSurge Systems.
Your job is to help paying clients understand their installation progress and get answers fast.
Rules:
- Keep every reply to 2-4 sentences max. Be specific — use the client's actual status and services if provided.
- Never promise specific go-live dates beyond "5-7 business days from order date".
- If the client needs urgent help, direct them to call (602) 587-4608 or email support@clientsurgesystems.com.
- Don't be robotic. Be helpful and human.
- Install stages in order: Paid → Ready for Install → Configuring → Testing → Live.
- "Configuring" means we are actively building their automation flows.
- "Testing" means flows are built and we are doing final end-to-end verification.`;

// ── In-memory rate limiter ──────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_MESSAGE_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 2000;

function sanitizeMessageContent(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .slice(0, MAX_MESSAGE_LENGTH);
}

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
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count += 1;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateLimitMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);
// ────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      return Response.json(
        { reply: "You're sending messages pretty fast! Take a breath — or book a free call and we'll answer everything live." },
        { status: 429 }
      );
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { messages, installStatus, services, mode } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages array required' }, { status: 400 });
    }

    const sanitizedMessages = messages.map((message: any) => ({
      ...message,
      content: sanitizeMessageContent(message?.content),
    }));
    const trimmedMessages = sanitizedMessages.slice(-MAX_MESSAGE_HISTORY);

    // Determine which system prompt to use
    // If installStatus or services are passed, this is a support chat (client dashboard)
    let systemPrompt = SALES_PROMPT;
    if (installStatus || (services && services.length > 0)) {
      const serviceNames = Array.isArray(services)
        ? services.map((s: any) => s.productName || s.name || s.service_key).filter(Boolean).join(', ')
        : 'unknown';
      systemPrompt = `${SUPPORT_PROMPT}

Client context:
- Current install status: ${installStatus || 'Unknown'}
- Purchased services: ${serviceNames || 'Unknown'}`;
    }

    const conversationContext = `${systemPrompt}\n\n${trimmedMessages.map((m: any) => `${m.role === 'user' ? 'Client' : 'Assistant'}: ${m.content}`).join('\n')}\nAssistant:`;

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: conversationContext,
    });

    const replyText = typeof reply === 'string' ? reply.trim() : String(reply).trim();

    return Response.json({ reply: replyText });
  } catch (error) {
    console.error('chatBubbleAI error:', error);
    return Response.json({
      reply: 'I\'m having trouble connecting right now. For urgent support, call (602) 587-4608 or email support@clientsurgesystems.com.',
    }, { status: 500 });
  }
});
