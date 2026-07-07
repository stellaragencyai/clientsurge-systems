import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Set all channels to approval_required autopilot
    await base44.asServiceRole.entities.SocialChannelConnection.updateMany(
      {},
      { $set: { autopilot_mode: 'approval_required' } }
    );

    // Cancel all scheduled posts
    await base44.asServiceRole.entities.MarketingPost.updateMany(
      { publish_status: 'scheduled' },
      { $set: { publish_status: 'cancelled' } }
    );

    // Cancel all queued publishing jobs
    await base44.asServiceRole.entities.MarketingPublishingJob.updateMany(
      { status: { $in: ['queued', 'retrying'] } },
      { $set: { status: 'cancelled' } }
    );

    // Pause all active campaigns
    await base44.asServiceRole.entities.MarketingCampaign.updateMany(
      { status: 'active' },
      { $set: { status: 'paused' } }
    );

    return Response.json({
      success: true,
      message: 'All marketing automation paused. Scheduled posts cancelled. Campaigns paused. Autopilot reset to approval_required.',
      paused_at: new Date().toISOString(),
      paused_by: user.email,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});