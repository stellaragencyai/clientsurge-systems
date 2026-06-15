# A/B Testing System

## Overview

ClientSurge now includes a **Funnel A/B Testing System** for conversion rate optimization. Test different page versions (copy, layout, CTAs) and measure impact on key metrics:

- Page views
- CTA clicks
- Lead submissions
- Booking requests

---

## Supported Pages

✅ **Homepage** — Test hero section, value proposition, main CTA

✅ **HVAC Landing Page** — Test pain points, solution messaging, booking CTA

✅ **Roofing/Contractor Landing Page** — Test industry-specific messaging, urgency triggers, form CTAs

✅ **Dental Landing Page** — Test benefits, pricing emphasis, demo booking CTA

✅ **Chiropractic Landing Page** — Test treatment highlights, patient testimonials, appointment CTA

---

## How It Works

### 1. Create A/B Test

```javascript
import { createABTest } from '@/lib/abTestingFramework';

const testConfig = {
  page_key: 'homepage',
  page_path: '/',
  test_duration_days: 14,
  hypothesis: 'Shorter headline increases click-through rate',
  success_metric: 'click_through_rate',
  minimum_sample_size: 100,
  confidence_threshold_percent: 95,
  variants: [
    {
      variant_label: 'A',
      variant_name: 'Control - Original Hero',
      variant_description: 'Current homepage with original headline',
      traffic_split_percent: 50,
      changes: {
        // No changes for control
      }
    },
    {
      variant_label: 'B',
      variant_name: 'Shorter Headline',
      variant_description: 'Shorter, punchier headline (8 words vs 14)',
      traffic_split_percent: 50,
      changes: {
        hero_title: 'AI Lead Automation for Service Businesses',
        cta_text: 'Start Free Trial'
      }
    }
  ]
};

const result = await createABTest(base44, testConfig);
// → { success: true, test_id: 'homepage', variants: [...] }
```

### 2. Assign Visitors to Variants

```javascript
import { getVariantAssignment, trackVariantAssignment } from '@/lib/abTestingFramework';

// Get consistent assignment for visitor
const visitorId = generateOrGetVisitorId(); // e.g., from cookie or session
const variant = getVariantAssignment(visitorId, 'homepage', 50); // 50% split
// → 'A' or 'B'

// Track assignment
await trackVariantAssignment(base44, visitorId, 'homepage', variant);

// Return which variant to show
return { variant, hero_title: getTitleForVariant(variant), ... };
```

**Key Feature**: Same visitor always sees same variant (consistent hashing)

### 3. Track Events

**Page View**:
```javascript
import { trackPageView } from '@/lib/abTestingFramework';

await trackPageView(base44, 'homepage', variant, visitorId);
```

**CTA Click**:
```javascript
import { trackCTAClick } from '@/lib/abTestingFramework';

const handleCTAClick = async () => {
  await trackCTAClick(base44, 'homepage', variant, 'Book Demo', visitorId);
  // Navigate to booking
};
```

**Lead Submission**:
```javascript
import { trackLeadSubmission } from '@/lib/abTestingFramework';

const handleLeadCapture = async (leadData) => {
  const lead = await submitLead(leadData);
  await trackLeadSubmission(base44, 'homepage', variant, lead.id, visitorId);
};
```

**Booking Request**:
```javascript
import { trackBookingRequest } from '@/lib/abTestingFramework';

const handleBooking = async (bookingData) => {
  await scheduleBooking(bookingData);
  await trackBookingRequest(base44, 'homepage', variant, leadId, visitorId);
};
```

### 4. Analyze Results

```javascript
// Get analytics for page
const response = await fetch('/api/functions/computeABTestAnalytics?page_key=homepage');
const results = await response.json();

console.log(results);
// {
//   page_key: 'homepage',
//   variants: {
//     A: {
//       page_views: 1250,
//       cta_clicks: 187,
//       lead_submissions: 45,
//       conversion_rate: 3.6%,
//       click_through_rate: 14.96%
//     },
//     B: {
//       page_views: 1238,
//       cta_clicks: 201,
//       lead_submissions: 52,
//       conversion_rate: 4.2%,
//       click_through_rate: 16.23%
//     }
//   },
//   comparison: {
//     conversion_rate: {
//       variant_a: 3.6,
//       variant_b: 4.2,
//       winner: 'B',
//       improvement: 16.7% // B is 16.7% better
//     }
//   },
//   winner: 'B'
// }
```

---

## Integration Guide

### Homepage Example

**1. Add Variant Assignment to Home Component**:

```jsx
// pages/Home.jsx
import { useEffect, useState } from 'react';
import { getVariantAssignment, trackPageView } from '@/lib/abTestingFramework';

export default function Home() {
  const [variant, setVariant] = useState('A');

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const assignedVariant = getVariantAssignment(visitorId, 'homepage', 50);
    setVariant(assignedVariant);
    
    // Track page view
    trackPageView(base44, 'homepage', assignedVariant, visitorId);
  }, []);

  return (
    <div>
      <Hero variant={variant} />
      {/* Rest of page */}
    </div>
  );
}
```

**2. Create Variant-Aware Hero Component**:

```jsx
// components/landing/Hero.jsx
function Hero({ variant }) {
  const content = variant === 'A' ? {
    title: 'AI-Powered Lead Automation for Service Businesses',
    subheading: 'Get qualified leads, book appointments, increase revenue.',
    cta: 'Book a Demo'
  } : {
    title: 'AI Lead Automation for Service Businesses',
    subheading: 'Get more leads. Close more deals.',
    cta: 'Start Free Trial'
  };

  return (
    <section>
      <h1>{content.title}</h1>
      <p>{content.subheading}</p>
      <Button onClick={() => trackCTAClick(...)}>{content.cta}</Button>
    </section>
  );
}
```

