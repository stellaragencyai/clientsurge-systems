import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

Deno.serve(async (req) => {
  try {
    const { 
      recipients, 
      subject, 
      html_body, 
      scheduled_at, 
      campaign_name,
      segment_filter 
    } = await req.json();

    if (!recipients || recipients.length === 0 || !subject || !html_body) {
      return Response.json({ error: 'Recipients, subject, and body required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Resend API key not configured' }, { status: 500 });
    }

    const senderEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@clientsurgesystems.com';

    // Prepare batch payload for Resend Broadcast API
    const emails = recipients.map(email => ({ email }));

    const payload = {
      from: `ClientSurge Systems <${senderEmail}>`,
      subject,
      html: html_body,
      to: emails,
      reply_to: Deno.env.get('ADMIN_EMAIL') || 'support@clientsurgesystems.com',
    };

    // Add scheduling if provided
    if (scheduled_at) {
      payload.scheduled_at = scheduled_at;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: 'Failed to send broadcast', details: data }, { status: 500 });
    }

    // Log broadcast campaign in database
    const base44 = createClientFromRequest(req);
    await base44.entities.CommunicationEvent.create({
      channel: 'email',
      direction: 'outbound',
      event_type: 'broadcast_sent',
      provider: 'resend',
      status: 'sent',
      subject,
      message_body: html_body,
      metadata_json: JSON.stringify({
        campaign_name,
        recipient_count: recipients.length,
        scheduled_at,
        segment_filter,
        broadcast_id: data.id,
      }),
    });

    return Response.json({
      success: true,
      broadcast_id: data.id,
      recipient_count: recipients.length,
      scheduled: !!scheduled_at,
      message: `Broadcast ${scheduled_at ? 'scheduled' : 'sent'} to ${recipients.length} recipients`,
    });
  } catch (error) {
    console.error('Resend Broadcast Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});