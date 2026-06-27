import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead, bookingLink } = await req.json();

    if (!lead || !bookingLink) {
      return secureJson(
        { error: 'lead and bookingLink required' },
        { status: 400 }
      );
    }

    if (!lead.email) {
      return secureJson(
        { triggered: false, reason: 'no email on lead' },
        { status: 200 }
      );
    }

    const subject = 'Your next step';
    const body = `Hi ${lead.full_name || 'there'},\n\nHere's the link to book a time that works for you:\n\n${bookingLink}\n\nLooking forward to speaking with you!`;

    // Send email using existing function
    try {
      await base44.functions.invoke('sendEmail', {
        email: lead.email,
        subject,
        body,
        leadId: lead.id,
      });
    } catch (e) {
      console.error('[sendBookingEmail] Error sending booking email:', e.message);
      throw e;
    }

    return secureJson({
      triggered: true,
      message: 'Booking email sent',
    });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});