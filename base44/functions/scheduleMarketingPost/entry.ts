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

    const body = await req.json();
    const { post_id, scheduled_at } = body;

    if (!post_id || !scheduled_at) {
      return Response.json({ error: 'post_id and scheduled_at are required' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.MarketingPost.get(post_id);
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

    if (post.approval_status !== 'approved') {
      return Response.json({
        error: 'Post must be approved before scheduling. Use approveMarketingPost with action=approve first.',
        blocked: true,
        current_approval_status: post.approval_status,
      }, { status: 400 });
    }

    // Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return Response.json({ error: 'Invalid scheduled_at format. Use ISO 8601.' }, { status: 400 });
    }
    if (scheduledDate.getTime() <= Date.now()) {
      return Response.json({ error: 'scheduled_at must be in the future' }, { status: 400 });
    }

    // Check platform readiness
    const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
      platform: post.platform,
    }, '-created_date', 1);
    const connection = connections?.[0];

    const platformPublishers = {
      linkedin: 'publishToLinkedIn',
      instagram_business: 'publishToInstagramBusiness',
      tiktok: 'publishToTikTok',
    };

    const publisherExists = !!platformPublishers[post.platform];

    // Facebook ads are draft-only — no scheduling
    if (post.platform === 'facebook_ads') {
      return Response.json({
        error: 'Facebook Ads are draft-only. No scheduling or publishing available.',
        blocked: true,
        reason: 'facebook_ads_draft_only',
      }, { status: 400 });
    }

    if (!publisherExists) {
      return Response.json({
        error: `No publisher available for platform: ${post.platform}`,
        blocked: true,
      }, { status: 400 });
    }

    // Check connection readiness
    let schedulingWarning = null;
    if (!connection || connection.connected_status !== 'connected') {
      schedulingWarning = `Platform ${post.platform} is not connected. Post will be scheduled but publishing will fail until the connection is established.`;
    } else if (connection.publish_capability_status !== 'ready_to_publish') {
      schedulingWarning = `Platform ${post.platform} is connected but not ready to publish (status: ${connection.publish_capability_status}). Publishing will fail until resolved.`;
    }

    // TikTok special case
    if (post.platform === 'tiktok') {
      schedulingWarning = 'TikTok publishing is blocked: Base44 connector is read-only. A custom TikTok Developer App with Content Posting API is required. Post is scheduled but will fail to publish.';
    }

    // Instagram media check
    if (post.platform === 'instagram_business' && !post.asset_url) {
      schedulingWarning = 'Instagram publishing requires an image or video asset_url. Post is scheduled but will fail to publish without media.';
    }

    await base44.asServiceRole.entities.MarketingPost.update(post_id, {
      scheduled_at: scheduledDate.toISOString(),
      publish_status: 'scheduled',
    });

    return Response.json({
      success: true,
      post_id,
      scheduled_at: scheduledDate.toISOString(),
      platform: post.platform,
      publisher_function: platformPublishers[post.platform],
      warning: schedulingWarning,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});