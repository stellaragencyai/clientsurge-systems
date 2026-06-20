import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * SETUP GA4 CONFIGURATION — Admin-Only GA4 Integration Setup
 *
 * Creates/updates GA4 configuration with setup guide and validation.
 * Admin-only function to ensure only authorized users can configure GA4.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { measurement_id, api_secret, enabled, tracked_events } = await req.json();

    if (!measurement_id || !measurement_id.startsWith('G-')) {
      return Response.json(
        { error: 'Invalid measurement_id format. Must start with G-' },
        { status: 400 }
      );
    }

    const setupGuide = buildGA4SetupGuide();

    // Check if config already exists
    const existing = await base44.asServiceRole.entities.GA4Configuration.filter(
      { measurement_id },
      '-created_date',
      1
    ).catch(() => []);

    let config;
    const payload = {
      measurement_id,
      api_secret: api_secret || null,
      enabled: enabled !== false,
      tracked_events: tracked_events || [
        'page_view',
        'cta_click',
        'pricing_view',
        'checkout_click',
        'form_submit',
      ],
      setup_status: 'configured',
      setup_guide: setupGuide,
      last_verified_at: new Date().toISOString(),
    };

    if (existing?.[0]?.id) {
      config = await base44.asServiceRole.entities.GA4Configuration.update(
        existing[0].id,
        payload
      );
    } else {
      config = await base44.asServiceRole.entities.GA4Configuration.create(payload);
    }

    return Response.json({
      success: true,
      config,
      message: 'GA4 configuration saved. Begin implementing GA4 tag on frontend.',
    });
  } catch (error) {
    console.error('[setupGA4Configuration]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildGA4SetupGuide() {
  return `
GA4 SETUP GUIDE — ClientSurge Landing Pages

==================================================
STEP 1: Create GA4 Property
==================================================
1. Go to Google Analytics 4 (analytics.google.com)
2. Create new Property for ClientSurge landing pages
3. Select "Web" as your platform
4. Follow wizard to completion

==================================================
STEP 2: Get Measurement ID
==================================================
1. In GA4 admin panel, navigate to "Data Streams"
2. Select the web stream you just created
3. Copy the Measurement ID (format: G-XXXXXXX)
4. Paste into GA4Configuration.measurement_id field

==================================================
STEP 3: Install GA4 Tag on Frontend
==================================================
Add this to index.html <head>:

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_MEASUREMENT_ID', {
    'anonymize_ip': true,
    'allow_google_signals': false,
  });
</script>

Replace YOUR_MEASUREMENT_ID with your actual G-XXXXXXX from Step 2.

==================================================
STEP 4: Enable Enhanced Measurement
==================================================
1. In GA4 admin → Data Streams → Select your stream
2. Scroll to "Enhanced measurement"
3. Enable:
   ✓ Page views
   ✓ Scrolls
   ✓ Outbound clicks
   ✓ File downloads
   ✓ Form interactions

==================================================
STEP 5: Configure Conversion Events
==================================================
1. In GA4 admin → Conversions
2. Create new conversion events:
   - cta_click
   - checkout_click
   - pricing_view
   - demo_booking_click
   - form_submit

For each event:
- Event name: exact match from list above
- Mark as "Conversion"
- Save

==================================================
STEP 6: Frontend Integration
==================================================
ConversionTrackingEvent entity automatically:
- Captures page views, clicks, form submissions
- Tracks scroll depth, device type, UTM params
- Syncs with GA4 via gtag('event', ...) calls

Tracking functions available in lib/conversionTracking.js:
- trackPageView(pageKey)
- trackCTAClick(pageKey, label)
- trackPricingView()
- trackCheckoutClick(pageKey, planName)
- trackDemoBooking(pageKey)
- trackFormSubmit(pageKey, formName)

==================================================
STEP 7: Verify Setup
==================================================
1. In GA4 admin → Real-time report
2. Load a landing page in new browser tab
3. You should see your session appear within seconds
4. Trigger a conversion event (click CTA button)
5. Event should appear in Real-time report

If events don't appear:
- Check browser console for JS errors
- Verify Measurement ID is correct (G-XXXXXXX)
- Confirm GA4 tag is in <head> of HTML
- Check GA4 filters aren't blocking your IP

==================================================
STEP 8: Setup Server-Side Tracking (Optional)
==================================================
For Stripe checkout events, use GA4 Measurement Protocol:
- API Secret: Retrieve from GA4 admin → Data Streams → Measurement Protocol API secrets
- Store in GA4Configuration.api_secret field
- Backend function will use to send checkout events server-side

==================================================
STEP 9: Monitor Performance
==================================================
Dashboard locations:
- GA4 Realtime: Real-time visitor activity
- GA4 Acquisition: Where traffic comes from
- GA4 Engagement: How users interact with pages
- GA4 Conversions: Conversion tracking results

LandingPageAnalytics entity aggregates daily metrics:
- Page views, sessions, CTA clicks
- Conversion rate, bounce rate, scroll depth
- Traffic source breakdown (UTM params)
- Device breakdown (mobile/tablet/desktop)

Admin dashboard: Navigate to /admin → landing-page-analytics

==================================================
TROUBLESHOOTING
==================================================
Q: Measurement ID format?
A: Must start with 'G-' followed by 10-12 characters. Example: G-1A2B3C4D5E

Q: No events appearing in GA4?
A: Check that gtag() is defined. Ensure GA4 tag is loaded before tracking calls.

Q: ConversionTrackingEvent records appearing but not GA4?
A: GA4 tag may not be installed. Re-run Step 3 and verify in browser console: window.gtag exists

Q: Want to test without live traffic?
A: Use GA4 Debug View mode (admin → Data Streams → Measurement Protocol) to see test events.

==================================================
NEXT STEPS
==================================================
1. Wait 24 hours for initial data to populate
2. Create custom reports in GA4 for industry page comparison
3. Set up GA4 goals for checkout completion rate
4. Enable Google Ads integration for remarketing
5. Connect Google Search Console for organic search insights

Questions? Contact: support@clientsurge.com
`;
}