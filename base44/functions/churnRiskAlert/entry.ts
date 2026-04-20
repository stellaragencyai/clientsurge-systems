import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allClients = await base44.asServiceRole.entities.OnboardingClient.list('-created_date', 200);
    const liveClients = allClients.filter(c => c.status === 'Live');

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const churnRisks = [];

    for (const client of liveClients) {
      // Condition 1: Live for more than 60 days
      const wentLiveAt = client.start_date ? new Date(client.start_date) : new Date(client.created_date);
      const isOldEnough = wentLiveAt < sixtyDaysAgo;
      if (!isOldEnough) continue;

      // Condition 2: No bookings/demos logged in notes in past 30 days
      const notes = client.notes || '';
      const hasRecentBookingNote = (() => {
        // Look for booking-related keywords with a recent timestamp
        const bookingKeywords = ['booked', 'booking', 'demo', 'appointment', 'scheduled', 'call booked'];
        const lines = notes.split('\n').filter(l => l.trim());
        return lines.some(line => {
          const lower = line.toLowerCase();
          const hasKeyword = bookingKeywords.some(kw => lower.includes(kw));
          if (!hasKeyword) return false;
          // Try to find a date in the line
          const dateMatch = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/i);
          if (dateMatch) {
            return new Date(dateMatch[0]) > thirtyDaysAgo;
          }
          return false;
        });
      })();

      if (hasRecentBookingNote) continue;

      // Calculate days live
      const daysLive = Math.floor((Date.now() - wentLiveAt.getTime()) / (1000 * 60 * 60 * 24));

      // Determine suggested action
      let suggestedAction = '';
      if (!client.twilio_number) {
        suggestedAction = '🔌 <strong>Check webhook connection</strong> — no Twilio number on record. Lead intake may be broken.';
      } else if (!client.step_messages_customized) {
        suggestedAction = '✍️ <strong>Adjust their messaging</strong> — messages haven\'t been customized. Generic copy may be hurting response rates.';
      } else if (!client.step_followup_sequence) {
        suggestedAction = '📬 <strong>Build their follow-up sequence</strong> — no multi-day follow-up active. They\'re likely losing warm leads.';
      } else {
        suggestedAction = '📞 <strong>Offer a free optimization call</strong> — system looks complete but results are flat. A personal review call may re-energize the relationship.';
      }

      // Active systems snapshot
      const systemsOn = [];
      if (client.step_twilio) systemsOn.push('Twilio ✓');
      if (client.step_lead_sources) systemsOn.push('Lead Sources ✓');
      if (client.step_instant_response) systemsOn.push('Instant SMS ✓');
      if (client.step_followup_sequence) systemsOn.push('Follow-Up ✓');
      if (client.step_missed_call) systemsOn.push('Missed Call ✓');
      if (client.step_messages_customized) systemsOn.push('Messages ✓');
      if (client.step_tested) systemsOn.push('Tested ✓');

      churnRisks.push({ client, daysLive, suggestedAction, systemsOn });
    }

    if (churnRisks.length === 0) {
      return Response.json({ success: true, message: 'No churn risks detected this week.' });
    }

    // Build the alert email for Nolan
    const clientRows = churnRisks.map(({ client, daysLive, suggestedAction, systemsOn }) => `
<div style="border:1px solid #fca5a5;border-radius:10px;padding:18px 20px;margin-bottom:16px;background:#fff5f5;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
    <div>
      <p style="font-size:16px;font-weight:700;color:#2d2d2d;margin:0;">${client.business_name}</p>
      <p style="font-size:13px;color:#888;margin:4px 0 0 0;">${client.owner_name} · ${client.email}</p>
    </div>
    <span style="background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:700;padding:4px 10px;border-radius:9999px;white-space:nowrap;">
      ${daysLive} days live
    </span>
  </div>

  <table style="font-size:13px;color:#444;width:100%;margin-bottom:12px;">
    <tr><td style="padding:3px 12px 3px 0;color:#888;font-weight:600;white-space:nowrap;">Phone</td><td>${client.phone || '—'}</td></tr>
    <tr><td style="padding:3px 12px 3px 0;color:#888;font-weight:600;white-space:nowrap;">Twilio #</td><td>${client.twilio_number || '⚠️ Not assigned'}</td></tr>
    <tr><td style="padding:3px 12px 3px 0;color:#888;font-weight:600;white-space:nowrap;">Monthly Rate</td><td>${client.monthly_rate ? '$' + client.monthly_rate + '/mo' : '—'}</td></tr>
    <tr><td style="padding:3px 12px 3px 0;color:#888;font-weight:600;white-space:nowrap;">Systems On</td><td>${systemsOn.length > 0 ? systemsOn.join(' · ') : 'None confirmed'}</td></tr>
  </table>

  <div style="background:#fff;border-left:4px solid #f97316;border-radius:4px;padding:10px 14px;">
    <p style="font-size:12px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Suggested Action</p>
    <p style="font-size:14px;margin:0;">${suggestedAction}</p>
  </div>
</div>
`).join('');

    const alertEmail = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;color:#2d2d2d;">

  <div style="border-bottom:3px solid #b91c1c;padding-bottom:16px;margin-bottom:24px;">
    <p style="font-size:13px;font-weight:700;color:#b91c1c;text-transform:uppercase;letter-spacing:1px;margin:0;">⚠️ ClientSurge — Churn Risk Report</p>
  </div>

  <p style="font-size:15px;line-height:1.7;">Hi Nolan,</p>

  <p style="font-size:15px;line-height:1.7;">
    Your weekly churn risk scan found <strong>${churnRisks.length} client${churnRisks.length > 1 ? 's' : ''}</strong> who have been live for 60+ days with no bookings or demo activity logged in the past 30 days.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#888;">These clients are at risk of churning. A proactive outreach this week could save the relationship.</p>

  ${clientRows}

  <p style="margin-top:24px;font-size:14px;color:#888;">
    <a href="https://clientsurgesystems.com/admin/onboarding" style="color:#9a5c2e;">View all clients in Admin →</a>
  </p>

  <p style="font-size:12px;color:#aaa;border-top:1px solid #e8ddd0;padding-top:16px;margin-top:24px;">
    — ClientSurge Systems Automation · Sent every Friday at 4PM
  </p>
</div>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'nolan@clientsurgesystems.com',
      from_name: 'ClientSurge Systems',
      subject: `⚠️ ${churnRisks.length} Churn Risk${churnRisks.length > 1 ? 's' : ''} Detected — Weekly Review`,
      body: alertEmail,
    });

    return Response.json({ success: true, churn_risks: churnRisks.map(r => r.client.business_name), count: churnRisks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});