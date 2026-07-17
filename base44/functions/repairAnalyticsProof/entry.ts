import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PAGE_KEYS = [
  'homepage', 'med_spa', 'dental', 'hvac', 'roofing', 'contractors',
  'real_estate', 'personal_injury', 'plumbing', 'chiropractic', 'pricing',
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

function isoDay(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function isTrustedProductionEvent(event) {
  const environment = String(event?.environment || 'production').toLowerCase();
  return !['qa', 'smoke', 'demo', 'internal', 'test'].includes(environment);
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: 'Admin only', request_id: requestId }, 403);

    const body = await req.json().catch(() => ({}));
    const requestedDays = Math.min(Math.max(Number(body.days || 30), 1), 90);
    const cutoff = new Date(Date.now() - requestedDays * 86400000).toISOString();

    const rawEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.list('-created_date', 5000).catch(() => []);
    const events = (Array.isArray(rawEvents) ? rawEvents : []).filter((event) => {
      const timestamp = event.created_date || event.timestamp;
      return timestamp && timestamp >= cutoff && isTrustedProductionEvent(event);
    });

    const grouped = new Map();
    for (const event of events) {
      const day = isoDay(event.created_date || event.timestamp);
      const pageKey = String(event.page_key || '').trim();
      if (!day || !pageKey || !PAGE_KEYS.includes(pageKey)) continue;
      const key = `${day}:${pageKey}`;
      if (!grouped.has(key)) grouped.set(key, { day, pageKey, events: [] });
      grouped.get(key).events.push(event);
    }

    let created = 0;
    let updated = 0;
    const errors = [];
    const touchedDates = new Set();

    for (const group of grouped.values()) {
      try {
        const sessions = new Set();
        let pageViews = 0;
        let ctaClicks = 0;
        let demoBookings = 0;
        let checkoutClicks = 0;
        let formSubmissions = 0;
        let scrollSum = 0;
        let scrollCount = 0;
        const utmSources = {};
        const utmCampaigns = {};
        const devices = { mobile: 0, tablet: 0, desktop: 0 };

        for (const event of group.events) {
          const metadata = event.metadata || {};
          if (event.session_id) sessions.add(event.session_id);
          if (event.event_type === 'page_view') pageViews++;
          else if (event.event_type === 'cta_click') ctaClicks++;
          else if (event.event_type === 'demo_booking_click') demoBookings++;
          else if (event.event_type === 'checkout_click') checkoutClicks++;
          else if (event.event_type === 'form_submit') formSubmissions++;
          else if (event.event_type === 'scroll_depth' && Number.isFinite(Number(metadata.scroll_depth))) {
            scrollSum += Number(metadata.scroll_depth);
            scrollCount++;
          }
          if (metadata.utm_source) utmSources[metadata.utm_source] = (utmSources[metadata.utm_source] || 0) + 1;
          if (metadata.utm_campaign) utmCampaigns[metadata.utm_campaign] = (utmCampaigns[metadata.utm_campaign] || 0) + 1;
          if (metadata.device_type && Object.hasOwn(devices, metadata.device_type)) devices[metadata.device_type]++;
        }

        const sessionCount = sessions.size;
        const conversionActions = ctaClicks + demoBookings + checkoutClicks + formSubmissions;
        const payload = {
          page_key: group.pageKey,
          date: group.day,
          impressions: pageViews,
          sessions: sessionCount,
          cta_clicks: ctaClicks,
          demo_bookings: demoBookings,
          checkout_clicks: checkoutClicks,
          form_submissions: formSubmissions,
          conversion_rate: sessionCount ? Number(((conversionActions / sessionCount) * 100).toFixed(2)) : 0,
          bounce_rate: sessionCount ? Number((Math.max(0, (sessionCount - conversionActions) / sessionCount) * 100).toFixed(2)) : 0,
          scroll_completion_rate: scrollCount ? Number((scrollSum / scrollCount).toFixed(2)) : 0,
          top_utm_source: Object.entries(utmSources).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
          top_utm_campaign: Object.entries(utmCampaigns).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
          device_breakdown: devices,
          environment: 'production',
          last_computed_at: new Date().toISOString(),
        };

        const existing = await base44.asServiceRole.entities.LandingPageAnalytics.filter(
          { page_key: group.pageKey, date: group.day }, '-created_date', 1
        ).catch(() => []);

        if (existing?.[0]?.id) {
          await base44.asServiceRole.entities.LandingPageAnalytics.update(existing[0].id, payload);
          updated++;
        } else {
          await base44.asServiceRole.entities.LandingPageAnalytics.create(payload);
          created++;
        }
        touchedDates.add(group.day);
      } catch (error) {
        errors.push(`${group.day}/${group.pageKey}: ${error.message}`);
      }
    }

    await base44.asServiceRole.entities.AuditLog.create({
      admin_email: user.email || 'admin',
      action: 'analytics_proof_backfill',
      entity_name: 'LandingPageAnalytics',
      record_id: requestId,
      before: '{}',
      after: JSON.stringify({ requested_days: requestedDays, source_events: events.length, groups: grouped.size, created, updated, errors: errors.length }),
      timestamp: new Date().toISOString(),
      notes: 'Backfilled analytics only from trusted production conversion events; no synthetic events or zero-proof records created.',
    }).catch(() => null);

    return json({
      success: errors.length === 0,
      request_id: requestId,
      requested_days: requestedDays,
      trusted_source_events: events.length,
      page_day_groups: grouped.size,
      analytics_created: created,
      analytics_updated: updated,
      dates_repaired: [...touchedDates].sort(),
      errors,
      next_action: grouped.size === 0
        ? 'No trusted production conversion events were found. Verify the browser tracker is deployed and receiving traffic.'
        : 'Re-run the Audit Command Center to verify LandingPageAnalytics proof.',
    }, errors.length ? 207 : 200);
  } catch (error) {
    console.error(`[repairAnalyticsProof] ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});
