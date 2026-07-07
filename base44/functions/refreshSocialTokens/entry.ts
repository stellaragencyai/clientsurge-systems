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
        message: `No SocialChannelConnection found for ${platform}. Connect the integration first.`,
      });
    }

    // The Base44 platform manages OAuth token refresh automatically when a connector
    // is connected. There is no manual refresh endpoint available to backend functions.
    // The platform refreshes tokens before they expire as long as the connector is active.
    //
    // This function checks the current token state and reports whether a re-authorization
    // is needed. If the token is expired or the connection is broken, the admin must
    // re-authorize through the Base44 platform (via the AI assistant).

    const connectorMap = {
      linkedin: 'linkedin',
      tiktok: 'tiktok',
      instagram_business: 'instagram',
    };

    const connectorType = connectorMap[platform];
    let tokenValid = false;
    let refreshNeeded = false;
    let message = '';

    if (connectorType) {
      try {
        const conn = await base44.asServiceRole.connectors.getConnection(connectorType);
        if (conn?.accessToken) {
          tokenValid = true;
          message = `Token is active for ${platform}. Base44 platform manages automatic token refresh.`;
        } else {
          refreshNeeded = true;
          message = `No active access token for ${platform}. Re-authorization required.`;
        }
      } catch (e) {
        refreshNeeded = true;
        message = `Token refresh check failed for ${platform}: ${e.message}. Re-authorization required — ask the AI assistant to reconnect the ${platform} integration.`;
      }
    } else {
      message = `${platform} does not have a Base44 connector. No token to refresh.`;
    }

    // Check token expiry from stored record
    let tokenExpiresAt = connection.token_expires_at;
    let expiryWarning = null;

    if (tokenExpiresAt) {
      const expiry = new Date(tokenExpiresAt);
      if (expiry.getTime() <= Date.now()) {
        refreshNeeded = true;
        expiryWarning = `Token expired on ${tokenExpiresAt}. Re-authorization required.`;
      } else if (expiry.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000) {
        expiryWarning = `Token expires soon: ${tokenExpiresAt}. Base44 should auto-refresh, but monitor.`;
      }
    }

    // Update connection record
    const newStatus = refreshNeeded ? 'expired' : (tokenValid ? 'connected' : connection.connected_status);
    const newPublishStatus = refreshNeeded ? 'not_ready' : connection.publish_capability_status;

    await base44.asServiceRole.entities.SocialChannelConnection.update(connection.id, {
      connected_status: newStatus,
      publish_capability_status: newPublishStatus,
      last_verified_at: now,
      error_message: refreshNeeded ? (expiryWarning || message) : null,
    });

    return Response.json({
      success: true,
      platform,
      token_valid: tokenValid,
      refresh_needed: refreshNeeded,
      token_expires_at: tokenExpiresAt,
      expiry_warning: expiryWarning,
      connected_status: newStatus,
      publish_capability_status: newPublishStatus,
      message,
      action_required: refreshNeeded
        ? `Ask the AI assistant to reconnect the ${platform} integration via request_oauth_authorization.`
        : 'No action required. Base44 platform manages automatic token refresh.',
      verified_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});