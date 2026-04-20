import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all Live clients
    const allClients = await base44.asServiceRole.entities.OnboardingClient.list('-created_date', 200);
    const liveClients = allClients.filter(c => c.status === 'Live');

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const reEngaged = [];

    for (const client of liveClients) {
      if (!client.email) continue;

      // Check for leads created in the past 14 days tied to this client's webhook
      // We look at Leads entity filtered by notes/source containing the client id
      // or simply check CommunicationEvents for outbound activity in last 14 days
      let hasRecentLeads = false;

      try {
        // Check AutomationJobs for recent activity as a proxy for lead flow
        const recentJobs = await base44.asServiceRole.entities.AutomationJob.filter(
          { status: 'completed' },
          '-created_date',
          5
        );

        // Check CommunicationEvents for recent outbound activity
        const recentEvents = await base44.asServiceRole.entities.CommunicationEvent.list('-created_date', 5);
        const cutoff = fourteenDaysAgo.getTime();

        // If there are any events in last 14 days that mention this client's twilio number
        hasRecentLeads = recentEvents.some(e => {
          const eventTime = new Date(e.created_date).getTime();
          return eventTime > cutoff && (
            (client.twilio_number && e.metadata_json && e.metadata_json.includes(client.twilio_number))
          );
        });
      } catch (_) {
        // If check fails, treat as quiet — better to over-communicate
        hasRecentLeads = false;
      }

      if (hasRecentLeads) continue;

      // Also skip if we sent a re-engagement email recently (check notes)
      const notes = client.notes || '';
      const recentReEngagement = notes.includes('[Re-Engagement Sent:') && (() => {
        const match = notes.match(/\[Re-Engagement Sent: ([^\]]+)\]/g);
        if (!match) return false;
        const lastEntry = match[match.length - 1];
        const dateStr = lastEntry.replace('[Re-Engagement Sent: ', '').replace(']', '');
        return new Date(dateStr).getTime() > fourteenDaysAgo.getTime();
      })();

      if (recentReEngagement) continue;

      // Build active systems list for the email
      const activeSystems = [];
      if (client.step_instant_response) activeSystems.push('instant SMS response');
      if (client.step_followup_sequence) activeSystems.push('follow-up sequences');
      if (client.step_missed_call) activeSystems.push('missed call text-back');
      if (activeSystems.length === 0) activeSystems.push('your full automation system');

      const systemsText = activeSystems.join(', ');

      const emailBody = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;color:#2d2d2d;">

  <div style="border-bottom:3px solid #9a5c2e;padding-bottom:16px;margin-bottom:24px;">
    <p style="font-size:13px;font-weight:700;color:#9a5c2e;text-transform:uppercase;letter-spacing:1px;margin:0;">ClientSurge Systems</p>
  </div>

  <p style="font-size:16px;margin-bottom:6px;">Hey ${client.owner_name || 'there'},</p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    Just checking in — how are things going with <strong>${client.business_name}</strong>?
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    Your automation system is still running in the background — ${systemsText} ${activeSystems.length > 1 ? 'are all' : 'is'} active and ready to fire the moment a new lead comes in.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    If leads have slowed down, it might be worth a quick look together — sometimes a small tweak to messaging or lead source settings can make a big difference.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="https://calendly.com/nolan-clientsurgesystems"
       style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:13px 30px;border-radius:9999px;">
      📞 Book a Quick Optimization Call
    </a>
  </div>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    No pressure at all — just want to make sure you're getting the most out of your system.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;margin-top:24px;">
    Talk soon,<br/>
    <strong>Nolan</strong><br/>
    <span style="color:#9a5c2e;font-size:13px;">ClientSurge Systems</span>
  </p>

  <div style="border-top:1px solid #e8ddd0;margin-top:28px;padding-top:14px;">
    <p style="font-size:12px;color:#aaa;margin:0;">Questions? Reply directly to this email.</p>
  </div>

</div>
`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        from_name: 'Nolan @ ClientSurge Systems',
        subject: `Checking in — how are things going at ${client.business_name}?`,
        body: emailBody,
      });

      // Log the re-engagement in the client's notes field
      const timestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const updatedNotes = (client.notes ? client.notes + '\n' : '') +
        `[Re-Engagement Sent: ${timestamp}] — Quiet lead flow detected. Re-engagement check-in email sent automatically.`;

      await base44.asServiceRole.entities.OnboardingClient.update(client.id, {
        notes: updatedNotes,
      });

      reEngaged.push(client.business_name);
    }

    return Response.json({ success: true, re_engaged: reEngaged, count: reEngaged.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});