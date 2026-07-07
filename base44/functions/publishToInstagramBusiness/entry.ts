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
    if (post.platform !== 'instagram_business') return Response.json({ error: 'Post is not for Instagram' }, { status: 400 });

    // Get Instagram connection
    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection('instagram');
    } catch (e) {
      return Response.json({ error: 'Instagram not connected. Run the integration setup wizard first.', blocked: true }, { status: 403 });
    }

    const accessToken = connection.accessToken;
    if (!accessToken) {
      return Response.json({ error: 'Instagram access token not available', blocked: true }, { status: 403 });
    }

    // Instagram requires media — image or video
    if (!post.asset_url) {
      return Response.json({
        error: 'Instagram publishing requires an image or video asset_url. No media exists for this post.',
        blocked: true,
        reason: 'blocked_no_media',
      }, { status: 400 });
    }

    // Get Instagram business account ID
    const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
      platform: 'instagram_business',
      connected_status: 'connected',
    }, '-created_date', 1);
    const igConn = connections?.[0];

    if (!igConn || !igConn.account_id) {
      return Response.json({ error: 'Instagram business account ID not configured. Complete setup wizard first.', blocked: true }, { status: 403 });
    }

    const igUserId = igConn.account_id;
    const caption = (post.final_text || post.draft_text) + '\n\n' + (post.hashtags || []).map(h => `#${h}`).join(' ');

    // Step 1: Create media container
    const mediaType = post.post_type === 'video' || post.post_type === 'reel' ? 'REELS' : 'IMAGE';

    const createResponse = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: accessToken,
        image_url: mediaType === 'IMAGE' ? post.asset_url : undefined,
        video_url: mediaType === 'REELS' ? post.asset_url : undefined,
        media_type: mediaType,
        caption: caption,
      }).toString(),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Instagram container creation failed ${createResponse.status}: ${errorText}`);
    }

    const container = await createResponse.json();
    const creationId = container.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: accessToken,
        creation_id: creationId,
      }).toString(),
    });

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      throw new Error(`Instagram publish failed ${publishResponse.status}: ${errorText}`);
    }

    const result = await publishResponse.json();
    const publishedUrl = `https://www.instagram.com/p/${result.id}/`;

    return Response.json({
      success: true,
      published_url: publishedUrl,
      provider_post_id: result.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});