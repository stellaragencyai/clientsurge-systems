/**
 * createElevenLabsAgent — #542
 * Creates one ElevenLabs conversational AI agent per industry.
 * Each agent is pre-configured with industry-specific prompts.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

const INDUSTRY_CONFIGS: Record<string, { name: string; prompt: string; voice_id: string }> = {
  med_spa: {
    name: "ClientSurge — Med Spa AI Agent",
    voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah — professional, warm
    prompt: `You are a friendly AI receptionist for a medical spa. Your job is to:
1. Greet callers warmly and find out what they're looking for
2. Answer common questions about services (facials, Botox, laser treatments, body contouring)
3. Capture their name, email, and preferred appointment time
4. Book or schedule callbacks — never leave a caller without a next step
5. Keep responses concise — under 2 sentences per turn
Always be professional, empathetic, and focus on getting the caller booked.`,
  },
  dental: {
    name: "ClientSurge — Dental AI Agent",
    voice_id: "pNInz6obpgDQGcFmaJgB", // Adam — clear, trustworthy
    prompt: `You are a friendly AI receptionist for a dental practice. Your job is to:
1. Greet callers and quickly understand if it's an emergency, new patient, or existing patient
2. Answer questions about services (cleanings, whitening, implants, invisalign)
3. Capture name, date of birth, insurance, and preferred appointment time
4. Confirm availability and book or schedule a callback
Keep responses under 2 sentences. Sound confident and reassuring.`,
  },
  tanning_salon: {
    name: "ClientSurge — Tanning Salon AI Agent",
    voice_id: "onwK4e9ZLuTAKqWW03F9", // Daniel — upbeat, energetic
    prompt: `You are an upbeat AI assistant for a tanning salon. Your job is to:
1. Greet customers and find out what they're looking for (UV tanning, spray tan, memberships)
2. Explain membership options and current promotions
3. Capture name, phone, and preferred appointment time
4. Get them booked or set up a callback
Keep it fun and energetic — under 2 sentences per response.`,
  },
  general: {
    name: "ClientSurge — General AI Agent",
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    prompt: `You are a friendly AI receptionist. Greet callers, understand what they need, capture their contact info, and get them booked or set up a callback. Be concise — under 2 sentences per turn.`,
  },
};

async function createAgent(config: typeof INDUSTRY_CONFIGS[string], order_id: string, business_name: string) {
  const response = await fetch(`${ELEVENLABS_BASE}/convai/agents/create`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${business_name} — AI Receptionist`,
      conversation_config: {
        agent: {
          prompt: { prompt: config.prompt.replace("ClientSurge", business_name) },
          first_message: `Hi! Thanks for calling ${business_name}. How can I help you today?`,
          language: "en",
        },
        tts: { voice_id: config.voice_id },
      },
      tags: ["clientsurge", order_id],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${err}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return Response.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const { order_id, industry, business_name, dry_run = false } = await req.json();

    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const industryKey = industry?.toLowerCase().replace(/\s+/g, '_') || "general";
    const agentConfig = INDUSTRY_CONFIGS[industryKey] || INDUSTRY_CONFIGS.general;

    if (dry_run) {
      return Response.json({
        success: true, dry_run: true,
        would_create: { industry: industryKey, agent_name: `${business_name} — AI Receptionist`, voice_id: agentConfig.voice_id },
      });
    }

    const agent = await createAgent(agentConfig, order_id, business_name || "Your Business");

    // Save agent_id back to Order
    await base44.asServiceRole.entities.Order.update(order_id, {
      elevenlabs_agent_id: agent.agent_id,
      elevenlabs_configured: true,
    });

    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "Agent Smith",
      log_type: "INFO",
      summary: `ElevenLabs agent created for ${business_name} (${industryKey})`,
      details: `Agent ID: ${agent.agent_id}`,
      service: "createElevenLabsAgent",
      requires_nolan: false,
      resolved: true,
    });

    console.log(`[createElevenLabsAgent] Created agent ${agent.agent_id} for order ${order_id}`);
    return Response.json({ success: true, agent_id: agent.agent_id, industry: industryKey });
  } catch (err) {
    console.error("[createElevenLabsAgent] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
