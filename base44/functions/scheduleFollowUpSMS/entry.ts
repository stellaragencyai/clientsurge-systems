import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find leads that are in "Contacted" status and were created 10–20 min ago
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString();

    const leads = await base44.asServiceRole.entities.Leads.filter({
      status: 'Contacted',
    });

    // Filter to leads created in the 10–20 minute window
    const eligibleLeads = leads.filter(lead => {
      if (!lead.phone || !lead.created_date) return false;
      const created = new Date(lead.created_date).toISOString();
      return created >= twentyMinAgo && created <= tenMinAgo;
    });

    let sent = 0;

    for (const lead of eligibleLeads) {
      // Check if follow-up already sent
      const existing = await base44.asServiceRole.entities.Messages.filter({
        lead_id: lead.id,
        channel: 'sms',
        message_text: 'Just checking — still interested?',
      });

      if (existing.length > 0) continue;

      // Send follow-up SMS
      await base44.functions.invoke('sendSMS', {
        phone: lead.phone,
        message: 'Just checking — still interested?',
        leadId: lead.id,
      });

      sent++;
    }

    return Response.json({ success: true, sent, eligible: eligibleLeads.length });
  } catch (error) {
    console.error('scheduleFollowUpSMS error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});