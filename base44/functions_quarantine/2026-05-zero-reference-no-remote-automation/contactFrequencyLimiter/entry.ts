/**
 * contactFrequencyLimiter.ts — #493
 * No single lead receives more than 3 AI-generated messages per day.
 * Check before every automated outbound message.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const MAX_MESSAGES_PER_DAY = 3;

export async function checkContactFrequency(
  base44: any,
  lead_id: string
): Promise<{ allowed: boolean; count_today: number; reason?: string }> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const events = await base44.asServiceRole.entities.CommunicationEvent
    .filter({ lead_id, direction: "outbound", created_date_gte: since.toISOString() })
    .catch(() => []);

  const count = (events || []).length;
  if (count >= MAX_MESSAGES_PER_DAY) {
    return {
      allowed: false,
      count_today: count,
      reason: `Daily limit reached: ${count}/${MAX_MESSAGES_PER_DAY} messages sent today`,
    };
  }
  return { allowed: true, count_today: count };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();
    if (!lead_id) return Response.json({ error: "lead_id required" }, { status: 400 });
    const result = await checkContactFrequency(base44, lead_id);
    return Response.json({ success: true, ...result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
