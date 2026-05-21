import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { intent, lead, inboundMessage } = await req.json();

    if (!intent || !lead) {
      return secureJson(
        { error: 'intent and lead required' },
        { status: 400 }
      );
    }

    let message = '';

    switch (intent) {
      case 'pricing_interest':
        message = `Great question! Pricing depends on your specific needs. Let's hop on a quick call to discuss what would work best for you. Available? ${lead.booking_link || 'Let me know!'}`;
        break;

      case 'availability_interest':
        message = `Perfect! Here's a quick link to book a time that works for you: ${lead.booking_link || 'Click here to schedule'}`;
        break;

      case 'booking_ready':
        message = `Awesome! Here's your booking link: ${lead.booking_link || 'Let me send that to you'}`;
        break;

      case 'question':
        message = `Great question! That's exactly what we discuss on a quick call. Let me send you a booking link: ${lead.booking_link || 'When are you free?'}`;
        break;

      case 'unsure':
        message = `No pressure! Tell me — what's the biggest thing holding you back right now?`;
        break;

      case 'not_interested':
        message = `No worries! If things change, feel free to reach out anytime.`;
        break;

      case 'stop':
        message = `Got it. We've removed you from our list. Take care!`;
        break;

      default:
        message = `Thanks for your message! Let me get you booked in with someone who can help. ${lead.booking_link || 'Click here'}`;
    }

    return secureJson({
      message,
      intent,
      should_send: intent !== 'other',
    });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});