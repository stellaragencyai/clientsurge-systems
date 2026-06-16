import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FOLLOW_UP_TEMPLATES = {
  1: {
    subject: 'Quick reminder – AI automation for your leads',
    message: 'Hey! Still interested in learning how our AI automation can turn more leads into bookings? Quick 15-min chat? Call +16025874608 or reply YES.',
  },
  2: {
    subject: 'Last chance – limited spots available',
    message: 'Last chance to get in on our AI automation system before we hit capacity this quarter 🎯 Reply NOW or call +16025874608. Let\'s get you booked!',
  },
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { alert_id, phone_number, lead_name, attempt } = payload;

    if (!alert_id || !phone_number || !attempt) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get alert record
    const alert = await base44.entities.Alert.get(alert_id).catch(() => null);
    if (!alert) {
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Skip if already converted
    if (['booked', 'closed', 'lost'].includes(alert.conversion_status)) {
      return Response.json({ success: true, skipped: true, reason: 'already_converted' });
    }

    const template = FOLLOW_UP_TEMPLATES[attempt] || FOLLOW_UP_TEMPLATES[2];

    // Send follow-up SMS asynchronously (non-blocking)
    try {
      await base44.functions.invoke('sendInstantLeadResponseSms', {
        phone_number,
        message: template.message,
        alert_id,
      }).catch(err => {
        console.error('[missionControlFollowUp] SMS send failed:', err.message);
      });
    } catch (err) {
      console.error('[missionControlFollowUp] Error sending SMS:', err);
      // Don't block on SMS failures
    }

    // Update alert
    await base44.entities.Alert.update(alert_id, {
      follow_up_count: (alert.follow_up_count || 0) + 1,
      last_follow_up_at: new Date().toISOString(),
    }).catch(() => {
      // Silently fail if update fails
    });

    // Schedule next follow-up if this is attempt 1 (after 1 hour)
    if (attempt === 1) {
      try {
        setTimeout(async () => {
          await base44.functions.invoke('missionControlFollowUp', {
            alert_id,
            phone_number,
            lead_name,
            attempt: 2,
          }).catch(err => {
            console.error('[missionControlFollowUp] Next follow-up failed:', err.message);
          });
        }, 3600000); // 1 hour
      } catch (_err) {
        // Ignore scheduling errors
      }
    }

    return Response.json({
      success: true,
      alert_id,
      attempt,
      message_sent: true,
    });
  } catch (error) {
    console.error('[missionControlFollowUp] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});