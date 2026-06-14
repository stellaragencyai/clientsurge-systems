import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Get commercial dashboard view: client lifecycle stage and onboarding progress
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch all clients or single client
    let clients;
    if (clientId) {
      const client = await base44.asServiceRole.entities.Client.get(clientId);
      clients = client ? [client] : [];
    } else {
      clients = await base44.asServiceRole.entities.Client.list('-created_date', limit);
    }

    const dashboard = [];

    for (const client of clients) {
      // Fetch ClientProject
      const projects = await base44.asServiceRole.entities.ClientProject.filter(
        { client_id: client.id },
        '-created_date',
        1
      );
      const clientProject = projects.length > 0 ? projects[0] : null;

      // Fetch OnboardingClient
      const onboardings = await base44.asServiceRole.entities.OnboardingClient.filter(
        { client_id: client.id },
        '-created_date',
        1
      );
      const onboarding = onboardings.length > 0 ? onboardings[0] : null;

      // Fetch ClientInstallationOS
      const installations = await base44.asServiceRole.entities.ClientInstallationOS.filter(
        { client_id: client.id },
        '-created_date',
        1
      );
      const installation = installations.length > 0 ? installations[0] : null;

      // Calculate completion percentage
      const setupSteps = [
        clientProject?.step_onboarding || 'pending',
        clientProject?.step_payment || 'pending',
        clientProject?.step_system_setup || 'pending',
        clientProject?.step_sms || 'pending',
        clientProject?.step_email || 'pending',
        clientProject?.step_booking || 'pending',
        clientProject?.step_followup || 'pending',
        clientProject?.step_live || 'pending',
      ];
      const completedSteps = setupSteps.filter(s => s === 'complete').length;
      const completionPercent = Math.round((completedSteps / setupSteps.length) * 100);

      dashboard.push({
        client_id: client.id,
        business_name: client.business_name,
        email: client.email,
        lifecycle_stage: client.lifecycle_stage_override || client.lifecycle_stage,
        is_override: !!client.lifecycle_stage_override,
        override_by: client.lifecycle_override_by,
        override_at: client.lifecycle_override_at,
        project_status: clientProject?.client_project_status || 'Not Started',
        setup_completion_percent: completionPercent,
        setup_steps_completed: completedSteps,
        setup_steps_total: setupSteps.length,
        onboarding_started_at: client.onboarding_started_at,
        setup_completed_at: client.setup_completed_at,
        testing_started_at: client.testing_started_at,
        testing_completed_at: client.testing_completed_at,
        went_live_at: client.went_live_at,
        workflow_stage: installation?.workflow_stage || 'Not Started',
        activation_status: installation?.activation_status || 'Not Started',
        onboarding_status: onboarding?.status || 'Not Started',
        notes: client.notes || '',
      });
    }

    return Response.json({
      success: true,
      count: dashboard.length,
      dashboard,
    });
  } catch (error) {
    console.error('[getClientLifecycleDashboard] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});