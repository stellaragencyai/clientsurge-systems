import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * logAutomationExecution — Centralized automation execution logger
 *
 * Creates an AutomationExecutionLog record for every automation attempt.
 * Called by automation execution functions to track deployment-level history.
 *
 * Usage:
 *   const res = await base44.functions.invoke('logAutomationExecution', {
 *     client_deployment_id,
 *     module_key,
 *     trigger_event,
 *     execution_status: 'completed', // queued|running|completed|failed|blocked
 *     response_data: JSON.stringify(result),
 *     error_message: null,
 *     execution_time_ms: 1234,
 *     external_provider_reference: twilioMessageSid,
 *     lead_id,
 *     conversation_id
 *   })
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const {
      client_deployment_id,
      client_id,
      module_key,
      automation_module_id,
      trigger_event,
      execution_status,
      response_data,
      error_message,
      error_code,
      execution_time_ms,
      external_provider_reference,
      lead_id,
      conversation_id,
      started_at,
      completed_at
    } = body;

    if (!client_deployment_id || !module_key || !trigger_event || !execution_status) {
      return Response.json({
        error: 'client_deployment_id, module_key, trigger_event, and execution_status are required'
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const log = await base44.asServiceRole.entities.AutomationExecutionLog.create({
      client_deployment_id,
      client_id: client_id || null,
      automation_module_id: automation_module_id || null,
      module_key,
      trigger_event,
      execution_status,
      response_data: response_data || null,
      error_message: error_message || null,
      error_code: error_code || null,
      execution_time_ms: execution_time_ms || null,
      external_provider_reference: external_provider_reference || null,
      lead_id: lead_id || null,
      conversation_id: conversation_id || null,
      started_at: started_at || now,
      completed_at: completed_at || (execution_status === 'completed' || execution_status === 'failed' || execution_status === 'blocked' ? now : null)
    });

    // If this was a failure, also update the deployment's error tracking
    if (execution_status === 'failed' || execution_status === 'blocked') {
      const deployment = await base44.asServiceRole.entities.ClientDeployment.get(client_deployment_id).catch(() => null);
      if (deployment) {
        const existingErrors = deployment.errors || [];
        const newError = {
          error_code: error_code || `module_${module_key}_execution_failed`,
          message: error_message || `Module '${module_key}' execution failed during '${trigger_event}'`,
          module_key,
          severity: execution_status === 'blocked' ? 'advisory' : 'warning',
          suggested_action: getActionForError(error_code, module_key),
          occurred_at: now
        };

        // Avoid duplicate error entries for same module+code within last hour
        const recentDuplicate = existingErrors.find(e =>
          e.error_code === newError.error_code &&
          e.module_key === newError.module_key &&
          !e.resolved_at &&
          e.occurred_at &&
          (new Date(now).getTime() - new Date(e.occurred_at).getTime()) < 3600000
        );

        if (!recentDuplicate) {
          await base44.asServiceRole.entities.ClientDeployment.update(client_deployment_id, {
            errors: [...existingErrors, newError]
          }).catch(err => {
            console.warn('[logAutomationExecution] Failed to update deployment errors:', err.message);
          });
        }
      }
    }

    // If this was a successful execution, increment deployment analytics
    if (execution_status === 'completed') {
      const deployment = await base44.asServiceRole.entities.ClientDeployment.get(client_deployment_id).catch(() => null);
      if (deployment) {
        // Advance module_installation_status for real (non-permission-check) executions.
        // This closes the contract gap where activated_modules listed modules as active
        // but module_installation_status stayed 'not_started' forever.
        const isRealExecution = trigger_event && trigger_event !== 'permission_check';
        if (isRealExecution && module_key) {
          const currentStatus = deployment.module_installation_status || {};
          const existing = currentStatus[module_key];
          const terminalStates = ['installed', 'verified', 'tested', 'ready'];
          if (!terminalStates.includes(existing)) {
            const updatedStatus = { ...currentStatus, [module_key]: 'installed' };
            await base44.asServiceRole.entities.ClientDeployment.update(client_deployment_id, {
              module_installation_status: updatedStatus
            }).catch(err => {
              console.warn('[logAutomationExecution] Failed to advance module_installation_status:', err.message);
            });
          }
        }

        const analytics = deployment.analytics || {};
        const updatedAnalytics = {
          leads_generated: analytics.leads_generated || 0,
          conversations_started: analytics.conversations_started || 0,
          appointments_booked: analytics.appointments_booked || 0,
          automation_executions: (analytics.automation_executions || 0) + 1,
          recovered_opportunities: analytics.recovered_opportunities || 0,
          last_activity_at: now
        };

        // Increment specific counters based on module_key
        if (module_key === 'instant_lead_response' && trigger_event === 'lead_created') {
          updatedAnalytics.leads_generated += 1;
        }
        if (module_key === 'ai_booking_agent' && trigger_event === 'appointment_booked') {
          updatedAnalytics.appointments_booked += 1;
        }
        if (module_key === 'review_reactivation' && trigger_event === 'reactivation_sent') {
          updatedAnalytics.recovered_opportunities += 1;
        }

        await base44.asServiceRole.entities.ClientDeployment.update(client_deployment_id, {
          analytics: updatedAnalytics
        }).catch(err => {
          console.warn('[logAutomationExecution] Failed to update deployment analytics:', err.message);
        });
      }
    }

    return Response.json({
      success: true,
      log_id: log.id,
      execution_status: log.execution_status
    });

  } catch (error) {
    console.error('[logAutomationExecution]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getActionForError(errorCode, moduleKey) {
  if (errorCode?.includes('twilio') || moduleKey === 'instant_lead_response' || moduleKey === 'missed_call_text_back') {
    return 'Reconnect Twilio in Admin Settings → Integration Health';
  }
  if (errorCode?.includes('resend') || moduleKey === 'lead_nurture' || moduleKey === 'daily_digest') {
    return 'Reconnect Resend in Admin Settings → Integration Health';
  }
  if (errorCode?.includes('ai') || moduleKey === 'ai_booking_agent') {
    return 'Verify AI provider configuration and API key';
  }
  if (errorCode === 'module_not_authorized') {
    return 'Upgrade PackageTier or activate this module in Deployment Manager';
  }
  return 'Check deployment configuration and retry';
}