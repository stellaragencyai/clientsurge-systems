import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * One-time migration: normalize CRM stages from verbose to simplified enum
 * Run once to update all leads to new stage format
 */

const STAGE_MAP = {
  'Not Contacted': 'new',
  'Contacted': 'contacted',
  'Opened / Clicked': 'engaged',
  'Replied': 'engaged',
  'Audit Booked': 'booking_sent',
  'Audit Completed': 'booked',
  'Proposal Sent': 'qualified',
  'Won Pending Payment': 'won',
  'Won': 'won',
  'Lost': 'lost',
  'Follow Up Later': 'paused',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch (e) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    // Fetch all leads in batches
    let skip = 0;
    const batchSize = 100;

    while (true) {
      const leads = await base44.asServiceRole.entities.Leads.list('-created_date', batchSize, skip);
      if (!leads || leads.length === 0) break;

      for (const lead of leads) {
        try {
          const oldStage = lead.crm_stage;
          const newStage = STAGE_MAP[oldStage] || 'new';

          if (oldStage === newStage) {
            skipped++;
            continue;
          }

          await base44.asServiceRole.entities.Leads.update(lead.id, {
            crm_stage: newStage,
          });

          processed++;
        } catch (err) {
          console.error(`Failed to migrate lead ${lead.id}:`, err.message);
          failed++;
        }
      }

      skip += batchSize;
    }

    return Response.json({
      success: true,
      message: 'CRM stage migration complete',
      processed,
      skipped,
      failed,
    });
  } catch (error) {
    console.error('migrateCrmStages error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});