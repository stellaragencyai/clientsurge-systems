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
    if (post.platform !== 'linkedin') return Response.json({ error: 'Post is not for LinkedIn' }, { status: 400 });

    // Get LinkedIn OAuth connection
    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection('linkedin');
    } catch (e) {
      return Response.json({ error: 'LinkedIn not connected. Run the integration setup wizard first.', blocked: true }, { status: 403 });
    }

    const accessToken = connection.accessToken;
    if (!accessToken) {
      return Response.json({ error: 'LinkedIn access token not available', blocked: true }, { status: 403 });
    }

    // Get organization URN from SocialChannelConnection
    const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
      platform: 'linkedin',
      connected_status: 'connected',
    }, '-created_date', 1);
    const linkedinConn = connections?.[0];

    if (!linkedinConn || !linkedinConn.organization_id) {
      return Response.json({ error: 'LinkedIn organization ID not configured. Complete setup wizard first.', blocked: true }, { status: 403 });
    }

    const orgUrn = linkedinConn.organization_id;
    const text = post.final_text || post.draft_text;

    // Post to LinkedIn company page
    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify({
        author: orgUrn,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn API error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const postId = response.headers.get('x-restli-id') || result.id || `linkedin_${Date.now()}`;
    const publishedUrl = `https://www.linkedin.com/feed/update/${postId}/`;

    return Response.json({
      success: true,
      published_url: publishedUrl,
      provider_post_id: postId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});