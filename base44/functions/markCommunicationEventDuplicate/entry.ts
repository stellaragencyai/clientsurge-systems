import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * markCommunicationEventDuplicate — Mark events as collapsed duplicates
 * 
 * Instead of deleting, marks duplicate CommunicationEvents to prevent re-processing
 * while preserving audit trail. Used when duplicates are detected post-creation.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      canonical_event_id,
      duplicate_event_ids = [],
      reason = 'duplicate_detected',
    } = await req.json();

    if (!canonical_event_id || !duplicate_event_ids || duplicate_event_ids.length === 0) {
      return Response.json(
        { error: 'canonical_event_id and duplicate_event_ids required' },
        { status: 400 }
      );
    }

    let marked = 0;
    const results = [];

    for (const dupId of duplicate_event_ids) {
      try {
        // Mark as collapsed instead of deleting
        await base44.asServiceRole.entities.CommunicationEvent.update(dupId, {
          dashboard_excluded: true,
          dashboard_exclusion_reason: `Duplicate: collapsed into ${canonical_event_id}. ${reason}`,
          is_duplicate: true,
          canonical_event_id: canonical_event_id,
        });

        marked++;
        results.push({
          event_id: dupId,
          status: 'marked_duplicate',
        });

        console.log(`[markDuplicate] Event marked as collapsed duplicate:`, {
          duplicate: dupId,
          canonical: canonical_event_id,
        });
      } catch (error) {
        console.error(`[markDuplicate] Failed to mark ${dupId}:`, error.message);
        results.push({
          event_id: dupId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Create audit entry in EventDedupLog
    try {
      await base44.asServiceRole.entities.EventDedupLog.create({
        canonical_event_id: canonical_event_id,
        dedup_type: 'post_creation_collapse',
        duplicate_event_ids: duplicate_event_ids,
        duplicate_count: duplicate_event_ids.length,
        processing_state: 'marked_for_exclusion',
        dedup_key: `collapsed_${canonical_event_id}`,
      }).catch(() => {});
    } catch (e) {
      console.error('[markDuplicate] Failed to create audit entry:', e.message);
    }

    return Response.json({
      success: true,
      canonical_event_id,
      marked,
      total_duplicates: duplicate_event_ids.length,
      results,
    });
  } catch (error) {
    console.error('[markDuplicate] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});