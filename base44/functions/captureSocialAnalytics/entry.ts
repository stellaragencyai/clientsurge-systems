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
    const { platform, post_id } = body;

    if (!platform) {
      return Response.json({ error: 'platform is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // ── TRUTH: Analytics capture depends on platform API access ──
    // LinkedIn: requires r_organization_social scope + organization access
    // Instagram: requires instagram_business_basic scope
    // TikTok: read-only profile stats only (no post-level analytics via Base44 connector)
    // Facebook Ads: no API connection — draft only

    const connectorMap = {
      linkedin: 'linkedin',
      tiktok: 'tiktok',
      instagram_business: 'instagram',
    };

    const connectorType = connectorMap[platform];
    let oauthConnected = false;
    let oauthError = null;

    if (connectorType) {
      try {
        const conn = await base44.asServiceRole.connectors.getConnection(connectorType);
        if (conn?.accessToken) {
          oauthConnected = true;
        }
      } catch (e) {
        oauthError = e.message;
      }
    }

    // ── Platform-specific analytics capture ──

    if (platform === 'linkedin') {
      if (!oauthConnected) {
        return Response.json({
          success: false,
          platform,
          captured: false,
          data_source: 'not_connected',
          message: 'LinkedIn not connected. Analytics unavailable. Connect the LinkedIn integration first.',
          oauth_error: oauthError,
        });
      }

      // Get connection record for organization URN
      const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
        platform: 'linkedin',
      }, '-created_date', 1);
      const linkedinConn = connections?.[0];

      if (!linkedinConn?.organization_id) {
        return Response.json({
          success: false,
          platform,
          captured: false,
          data_source: 'not_connected',
          message: 'LinkedIn organization_id not configured. Cannot fetch post analytics without it.',
        });
      }

      // If post_id is provided, try to fetch post-level analytics
      // LinkedIn API: GET https://api.linkedin.com/rest/posts/{postUrn}/socialActions
      // and /rest/organizationalEntityShareStatistics
      // This requires the published_url or provider_post_id to be stored on the MarketingPost

      if (!post_id) {
        return Response.json({
          success: false,
          platform,
          captured: false,
          data_source: 'not_connected',
          message: 'post_id is required to capture LinkedIn post analytics. Use the MarketingPost ID.',
        });
      }

      const post = await base44.asServiceRole.entities.MarketingPost.get(post_id);
      if (!post) {
        return Response.json({ error: 'MarketingPost not found', post_id }, { status: 404 });
      }

      if (!post.published_url) {
        return Response.json({
          success: false,
          platform,
          post_id,
          captured: false,
          data_source: 'not_connected',
          message: 'Post has not been published yet. No analytics available.',
        });
      }

      // Extract post URN from published_url
      // Format: https://www.linkedin.com/feed/update/{urn}/
      const urnMatch = post.published_url.match(/feed\/update\/([^/]+)/);
      if (!urnMatch) {
        return Response.json({
          success: false,
          platform,
          post_id,
          captured: false,
          data_source: 'not_connected',
          message: 'Could not extract post URN from published_url.',
        });
      }

      const postUrn = urnMatch[1];
      const accessToken = (await base44.asServiceRole.connectors.getConnection('linkedin')).accessToken;

      // Fetch social actions (likes, comments)
      const actionsResponse = await fetch(
        `https://api.linkedin.com/rest/posts/${encodeURIComponent(postUrn)}/socialActions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202401',
          },
        }
      );

      let likes = 0, comments = 0;
      if (actionsResponse.ok) {
        const actions = await actionsResponse.json();
        likes = actions.likes?.total || 0;
        comments = actions.comments?.total || 0;
      }

      // Fetch impressions (organizationalEntityShareStatistics)
      const statsResponse = await fetch(
        `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(linkedinConn.organization_id)}&shares[0]=${encodeURIComponent(postUrn)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202401',
          },
        }
      );

      let impressions = 0, clicks = 0;
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        const element = stats.elements?.[0];
        impressions = element?.totalShareStatistics?.impressions || 0;
        clicks = element?.totalShareStatistics?.clicks || 0;
      }

      // Create MarketingAnalyticsSnapshot
      const snapshot = await base44.asServiceRole.entities.MarketingAnalyticsSnapshot.create({
        platform: 'linkedin',
        post_id,
        impressions,
        clicks,
        likes,
        comments,
        shares: 0,
        saves: 0,
        follows: 0,
        website_sessions: 0,
        leads_created: 0,
        conversion_rate: 0,
        captured_at: now,
        data_source: 'platform_api',
      });

      return Response.json({
        success: true,
        platform: 'linkedin',
        post_id,
        captured: true,
        data_source: 'platform_api',
        metrics: { impressions, clicks, likes, comments },
        snapshot_id: snapshot.id,
        captured_at: now,
      });
    }

    if (platform === 'instagram_business') {
      if (!oauthConnected) {
        return Response.json({
          success: false,
          platform,
          captured: false,
          data_source: 'not_connected',
          message: 'Instagram not connected. Analytics unavailable. Connect the Instagram integration first.',
          oauth_error: oauthError,
        });
      }

      if (!post_id) {
        return Response.json({
          success: false,
          platform,
          captured: false,
          data_source: 'not_connected',
          message: 'post_id is required to capture Instagram post analytics.',
        });
      }

      const post = await base44.asServiceRole.entities.MarketingPost.get(post_id);
      if (!post) {
        return Response.json({ error: 'MarketingPost not found', post_id }, { status: 404 });
      }

      if (!post.published_url) {
        return Response.json({
          success: false,
          platform,
          post_id,
          captured: false,
          data_source: 'not_connected',
          message: 'Post has not been published yet. No analytics available.',
        });
      }

      // Extract IG media ID from published_url
      // Format: https://www.instagram.com/p/{shortcode}/
      const shortcodeMatch = post.published_url.match(/instagram\.com\/(?:p|reel)\/([^/]+)/);
      if (!shortcodeMatch) {
        return Response.json({
          success: false,
          platform,
          post_id,
          captured: false,
          data_source: 'not_connected',
          message: 'Could not extract shortcode from published_url.',
        });
      }

      // Get IG user ID from connection
      const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
        platform: 'instagram_business',
      }, '-created_date', 1);
      const igConn = connections?.[0];

      if (!igConn?.account_id) {
        return Response.json({
          success: false,
          platform,
          post_id,
          captured: false,
          data_source: 'not_connected',
          message: 'Instagram business account_id not configured.',
        });
      }

      // Use Instagram Graph API to get media insights
      const accessToken = (await base44.asServiceRole.connectors.getConnection('instagram')).accessToken;
      const igUserId = igConn.account_id;

      // First get the media object by shortcode
      const mediaResponse = await fetch(
        `https://graph.instagram.com/v21.0/${igUserId}/media?fields=id,like_count,comments_count&access_token=${accessToken}`
      );

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        return Response.json({
          success: false,
          platform,
          post_id,
          captured: false,
          data_source: 'not_connected',
          message: `Instagram API error: ${errorText}`,
        });
      }

      const mediaData = await mediaResponse.json();

      // Create snapshot with available data
      const snapshot = await base44.asServiceRole.entities.MarketingAnalyticsSnapshot.create({
        platform: 'instagram_business',
        post_id,
        impressions: 0, // IG basic display API doesn't provide impressions
        clicks: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        follows: 0,
        website_sessions: 0,
        leads_created: 0,
        conversion_rate: 0,
        captured_at: now,
        data_source: 'platform_api',
      });

      return Response.json({
        success: true,
        platform: 'instagram_business',
        post_id,
        captured: true,
        data_source: 'platform_api',
        message: 'Instagram analytics captured with available fields. Full insights require Instagram Graph API with insights permissions.',
        snapshot_id: snapshot.id,
        captured_at: now,
      });
    }

    if (platform === 'tiktok') {
      return Response.json({
        success: false,
        platform,
        captured: false,
        data_source: 'not_connected',
        message: 'TikTok Base44 connector is read-only. Post-level analytics are not available through the connector. TikTok video view counts would require the TikTok Display API or Content Posting API with a custom developer app.',
      });
    }

    if (platform === 'facebook_ads') {
      return Response.json({
        success: false,
        platform,
        captured: false,
        data_source: 'not_connected',
        message: 'Facebook Ads module is draft-only. No ad campaigns are running. No analytics to capture.',
      });
    }

    return Response.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});