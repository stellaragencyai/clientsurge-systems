import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * INSTANT LEAD RESPONSE ORCHESTRATOR
 * Triggered on WebsiteLead creation via entity automation.
 * Also callable directly with { lead_id, lead_type }.
 * Creates AutomationJob records for instant_sms and confirmation_email.
 * Idempotent — skips if jobs already exist for this lead.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both entity automation format (event.entity_id) and direct call format
    const isEntityAutomation = body?.event?.type === 'create';
    const lead_id = isEntityAutomation ? body.event.entity_id : body.lead_id;
    const lead_type = isEntityAutomation ? (body.event.entity_name || 'WebsiteLead') : (body.lead_type || 'WebsiteLead');

    if (!lead_id) {
      return Response.json({ error: 'No lead_id found in payload' }, { status: 400 });
    }

    // 1. Idempotency check — don't double-create jobs for same lead
    const existingJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { lead_id },
      '-created_at',
      5
    ).catch(() => []);

    if (existingJobs?.length > 0) {
      const existingTypes = new Set(existingJobs.map(j => j.job_type));
      console.log(`[handleInstantLeadResponse] Jobs already exist for lead ${lead_id}:`, [...existingTypes]);
    }

    // 2. Fetch the lead record
    const lead = await (lead_type === 'WebsiteLead'
      ? base44.asServiceRole.entities.WebsiteLead.get(lead_id)
      : base44.asServiceRole.entities.Leads.get(lead_id)
    );

    if (!lead) {
      return Response.json({ error: 'Lead not found', lead_id }, { status: 404 });
    }

    // Skip if automation disabled
    if (lead.automation_enabled === false) {
      return Response.json({ skipped: true, reason: 'automation_disabled', lead_id });
    }

    // Skip smoke/QA data — check for test markers
    if (isTestLead(lead)) {
      console.log(`[handleInstantLeadResponse] Skipping test/smoke lead ${lead_id}`);
      return Response.json({ skipped: true, reason: 'test_lead', lead_id });
    }

    // ── PART 4: PACKAGE PERMISSION ENFORCEMENT ──
    // Resolve ClientDeployment and check module permission before creating any automation jobs.
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    if (lead.client_id) {
      try {
        const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: lead.client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
          '-created_date', 1
        );
        const deployment = deployments?.[0] || null;
        if (deployment) {
          const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
            deployment_id: deployment.id, module_key: 'instant_lead_response'
          });
          if (permRes.data?.authorized !== true) {
            // PART 5: Log blocked execution
            await base44.asServiceRole.functions.invoke('logAutomationExecution', {
              client_deployment_id: deployment.id, client_id: lead.client_id,
              module_key: 'instant_lead_response', trigger_event: 'lead_created',
              execution_status: 'blocked',
              error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
              error_code: permRes.data?.reason || 'module_not_authorized',
              lead_id: lead_id,
            }).catch(() => {});
            return Response.json({
              blocked: true,
              reason: permRes.data?.reason,
              message: 'Module not authorized for this deployment',
              lead_id
            }, { status: 403 });
          }
          _obsCtx = {
            deployment_id: deployment.id,
            client_id: lead.client_id,
            module_key: 'instant_lead_response',
            trigger_event: 'lead_created',
            lead_id: lead_id
          };
        }
      } catch (err) {
        console.warn('[handleInstantLeadResponse] Permission check failed:', err.message);
      }
    }

    // 3. Log workflow_triggered
    const workflowEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      client_id: lead.client_id,
      client_project_id: lead.client_project_id,
      channel: 'internal',
      direction: 'system',
      event_type: 'workflow_triggered',
      provider: 'internal',
      status: 'processed',
      subject: `Instant lead response workflow triggered`,
      message_body: JSON.stringify({ lead_id, lead_type, email: lead.email, phone: lead.phone_number }),
      environment: 'production',
      dashboard_excluded: false,
      dashboard_truth_status: 'trusted',
    }).catch(err => {
      console.warn('[handleInstantLeadResponse] Failed to log workflow event:', err.message);
      return null;
    });

    // 4. Get admin settings
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]).catch(() => null);

    const jobs = [];
    const existing = new Set((existingJobs || []).map(j => j.job_type));

    // 5. Create instant_sms job if not already created
    if (!existing.has('instant_sms') && settings?.twilio_enabled && lead.phone_number) {
      const smsJob = await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        lead_type,
        client_id: lead.client_id,
        client_project_id: lead.client_project_id,
        job_type: 'instant_sms',
        status: 'queued',
        channel: 'sms',
        recipient_phone: lead.phone_number,
        template_key: 'instant_lead_response',
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        queued_at: new Date().toISOString(),
        context_json: JSON.stringify({
          first_name: lead.first_name || 'there',
          business_name: lead.business_name,
          lead_type,
        }),
      });
      jobs.push(smsJob);
    } else if (!settings?.twilio_enabled) {
      console.warn('[handleInstantLeadResponse] Twilio not enabled — skipping SMS job');
    } else if (!lead.phone_number) {
      console.warn('[handleInstantLeadResponse] No phone number on lead — skipping SMS job');
    }

    // 6. Create confirmation_email job if not already created
    if (!existing.has('confirmation_email') && settings?.resend_enabled && lead.email) {
      const emailJob = await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        lead_type,
        client_id: lead.client_id,
        client_project_id: lead.client_project_id,
        job_type: 'confirmation_email',
        status: 'queued',
        channel: 'email',
        recipient_email: lead.email,
        template_key: 'confirmation_email',
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        queued_at: new Date().toISOString(),
        context_json: JSON.stringify({
          first_name: lead.first_name || 'there',
          business_name: lead.business_name,
          lead_type,
        }),
      });
      jobs.push(emailJob);
    } else if (!settings?.resend_enabled) {
      console.warn('[handleInstantLeadResponse] Resend not enabled — skipping email job');
    } else if (!lead.email) {
      console.warn('[handleInstantLeadResponse] No email on lead — skipping email job');
    }

    // 7. Queue each job in EventQueue with proper schema fields
    const eventQueueIds = [];
    for (const job of jobs) {
      const eq = await base44.asServiceRole.entities.EventQueue.create({
        communication_event_id: workflowEvent?.id || 'workflow_triggered',
        client_id: lead.client_id || 'unknown',
        client_project_id: lead.client_project_id,
        event_category: 'automation_event',
        processor_type: 'messaging_processor',
        status: 'queued',
        retry_count: 0,
        max_retries: 3,
        priority: 1,
        metadata_json: JSON.stringify({
          job_id: job.id,
          job_type: job.job_type,
          lead_id,
          lead_type,
          channel: job.channel,
        }),
      }).catch(err => { console.warn('EventQueue create failed:', err.message); return null; });
      if (eq) eventQueueIds.push(eq.id);
    }

    // 8. Write DashboardTruthCheck for admin_dashboard scope
    const now = new Date().toISOString();
    const hasProofEvents = false; // No completed provider_send_succeeded events yet — jobs just queued
    const blockers = [];
    const warnings = [];

    if (jobs.length === 0) {
      blockers.push({
        code: 'no_jobs_created',
        severity: 'launch_blocker',
        message: 'No AutomationJob records were created — Twilio or Resend may not be configured, or lead is missing phone/email.',
        entity_name: 'AutomationJob',
        fix_action: 'Enable Twilio/Resend in AdminSettings and ensure lead has phone_number and email.',
      });
    } else {
      warnings.push({
        code: 'jobs_queued_no_provider_proof',
        severity: 'advisory',
        message: `${jobs.length} job(s) created with status=queued. No provider_send_succeeded events exist yet. safe_to_launch remains false until real delivery proof is recorded.`,
        entity_name: 'AutomationJob',
        fix_action: 'Run processAutomationJobsQueue and confirm provider_send_succeeded CommunicationEvent exists.',
      });
    }

    // Exclude QA/smoke/internal from production truth
    const isProductionLead = !isTestLead(lead);
    if (isProductionLead) {
      const existingTruth = await base44.asServiceRole.entities.DashboardTruthCheck.filter(
        { scope: 'admin_dashboard', client_id: lead.client_id || 'platform' },
        '-created_date',
        1
      ).catch(() => []);

      const truthPayload = {
        scope: 'admin_dashboard',
        client_id: lead.client_id || 'platform',
        client_project_id: lead.client_project_id,
        environment: 'production',
        truth_status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'trusted',
        safe_to_show_admin: true,
        safe_to_show_client: false,
        safe_to_launch: hasProofEvents, // false until real provider success proof exists
        blocker_count: blockers.length,
        warning_count: warnings.length,
        blockers,
        warnings,
        evidence_summary: jobs.length === 0
          ? 'No AutomationJobs created. Provider integration (Twilio/Resend) likely not configured or lead missing contact info.'
          : `${jobs.length} job(s) queued (${jobs.map(j => j.job_type).join(', ')}). Workflow event logged (id: ${workflowEvent?.id || 'none'}). No provider_send_succeeded events yet — safe_to_launch=false.`,
        source_records: { lead_id, workflow_event_id: workflowEvent?.id, job_ids: jobs.map(j => j.id) },
        last_checked_at: now,
        updated_at: now,
      };

      if (existingTruth?.[0]?.id) {
        await base44.asServiceRole.entities.DashboardTruthCheck.update(existingTruth[0].id, truthPayload).catch(err =>
          console.warn('[handleInstantLeadResponse] DashboardTruthCheck update failed:', err.message)
        );
      } else {
        await base44.asServiceRole.entities.DashboardTruthCheck.create({ ...truthPayload, created_at: now }).catch(err =>
          console.warn('[handleInstantLeadResponse] DashboardTruthCheck create failed:', err.message)
        );
      }
    }

    // ── PART 5: LOG AUTOMATION EXECUTION ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: jobs.length > 0 ? 'completed' : 'skipped',
          response_data: JSON.stringify({
            jobs_created: jobs.length,
            job_types: jobs.map(j => j.job_type),
          }),
          execution_time_ms: Date.now() - _obsStartTime,
        });
      } catch (_) {}
    }

    return Response.json({
      success: true,
      lead_id,
      lead_type,
      jobs_created: jobs.length,
      sms_job_id: jobs.find(j => j.job_type === 'instant_sms')?.id,
      email_job_id: jobs.find(j => j.job_type === 'confirmation_email')?.id,
      workflow_event_id: workflowEvent?.id,
      event_queue_ids: eventQueueIds,
      skipped_existing: [...existing],
    });
  } catch (error) {
    console.error('[handleInstantLeadResponse]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function isTestLead(lead) {
  const testMarkers = ['test', 'smoke', 'qa', 'demo', 'staging'];
  const emailDomain = (lead.email || '').split('@')[1] || '';
  const businessName = (lead.business_name || '').toLowerCase();
  return testMarkers.some(m =>
    emailDomain.includes(m) || businessName.includes(m)
  );
}