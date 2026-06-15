import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Workflow Orchestrator: Executes workflow stages in deterministic order
 * Ensures each stage completes before next stage starts
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { workflow_id, resource_type, resource_id, client_id, client_project_id, workflow_type } = await req.json();

    const workflow = await base44.asServiceRole.entities.OrchestrationWorkflow.get(workflow_id);
    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const results = {
      workflow_id,
      stages_executed: 0,
      stages_failed: 0,
      execution_log: [],
    };

    // Execute stages in order
    for (const stage of workflow.execution_order) {
      try {
        // Update stage status
        await updateWorkflowStage(base44, workflow_id, stage.stage_index, 'executing');

        // Invoke processor
        const processorResult = await invokeStageProcessor(
          base44,
          stage.processor_type,
          workflow_id,
          resource_type,
          resource_id,
          client_id,
          client_project_id
        );

        if (processorResult.success) {
          await updateWorkflowStage(base44, workflow_id, stage.stage_index, 'completed');
          results.stages_executed++;
          results.execution_log.push({
            stage: stage.processor_type,
            status: 'completed',
            timestamp: new Date().toISOString(),
          });
        } else {
          throw new Error(processorResult.error || 'Stage execution failed');
        }
      } catch (stageError) {
        results.stages_failed++;
        results.execution_log.push({
          stage: stage.processor_type,
          status: 'failed',
          error: stageError.message,
          timestamp: new Date().toISOString(),
        });

        // Stop execution on first failure
        await base44.asServiceRole.entities.OrchestrationWorkflow.update(workflow_id, {
          status: 'failed',
          error_message: `Stage ${stage.processor_type} failed: ${stageError.message}`,
        });

        return Response.json({
          success: false,
          error: stageError.message,
          ...results,
        });
      }
    }

    // All stages completed
    await base44.asServiceRole.entities.OrchestrationWorkflow.update(workflow_id, {
      status: 'completed',
      current_stage: 'completed',
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[workflowOrchestrator] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function updateWorkflowStage(base44, workflowId, stageIndex, status) {
  const workflow = await base44.asServiceRole.entities.OrchestrationWorkflow.get(workflowId);
  const updatedOrder = workflow.execution_order.map(s =>
    s.stage_index === stageIndex
      ? { ...s, status, executed_at: status === 'completed' ? new Date().toISOString() : null }
      : s
  );

  await base44.asServiceRole.entities.OrchestrationWorkflow.update(workflowId, {
    execution_order: updatedOrder,
  });
}

async function invokeStageProcessor(base44, processorType, workflowId, resourceType, resourceId, clientId, clientProjectId) {
  try {
    const result = await base44.asServiceRole.functions.invoke(processorType, {
      workflow_id: workflowId,
      resource_type: resourceType,
      resource_id: resourceId,
      client_id: clientId,
      client_project_id: clientProjectId,
    });

    return {
      success: result.data?.success !== false,
      error: result.data?.error || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}