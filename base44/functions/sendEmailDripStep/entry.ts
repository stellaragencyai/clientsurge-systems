import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

function getEmailOutreachGate(context = "email outreach") {
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();
  if (["verified", "passed", "production_verified"].includes(proofStatus)) {
    return { ok: true, reason: null, proof_status: proofStatus || "verified" };
  }
  return { ok: false, reason: `Email outreach blocked: deliverability proof not complete (context: ${context}).`, proof_status: proofStatus || "missing" };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, campaign_id, step_number } = await req.json();

    if (!lead_id || !campaign_id || step_number === undefined) {
      return secureJson(
        { error: "lead_id, campaign_id, step_number required" },
        { status: 400 }
      );
    }

    console.log(
      `[SendEmailDrip] Sending step ${step_number} for campaign ${campaign_id}`
    );

    // 1. Get campaign
    const campaign = await base44.asServiceRole.entities.EmailDripCampaign.get(
      campaign_id
    );
    if (!campaign || campaign.status !== "active") {
      console.log(`[SendEmailDrip] Campaign not active, skipping`);
      return secureJson({ success: false, message: "Campaign not active" }, { status: 409 });
    }

    const sendGate = getEmailOutreachGate("email drip campaign");
    if (!sendGate.ok) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id,
        channel: "email",
        direction: "outbound",
        event_type: "email_blocked",
        provider: "resend",
        status: "blocked",
        subject: `Email drip step ${step_number} blocked`,
        message_body: sendGate.reason,
        metadata_json: JSON.stringify({
          campaign_id,
          step_number,
          reason: "deliverability_gate",
          proof_status: sendGate.proof_status,
          requires_owner_action: true,
        }),
      });

      return secureJson({
        success: false,
        email_sent: false,
        error: "Email drip campaign sending is blocked until deliverability proof is complete.",
        reason: sendGate.reason,
        proof_status: sendGate.proof_status,
      }, { status: 403 });
    }

    // 2. Get step data
    const step = campaign.steps[step_number - 1];
    if (!step) {
      return secureJson(
        { error: `Step ${step_number} not found` },
        { status: 404 }
      );
    }

    // 3. Get lead email
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead?.email) {
      return secureJson({ error: "Lead email not found" }, { status: 400 });
    }

    // ── TENANT SCOPE GUARDRAIL (inlined) ──
    const resolvedClientId = lead.client_id || campaign.client_id;
    if (!resolvedClientId) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id, channel: 'email', direction: 'outbound', event_type: 'tenant_scope_blocked',
          provider: 'resend', status: 'failed', error_message: 'missing_client_id_tenant_scope',
          metadata_json: JSON.stringify({ trigger_name: 'sendEmailDripStep', campaign_id, step_number }),
        });
      } catch (_) {}
      return secureJson({ error: 'Outbound email blocked: missing client_id tenant scope', email_sent: false, reason: 'missing_client_id_tenant_scope', safe_to_continue: true });
    }
    const scope = { client_id: resolvedClientId, client_project_id: lead.client_project_id || campaign.client_project_id };

    // ── PHASE 2: DEPLOYMENT CONTEXT + MODULE PERMISSION ──
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    try {
      const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
        { client_id: resolvedClientId, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
        '-created_date', 1
      );
      const deployment = deployments?.[0] || null;
      if (deployment) {
        const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
          deployment_id: deployment.id, module_key: 'lead_nurture',
          client_id: resolvedClientId, environment: lead.environment || null,
        });
        if (permRes.data?.authorized !== true) {
          await base44.asServiceRole.functions.invoke('logAutomationExecution', {
            client_deployment_id: deployment.id, client_id: resolvedClientId,
            module_key: 'lead_nurture', trigger_event: 'email_drip_step',
            execution_status: 'blocked',
            error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
            error_code: permRes.data?.reason || 'module_not_authorized',
            lead_id: lead_id,
          }).catch(() => {});
          return secureJson({ success: false, blocked: true, reason: permRes.data?.reason, message: 'Module not authorized for this deployment' }, { status: 403 });
        }
        _obsCtx = {
          deployment_id: deployment.id, client_id: resolvedClientId,
          client_project_id: scope.client_project_id,
          industry_config_id: deployment.industry_config_id || null,
          module_key: 'lead_nurture', trigger_event: 'email_drip_step',
          lead_id: lead_id, environment: lead.environment || null,
        };
      }
    } catch (err) {
      console.warn('[sendEmailDripStep] Deployment/permission check failed:', err.message);
    }

    // 4. Send via Resend
    const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
      to: lead.email,
      subject: step.subject,
      body: step.body,
      from_name: "ClientSurge Systems",
    });

    // 5. Update campaign step status
    const updatedSteps = campaign.steps.map((s, i) => {
      if (i === step_number - 1) {
        return {
          ...s,
          status: "sent",
          sent_at: new Date().toISOString(),
        };
      }
      return s;
    });

    await base44.asServiceRole.entities.EmailDripCampaign.update(campaign_id, {
      steps: updatedSteps,
    });

    // 6. Log as communication event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      client_id: scope.client_id,
      client_project_id: scope.client_project_id,
      tenant_scope_status: 'scoped',
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: "sent",
      subject: step.subject,
      message_body: step.body.substring(0, 500),
      metadata_json: JSON.stringify({
        campaign_id,
        step_number,
        campaign_type: campaign.campaign_type,
      }),
    });

    console.log(
      `[SendEmailDrip] Step ${step_number} sent to ${lead.email}`
    );

    // 7. Check if campaign complete
    const allSent = updatedSteps.every((s) => s.status === "sent");
    if (allSent) {
      await base44.asServiceRole.entities.EmailDripCampaign.update(
        campaign_id,
        {
          status: "completed",
          completed_at: new Date().toISOString(),
        }
      );
      console.log(`[SendEmailDrip] Campaign ${campaign_id} completed`);
    }

    // ── PHASE 2: LOG EXECUTION RESULT ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'completed',
          external_provider_reference: emailResult?.id || null,
          execution_time_ms: Date.now() - _obsStartTime,
        });
      } catch (_) {}
    }

    return secureJson({
      success: true,
      lead_id,
      step_number,
      email_sent: lead.email,
    });
  } catch (error) {
    console.error("[SendEmailDrip] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});