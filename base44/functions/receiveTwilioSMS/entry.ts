import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const formData = await req.formData();

    const fromPhone = formData.get('From');
    const messageBody = formData.get('Body');
    const messageSid = formData.get('MessageSid');

    if (!fromPhone || !messageBody) {
      return new Response('Missing SMS data', { status: 400 });
    }

    // Find lead by phone
    const leads = await base44.entities.Leads.filter({ phone: fromPhone });
    if (!leads || leads.length === 0) {
      return new Response('Lead not found', { status: 404 });
    }

    const lead = leads[0];

    // Log inbound message
    await base44.entities.Messages.create({
      lead_id: lead.id,
      direction: 'inbound',
      channel: 'sms',
      message_text: messageBody,
      status: 'received',
    });

    // Classify the reply
    let classifiedReply = { intent: 'other', confidence: 0.5, recommended_next_action: 'escalate_to_admin' };
    try {
      const classification = await base44.functions.invoke('classifyLeadReply', {
        messageText: messageBody,
        lead: lead,
      });
      classifiedReply = classification;
    } catch (e) {
      console.error('Classification error:', e.message);
    }

    // Update lead with AI classification
    await base44.entities.Leads.update(lead.id, {
      status: 'Replied',
      ai_intent: classifiedReply.intent,
      ai_last_classification: classifiedReply.recommended_next_action,
      ai_confidence: classifiedReply.confidence,
      last_contacted_at: new Date().toISOString(),
    });

    // Handle booking trigger
    if (classifiedReply.recommended_next_action === 'send_booking_link') {
      try {
        await base44.functions.invoke('handleBookingTrigger', {
          lead,
          classifiedReply,
        });
      } catch (e) {
        console.error('Booking trigger error:', e.message);
      }
    }

    // Generate and send AI reply for non-stop intents
    if (classifiedReply.intent !== 'stop') {
      try {
        const aiReply = await base44.functions.invoke('generateAIReply', {
          intent: classifiedReply.intent,
          lead,
          inboundMessage: messageBody,
        });

        if (aiReply.should_send && aiReply.message) {
          await base44.functions.invoke('sendSMS', {
            phone: lead.phone,
            message: aiReply.message,
            leadId: lead.id,
          });

          // Mark message as AI-generated
          const messages = await base44.entities.Messages.filter({ lead_id: lead.id });
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
            await base44.entities.Messages.update(lastMessage.id, {
              ai_generated: true,
            });
          }
        }
      } catch (e) {
        console.error('AI reply generation error:', e.message);
      }
    } else {
      // If stop intent, mark lead as closed
      await base44.entities.Leads.update(lead.id, {
        status: 'Closed',
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Twilio webhook error:', error.message);
    return new Response('Error processing message', { status: 500 });
  }
});