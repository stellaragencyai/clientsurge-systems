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
    const { platform } = body;

    if (!platform) {
      return Response.json({ error: 'platform is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Get the SocialChannelConnection record
    const connections = await base44.asServiceRole.entities.SocialChannelConnection.filter({
      platform,
    }, '-created_date', 1);
    const connection = connections?.[0];

    if (!connection) {
      return Response.json({
        success: false,
        platform,
        connected: false,
        publish_ready: false,
        status: 'not_connected',
        message: `No SocialChannelConnection found for ${platform}. Run the integration setup wizard first.`,
        verified_at: now,
      });
    }

    // Check OAuth connection via Base44 connectors
    const connectorMap = {
      linkedin: 'linkedin',
      tiktok: 'tiktok',
      instagram_business: 'instagram',
    };

    const connectorType = connectorMap[platform];
    let oauthConnected = false;
    let oauthError = null;
    let tokenExpiresAt = null;
    let permissions = [];

    if (connectorType) {
      try {
        const conn = await base44.asServiceRole.connectors.getConnection(connectorType);
        if (conn?.accessToken) {
          oauthConnected = true;
          // LinkedIn and Instagram tokens don't expose expiry via SDK directly
          // TikTok is read-only
        }
      } catch (e) {
        oauthError = e.message;
      }
    }

    // Platform-specific verification
    let platformStatus = 'connected';
    let publishCapability = 'ready_to_publish';
    let issues = [];

    // TikTok: always blocked for publishing
    if (platform === 'tiktok') {
      platformStatus = oauthConnected ? 'connected' : 'not_connected';
      publishCapability = 'read_only';
      issues.push('TikTok Base44 connector is read-only. Video publishing requires a custom TikTok Developer App with Content Posting API.');
    }

    // LinkedIn: check for organization_id
    if (platform === 'linkedin') {
      if (!connection.organization_id) {
        publishCapability = 'blocked_missing_scope';
        issues.push('LinkedIn organization_id not configured. Set the Company Page URN in the SocialChannelConnection record.');
      }
    }

    // Instagram: check for account_id and media requirements
    if (platform === 'instagram_business') {
      if (!connection.account_id) {
        publishCapability = 'blocked_missing_scope';
        issues.push('Instagram business account_id not configured. Set the IG Business Account ID in the SocialChannelConnection record.');
      }
    }

    // Facebook Ads: draft only
    if (platform === 'facebook_ads') {
      publishCapability = 'read_only';
      issues.push('Facebook Ads module is draft-only. No publishing available.');
    }

    // If OAuth not connected, mark as not connected
    if (!oauthConnected && connectorType) {
      platformStatus = 'not_connected';
      publishCapability = 'not_ready';
      issues.push(`OAuth connection to ${connectorType} is not established. Ask the AI assistant to connect the ${platform} integration.`);
    }

    // Check token expiry
    if (connection.token_expires_at) {
      const expiry = new Date(connection.token_expires_at);
      if (expiry.getTime() <= Date.now()) {
        platformStatus = 'expired';
        publishCapability = 'not_ready';
        issues.push(`OAuth token expired on ${connection.token_expires_at}. Reconnect required.`);
      } else if (expiry.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000) {
        issues.push(`OAuth token expires soon: ${connection.token_expires_at}. Consider refreshing.`);
      }
      tokenExpiresAt = connection.token_expires_at;
    }

    permissions = connection.permissions_granted || [];

    // Update the SocialChannelConnection record
    const updateData = {
      connected_status: platformStatus,
      publish_capability_status: publishCapability,
      last_verified_at: now,
      error_message: issues.length > 0 ? issues.join('; ') : null,
    };

    await base44.asServiceRole.entities.SocialChannelConnection.update(connection.id, updateData);

    return Response.json({
      success: true,
      platform,
      connected: platformStatus === 'connected',
      publish_ready: publishCapability === 'ready_to_publish',
      connected_status: platformStatus,
      publish_capability_status: publishCapability,
      oauth_connected: oauthConnected,
      oauth_error: oauthError,
      token_expires_at: tokenExpiresAt,
      permissions_granted: permissions,
      issues,
      verified_at: now,
      connection_id: connection.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});