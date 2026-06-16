import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Automatically trigger onboarding workflows when client enters setup_in_progress
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'Missing client_id' }, { status: 400 });
    }

    const client = await base44.asServiceRole.entities.Client.get(client_id);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Determine effective lifecycle stage (override takes precedence)
    const effectiveStage = client.lifecycle_stage_override || client.lifecycle_stage;

    if (effectiveStage !== 'setup_in_progress') {
      return Response.json({
        success: true,
        message: `Client not in setup_in_progress stage (current: ${effectiveStage})`,
        skipped: true,
      });
    }

    // Fetch or create ClientInstallationOS
    const osRecords = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { client_id: client.id },
      '-created_date',
      1
    );

    let installationOS;
    if (osRecords.length > 0) {
      installationOS = osRecords[0];
    } else {
      // Create new if missing
      installationOS = await base44.asServiceRole.entities.ClientInstallationOS.create({
        order_id: `setup-${client.id}-${Date.now()}`,
        client_id: client.id,
        client_email: client.email,
        business_name: client.business_name,
        workflow_stage: 'intake_received',
        activation_status: 'not_ready',
      });
    }

    // Initialize setup steps if not already started
    const needsUpdate = installationOS.workflow_stage === 'intake_received';
    
    if (needsUpdate) {
      await base44.asServiceRole.entities.ClientInstallationOS.update(installationOS.id, {
        workflow_stage: 'automation_setup',
        admin_notes: `[${new Date().toISOString()}] Onboarding orchestrator initialized setup steps`,
      });

      console.log(`[orchestrateClientOnboarding] Initialized setup for client ${client.id}`, {
        installation_os_id: installationOS.id,
        workflow_stage: 'automation_setup',
      });

      return Response.json({
        success: true,
        client_id: client.id,
        installation_os_id: installationOS.id,
        workflow_stage: 'automation_setup',
        setup_initialized: true,
      });
    }

    return Response.json({
      success: true,
      client_id: client.id,
      installation_os_id: installationOS.id,
      workflow_stage: installationOS.workflow_stage,
      setup_already_in_progress: true,
    });
  } catch (error) {
    console.error('[orchestrateClientOnboarding] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});