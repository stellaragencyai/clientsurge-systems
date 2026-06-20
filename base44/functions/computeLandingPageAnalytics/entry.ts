import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * COMPUTE LANDING PAGE ANALYTICS — Aggregates conversion events into daily metrics
 *
 * Scans ConversionTrackingEvent records and creates LandingPageAnalytics summaries
 * for each page_key per day. Idempotent — safe to run multiple times.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { date } = await req.json(); // ISO date string (YYYY-MM-DD)
    const targetDate = date ? new Date(date).toISOString().split('T')[0] : getTodayISO();

    const results = {
      analyticsCreated: 0,
      analyticsUpdated: 0,
      pagesProcessed: 0,
      errors: [],
    };

    const pageKeys = [
      'homepage',
      'med_spa',
      'dental',
      'hvac',
      'roofing',
      'contractors',
      'real_estate',
      'personal_injury',
      'plumbing',
      'chiropractic',
      'pricing',
    ];

    // Process each page
    for (const pageKey of pageKeys) {
      try {
        // Fetch all events for this page on the target date
        const dateStart = `${targetDate}T00:00:00Z`;
        const dateEnd = `${targetDate}T23:59:59Z`;

        const events = await base44.asServiceRole.entities.ConversionTrackingEvent.filter(
          { page_key: pageKey },
          '-created_date',
          5000
        ).catch(() => []);

        // Filter by date range (created_date between dateStart and dateEnd)
        const dayEvents = (events || []).filter((e) => {
          const ts = e.created_date || e.timestamp;
          return ts >= dateStart && ts <= dateEnd;
        });

        if (dayEvents.length === 0) {
          results.pagesProcessed++;
          continue; // Skip pages with no events
        }

        // Aggregate metrics
        const sessionIds = new Set();
        let pageViews = 0;
        let ctaClicks = 0;
        let demoBookings = 0;
        let checkoutClicks = 0;
        let formSubmissions = 0;
        let scrollSum = 0;
        let scrollCount = 0;
        let timeOnPageSum = 0;
        let timeOnPageCount = 0;
        const utmSources = {};
        const utmCampaigns = {};
        const devices = { mobile: 0, tablet: 0, desktop: 0 };

        for (const evt of dayEvents) {
          const meta = evt.metadata || {};
          sessionIds.add(evt.session_id);

          if (evt.event_type === 'page_view') pageViews++;
          else if (evt.event_type === 'cta_click') ctaClicks++;
          else if (evt.event_type === 'demo_booking_click') demoBookings++;
          else if (evt.event_type === 'checkout_click') checkoutClicks++;
          else if (evt.event_type === 'form_submit') formSubmissions++;
          else if (evt.event_type === 'scroll_depth') {
            if (meta.scroll_depth) {
              scrollSum += meta.scroll_depth;
              scrollCount++;
            }
          }

          if (meta.utm_source) utmSources[meta.utm_source] = (utmSources[meta.utm_source] || 0) + 1;
          if (meta.utm_campaign) utmCampaigns[meta.utm_campaign] = (utmCampaigns[meta.utm_campaign] || 0) + 1;
          if (meta.device_type) devices[meta.device_type]++;
        }

        const sessions = sessionIds.size;
        const conversionRate = sessions > 0 ? (ctaClicks / sessions) * 100 : 0;
        const avgScrollDepth = scrollCount > 0 ? scrollSum / scrollCount : 0;
        const topUtmSource = Object.entries(utmSources).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const topUtmCampaign = Object.entries(utmCampaigns).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        // Look for existing analytics record
        const existing = await base44.asServiceRole.entities.LandingPageAnalytics.filter(
          { page_key: pageKey, date: targetDate },
          '-created_date',
          1
        ).catch(() => []);

        const analyticsPayload = {
          page_key: pageKey,
          date: targetDate,
          impressions: pageViews,
          sessions,
          cta_clicks: ctaClicks,
          demo_bookings: demoBookings,
          checkout_clicks: checkoutClicks,
          form_submissions: formSubmissions,
          conversion_rate: parseFloat(conversionRate.toFixed(2)),
          bounce_rate: sessions > 0 ? ((sessions - (ctaClicks + demoBookings + checkoutClicks + formSubmissions)) / sessions) * 100 : 0,
          scroll_completion_rate: avgScrollDepth,
          top_utm_source: topUtmSource,
          top_utm_campaign: topUtmCampaign,
          device_breakdown: devices,
        };

        if (existing?.[0]?.id) {
          await base44.asServiceRole.entities.LandingPageAnalytics.update(
            existing[0].id,
            analyticsPayload
          );
          results.analyticsUpdated++;
        } else {
          await base44.asServiceRole.entities.LandingPageAnalytics.create(analyticsPayload);
          results.analyticsCreated++;
        }

        results.pagesProcessed++;
      } catch (err) {
        results.errors.push(`${pageKey}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      date: targetDate,
      results,
    });
  } catch (error) {
    console.error('[computeLandingPageAnalytics]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getTodayISO() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}