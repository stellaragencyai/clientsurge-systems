# GA4 Setup Guide — ClientSurge Landing Pages

Complete this guide to enable full conversion tracking and analytics for all landing pages.

## STEP 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click **Create** → **New property**
3. Enter property name: "ClientSurge Landing Pages"
4. Select timezone and currency (USD)
5. Click **Next**
6. Select **Web** as your platform
7. Enter website URL and stream name
8. Click **Create**

## STEP 2: Get Your Measurement ID

1. In GA4 admin, go to **Data Streams**
2. Click your new web stream
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Save this — you'll need it in STEP 3

## STEP 3: Install GA4 Tag on Frontend

Add this to `index.html` `<head>` section:

```html
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
```

**Replace `YOUR_MEASUREMENT_ID` with your actual Measurement ID from STEP 2.**

## STEP 4: Enable Enhanced Measurement

1. In GA4 admin → **Data Streams** → Select your web stream
2. Scroll to **Enhanced measurement** section
3. Enable these toggles:
   - ✓ Page views
   - ✓ Scrolls
   - ✓ Outbound clicks
   - ✓ File downloads
   - ✓ Form interactions

## STEP 5: Configure Conversion Events

1. In GA4 admin → **Conversions**
2. Create new conversion events:
   - `cta_click` — User clicked a CTA button
   - `checkout_click` — User clicked Checkout
   - `pricing_view` — User viewed Pricing page
   - `demo_booking_click` — User initiated demo booking
   - `form_submit` — User submitted a form

For each event:
1. Click **New conversion event**
2. Enter event name (exact match above)
3. Select "Conversion" status
4. Click **Save**

## STEP 6: Frontend Integration

The ConversionTrackingEvent entity automatically captures:
- Page views on all landing pages
- Button clicks (CTA, checkout)
- Form submissions
- Scroll depth tracking
- Device type & UTM parameters

**Tracking functions in `lib/conversionTracking.js`:**

```javascript
import {
  trackPageView,
  trackCTAClick,
  trackPricingView,
  trackCheckoutClick,
  trackDemoBooking,
  trackFormSubmit,
  setupScrollTracking,
} from '@/lib/conversionTracking';

// In page component:
useEffect(() => {
  trackPageView('med_spa');
  setupScrollTracking('med_spa');
}, []);

// On button click:
const handleCTAClick = () => {
  trackCTAClick('med_spa', 'Get Started Button');
};
```

## STEP 7: Verify Setup (Real-Time Testing)

1. Open GA4 → **Real-time** report
2. Open a landing page in a new browser window
3. Within 1-2 seconds, you should see yourself appear in Real-time
4. Click a CTA button on the landing page
5. The event should appear in Real-time report within seconds

**If events don't appear:**
- Check browser console for JavaScript errors
- Verify Measurement ID is correct (G-XXXXX)
- Confirm GA4 tag is in the `<head>` of `index.html`
- Try in an incognito window (filters may block your IP)

## STEP 8: View Analytics Dashboards

**GA4 Default Reports:**
- **Realtime** → See live traffic as it happens
- **Acquisition** → Where traffic comes from (organic, direct, campaigns)
- **Engagement** → How users interact with pages
- **Conversions** → Conversion event tracking results

**ClientSurge Analytics:**
- Admin Dashboard → **Landing Page Analytics**
- View metrics by industry page:
  - Impressions, sessions, CTA clicks
  - Conversion rate, bounce rate, scroll depth
  - Traffic source breakdown (UTM params)
  - Device breakdown (mobile/tablet/desktop)

## STEP 9: Server-Side Checkout Tracking (Optional)

For Stripe checkout events tracked server-side:

1. In GA4 admin → **Data Streams** → Select web stream
2. Scroll to **Measurement Protocol API secrets**
3. Click **Create**
4. Copy the API Secret
5. In Admin Dashboard → GA4 Configuration
6. Paste API Secret into `api_secret` field
7. Enable `api_secret` field

Backend will use this secret to send checkout completion events server-side.

## STEP 10: Monitor Performance

The system automatically aggregates daily metrics into `LandingPageAnalytics`:

**What's tracked:**
- Page views per industry page
- Sessions (unique visitors)
- CTA click-through rate
- Conversion rates by page
- Bounce rates
- Scroll completion rates
- Top traffic sources (UTM)
- Device breakdown

**Run analytics computation:**
- Admin Dashboard → Refresh Data button
- Or scheduled daily via `computeLandingPageAnalytics` function

## TROUBLESHOOTING

### Q: Measurement ID format?
**A:** Must start with `G-` followed by 10-12 characters. Example: `G-1A2B3C4D5E`

### Q: No events in Real-time?
**A:** 
1. Check browser console: `console.log(window.gtag)` should be a function
2. Verify GA4 tag loaded before tracking calls
3. Confirm GA4 tag is in `<head>`, not `<body>`

### Q: Events in ConversionTrackingEvent but not GA4?
**A:** GA4 tag may not be installed. Re-run STEP 3 and verify `window.gtag` exists in browser console.

### Q: Want to test without live traffic?
**A:** Use GA4 Debug View:
1. Admin → **Data Streams** → Select stream
2. Enable **Measurement Protocol API debug view**
3. Events will appear in Debug View immediately

## NEXT STEPS

1. **Wait 24 hours** for initial data to populate in GA4
2. **Create custom reports** in GA4 comparing industry pages
3. **Set up GA4 goals** for checkout completion rate
4. **Enable Google Ads** integration for remarketing
5. **Connect Google Search Console** for organic traffic insights
6. **Set up alerts** for drop in conversion rates

## SUPPORT

Questions? Email: [support@clientsurge.com](mailto:support@clientsurge.com)

See also: GA4Configuration entity for current setup status