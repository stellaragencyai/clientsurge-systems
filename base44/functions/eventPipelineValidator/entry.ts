import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Event Pipeline Validator: Marks events with failure states + processing states
 * Enables full auditability of failed events without deletion
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      communication_event_id,
      client_id,
      client_project_id,
      event_type,
      channel,
      processing_status,
      error_details,
    } = await req.json();

    const results = {
      event_validated: false,
      processing_state: 'processed',
      reason: '',
    };

    // Determine processing state
    if (error_details) {
      let failureReason = 'processing_failed';
      if (error_details.includes('retry')) failureReason = 'retry_exhausted';
      if (error_details.includes('provider')) failureReason = 'provider_error';
      if (error_details.includes('validation')) failureReason = 'validation_error';

      // Create failed event record
      await base44.asServiceRole.entities.EventDedupLog.create({
        canonical_event_id: communication_event_id,
        client_id,
        client_project_id: client_project_id || null,
        dedup_key: `failed_${communication_event_id}`,
        dedup_type: 'failed',
        event_type,
        channel,
        status: 'failed',
        processing_state: 'failed',
        failure_reason: failureReason,
        failure_details: error_details,
      }).catch(() => {});

      results.processing_state = 'failed';
      results.reason = failureReason;
      console.log(`[eventPipelineValidator] Event marked as failed:`, {
        event_id: communication_event_id,
        reason: failureReason,
        details: error_details,
      });
    } else {
      results.processing_state = 'processed';
      results.reason = 'successful_processing';
    }

    results.event_validated = true;

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[eventPipelineValidator] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});