import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Orchestration Controller: Deterministic execution of workflows
 * 
 * Enforces:
 * 1. Single-active-workflow guarantee per resource
 * 2. Deterministic execution order (billing → provisioning → onboarding → automation → messaging)
 * 3. Idempotency key deduplication
 * 4. State transition tracking
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { resource_type, resource_id, client_id, client_project_id, workflow_type, triggering_idempotency_key } = await req.json();

    // Validate required fields
    if (!resource_type || !resource_id || !client_id || !workflow_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const results = {
      workflow_initiated: false,
      workflow_id: null,
      reason: '',
      existing_workflow_id: null,
    };

    // Check for active workflow on this resource (single-active-workflow guarantee)
    const activeWorkflows = await base44.asServiceRole.entities.OrchestrationWorkflow.filter(
      {
        resource_type,
        resource_id,
        client_id,
        status: { $in: ['initiated', 'in_progress'] },
      },
      '-created_date',
      1
    ).catch(() => []);

    if (activeWorkflows?.length > 0) {
      const existingWorkflow = activeWorkflows[0];
      
      // Attach idempotency key to existing workflow if provided
      if (triggering_idempotency_key && existingWorkflow.linked_idempotency_keys) {
        if (!existingWorkflow.linked_idempotency_keys.includes(triggering_idempotency_key)) {
          await base44.asServiceRole.entities.OrchestrationWorkflow.update(existingWorkflow.id, {
            linked_idempotency_keys: [
              ...existingWorkflow.linked_idempotency_keys,
              triggering_idempotency_key,
            ],
          });
        }
      }

      results.reason = 'active_workflow_exists';
      results.existing_workflow_id = existingWorkflow.id;
      console.log(`[orchestrationController] Workflow already active for ${resource_type}:${resource_id}`, {
        existing_workflow_id: existingWorkflow.id,
      });

      return Response.json({
        success: true,
        ...results,
      });
    }

    // Create new workflow with deterministic execution order
    const executionOrder = getExecutionOrder(workflow_type);
    const workflow = await base44.asServiceRole.entities.OrchestrationWorkflow.create({
      resource_type,
      resource_id,
      client_id,
      client_project_id: client_project_id || null,
      workflow_type,
      status: 'initiated',
      current_stage: 'billing_validation',
      execution_order: executionOrder,
      linked_idempotency_keys: triggering_idempotency_key ? [triggering_idempotency_key] : [],
      started_at: new Date().toISOString(),
    });

    results.workflow_initiated = true;
    results.workflow_id = workflow.id;

    console.log(`[orchestrationController] Workflow initiated`, {
      workflow_id: workflow.id,
      workflow_type,
      resource: `${resource_type}:${resource_id}`,
    });

    // Dispatch to orchestration processor
    const processResult = await base44.asServiceRole.functions.invoke('workflowOrchestrator', {
      workflow_id: workflow.id,
      resource_type,
      resource_id,
      client_id,
      client_project_id,
      workflow_type,
    });

    if (!processResult.data?.success) {
      await base44.asServiceRole.entities.OrchestrationWorkflow.update(workflow.id, {
        status: 'failed',
        error_message: processResult.data?.error || 'Orchestration failed',
      });
    }

    return Response.json({
      success: true,
      ...results,
      orchestration_result: processResult.data,
    });
  } catch (error) {
    console.error('[orchestrationController] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Deterministic execution order for workflow stages
 */
function getExecutionOrder(workflowType) {
  const baseOrder = [
    { stage_index: 1, processor_type: 'billing_processor', status: 'pending' },
    { stage_index: 2, processor_type: 'client_provisioning', status: 'pending' },
    { stage_index: 3, processor_type: 'onboarding_processor', status: 'pending' },
    { stage_index: 4, processor_type: 'automation_processor', status: 'pending' },
    { stage_index: 5, processor_type: 'messaging_processor', status: 'pending' },
  ];

  // Customize for specific workflow types if needed
  if (workflowType === 'client_lifecycle') {
    return baseOrder.filter(s => s.processor_type !== 'billing_processor');
  }

  return baseOrder;
}