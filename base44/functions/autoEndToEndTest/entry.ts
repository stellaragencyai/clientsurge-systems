import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { entity_id, data: client } = payload;

    if (!client || !client.business_name) {
      return Response.json({ error: 'No client data' }, { status: 400 });
    }

    const failures = [];

    // Step 1: Submit a fake test lead through the client's webhook URL
    const webhookUrl = `https://grinning-apex-flow-growth.base44.app/api/functions/createLeadAndDispatch?client_id=${entity_id}`;

    const fakeLeadPayload = {
      full_name: 'Test Lead — Auto QA',
      email: 'test-qa@clientsurgesystems.com',
      phone: '+16025550000',
      business_type: client.industry || 'Service Business',
      problem: 'Auto end-to-end system test — please ignore',
      business_name: `TEST — ${client.business_name}`,
      _is_test: true,
    };

    let testLeadId = null;

    try {
      const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakeLeadPayload),
      });

      const webhookData = await webhookRes.json();

      if (!webhookRes.ok || webhookData.error) {
        failures.push(`Webhook submission failed: ${webhookData.error || webhookRes.status}`);
      } else {
        testLeadId = webhookData.lead_id || webhookData.id || null;
      }
    } catch (err) {
      failures.push(`Webhook unreachable: ${err.message}`);
    }

    // Step 2: Wait 90 seconds for instant response to fire
    await new Promise(resolve => setTimeout(resolve, 90000));

    // Step 3: Verify instant response fired — check CommunicationEvent for this lead
    if (testLeadId) {
      try {
        const commEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
          { lead_id: testLeadId },
          '-created_date',
          20
        );

        const instantSmsFired = commEvents.some(
          e => e.event_type === 'sms_sent' && e.direction === 'outbound'
        );

        if (!instantSmsFired) {
          failures.push('Instant SMS response did NOT fire within 90 seconds');
        }

        // Step 4: Check Day 1 follow-up is queued in AutomationJob
        const jobs = await base44.asServiceRole.entities.AutomationJob.filter(
          { lead_id: testLeadId },
          '-created_date',
          20
        );

        const followUpQueued = jobs.some(
          j => j.job_type === 'nurture_sequence' && (j.status === 'queued' || j.status === 'processing' || j.status === 'completed')
        );

        if (!followUpQueued) {
          failures.push('Day 1 follow-up sequence was NOT queued after lead creation');
        }

        // Clean up — delete the test lead to avoid pollution
        try {
          await base44.asServiceRole.entities.Leads.delete(testLeadId);
        } catch (_) {
          // Non-critical cleanup failure
        }
      } catch (err) {
        failures.push(`Verification check failed: ${err.message}`);
      }
    } else {
      failures.push('No lead ID returned from webhook — cannot verify downstream events');
    }

    // Step 5: Mark passed or alert on failure
    if (failures.length === 0) {
      // All checks passed — mark the client record
      await base44.asServiceRole.entities.OnboardingClient.update(entity_id, {
        step_tested: true,
      });

      return Response.json({ success: true, message: 'End-to-end test passed. step_tested marked true.' });
    } else {
      // Send Nolan an alert with exactly what broke
      const failureList = failures.map((f, i) => `<li style="margin-bottom:8px;"><b>${i + 1}.</b> ${f}</li>`).join('');

      const alertEmail = `
<p>Hi Nolan,</p>

<p>The automated end-to-end system test for a client <b>failed</b>. Here's what broke:</p>

<div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin:20px 0;">
  <p style="font-weight:700;color:#b91c1c;margin:0 0 12px 0;">❌ Test Failures</p>
  <ul style="margin:0;padding-left:16px;color:#2d2d2d;font-size:14px;line-height:1.7;">
    ${failureList}
  </ul>
</div>

<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-bottom:20px;">
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Client</td><td>${client.business_name} (${client.owner_name})</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Email</td><td>${client.email}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Industry</td><td>${client.industry || '—'}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#888;font-weight:600;">Twilio #</td><td>${client.twilio_number || 'Not assigned'}</td></tr>
</table>

<p>The <code>step_tested</code> flag has <b>not</b> been marked true. Please investigate and re-trigger the test once resolved.</p>

<p><a href="https://clientsurgesystems.com/admin/onboarding">View Client Onboarding →</a></p>

<p>— ClientSurge Systems Automation</p>
`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'nolan@clientsurgesystems.com',
        from_name: 'ClientSurge Systems',
        subject: `🚨 E2E Test FAILED — ${client.business_name} (${failures.length} issue${failures.length > 1 ? 's' : ''})`,
        body: alertEmail,
      });

      return Response.json({ success: false, failures });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});