import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Event Collapser: Groups high-frequency repetitive events into single representatives
 * 
 * Collapses events within 10-minute windows:
 * - SMS received bursts
 * - Portal login repeated attempts
 * - Status update noise
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      client_id,
      client_project_id,
      event_type,
      channel,
      lead_id,
      phone_number,
    } = await req.json();

    const results = {
      collapsed: false,
      collapse_group_id: null,
      events_in_group: 0,
      reason: 'not_collapsible',
    };

    // Determine if event is collapsible
    const collapsibleTypes = ['sms_received', 'portal_login', 'status_update'];
    if (!collapsibleTypes.includes(event_type)) {
      return Response.json({ success: true, ...results });
    }

    // Generate collapse key for 10-minute window
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 600000);
    const collapseKeyTime = Math.floor(tenMinutesAgo.getTime() / 600000) * 600000;

    let collapseKey = null;
    if (event_type === 'sms_received' && phone_number) {
      collapseKey = `sms_burst_${phone_number}_${collapseKeyTime}`;
    } else if (event_type === 'portal_login' && client_id) {
      collapseKey = `portal_login_${client_id}_${collapseKeyTime}`;
    } else if (event_type === 'status_update') {
      collapseKey = `status_update_${client_project_id}_${collapseKeyTime}`;
    }

    if (!collapseKey) {
      return Response.json({ success: true, ...results });
    }

    // Find existing collapse group
    const existing = await base44.asServiceRole.entities.EventDedupLog.filter(
      {
        client_id,
        client_project_id,
        dedup_type: 'collapsed_group',
        event_type,
      },
      '-created_at',
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      const collapseGroup = existing[0];
      const timeWindowEnd = new Date(collapseGroup.time_window_end);

      // If still in collapse window, add to group
      if (now < timeWindowEnd) {
        if (!collapseGroup.duplicate_event_ids) {
          collapseGroup.duplicate_event_ids = [];
        }

        await base44.asServiceRole.entities.EventDedupLog.update(collapseGroup.id, {
          duplicate_event_ids: [...collapseGroup.duplicate_event_ids],
          duplicate_count: (collapseGroup.duplicate_count || 0) + 1,
          time_window_end: new Date(now.getTime() + 600000).toISOString(),
        }).catch(() => {});

        results.collapsed = true;
        results.collapse_group_id = collapseGroup.id;
        results.events_in_group = collapseGroup.duplicate_count + 1;
        results.reason = 'added_to_existing_group';

        console.log(`[eventCollapser] Event added to collapse group:`, {
          group_id: collapseGroup.id,
          event_type,
          count: results.events_in_group,
        });
      }
    } else {
      // Create new collapse group
      const newGroup = await base44.asServiceRole.entities.EventDedupLog.create({
        canonical_event_id: 'collapsed_representative', // Placeholder
        client_id,
        client_project_id: client_project_id || null,
        dedup_key: collapseKey,
        dedup_type: 'collapsed_group',
        event_type,
        channel,
        duplicate_count: 0,
        duplicate_event_ids: [],
        processing_state: 'collapsed',
        time_window_start: now.toISOString(),
        time_window_end: new Date(now.getTime() + 600000).toISOString(),
        metadata_json: JSON.stringify({
          collapse_key: collapseKey,
          sources: [{ type: event_type, count: 1 }],
        }),
      }).catch(() => null);

      if (newGroup) {
        results.collapsed = true;
        results.collapse_group_id = newGroup.id;
        results.events_in_group = 1;
        results.reason = 'created_new_group';

        console.log(`[eventCollapser] New collapse group created:`, {
          group_id: newGroup.id,
          collapse_key: collapseKey,
        });
      }
    }

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[eventCollapser] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});