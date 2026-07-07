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
    const { post_id, action, required_changes, edited_text, scheduled_at } = body;

    if (!post_id || !action) {
      return Response.json({ error: 'post_id and action are required' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.MarketingPost.get(post_id);
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

    const now = new Date().toISOString();

    if (action === 'approve') {
      await base44.asServiceRole.entities.MarketingPost.update(post_id, {
        approval_status: 'approved',
        final_text: edited_text || post.draft_text,
        scheduled_at: scheduled_at || null,
        publish_status: scheduled_at ? 'scheduled' : 'not_scheduled',
      });

      await base44.asServiceRole.entities.MarketingApprovalQueue.updateMany(
        { post_id, status: 'pending' },
        { $set: { status: 'approved', reviewer: user.email, approved_at: now } }
      );

      return Response.json({ success: true, message: 'Post approved', post_id });
    }

    if (action === 'reject') {
      await base44.asServiceRole.entities.MarketingPost.update(post_id, {
        approval_status: 'rejected',
      });

      await base44.asServiceRole.entities.MarketingApprovalQueue.updateMany(
        { post_id, status: 'pending' },
        { $set: { status: 'rejected', reviewer: user.email, rejected_reason: required_changes || 'Rejected' } }
      );

      return Response.json({ success: true, message: 'Post rejected', post_id });
    }

    if (action === 'request_changes') {
      await base44.asServiceRole.entities.MarketingPost.update(post_id, {
        approval_status: 'changes_requested',
      });

      await base44.asServiceRole.entities.MarketingApprovalQueue.updateMany(
        { post_id, status: 'pending' },
        { $set: { status: 'changes_requested', reviewer: user.email, required_changes } }
      );

      return Response.json({ success: true, message: 'Changes requested', post_id });
    }

    if (action === 'schedule') {
      if (!scheduled_at) return Response.json({ error: 'scheduled_at is required for schedule action' }, { status: 400 });
      await base44.asServiceRole.entities.MarketingPost.update(post_id, {
        approval_status: 'approved',
        final_text: edited_text || post.draft_text,
        scheduled_at,
        publish_status: 'scheduled',
      });

      await base44.asServiceRole.entities.MarketingApprovalQueue.updateMany(
        { post_id, status: 'pending' },
        { $set: { status: 'approved', reviewer: user.email, approved_at: now } }
      );

      return Response.json({ success: true, message: 'Post scheduled', post_id });
    }

    return Response.json({ error: 'Invalid action. Use: approve, reject, request_changes, or schedule' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});