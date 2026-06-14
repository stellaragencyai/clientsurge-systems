import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INTENT_KEYWORDS = {
  high_intent: ['price', 'cost', 'quote', 'book', 'schedule', 'call', 'now', 'urgent', 'asap', 'ready'],
  booking: ['book', 'schedule', 'appointment', 'reserve', 'time', 'when'],
  support: ['help', 'issue', 'problem', 'error', 'not working'],
};

/**
 * Evaluates lead intent from message text
 */
function evaluateLeadIntent(text) {
  if (!text) return { intent: 'unknown', score: 0 };

  const lowerText = text.toLowerCase();
  let score = 0;
  let intent = 'unknown';

  // Check for booking keywords
  if (INTENT_KEYWORDS.booking.some(kw => lowerText.includes(kw))) {
    score += 40;
    intent = 'booking_request';
  }

  // Check for high-intent keywords
  if (INTENT_KEYWORDS.high_intent.some(kw => lowerText.includes(kw))) {
    score += 35;
    if (intent === 'unknown') intent = 'price_inquiry';
  }

  // Check for support keywords
  if (INTENT_KEYWORDS.support.some(kw => lowerText.includes(kw))) {
    score += 25;
    if (intent === 'unknown') intent = 'support';
  }

  // Length bonus (longer = more serious)
  if (text.length > 50) score += 10;
  if (text.length > 100) score += 15;

  return { intent, score: Math.min(score, 100) };
}

/**
 * Generate persuasive closing SMS response
 */
function generateClosingMessage(leadName, intent, phoneNumber) {
  const name = leadName ? `${leadName.split(' ')[0]}` : 'there';

  const templates = {
    booking_request: `Hey ${name}! 👋 Perfect timing. We specialize in AI-powered lead automation that turns more calls into booked appointments. Reply YES to grab a 15-min strategy call with our team, or call us at +16025874608. 🚀`,
    price_inquiry: `Hey ${name}! 📊 Our AI automation systems start at $797/month with proven ROI. Want to see how much you could be making? Quick 15-min call? Reply YES or call +16025874608.`,
    support: `Hey ${name}! We're here to help 💪 Our systems are built for reliability. What's your biggest challenge? Reply or call +16025874608 to jump on a quick call.`,
    unknown: `Hey ${name}! 🎯 Thanks for reaching out! ClientSurge specializes in AI lead automation that converts. Let's chat about your needs. Reply YES or call +16025874608.`,
  };

  return templates[intent] || templates.unknown;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { conversation_thread_id, phone_number, lead_name, message_text } = payload;

    if (!conversation_thread_id || !phone_number) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Evaluate intent
    const { intent, score } = evaluateLeadIntent(message_text);

    // Determine severity based on score
    const severity = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';

    // Create alert record
    const alertData = {
      type: severity === 'critical' ? 'high_intent_lead' : 'engagement_trigger',
      severity,
      phone_number,
      lead_name,
      message: `Incoming lead: ${message_text?.substring(0, 100)}`,
      lead_intent: intent,
      lead_score: score,
      conversation_thread_id,
      source: 'cloudflare_worker',
      notification_sent: true,
      closing_message_sent: false,
    };

    const alert = await base44.entities.Alert.create(alertData);

    // If high intent (score >= 80), send closing message immediately (async, non-blocking)
    let closingMessageSent = false;
    if (score >= 80) {
      try {
        const closingMsg = generateClosingMessage(lead_name, intent, phone_number);

        // Send SMS asynchronously (don't wait for response)
        const smsPromise = base44.functions.invoke('sendInstantLeadResponseSms', {
          phone_number,
          message: closingMsg,
          alert_id: alert.id,
        }).catch(err => {
          console.error('[missionControlLeadClosing] SMS send failed:', err.message);
          // Fail silently - don't block response
        });

        // Update alert with closing message
        await base44.entities.Alert.update(alert.id, {
          closing_message_sent: true,
          closing_message_text: closingMsg,
          conversion_status: 'engaged',
        });

        closingMessageSent = true;
      } catch (err) {
        console.error('[missionControlLeadClosing] Closing flow error:', err);
        // Don't block webhook response
      }
    }

    // Update ConversationThread status based on intent
    if (conversation_thread_id) {
      try {
        const newStatus = score >= 80 ? 'active' : 'pending';
        await base44.entities.ConversationThread.update(conversation_thread_id, {
          thread_status: newStatus,
          lead_score: score,
          intent_classification: intent,
        }).catch(() => {
          // Silently fail if thread not found
        });
      } catch (_err) {
        // Ignore errors
      }
    }

    // Schedule follow-up if no immediate close
    if (score >= 60 && score < 80) {
      // Schedule follow-up at 5 minutes
      try {
        setTimeout(async () => {
          await base44.functions.invoke('missionControlFollowUp', {
            alert_id: alert.id,
            phone_number,
            lead_name,
            attempt: 1,
          }).catch(err => {
            console.error('[missionControlLeadClosing] Follow-up scheduling failed:', err.message);
          });
        }, 300000); // 5 minutes
      } catch (_err) {
        // Ignore scheduling errors
      }
    }

    return Response.json({
      success: true,
      alert_id: alert.id,
      intent,
      lead_score: score,
      closing_message_sent: closingMessageSent,
      conversion_status: alert.conversion_status,
    });
  } catch (error) {
    console.error('[missionControlLeadClosing] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});