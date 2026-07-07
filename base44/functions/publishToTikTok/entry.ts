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
    const { post_id } = body;

    if (!post_id) return Response.json({ error: 'post_id is required' }, { status: 400 });

    const post = await base44.asServiceRole.entities.MarketingPost.get(post_id);
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
    if (post.platform !== 'tiktok') return Response.json({ error: 'Post is not for TikTok' }, { status: 400 });

    // Check for video asset
    if (!post.asset_url) {
      return Response.json({
        error: 'TikTok publishing requires a hosted video asset_url. No video asset exists for this post.',
        blocked: true,
        reason: 'blocked_no_media',
      }, { status: 400 });
    }

    // Get TikTok connection
    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection('tiktok');
    } catch (e) {
      return Response.json({ error: 'TikTok not connected. Run the integration setup wizard first.', blocked: true }, { status: 403 });
    }

    const accessToken = connection.accessToken;
    if (!accessToken) {
      return Response.json({ error: 'TikTok access token not available', blocked: true }, { status: 403 });
    }

    // Check TikTok connection record for audit status
    const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
      platform: 'tiktok',
      connected_status: 'connected',
    }, '-created_date', 1);
    const tiktokConn = connections?.[0];

    if (tiktokConn && (tiktokConn.connected_status === 'audit_required' || tiktokConn.connected_status === 'private_mode')) {
      return Response.json({
        error: 'TikTok app audit required. Only private/test posting is available until TikTok approves the app.',
        blocked: true,
        reason: 'blocked_audit_required',
      }, { status: 403 });
    }

    // NOTE: Base44's TikTok connector is read-only (profile/stats).
    // Actual video publishing requires TikTok Content Posting API with a custom developer app.
    // This is a placeholder that clearly blocks until proper API access is configured.

    return Response.json({
      error: 'TikTok video publishing is not yet available. The Base44 TikTok connector is read-only. A custom TikTok Developer App with Content Posting API access is required.',
      blocked: true,
      reason: 'tiktok_publishing_not_implemented',
      setup_required: 'Create a TikTok for Developers app, add Content Posting API product, and configure OAuth credentials as secrets.',
    }, { status: 501 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});