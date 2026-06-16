import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get admin settings with fallback defaults
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1).catch(() => []);
    const settings = settingsRecords?.[0] || {
      cadence_default_mode: 'auto',
      cadence_switch_attempts: 3,
      cadence_pause_on_reply: true,
      cadence_engagement_threshold: 50,
      cadence_max_attempts: 6,
      twilio_phone_number: Deno.env.get('TWILIO_PHONE_NUMBER'),
    };

    // **PHASE 2 FIX: Tightened query to exclude booked/closed leads**
    const leads = await base44.asServiceRole.entities.WebsiteLead.filter({
      lead_status: { $in: ['new', 'contacted', 'replied'] },
      reply_status: 'none', // Only un-replied leads
      booking_status: { $in: ['none', 'clicked'] }, // Not booked
      automation_enabled: true,
      cadence_paused: { $ne: true },
      initial_response_sent_at: { $exists: true }, // Only those we've already contacted
    }, '-initial_response_sent_at', 500);

    console.log(`Processing ${leads.length} leads for follow-ups`);

    for (const lead of leads) {
      try {
        // **PHASE 2 FIX: Phone number validation**
        if (!lead.phone_number || lead.phone_number.replace(/\D/g, '').length < 10) {
          console.log(`Skipping lead ${lead.id}: Invalid phone number`);
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            event_type: 'sms_failed',
            channel: 'sms',
            direction: 'outbound',
            provider: 'twilio',
            status: 'failed',
            error_message: 'Invalid phone number format',
            metadata_json: JSON.stringify({
              reason: 'validation_failed',
              phone: lead.phone_number,
            }),
          }).catch(err => console.error('Failed to log skip:', err.message));
          continue;
        }

        // Check if next follow-up time has arrived
        const now = new Date();
        if (lead.next_follow_up_at && new Date(lead.next_follow_up_at) > now) {
          // Not yet time for follow-up
          continue;
        }

        // Get current step using nullish coalescing
        const currentStep = (lead.follow_up_step ?? 0) + 1;

        // Check if max attempts reached
        if (currentStep > (settings.cadence_max_attempts ?? 6)) {
          console.log(`Lead ${lead.id} reached max follow-up attempts. Pausing cadence.`);
          await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
            cadence_paused: true,
            cadence_paused_at: now.toISOString(),
          });
          continue;
        }

        // Determine channel (alternate based on step)
        const useEmail = currentStep % 2 === 0; // Even steps = email, odd = SMS
        const channel = useEmail ? 'email' : 'sms';

        // TODO: Send message via appropriate channel
        console.log(`Would send ${channel} to ${lead.email} (step ${currentStep})`);

        // Update follow-up tracking
        const nextDelay = 60 * 60 * 24; // 24 hours in seconds
        const nextFollowUpAt = new Date(now.getTime() + nextDelay * 1000).toISOString();

        await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
          follow_up_step: currentStep,
          next_follow_up_at: nextFollowUpAt,
          last_message_sent: now.toISOString(),
        });

      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error.message);
      }
    }

    return Response.json({
      success: true,
      processed: leads.length,
    });
  } catch (error) {
    console.error('processDynamicFollowUps error:', error);
    return Response.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    );
  }
});