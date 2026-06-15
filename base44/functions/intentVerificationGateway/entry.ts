/**
 * CRITICAL ENHANCEMENT #3: AI Intent Verification Gateway
 * Intercepts negative/stop classifications before they permanently close leads.
 * Runs a second-pass validation using keyword determinism + confidence threshold.
 * If uncertain, flags for Manual Review instead of auto-closing the nurture sequence.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Hard stop keywords — only these trigger an immediate, unambiguous stop
const HARD_STOP_KEYWORDS = ['stop', 'unsubscribe', 'opt out', 'opt-out', 'remove me', 'cancel messages', 'do not contact'];
// Soft negative — may need review
const SOFT_NEGATIVE_KEYWORDS = ['not interested', 'no thanks', 'not for me', 'wrong number', 'not right now'];

function isHardStop(text) {
  const t = text.toLowerCase().trim();
  return HARD_STOP_KEYWORDS.some(kw => t.includes(kw));
}

function isSoftNegative(text) {
  const t = text.toLowerCase().trim();
  return SOFT_NEGATIVE_KEYWORDS.some(kw => t.includes(kw));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, message_text, ai_intent, ai_confidence } = await req.json();

    if (!lead_id || !message_text || !ai_intent) {
      return Response.json({ error: 'lead_id, message_text, and ai_intent required' }, { status: 400 });
    }

    // Only run verification for negative intents
    const negativeIntents = ['not_interested', 'stop'];
    if (!negativeIntents.includes(ai_intent)) {
      return Response.json({ verified: true, action: 'proceed', intent: ai_intent, reason: 'non_negative_intent' });
    }

    // Step 1: Deterministic keyword check
    const hardStop = isHardStop(message_text);
    const softNegative = isSoftNegative(message_text);

    // Hard stop = always honor immediately
    if (hardStop) {
      console.log(`[intent-verify] Hard stop confirmed for lead ${lead_id}`);
      return Response.json({
        verified: true,
        action: 'stop_immediately',
        intent: 'stop',
        reason: 'hard_stop_keyword_match',
        confidence: 1.0,
      });
    }

    // High confidence + soft negative = confirm stop
    if (softNegative && ai_confidence >= 0.90) {
      console.log(`[intent-verify] High-confidence soft negative for lead ${lead_id}, confirming stop`);
      return Response.json({
        verified: true,
        action: 'stop_immediately',
        intent: ai_intent,
        reason: 'high_confidence_soft_negative',
        confidence: ai_confidence,
      });
    }

    // Step 2: Low confidence or ambiguous — run second-pass LLM validation
    if (ai_confidence < 0.85 || !softNegative) {
      try {
        const validation = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a lead intent validator. A sales AI classified the following message as "${ai_intent}" with ${Math.round((ai_confidence || 0) * 100)}% confidence. 

Message: "${message_text}"

Is this an UNAMBIGUOUS opt-out or "not interested" response, or could it be:
- A busy/deflection response ("not now", "call later", "busy")  
- Context-dependent ("not interested in that specific thing")
- General frustration not meant as a permanent stop

Respond with JSON only: { "confirmed_negative": true/false, "reasoning": "one sentence", "recommended_action": "stop_immediately" | "flag_for_review" | "continue_nurture" }`,
          response_json_schema: {
            type: 'object',
            properties: {
              confirmed_negative: { type: 'boolean' },
              reasoning: { type: 'string' },
              recommended_action: { type: 'string' },
            }
          }
        });

        if (validation?.confirmed_negative === true) {
          console.log(`[intent-verify] LLM confirmed negative for lead ${lead_id}: ${validation.reasoning}`);
          return Response.json({
            verified: true,
            action: 'stop_immediately',
            intent: ai_intent,
            reason: 'llm_second_pass_confirmed',
            llm_reasoning: validation.reasoning,
          });
        }

        // LLM says ambiguous — flag for manual review
        await base44.asServiceRole.entities.Leads.update(lead_id, {
          ai_intent: 'unsure',
          ai_last_classification: `MANUAL_REVIEW_REQUIRED: AI said "${ai_intent}" but second-pass inconclusive. Message: "${message_text.slice(0, 100)}"`,
        }).catch(() => null);

        console.log(`[intent-verify] Flagged lead ${lead_id} for manual review: ${validation?.reasoning}`);
        return Response.json({
          verified: false,
          action: validation?.recommended_action || 'flag_for_review',
          intent: 'unsure',
          reason: 'llm_second_pass_inconclusive',
          llm_reasoning: validation?.reasoning,
        });

      } catch (llmErr) {
        console.warn(`[intent-verify] LLM second-pass failed for lead ${lead_id}:`, llmErr.message);
        // Fail safe: flag for review rather than auto-close
        return Response.json({
          verified: false,
          action: 'flag_for_review',
          intent: 'unsure',
          reason: 'llm_validation_failed_safe_mode',
        });
      }
    }

    // Default: flag for manual review if nothing matched
    return Response.json({
      verified: false,
      action: 'flag_for_review',
      intent: 'unsure',
      reason: 'no_clear_signal',
    });

  } catch (error) {
    console.error('[intent-verify] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});