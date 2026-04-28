/**
 * Detect Objection Patterns
 * AI analyzes lead replies to identify common objections
 * Routes custom response templates based on objection type
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, message_text } = await req.json();

    if (!lead_id || !message_text) {
      return Response.json(
        { error: "lead_id and message_text required" },
        { status: 400 }
      );
    }

    console.log(`[Objections] Analyzing message from ${lead_id}`);

    const messageLower = message_text.toLowerCase();

    // Define objection patterns
    const objections = {
      price: {
        keywords: ["cost", "price", "expensive", "afford", "budget", "cheap"],
        confidence: 0,
      },
      timing: {
        keywords: ["later", "next month", "next quarter", "not ready", "too soon"],
        confidence: 0,
      },
      competitor: {
        keywords: ["already using", "sticking with", "competitor", "another"],
        confidence: 0,
      },
      unclear: {
        keywords: ["how does", "tell me more", "explain", "understand", "confused"],
        confidence: 0,
      },
      uninterested: {
        keywords: ["no thank", "not interested", "pass", "dont need"],
        confidence: 0,
      },
      technical: {
        keywords: ["integration", "api", "compatibility", "technical", "setup"],
        confidence: 0,
      },
    };

    // Analyze message for objection types
    for (const [type, data] of Object.entries(objections)) {
      let matches = 0;
      for (const keyword of data.keywords) {
        if (messageLower.includes(keyword)) {
          matches++;
        }
      }
      objections[type].confidence = Math.min(100, (matches / data.keywords.length) * 100);
    }

    // Determine primary objection
    const primaryObjection = Object.entries(objections).sort(
      ([, a], [, b]) => b.confidence - a.confidence
    )[0];

    // Generate recommended counter-message strategy
    const strategies = {
      price: "Emphasize ROI and cost-per-lead savings. Offer payment plan.",
      timing: "Create urgency with limited offer. Book brief consultation.",
      competitor: "Highlight unique advantages. Request comparison meeting.",
      unclear: "Provide detailed explanation. Offer one-on-one demo.",
      uninterested: "Re-qualify fit. Ask about specific pain points.",
      technical: "Connect with technical team. Provide integration docs.",
    };

    console.log(
      `[Objections] Primary objection: ${primaryObjection[0]} (${primaryObjection[1].confidence}%)`
    );

    return Response.json({
      success: true,
      lead_id,
      primary_objection: primaryObjection[0],
      confidence: Math.round(primaryObjection[1].confidence),
      all_detected: objections,
      recommended_strategy: strategies[primaryObjection[0]],
    });
  } catch (error) {
    console.error("[Objections] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});