import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'Missing client_id' }, { status: 400 });
    }

    // Fetch the Client
    const client = await base44.asServiceRole.entities.Client.get(client_id);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // 1. Create ClientProject
    const clientProject = await base44.asServiceRole.entities.ClientProject.create({
      client_id: client.id,
      client_email: client.email,
      contact_email: client.email,
      client_name: client.full_name,
      business_name: client.business_name,
      plan: 'Starter System',
      client_project_status: 'Onboarding Pending',
      support_priority: 'Normal',
      step_onboarding: 'in_progress',
    });

    // 2. Create OnboardingClient
    const onboardingClient = await base44.asServiceRole.entities.OnboardingClient.create({
      business_name: client.business_name,
      owner_name: client.full_name,
      email: client.email,
      phone: client.phone,
      website: client.website || '',
      industry: client.industry || '',
      tone_of_voice: client.brand_voice || 'Professional',
      client_id: client.id,
      client_project_id: clientProject.id,
      status: 'Onboarding',
      start_date: new Date().toISOString().split('T')[0],
    });

    // 3. Create ClientInstallationOS
    const installationOS = await base44.asServiceRole.entities.ClientInstallationOS.create({
      order_id: `onboarding-${client.id}-${Date.now()}`,
      client_id: client.id,
      client_email: client.email,
      business_name: client.business_name,
      workflow_stage: 'intake_received',
      activation_status: 'not_ready',
    });

    // 4. Update Client status to setup
    await base44.asServiceRole.entities.Client.update(client.id, {
      status: 'In Setup',
    });

    console.log(`[initializeClientOnboarding] Initialized for client ${client.id}:`, {
      client_project_id: clientProject.id,
      onboarding_client_id: onboardingClient.id,
      installation_os_id: installationOS.id,
    });

    return Response.json({
      success: true,
      client_project_id: clientProject.id,
      onboarding_client_id: onboardingClient.id,
      installation_os_id: installationOS.id,
    });
  } catch (error) {
    console.error('[initializeClientOnboarding] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});