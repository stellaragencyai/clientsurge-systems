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

    const now = new Date().toISOString();

    // Find approved posts scheduled for now or earlier that haven't been published
    const duePosts = await base44.asServiceRole.entities.MarketingPost.filter({
      approval_status: 'approved',
      publish_status: 'scheduled',
      scheduled_at: { $lte: now },
    }, 'scheduled_at', 50);

    const results = [];

    for (const post of duePosts) {
      // Create a publishing job
      const job = await base44.asServiceRole.entities.MarketingPublishingJob.create({
        post_id: post.id,
        platform: post.platform,
        scheduled_at: post.scheduled_at,
        status: 'queued',
        attempt_count: 0,
      });

      // Check connection status for this platform
      const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
        platform: post.platform,
        connected_status: 'connected',
      }, '-created_date', 1);

      const connection = connections?.[0];

      if (!connection || connection.publish_capability_status !== 'ready_to_publish') {
        await base44.asServiceRole.entities.MarketingPublishingJob.update(job.id, {
          status: 'failed',
          failure_reason: `Platform ${post.platform} not ready to publish (status: ${connection?.publish_capability_status || 'not_connected'})`,
          last_attempt_at: now,
          attempt_count: 1,
        });
        results.push({ post_id: post.id, status: 'failed', reason: 'Platform not connected or not ready' });
        continue;
      }

      // Invoke the platform-specific publisher
      const publisherMap = {
        linkedin: 'publishToLinkedIn',
        instagram_business: 'publishToInstagramBusiness',
        tiktok: 'publishToTikTok',
      };

      const publisherFunction = publisherMap[post.platform];
      if (!publisherFunction) {
        await base44.asServiceRole.entities.MarketingPublishingJob.update(job.id, {
          status: 'failed',
          failure_reason: `No publisher for platform ${post.platform}`,
          last_attempt_at: now,
          attempt_count: 1,
        });
        results.push({ post_id: post.id, status: 'failed', reason: 'No publisher available' });
        continue;
      }

      try {
        await base44.asServiceRole.entities.MarketingPublishingJob.update(job.id, {
          status: 'in_progress',
          last_attempt_at: now,
          attempt_count: 1,
        });

        const publishResult = await base44.asServiceRole.functions.invoke(publisherFunction, {
          post_id: post.id,
          job_id: job.id,
        });

        const published = publishResult.data || publishResult;
        await base44.asServiceRole.entities.MarketingPost.update(post.id, {
          publish_status: 'published',
          published_at: now,
          published_url: published.published_url || null,
        });

        await base44.asServiceRole.entities.MarketingPublishingJob.update(job.id, {
          status: 'completed',
          response_payload: JSON.stringify(published),
          published_url: published.published_url || null,
        });

        results.push({ post_id: post.id, status: 'published', published_url: published.published_url });
      } catch (publishError) {
        await base44.asServiceRole.entities.MarketingPost.update(post.id, {
          publish_status: 'failed',
          error_message: publishError.message,
        });

        await base44.asServiceRole.entities.MarketingPublishingJob.update(job.id, {
          status: 'failed',
          failure_reason: publishError.message,
          retry_after: new Date(Date.now() + 3600000).toISOString(), // retry in 1 hour
        });

        results.push({ post_id: post.id, status: 'failed', error: publishError.message });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});