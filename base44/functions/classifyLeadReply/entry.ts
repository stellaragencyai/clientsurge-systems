import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { classifyLeadIntent } from "../_shared/leadIntentClassifier.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { messageText, lead } = await req.json();

    if (!messageText || !lead) {
      return Response.json(
        { error: 'messageText and lead required' },
        { status: 400 }
      );
    }

    const result = await classifyLeadIntent({ base44, messageText, lead });

    return Response.json({
      intent: result.canonical_intent,
      confidence: result.confidence,
      recommended_next_action: result.recommended_next_action,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
