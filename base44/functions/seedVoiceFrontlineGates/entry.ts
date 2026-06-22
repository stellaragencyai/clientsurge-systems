import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    if (user.role !== "admin" && user.role !== "super_admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });

    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

    const existing = await base44.asServiceRole.entities.LaunchGate.list("", 100).catch(() => []);
    const byKey = {};
    for (const g of existing) { if (g.gate_key) byKey[g.gate_key] = g; }

    const results = [];

    if (!byKey["voice_frontline_gate"]) {
      const g = await base44.asServiceRole.entities.LaunchGate.create({
        gate_key: "voice_frontline_gate",
        gate_name: "Voice Front-Line Responder",
        status: "blocked",
        proof_percent: 0,
        current_blocker: "No front-line voice responder configured. ElevenLabs agent or Twilio Function required before any voice is live.",
        category: "voice",
        description: "Tracks whether a reliable first voice responder (ElevenLabs Agent or Twilio Function) is live and answering calls on +16025843227.",
        notes: "Seeded " + new Date().toISOString() + ". Base44 custom-domain /api routes failed live Twilio call tests — external first responder required.",
      });
      results.push({ gate: "voice_frontline_gate", action: "created", status: g.status });
    } else {
      results.push({ gate: "voice_frontline_gate", action: "already_exists", status: byKey["voice_frontline_gate"].status });
    }

    if (!byKey["elevenlabs_postcall_logging_gate"]) {
      const g = await base44.asServiceRole.entities.LaunchGate.create({
        gate_key: "elevenlabs_postcall_logging_gate",
        gate_name: "ElevenLabs Post-Call Logging",
        status: "blocked",
        proof_percent: 0,
        current_blocker: "Depends on voice_frontline_gate. Complete ElevenLabs live call first, then configure post-call webhook to Base44.",
        category: "voice",
        description: "Tracks whether post-call data (transcript, duration, outcome) from ElevenLabs is successfully received and logged in Base44 after a real call.",
        notes: "Seeded " + new Date().toISOString() + ". Target endpoint: receiveElevenLabsPostCallWebhook.",
      });
      results.push({ gate: "elevenlabs_postcall_logging_gate", action: "created", status: g.status });
    } else {
      results.push({ gate: "elevenlabs_postcall_logging_gate", action: "already_exists", status: byKey["elevenlabs_postcall_logging_gate"].status });
    }

    return json({ success: true, results, seeded_at: new Date().toISOString() });
  } catch (err) {
    console.error("[seedVoiceFrontlineGates] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});