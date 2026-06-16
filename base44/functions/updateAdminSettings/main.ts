import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // **PHASE 2 FIX: Verify user exists and is admin**
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return Response.json({ error: 'Missing settings object' }, { status: 400 });
    }

    // Validate cadence settings ranges
    if (settings.cadence_max_attempts !== undefined) {
      if (settings.cadence_max_attempts < 2 || settings.cadence_max_attempts > 20) {
        return Response.json(
          { error: 'cadence_max_attempts must be between 2 and 20' },
          { status: 400 }
        );
      }
    }

    if (settings.cadence_switch_attempts !== undefined) {
      if (settings.cadence_switch_attempts < 1 || settings.cadence_switch_attempts > 10) {
        return Response.json(
          { error: 'cadence_switch_attempts must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    if (settings.cadence_engagement_threshold !== undefined) {
      if (settings.cadence_engagement_threshold < 0 || settings.cadence_engagement_threshold > 100) {
        return Response.json(
          { error: 'cadence_engagement_threshold must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Get current settings for audit
    const currentSettings = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const settingsId = currentSettings?.[0]?.id;

    let updatedSettings;
    if (settingsId) {
      // Update existing
      updatedSettings = await base44.asServiceRole.entities.AdminSettings.update(settingsId, settings);
    } else {
      // Create new
      updatedSettings = await base44.asServiceRole.entities.AdminSettings.create(settings);
    }

    // **PHASE 3 FIX: Audit log for settings changes**
    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_type: 'admin_settings',
      channel: 'internal',
      direction: 'system',
      event_type: 'settings_changed',
      provider: 'internal',
      status: 'processed',
      subject: 'Admin settings updated',
      metadata_json: JSON.stringify({
        changed_by: user.email,
        changed_fields: Object.keys(settings),
        new_values: settings,
        timestamp: new Date().toISOString(),
      }),
    }).catch(err => {
      console.error('Failed to log settings change:', err.message);
      // Don't fail the function for audit logging
    });

    console.log(`Settings updated by ${user.email}: ${Object.keys(settings).join(', ')}`);

    return Response.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('updateAdminSettings error:', error);
    return Response.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
});