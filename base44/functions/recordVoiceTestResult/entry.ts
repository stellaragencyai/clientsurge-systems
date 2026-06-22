/**
 * recordVoiceTestResult — Admin-only.
 * Records the outcome of a manual live call test to +16025843227.
 * Updates voice_frontline_gate status based on result.
 * NEVER creates fake CommunicationEvents or marks voice live.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const VALID_RESULTS = ["answered_by_elevenlabs", "application_error", "no_answer", "wrong_route"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    if (user.role !== "admin" && user.role !== "super_admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });

    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const { result, notes } = body;

    if (!VALID_RESULTS.includes(result)) {
      return json({ error: `result must be one of: ${VALID_RESULTS.join(", ")}` }, 400);
    }

    // Find the voice_frontline_gate
    const gates = await base44.asServiceRole.entities.LaunchGate.filter(
      { gate_key: "voice_frontline_gate" }, "-created_date", 1
    ).catch(() => []);
    const gate = gates?.[0];

    if (!gate) {
      return json({ error: "voice_frontline_gate not found. Run seedVoiceFrontlineGates first." }, 404);
    }

    const timestamp = new Date().toISOString();
    const noteEntry = `[${timestamp}] Recorded by ${user.email}: result=${result}. ${notes || ""}`.trim();

    let updateData = {
      notes: noteEntry,
    };

    if (result === "answered_by_elevenlabs") {
      updateData.status = "ready_for_proof";
      updateData.proof_percent = 50;
      updateData.current_blocker = "Live call answered by ElevenLabs ✅. Next: configure post-call data logging webhook to Base44 (receiveElevenLabsPostCallWebhook).";
    } else if (result === "application_error") {
      updateData.status = "blocked";
      updateData.proof_percent = 0;
      updateData.current_blocker = `Application error on live call. Check ElevenLabs/Twilio console. Notes: ${notes || "none"}`;
    } else if (result === "no_answer") {
      updateData.status = "blocked";
      updateData.proof_percent = 0;
      updateData.current_blocker = "Number did not answer. Verify Twilio number +16025843227 is imported and assigned in ElevenLabs.";
    } else if (result === "wrong_route") {
      updateData.status = "blocked";
      updateData.proof_percent = 0;
      updateData.current_blocker = "Call went to wrong handler. Check Twilio Console phone number Voice webhook configuration.";
    }

    const updated = await base44.asServiceRole.entities.LaunchGate.update(gate.id, updateData);

    console.log(`[recordVoiceTestResult] ${user.email} recorded result=${result} → gate status=${updated.status}`);

    return json({
      success: true,
      result,
      gate: {
        id: updated.id,
        status: updated.status,
        proof_percent: updated.proof_percent,
        current_blocker: updated.current_blocker,
      },
      recorded_at: timestamp,
      recorded_by: user.email,
    });
  } catch (err) {
    console.error("[recordVoiceTestResult] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});