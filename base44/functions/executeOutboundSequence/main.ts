import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Execute Outbound Sequence: Processes next step for leads in active sequences
 * Scheduled to run every 5 minutes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const results = {
      sequences_executed: 0,
      messages_sent: 0,
      errors: [],
    };

    // Fetch all active sequences
    const sequences = await base44.asServiceRole.entities.OutboundSequence.filter(
      { enabled: true },
      '-created_at',
      100
    ).catch(() => []);

    for (const sequence of sequences) {
      try {
        // Fetch leads in this sequence
        const leads = await base44.asServiceRole.entities.OutboundLead.filter(
          {
            sequence_id: sequence.id,
            outreach_status: { $in: ['new', 'contacted'] },
          },
          '-created_date',
          50
        ).catch(() => []);

        for (const lead of leads) {
          try {
            // Determine next step
            const nextStep = sequence.steps[lead.current_sequence_step];
            if (!nextStep) {
              // Sequence complete
              await base44.asServiceRole.entities.OutboundLead.update(lead.id, {
                outreach_status: 'paused',
              });
              continue;
            }

            // Check if step is ready to send (based on delay)
            if (lead.last_contacted_at) {
              const lastContact = new Date(lead.last_contacted_at);
              const delayMs = nextStep.delay_hours * 3600000;
              if (Date.now() - lastContact.getTime() < delayMs) {
                continue; // Not ready yet
              }
            }

            // Send message (simulate message sending)
            const message = nextStep.message_body
              .replace('{{first_name}}', lead.contact_name?.split(' ')[0] || 'there')
              .replace('{{company_name}}', lead.business_name);

            // Log activity
            await base44.asServiceRole.entities.OutboundActivity.create({
              outbound_lead_id: lead.id,
              client_id: sequence.client_id,
              sequence_id: sequence.id,
              sequence_step: nextStep.step_number,
              activity_type: 'message_sent',
              channel: nextStep.channel,
              message_subject: nextStep.message_subject,
              message_preview: message.substring(0, 100),
              status: 'sent',
              occurred_at: new Date().toISOString(),
            }).catch(() => {});

            // Update lead status
            await base44.asServiceRole.entities.OutboundLead.update(lead.id, {
              current_sequence_step: lead.current_sequence_step + 1,
              last_contacted_at: new Date().toISOString(),
              total_outreach_messages: (lead.total_outreach_messages || 0) + 1,
              outreach_status: 'contacted',
            }).catch(() => {});

            results.messages_sent++;
          } catch (leadError) {
            results.errors.push({
              lead_id: lead.id,
              error: leadError.message,
            });
          }
        }

        results.sequences_executed++;
      } catch (seqError) {
        results.errors.push({
          sequence_id: sequence.id,
          error: seqError.message,
        });
      }
    }

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[executeOutboundSequence] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});