import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead, bookingLink } = await req.json();

    if (!lead || !bookingLink) {
      return Response.json(
        { error: 'lead and bookingLink required' },
        { status: 400 }
      );
    }

    if (!lead.email) {
      return Response.json(
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

    return Response.json({
      triggered: true,
      message: 'Booking email sent',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});