import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const data = await req.json();

    // Optional: Send webhook to n8n or external automation system
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'client_onboarding_submitted',
            timestamp: new Date().toISOString(),
            data: data,
          }),
        });
      } catch (webhookErr) {
        console.log('Webhook send failed (non-blocking):', webhookErr.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Onboarding submitted successfully' 
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});