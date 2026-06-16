import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Get comprehensive SaaS workflow orchestration status across all clients
 * Shows: Order → Client → ClientProject → Subscription → ClientInstallationOS linkage
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch Orders (root of orchestration workflow)
    let orders;
    if (clientId) {
      orders = await base44.asServiceRole.entities.Order.filter(
        { client_id: clientId },
        '-created_date',
        limit
      );
    } else {
      orders = await base44.asServiceRole.entities.Order.list('-created_date', limit);
    }

    const orchestrationStatus = [];

    for (const order of orders) {
      // Skip incomplete orders
      if (order.payment_status !== 'paid') continue;

      const status = {
        order_id: order.id,
        order_status: order.order_status,
        payment_status: order.payment_status,
        pipeline_status: order.pipeline_status,
        customer: {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          business_name: order.business_name,
        },
        linked_entities: {},
        workflow_completion: 0,
      };

      // Check Client
      if (order.client_id) {
        const client = await base44.asServiceRole.entities.Client.get(order.client_id);
        if (client) {
          status.linked_entities.client = {
            id: client.id,
            lifecycle_stage: client.lifecycle_stage,
            is_override: !!client.lifecycle_stage_override,
            onboarding_started_at: client.onboarding_started_at,
            setup_completed_at: client.setup_completed_at,
            went_live_at: client.went_live_at,
          };
          status.workflow_completion += 20;
        }
      }

      // Check ClientProject
      if (order.client_project_id) {
        const project = await base44.asServiceRole.entities.ClientProject.get(order.client_project_id);
        if (project) {
          const setupSteps = [
            project.step_onboarding,
            project.step_payment,
            project.step_system_setup,
            project.step_sms,
            project.step_email,
            project.step_booking,
            project.step_followup,
            project.step_live,
          ];
          const completedSteps = setupSteps.filter(s => s === 'complete').length;

          status.linked_entities.client_project = {
            id: project.id,
            status: project.client_project_status,
            setup_completion_percent: Math.round((completedSteps / setupSteps.length) * 100),
            setup_steps_completed: completedSteps,
          };
          status.workflow_completion += 20;
        }
      }

      // Check Subscription
      if (order.subscription_id) {
        const subscription = await base44.asServiceRole.entities.Subscription.get(order.subscription_id);
        if (subscription) {
          status.linked_entities.subscription = {
            id: subscription.id,
            status: subscription.status,
            plan_type: subscription.plan_type,
            current_period_end: subscription.current_period_end,
          };
          status.workflow_completion += 20;
        }
      }

      // Check ClientInstallationOS
      if (order.client_id) {
        const installations = await base44.asServiceRole.entities.ClientInstallationOS.filter(
          { client_id: order.client_id },
          '-created_date',
          1
        );
        if (installations.length > 0) {
          const installation = installations[0];
          status.linked_entities.installation_os = {
            id: installation.id,
            workflow_stage: installation.workflow_stage,
            activation_status: installation.activation_status,
            activation_eligible: installation.activation_eligible,
          };
          status.workflow_completion += 20;
        }
      }

      // Check OnboardingClient
      if (order.client_id) {
        const onboardings = await base44.asServiceRole.entities.OnboardingClient.filter(
          { client_id: order.client_id },
          '-created_date',
          1
        );
        if (onboardings.length > 0) {
          const onboarding = onboardings[0];
          status.linked_entities.onboarding_client = {
            id: onboarding.id,
            status: onboarding.status,
            completion_steps: [
              onboarding.step_twilio,
              onboarding.step_lead_sources,
              onboarding.step_instant_response,
              onboarding.step_followup_sequence,
              onboarding.step_missed_call,
              onboarding.step_messages_customized,
              onboarding.step_tested,
              onboarding.step_dashboard,
              onboarding.step_live,
            ].filter(Boolean).length,
          };
        }
      }

      status.workflow_status = status.workflow_completion >= 80 ? 'complete' : status.workflow_completion >= 40 ? 'in_progress' : 'not_started';

      orchestrationStatus.push(status);
    }

    return Response.json({
      success: true,
      count: orchestrationStatus.length,
      orchestration_status: orchestrationStatus,
    });
  } catch (error) {
    console.error('[getWorkflowOrchestrationStatus] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});