**3. Track Lead Submissions**:

```jsx
// In lead capture form
const handleSubmit = async (formData) => {
  const lead = await submitLeadCapture(formData);
  await trackLeadSubmission(base44, 'homepage', variant, lead.id, visitorId);
  // Show success message
};
```

### Industry Pages Example

**HVAC Landing Page**:

```jsx
// components/industry/IndustryLandingPage.jsx
const industryConfig = {
  hvac: {
    page_key: 'hvac_landing',
    variantA: { title: '...', cta: '...' },
    variantB: { title: '...', cta: '...' }
  },
  roofing: { ... },
  dental: { ... },
  chiropractic: { ... }
};

export default function IndustryLandingPage() {
  const industry = useParams().industry;
  const config = industryConfig[industry];
  const [variant, setVariant] = useState('A');

  useEffect(() => {
    const v = getVariantAssignment(visitorId, config.page_key, 50);
    setVariant(v);
    trackPageView(base44, config.page_key, v, visitorId);
  }, []);

  const variantContent = variant === 'A' ? config.variantA : config.variantB;

  return (
    <IndustryTemplate config={config} variant={variant}>
      {/* Render with variantContent */}
    </IndustryTemplate>
  );
}
```

---

## Testing Workflow

### Phase 1: Setup (30 min)
1. Define hypothesis and primary metric
2. Create two variants in ABTestVariant entity
3. Set traffic split (usually 50/50)
4. Configure minimum sample size

### Phase 2: Running (2 weeks typical)
1. Monitor page view counts
2. Track conversion metrics
3. Pause if variant B is significantly worse (protect users)
4. Let test run until minimum sample size reached

### Phase 3: Analysis (1 day)
1. Run `computeABTestAnalytics` to get results
2. Check statistical significance
3. Calculate improvement (lift %)
4. Document findings

### Phase 4: Implementation (1 day)
1. Implement winning variant (or tie = no change)
2. Roll back to control if winner unclear
3. Archive test results
4. Start next test

---

## Best Practices

### Sample Size & Duration
- **Minimum per variant**: 100 visitors
- **Typical test duration**: 2 weeks
- **Recommended daily traffic**: 100+ visitors/variant/day

### What to Test
✅ **CTA Text** — "Book Demo" vs "Get Started"  
✅ **Headline Length** — Short vs detailed  
✅ **Value Proposition** — Benefit-focused vs feature-focused  
✅ **CTA Color** — Red vs blue vs green  
✅ **Hero Image** — Product demo vs customer success  
✅ **Form Length** — 3 fields vs 5 fields  

### What NOT to Test
❌ Radical redesigns (test smaller changes)  
❌ Multiple changes per variant (isolate variables)  
❌ Very short tests (< 1 week)  
❌ Low traffic pages (< 50 visitors/day)  

### Statistical Significance
- 95% confidence threshold (standard)
- Requires ~100 conversions per variant
- Don't stop test early unless major difference

---

## Metrics Reference

| Metric | Formula | Interpretation |
|--------|---------|-----------------|
| CTR (Click-Through Rate) | CTA Clicks / Page Views | Engagement level |
| Conversion Rate | Lead Submissions / Page Views | Main goal metric |
| Booking Rate | Booking Requests / Page Views | Final step conversion |
| Improvement | (Winner - Loser) / Loser × 100 | Lift % (e.g., 15% better) |

---

## Admin Dashboard Integration

### View All Tests

```javascript
// Get all tests for a client project
const tests = await base44.entities.ABTestVariant.filter({
  status: { $in: ['active', 'completed'] }
});

tests.forEach(test => {
  console.log(`${test.page_key}: ${test.status} (${test.variant_label})`);
});
```

### Pause/Resume Test

```javascript
import { pauseABTest, resumeABTest } from '@/lib/abTestingFramework';

// Pause
await pauseABTest(base44, 'homepage');

// Resume
await resumeABTest(base44, 'homepage');
```

### Conclude Test

```javascript
import { concludeABTest } from '@/lib/abTestingFramework';

const result = await concludeABTest(base44, 'homepage');
// Mark variants as completed, record winner
```

---

## Troubleshooting

### Test Not Tracking Data
- [ ] Verify `trackPageView()` is called on page load
- [ ] Confirm variant is being assigned correctly
- [ ] Check CommunicationEvent creation succeeds

### Unequal Traffic Split
- [ ] Verify `traffic_split_percent` sums to 100%
- [ ] Check `getVariantAssignment()` logic
- [ ] Review visitor ID consistency

### Variant Content Not Showing
- [ ] Ensure variant data is stored in ABTestVariant entity
- [ ] Verify component reads from correct variant object
- [ ] Check JSX rendering logic for variant A vs B

---

## Safety Constraints

✅ **Zero Changes to**:
- Cloudflare Worker logic
- CommunicationEvent schema
- Billing system
- Automation workflows

✅ **Data Storage**:
- Events logged in CommunicationEvent (non-invasive)
- Variants stored in new ABTestVariant entity
- No modification to existing systems

---

## Next Steps

1. **Deploy entity schema** (`entities/ABTestVariant.json`)
2. **Deploy libraries** (`lib/abTestingFramework.js`)
3. **Deploy analytics** (`functions/computeABTestAnalytics.js`)
4. **Integrate into pages** (add variant assignment + tracking)
5. **Create first test** (e.g., homepage hero section)
6. **Monitor results** (analytics dashboard)
7. **Implement winner** (roll out winning variant)

---

**Status**: Production Ready  
**Supported Pages**: 5 (Homepage, 4 Industry Pages)  
**Metrics Tracked**: 4 (Views, Clicks, Leads, Bookings)  
**Breaking Changes**: 0