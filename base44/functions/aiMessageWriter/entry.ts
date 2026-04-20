import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { entity_id, data } = payload;
    const client = data;

    if (!client || !client.business_name) {
      return Response.json({ error: 'No client data' }, { status: 400 });
    }

    const prompt = `You are an SMS copywriter for a local service business automation agency called ClientSurge Systems.

Generate 6 personalized SMS messages for this client:
- Business Name: ${client.business_name}
- Owner: ${client.owner_name}
- Services: ${client.services || 'their services'}
- Booking Link: ${client.booking_link || '[BOOKING LINK]'}
- Tone of Voice: ${client.tone_of_voice || 'Professional'}
- Industry: ${client.industry || 'service business'}

Rules:
- Each SMS must be under 160 characters
- Match the tone: ${client.tone_of_voice || 'Professional'}
- Include the booking link where appropriate
- Never use emojis unless tone is "Casual" or "Friendly"
- Sound human, not robotic

Return a JSON object with exactly these keys:
{
  "instant_response": "...",
  "day1_followup": "...",
  "day3_followup": "...",
  "day7_followup": "...",
  "missed_call": "...",
  "appointment_reminder": "..."
}`;

    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          instant_response: { type: "string" },
          day1_followup: { type: "string" },
          day3_followup: { type: "string" },
          day7_followup: { type: "string" },
          missed_call: { type: "string" },
          appointment_reminder: { type: "string" }
        }
      }
    });

    await base44.asServiceRole.entities.OnboardingClient.update(entity_id, {
      generated_messages: JSON.stringify(generated)
    });

    return Response.json({ success: true, messages: generated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});