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
    const { job_id } = body;

    if (!job_id) {
      return Response.json({ error: 'job_id is required' }, { status: 400 });
    }

    const job = await base44.asServiceRole.entities.MarketingPublishingJob.get(job_id);
    if (!job) return Response.json({ error: 'Publishing job not found' }, { status: 404 });

    // Only retry failed or retrying jobs
    if (!['failed', 'retrying'].includes(job.status)) {
      return Response.json({
        error: `Job status is '${job.status}'. Only failed or retrying jobs can be retried.`,
        blocked: true,
      }, { status: 400 });
    }

    // Get the post
    const post = await base44.asServiceRole.entities.MarketingPost.get(job.post_id);
    if (!post) {
      await base44.asServiceRole.entities.MarketingPublishingJob.update(job_id, {
        status: 'failed',
        failure_reason: 'MarketingPost no longer exists',
        last_attempt_at: new Date().toISOString(),
      });
      return Response.json({ error: 'MarketingPost not found', job_id }, { status: 404 });
    }

    const now = new Date().toISOString();
    const newAttemptCount = (job.attempt_count || 0) + 1;
    const MAX_ATTEMPTS = 5;

    if (newAttemptCount > MAX_ATTEMPTS) {
      await base44.asServiceRole.entities.MarketingPublishingJob.update(job_id, {
        status: 'failed',
        failure_reason: `Max retry attempts (${MAX_ATTEMPTS}) exceeded. Manual intervention required.`,
        last_attempt_at: now,
      });
      return Response.json({
        success: false,
        job_id,
        message: `Max retry attempts (${MAX_ATTEMPTS}) exceeded. Manual intervention required.`,
        attempt_count: newAttemptCount,
      });
    }

    // Check if the platform is ready for retry
    const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
      platform: job.platform,
    }, '-created_date', 1);
    const connection = connections?.[0];

    if (!connection || connection.connected_status !== 'connected' || connection.publish_capability_status !== 'ready_to_publish') {
      const blocker = !connection ? 'not_connected' : connection.publish_capability_status;
      await base44.asServiceRole.entities.MarketingPublishingJob.update(job_id, {
        status: 'failed',
        attempt_count: newAttemptCount,
        last_attempt_at: now,
        failure_reason: `Platform ${job.platform} not ready (status: ${blocker}). Retry blocked.`,
        retry_after: new Date(Date.now() + 3600000).toISOString(),
      });
      return Response.json({
        success: false,
        job_id,
        message: `Cannot retry — platform ${job.platform} is not ready (${blocker}). Fix the connection first.`,
        attempt_count: newAttemptCount,
        blocker,
      });
    }

    // Mark job as retrying
    await base44.asServiceRole.entities.MarketingPublishingJob.update(job_id, {
      status: 'in_progress',
      attempt_count: newAttemptCount,
      last_attempt_at: now,
    });

    // Reset post status
    await base44.asServiceRole.entities.MarketingPost.update(post.id, {
      publish_status: 'scheduled',
      error_message: null,
    });

    // Invoke the publisher
    const publisherMap = {
      linkedin: 'publishToLinkedIn',
      instagram_business: 'publishToInstagramBusiness',
      tiktok: 'publishToTikTok',
    };

    const publisherFunction = publisherMap[job.platform];
    if (!publisherFunction) {
      await base44.asServiceRole.entities.MarketingPublishingJob.update(job_id, {
        status: 'failed',
        failure_reason: `No publisher for platform ${job.platform}`,
        last_attempt_at: now,
      });
      return Response.json({
        success: false,
        job_id,
        message: `No publisher available for platform ${job.platform}`,
      });
    }

    try {
      const publishResult = await base44.asServiceRole.functions.invoke(publisherFunction, {
        post_id: post.id,
        job_id: job.id,
      });

      const published = publishResult.data || publishResult;

      await base44.asServiceRole.entities.MarketingPost.update(post.id, {
        publish_status: 'published',
        published_at: now,
        published_url: published.published_url || null,
        error_message: null,
      });

      await base44.asServiceRole.entities.MarketingPublishingJob.update(job_id, {
        status: 'completed',
        response_payload: JSON.stringify(published),
        published_url: published.published_url || null,
        failure_reason: null,
        retry_after: null,
      });

      return Response.json({
        success: true,
        job_id,
        post_id: post.id,
        status: 'completed',
        published_url: published.published_url,
        attempt_count: newAttemptCount,
      });
    } catch (publishError) {
      await base44.asServiceRole.entities.MarketingPost.update(post.id, {
        publish_status: 'failed',
        error_message: publishError.message,
      });

      await base44.asServiceRole.entities.MarketingPublishingJob.update(job_id, {
        status: newAttemptCount >= MAX_ATTEMPTS ? 'failed' : 'retrying',
        failure_reason: publishError.message,
        retry_after: new Date(Date.now() + 3600000).toISOString(),
      });

      return Response.json({
        success: false,
        job_id,
        post_id: post.id,
        status: 'failed',
        error: publishError.message,
        attempt_count: newAttemptCount,
        max_attempts_reached: newAttemptCount >= MAX_ATTEMPTS,
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});