import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    // Trigger: when Leads status is updated to "Qualified" OR when user replies with booking-related keywords
    if (event.type !== 'update' || event.entity_name !== 'Leads') {
      return Response.json({ success: true });
    }

    const lead = event.data;
    const oldLead = event.old_data;

    if (!lead || !lead.id || !lead.phone) {
      return Response.json({ success: true });
    }

    // Booking link from admin settings
    const settings = await base44.asServiceRole.entities.AdminSettings.list(1);
    const bookingLink = settings[0]?.booking_link_default || 'https://calendly.com/apexflow';

    // Check if already sent booking link
    if (lead.booking_link_sent_at) {
      return Response.json({ success: true, skipped: true });
    }

    // Trigger condition 1: Status manually set to "Qualified"
    const statusToQualified = oldLead?.status !== 'Qualified' && lead.status === 'Qualified';

    if (statusToQualified) {
      const bookingMessage = `Perfect — here's a quick link to grab a time: ${bookingLink}`;

      await base44.functions.invoke('sendSMS', {
        phone: lead.phone,
        message: bookingMessage,
        leadId: lead.id,
      });

      // Update lead
      await base44.entities.Leads.update(lead.id, {
        status: 'Booking Prompt Sent',
        booking_link_sent_at: new Date().toISOString(),
      });

      return Response.json({ success: true, bookingLinkSent: true });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendBookingLinkSMS error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});