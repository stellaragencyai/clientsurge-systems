import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allClients = await base44.asServiceRole.entities.OnboardingClient.list('-created_date', 200);
    const liveClients = allClients.filter(c => c.status === 'Live');

    if (liveClients.length === 0) {
      return Response.json({ success: true, message: 'No live clients to report on.' });
    }

    const results = [];

    for (const client of liveClients) {
      const daysLive = client.start_date
        ? Math.floor((Date.now() - new Date(client.start_date)) / (1000 * 60 * 60 * 24))
        : null;

      const activeSystems = [];
      if (client.step_instant_response) activeSystems.push('Instant Lead Response (SMS within 60 seconds)');
      if (client.step_followup_sequence) activeSystems.push('Follow-Up Sequence (Day 1, Day 3, Day 7)');
      if (client.step_missed_call) activeSystems.push('Missed Call Text-Back');
      if (client.step_messages_customized) activeSystems.push('Custom-Branded Messaging');
      if (client.step_tested) activeSystems.push('End-to-End QA Verified');
      if (client.step_lead_sources) activeSystems.push('Lead Source Integrations');

      const systemsList = activeSystems.length > 0
        ? activeSystems.map(s => `• ${s}`).join('<br>')
        : '• Core automation systems running';

      const emailBody = `
<p>Hi ${client.owner_name},</p>

<p>Happy to share your monthly performance summary from <b>ClientSurge Systems</b>!</p>

<h3>📊 ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Summary — ${client.business_name}</h3>

${daysLive !== null ? `<p><b>Days Live:</b> ${daysLive} days</p>` : ''}

<p><b>Active Automation Systems:</b><br>
${systemsList}
</p>

<p>Your systems have been running 24/7, capturing leads, following up automatically, and working to put more bookings on your calendar — so you don't have to.</p>

<p>If you'd like to review your dashboard, view live stats, or discuss any optimizations, just reply to this email or reach out directly.</p>

<hr>

<p>As always, I'm grateful to have you as a client. Building these systems for businesses like yours is exactly why I started ClientSurge Systems, and your trust means everything.</p>

<p>Here's to a strong month ahead.</p>

<p>
— <b>Nolan</b><br>
Founder, ClientSurge Systems<br>
<a href="mailto:nolan@clientsurgesystems.com">nolan@clientsurgesystems.com</a><br>
(602) 587-4608
</p>
`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        from_name: 'Nolan @ ClientSurge Systems',
        subject: `Your ${new Date().toLocaleString('default', { month: 'long' })} Performance Summary — ${client.business_name}`,
        body: emailBody,
      });

      results.push({ client: client.business_name, email: client.email, sent: true });
    }

    return Response.json({ success: true, emails_sent: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});