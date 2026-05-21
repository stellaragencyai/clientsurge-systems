import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead, classifiedReply } = await req.json();

    if (!lead || !classifiedReply) {
      return Response.json(
        { error: 'lead and classifiedReply required' },
        { status: 400 }
      );
    }

    const { intent, confidence } = classifiedReply;

    // Determine if we should send booking link
    const shouldSendBooking =
      (intent === 'booking_ready' || intent === 'availability_interest') &&
      confidence >= 0.8 &&
      !lead.booking_link_sent_at;

    if (!shouldSendBooking) {
      return Response.json({
        triggered: false,
        reason: 'intent does not match booking criteria or already sent',
      });
    }

    // Use booking link from environment or lead
    const bookingLink =
      lead.booking_link || Deno.env.get('DEFAULT_BOOKING_LINK') || '';

    if (!bookingLink) {
      return Response.json({
        triggered: false,
        reason: 'no booking link configured',
      });
    }

    const bookingMessage = `Perfect! Here's your booking link: ${bookingLink}`;

    // Send SMS if phone exists
    if (lead.phone) {
      try {
        await base44.functions.invoke('sendSMS', {
          phone: lead.phone,
          message: bookingMessage,
          leadId: lead.id,
        });
      } catch (e) {
        console.error('[handleBookingTrigger] Error sending booking SMS:', e.message);
      }
    }

    // Send booking email
    if (lead.email) {
      try {
        await base44.functions.invoke('sendBookingEmail', {
          lead,
          bookingLink,
        });
      } catch (e) {
        console.error('[handleBookingTrigger] Error sending booking email:', e.message);
      }
    }

    // Update lead status and timestamp
    await base44.entities.Leads.update(lead.id, {
      status: 'Booking Prompt Sent',
      booking_link_sent_at: new Date().toISOString(),
    });

    return Response.json({
      triggered: true,
      message: 'Booking link sent via SMS and email',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});