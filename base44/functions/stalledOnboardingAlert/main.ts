import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STEP_LABELS = {
  step_twilio: "Twilio Configured",
  step_lead_sources: "Lead Sources Connected",
  step_instant_response: "Instant Response Built",
  step_followup_sequence: "Follow-Up Sequence Built",
  step_missed_call: "Missed Call Text-Back Active",
  step_messages_customized: "Messages Customized",
  step_tested: "End-to-End Tested",
  step_dashboard: "Client Portal Delivered",
  step_live: "Went Live",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allClients = await base44.asServiceRole.entities.OnboardingClient.list('-created_date', 200);

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const stalledClients = allClients.filter(client => {
      const isOnboarding = client.status === 'Onboarding' || client.status === 'In Setup';
      const isNotLive = !client.step_live;
      const isOldEnough = new Date(client.created_date) < fiveDaysAgo;
      return isOnboarding && isNotLive && isOldEnough;
    });

    if (stalledClients.length === 0) {
      return secureJson({ success: true, message: 'No stalled clients found.' });
    }

    let clientRows = '';
    for (const client of stalledClients) {
      const incompleteSteps = Object.entries(STEP_LABELS)
        .filter(([key]) => !client[key])
        .map(([, label]) => `• ${label}`)
        .join('\n');

      const daysSinceCreated = Math.floor((Date.now() - new Date(client.created_date)) / (1000 * 60 * 60 * 24));

      clientRows += `
---
<b>${client.business_name}</b> (${client.owner_name})<br>
Started: ${daysSinceCreated} days ago<br>
Email: ${client.email}<br>
<b>Incomplete Steps:</b><br>
${incompleteSteps.replace(/\n/g, '<br>')}
<br>`;
    }

    const emailBody = `
<p>Hi Nolan,</p>

<p>Here are the clients who have been in onboarding for more than 5 days and are not yet live:</p>

${clientRows}

<p>Total stalled: <b>${stalledClients.length}</b></p>

<p>Log in to the admin dashboard to take action:<br>
<a href="https://clientsurgesystems.com/admin/onboarding">View Client Onboarding</a></p>

<p>— ClientSurge Systems Automation</p>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'nolan@clientsurgesystems.com',
      from_name: 'ClientSurge Systems',
      subject: `⚠️ ${stalledClients.length} Stalled Onboarding Client${stalledClients.length > 1 ? 's' : ''} — Action Required`,
      body: emailBody,
    });

    return secureJson({ success: true, stalled_count: stalledClients.length });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
