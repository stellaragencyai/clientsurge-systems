// PL-79: chatBubbleAI — with prompt injection guard and content sanitization
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const BLOCKED_PATTERNS = [
  /ignore\s+(previous|all|above|prior)/i,
  /forget\s+(everything|all|your|prior)/i,
  /jailbreak/i,
  /act\s+as\s+(a\s+)?(different|another|new)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /system\s*:/i,
  /<script/i,
  /javascript:/i,
  /data:/i,
];

const BLOCKED_TOPICS = [
  /credit\s+card\s+number/i,
  /social\s+security/i,
  /ssn/i,
  /bank\s+account/i,
  /password/i,
  /personal\s+information/i,
];

function sanitizeInput(input) {
  if (!input || typeof input !== "string") return "";
  // Remove HTML tags, limit length
  return input.replace(/<[^>]*>/g, "").trim().substring(0, 2000);
}

function isBlockedInput(input) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) return true;
  }
  return false;
}

function containsSensitiveTopics(input) {
  for (const pattern of BLOCKED_TOPICS) {
    if (pattern.test(input)) return true;
  }
  return false;
}

const SYSTEM_PROMPT = `You are an AI assistant for ClientSurge Systems, an AI automation platform for local service businesses.
You help potential clients understand:
- What services we offer (AI lead response, missed call text-back, booking automation, review requests, nurture sequences, lead reactivation)
- How our pricing works (Starter $249 setup/$99mo, Growth $499 setup/$249mo, Pro $999 setup/$499mo)
- How the setup process works (5-7 business days, remote setup)
- How to book a consultation

Be helpful, concise, and professional. Do NOT:
- Share personal data or contact information from other clients
- Make guarantees about specific lead volumes or revenue
- Discuss competitor products negatively
- Respond to requests outside of ClientSurge's business context

If asked about something outside your scope, politely redirect to contacting support@clientsurgesystems.com or booking a call at clientsurgesystems.com/book`;

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const { message, history } = await req.json();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const sanitized = sanitizeInput(message);

    // PL-79: Prompt injection guard
    if (isBlockedInput(sanitized)) {
      return Response.json({
        reply: "I'm here to help you learn about ClientSurge Systems' AI automation services. Is there something specific about our packages or how we help local businesses that I can help with?",
        blocked: true,
      });
    }

    // Block requests asking for sensitive data
    if (containsSensitiveTopics(sanitized)) {
      return Response.json({
        reply: "I'm not able to assist with that topic. For account-specific questions, please contact support@clientsurgesystems.com.",
        blocked: true,
      });
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return Response.json({ error: "AI service not configured" }, { status: 503 });
    }

    // Build message history (limit to last 8 messages)
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (Array.isArray(history)) {
      const recentHistory = history.slice(-8);
      for (const msg of recentHistory) {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: sanitizeInput(String(msg.content)) });
        }
      }
    }

    messages.push({ role: "user", content: sanitized });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[chatBubbleAI] OpenAI error:", errText);
      return Response.json({ error: "AI service temporarily unavailable" }, { status: 503 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "I'm not sure how to answer that. Please contact support@clientsurgesystems.com for help.";

    return Response.json({ reply });
  } catch (error) {
    console.error("[chatBubbleAI] Error:", error.message);
    return Response.json({ error: "Service error" }, { status: 500 });
  }
});
