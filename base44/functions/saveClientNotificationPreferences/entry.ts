import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, preferences } = await req.json();

    if (!project_id || !preferences) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save preferences to client's user data
    await base44.auth.updateMe({
      notification_preferences: {
        email_notifications: preferences.email_notifications,
        sms_notifications: preferences.sms_notifications,
        phone_number: preferences.phone_number || '',
        notify_on_new_lead: preferences.notify_on_new_lead,
        notify_on_reply: preferences.notify_on_reply,
        notify_on_booking: preferences.notify_on_booking,
        notification_frequency: preferences.notification_frequency,
        onboarding_completed_at: new Date().toISOString(),
      },
    });

    return Response.json({ success: true, message: 'Preferences saved' });
  } catch (error) {
    console.error('[saveClientNotificationPreferences] Error saving preferences:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});