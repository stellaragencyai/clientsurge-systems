import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { messageText, lead } = await req.json();

    if (!messageText || !lead) {
      return Response.json(
        { error: 'messageText and lead required' },
        { status: 400 }
      );
    }

    const text = messageText.toLowerCase().trim();

    // Stop/unsubscribe keywords
    if (
      text.includes('stop') ||
      text.includes('unsubscribe') ||
      text.includes('no thanks') ||
      text.includes('not interested')
    ) {
      return Response.json({
        intent: 'stop',
        confidence: 0.95,
        recommended_next_action: 'stop_follow_up',
      });
    }

    // Not interested
    if (
      text.includes('not interested') ||
      text.includes('not for me') ||
      text.includes('wrong number')
    ) {
      return Response.json({
        intent: 'not_interested',
        confidence: 0.9,
        recommended_next_action: 'stop_follow_up',
      });
    }

    // Booking ready
    if (
      text.includes('yes') ||
      text.includes('ready') ||
      text.includes('let\'s do it') ||
      text.includes('perfect') ||
      text.includes('confirmed') ||
      text.includes('book me') ||
      text.includes('schedule')
    ) {
      return Response.json({
        intent: 'booking_ready',
        confidence: 0.9,
        recommended_next_action: 'send_booking_link',
      });
    }

    // Availability interest
    if (
      text.includes('when') ||
      text.includes('what time') ||
      text.includes('available') ||
      text.includes('schedule') ||
      text.includes('appointment')
    ) {
      return Response.json({
        intent: 'availability_interest',
        confidence: 0.85,
        recommended_next_action: 'send_booking_link',
      });
    }

    // Pricing interest
    if (
      text.includes('price') ||
      text.includes('cost') ||
      text.includes('how much') ||
      text.includes('rates') ||
      text.includes('pricing')
    ) {
      return Response.json({
        intent: 'pricing_interest',
        confidence: 0.85,
        recommended_next_action: 'answer_question',
      });
    }

    // Question
    if (text.includes('?')) {
      return Response.json({
        intent: 'question',
        confidence: 0.8,
        recommended_next_action: 'answer_question',
      });
    }

    // Unsure / needs clarification
    if (
      text.includes('maybe') ||
      text.includes('not sure') ||
      text.includes('depends') ||
      text.includes('tell me more')
    ) {
      return Response.json({
        intent: 'unsure',
        confidence: 0.8,
        recommended_next_action: 'ask_clarifying_question',
      });
    }

    // Default to other
    return Response.json({
      intent: 'other',
      confidence: 0.5,
      recommended_next_action: 'escalate_to_admin',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});