import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Infer client lifecycle stage from ClientProject status and setup completion
 */
function inferLifecycleStage(clientProject) {
  if (!clientProject) return 'pending';
  
  const status = clientProject.client_project_status;
  const setupSteps = [
    clientProject.step_onboarding,
    clientProject.step_payment,
    clientProject.step_system_setup,
    clientProject.step_sms,
    clientProject.step_email,
    clientProject.step_booking,
    clientProject.step_followup,
    clientProject.step_live,
  ];
  
  const allSetupComplete = setupSteps.every(step => step === 'complete');
  
  if (status === 'Live' || (status === 'Monitoring' && allSetupComplete)) {
    return 'live';
  }
  if (status === 'QA In Progress' || status === 'Awaiting Client Approval') {
    return 'testing';
  }
  if (status === 'Setup In Progress' || status === 'Access Verified') {
    return 'setup_in_progress';
  }
  if (status === 'Paused' || status === 'Blocked') {
    return 'suspended';
  }
  
  return 'pending';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, action, target_stage, admin_email } = await req.json();

    if (!client_id || !action) {
      return Response.json({ error: 'Missing client_id or action' }, { status: 400 });
    }

    const client = await base44.asServiceRole.entities.Client.get(client_id);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    let updated = false;
    const updates = {};

    if (action === 'infer') {
      // Infer lifecycle stage from ClientProject
      const projects = await base44.asServiceRole.entities.ClientProject.filter(
        { client_id: client.id },
        '-created_date',
        1
      );
      
      const clientProject = projects.length > 0 ? projects[0] : null;
      const inferred = inferLifecycleStage(clientProject);
      
      // Only update if it changed and no override is active
      if (inferred !== client.lifecycle_stage && !client.lifecycle_stage_override) {
        updates.lifecycle_stage = inferred;
        updated = true;
      }
      
      return Response.json({
        success: true,
        current_stage: client.lifecycle_stage,
        inferred_stage: inferred,
        updated,
      });
    }

    if (action === 'override') {
      // Admin override of lifecycle stage
      if (!target_stage || !admin_email) {
        return Response.json({ error: 'Missing target_stage or admin_email' }, { status: 400 });
      }
      
      updates.lifecycle_stage_override = target_stage;
      updates.lifecycle_override_by = admin_email;
      updates.lifecycle_override_at = new Date().toISOString();
      updated = true;
    }

    if (action === 'clear_override') {
      // Clear admin override
      updates.lifecycle_stage_override = null;
      updates.lifecycle_override_by = null;
      updates.lifecycle_override_at = null;
      updated = true;
    }

    if (updated) {
      await base44.asServiceRole.entities.Client.update(client.id, updates);
      console.log(`[manageClientLifecycle] Updated client ${client.id}:`, updates);
    }

    return Response.json({
      success: true,
      client_id: client.id,
      lifecycle_stage: updates.lifecycle_stage || client.lifecycle_stage,
      action,
      updated,
    });
  } catch (error) {
    console.error('[manageClientLifecycle] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});