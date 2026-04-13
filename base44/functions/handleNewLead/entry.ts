import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    // Fetch the lead
    const lead = await base44.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 1. Generate AI messages
    const aiMessages = await generateMessages(base44, lead);

    // 2. Send SMS (if Twilio is configured)
    const smsResult = await sendSmsIfConfigured(base44, lead, aiMessages.sms);

    // 3. Send Email (if Resend is configured)
    const emailResult = await sendEmailIfConfigured(base44, lead, aiMessages.email);

    // 4. Log events
    await logEvent(base44, lead_id, 'lead_created', {
      sms_sent: !!smsResult,
      email_sent: !!emailResult,
    });

    return Response.json({
      success: true,
      lead_id,
      sms_sent: !!smsResult,
      email_sent: !!emailResult,
    });
  } catch (error) {
    console.error('Error in handleNewLead:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateMessages(base44, lead) {
  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a short, friendly SMS and email for a new business inquiry.

Lead Info:
- Name: ${lead.full_name}
- Business: ${lead.business_name}
- Problem: ${lead.problem}

Create TWO messages:

1. SMS (max 160 characters): A short friendly greeting that asks what they need and invites them to book a call.

2. EMAIL: A short email (2-3 sentences) welcoming them and asking what they need.

Format your response as JSON with keys: "sms" and "email"`,
      response_json_schema: {
        type: 'object',
        properties: {
          sms: { type: 'string' },
          email: { type: 'string' },
        },
      },
    });

    return response.data;
  } catch (error) {
    console.error('AI message generation failed:', error);
    return {
      sms: `Hi ${lead.full_name}! We got your inquiry. When would be a good time to chat?`,
      email: `Hi ${lead.full_name},\n\nThanks for reaching out! We'd love to help. Let's schedule a quick call to discuss what you need.`,
    };
  }
}

async function sendSmsIfConfigured(base44, lead, message) {
  try {
    // This will be properly implemented in STEP 5 with Twilio
    console.log('SMS sending prepared for:', lead.phone);
    
    // For now, log it as a message
    await base44.entities.Messages.create({
      lead_id: lead.id,
      direction: 'outbound',
      channel: 'sms',
      message_text: message,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    console.error('SMS send failed:', error);
    return null;
  }
}

async function sendEmailIfConfigured(base44, lead, emailBody) {
  try {
    // This will be properly implemented in STEP 6 with Resend
    console.log('Email sending prepared for:', lead.email);

    await base44.entities.Emails.create({
      lead_id: lead.id,
      email_address: lead.email,
      subject: `Let's discuss ${lead.business_name}`,
      body: emailBody,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return null;
  }
}

async function logEvent(base44, lead_id, event_type, data) {
  try {
    await base44.entities.Events.create({
      lead_id,
      event_type,
      data,
    });
  } catch (error) {
    console.error('Event logging failed:', error);
  }
}