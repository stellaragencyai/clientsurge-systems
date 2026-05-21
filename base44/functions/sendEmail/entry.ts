import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";

Deno.serve(async (req) => {
  try {
    const { email, subject, body, leadId } = await req.json();

    if (!email || !subject || !body) {
      return Response.json({ error: 'Email, subject, and body required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Resend API key not configured' }, { status: 500 });
    }

    const response = await resendFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@apexflow.com',
        to: email,
        subject,
        html: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: 'Failed to send email', details: data }, { status: 500 });
    }

    // Log email in database
    const base44 = createClientFromRequest(req);
    if (leadId) {
      await base44.entities.Emails.create({
        lead_id: leadId,
        email_address: email,
        subject,
        body,
        status: 'sent',
      });
    }

    return Response.json({ success: true, emailId: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});