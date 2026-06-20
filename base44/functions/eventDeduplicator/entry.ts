import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Event Deduplicator: Enforces strict deduplication rules
 * Prevents duplicate processing using provider IDs and composite keys
 * 
 * Runs on all incoming events to CommunicationEvent before downstream processing
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      communication_event_id,
      client_id,
      client_project_id,
      channel,
      event_type,
      provider_message_id,
      stripe_event_id,
      lead_id,
      provider,
    } = await req.json();

    const results = {
      is_duplicate: false,
      is_replay: false,
      canonical_event_id: communication_event_id,
      reason: 'new_event',
      dedup_key: null,
    };

    // Determine dedup key based on available identifiers
    let dedupKey = null;
    if (provider_message_id && provider === 'twilio') {
      dedupKey = `twilio_${provider_message_id}`;
    } else if (stripe_event_id) {
      dedupKey = `stripe_${stripe_event_id}`;
    } else if (lead_id && event_type) {
      // Composite key with 60-second window
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60000);
      dedupKey = `${lead_id}_${event_type}_${Math.floor(windowStart.getTime() / 1000)}`;
    }

    if (!dedupKey) {
      return Response.json({
        success: true,
        ...results,
        reason: 'no_dedup_key',
      });
    }

    results.dedup_key = dedupKey;

    // Check for existing dedup entry
    const existing = await base44.asServiceRole.entities.EventDedupLog.filter(
      { dedup_key: dedupKey, client_id, client_project_id },
      '-created_at',
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      const dedupEntry = existing[0];
      
      // Mark as duplicate
      results.is_duplicate = true;
      results.canonical_event_id = dedupEntry.canonical_event_id;
      results.reason = 'strict_duplicate_found';

      // Update dedup log with new duplicate
      const currentDupIds = dedupEntry.duplicate_event_ids || [];
      if (!currentDupIds.includes(communication_event_id)) {
        await base44.asServiceRole.entities.EventDedupLog.update(dedupEntry.id, {
          duplicate_event_ids: [...currentDupIds, communication_event_id],
          duplicate_count: (dedupEntry.duplicate_count || 0) + 1,
        }).catch(() => {});
      }

      // CRITICAL: Mark CommunicationEvent as excluded to prevent re-dispatch
      if (communication_event_id) {
        await base44.asServiceRole.entities.CommunicationEvent.update(communication_event_id, {
          dashboard_excluded: true,
          dashboard_exclusion_reason: `Duplicate of canonical event ${dedupEntry.canonical_event_id} (${dedupKey})`,
        }).catch(() => {});
      }

      // CRITICAL: Cancel any EventQueue items for this duplicate event
      const dupQueueItems = await base44.asServiceRole.entities.EventQueue.filter(
        { communication_event_id, status: { $in: ['queued', 'processing'] } },
        '-created_date',
        5
      ).catch(() => []);

      for (const qItem of dupQueueItems) {
        await base44.asServiceRole.entities.EventQueue.update(qItem.id, {
          status: 'ignored',
          error_message: `Ignored: duplicate event. Canonical: ${dedupEntry.canonical_event_id}`,
        }).catch(() => {});
      }

      // CRITICAL: Cancel any pending AutomationJobs for this duplicate
      const dupJobs = await base44.asServiceRole.entities.AutomationJob.filter(
        { communication_event_id, status: { $in: ['pending', 'processing'] } },
        '-created_date',
        5
      ).catch(() => []);

      for (const job of dupJobs) {
        await base44.asServiceRole.entities.AutomationJob.update(job.id, {
          status: 'cancelled',
          error_message: `Cancelled: duplicate event. Canonical: ${dedupEntry.canonical_event_id}`,
        }).catch(() => {});
      }

      console.log(`[eventDeduplicator] Duplicate detected and suppressed:`, {
        dedup_key: dedupKey,
        canonical: dedupEntry.canonical_event_id,
        duplicate: communication_event_id,
        queue_items_ignored: dupQueueItems.length,
        jobs_cancelled: dupJobs.length,
      });
    } else {
      // Create new dedup entry
      await base44.asServiceRole.entities.EventDedupLog.create({
        canonical_event_id: communication_event_id,
        client_id,
        client_project_id: client_project_id || null,
        dedup_key: dedupKey,
        dedup_type: 'strict_duplicate',
        event_type,
        channel,
        duplicate_count: 0,
        duplicate_event_ids: [],
        processing_state: 'processed',
        time_window_start: new Date().toISOString(),
        time_window_end: new Date(Date.now() + 60000).toISOString(),
      }).catch(() => {});

      console.log(`[eventDeduplicator] New canonical event tracked:`, {
        event_id: communication_event_id,
        dedup_key: dedupKey,
      });
    }

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[eventDeduplicator] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});