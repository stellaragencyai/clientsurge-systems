# Multi-Industry Landing Page System

## Overview

Complete public-facing SaaS landing page system for ClientSurge, supporting 9 industry-specific pages all driven by centralized configuration and SaaS feature mapping.

## Architecture

### Core Components

**1. Industry Marketing Config** (`data/industryMarketingConfig.js`)
- 9 fully configured industries with tailored messaging
- Pain points, use cases, ROI metrics, testimonials per industry
- Industry data includes recommended plans
- Helper functions: `getIndustryBySlug()`, `getAllIndustries()`, `getIndustrySlugs()`

**2. Industry Page Template** (`components/landing/IndustryPageTemplate.jsx`)
- Dynamic React component driven by industry config
- Renders hero, pain points, use cases, ROI metrics, testimonials, features, final CTA
- Pulls plan features from `saasProductizationConfig.js` (SaaS control map)
- Mobile-responsive, conversion-optimized design

**3. Pricing Integration** (`components/pricing/PricingTableWithFeatures.jsx`)
- Reads plans from `PLAN_REGISTRY` and features from `PLAN_FEATURE_MAPPING`
- Monthly vs. one-time setup toggle
- Highlights recommended plan
- Integrates with checkout flow

**4. Checkout Button** (`components/checkout/CheckoutButton.jsx`)
- Production-ready Stripe integration
- Detects iframe sandbox (blocks checkout in editor preview)
- Calls `createCheckoutSession` backend function
- Shows iframe warning + error handling

## Supported Industries

1. **Medical Spa** (`/med-spa`)
   - Recommended plan: Growth System
   - Key focus: Lead response speed, appointment bookings, no-show reduction

2. **Dental Practice** (`/dental`)
   - Recommended plan: Growth System
   - Key focus: Emergency intake, recall automation, review generation

3. **HVAC** (`/hvac`)
   - Recommended plan: Growth System
   - Key focus: Emergency dispatch, seasonal maintenance, peak-season scaling

4. **Roofing** (`/roofing`)
   - Recommended plan: Elite System
   - Key focus: Storm lead capture, insurance claim navigation, crew dispatch

5. **General Contractors** (`/contractors`)
   - Recommended plan: Growth System
   - Key focus: Quote follow-up, walk-through confirmation, project updates

6. **Plumbing** (`/plumbing`)
   - Recommended plan: Growth System
   - Key focus: Emergency response, crew dispatch, maintenance upsells

7. **Chiropractic** (`/chiropractic`)
   - Recommended plan: Growth System
   - Key focus: New patient response, booking automation, retention

8. **Real Estate** (`/real-estate`)
   - Recommended plan: Growth System
   - Key focus: Buyer qualification, showing automation, follow-up sequences

9. **Personal Injury Law** (`/personal-injury`)
   - Recommended plan: Elite System
   - Key focus: Immediate response, case qualification, consultation confirmation

## Routing

All industry routes are auto-generated from `App.jsx`:

```javascript
{INDUSTRY_ROUTE_SLUGS.map((slug) => (
  <Route
    key={slug}
    path={`/${slug}`}
    element={<LazyRoute Component={IndustryPageTemplate} />}
  />
))}
```

Each route:
- Extracts slug from URL params
- Loads industry config via `getIndustryBySlug(slug)`
- Renders `IndustryPageTemplate` with industry-specific content
- Provides industry-specific CTAs (book demo, pricing)

## Data Flow

```
industryMarketingConfig.js
    ↓
IndustryPageTemplate (reads via getIndustryBySlug)
    ↓
Renders:
  - Hero (headline, subheadline, description)
  - Pain Points section
  - Use Cases (with metrics)
  - ROI Metrics section
  - Testimonials section
  - Features (pulls from saasProductizationConfig.js)
  - Final CTA
```

## SaaS Integration Points

### Plan Features
```javascript
import { getPlanFeatures } from '@/lib/saasProductizationConfig';

const recommendedFeatures = getPlanFeatures(industry.recommended_plan);
// Returns array of feature_key strings for that plan
```

### Pricing Display
```javascript
import { PLAN_REGISTRY } from '@/lib/saasProductizationConfig';

const plans = Object.values(PLAN_REGISTRY);
// Each plan has: plan_type, display_name, tier_order, setup_fee_usd, monthly_fee_usd
```

## Conversion Flow

```
1. User lands on industry page (e.g., /med-spa)
   ↓
2. Reads industry-specific pain points, use cases, testimonials
   ↓
3. Clicks "Book Demo" or "See Pricing"
   ↓
4. If "Book Demo" → /book (DemoBooking page)
   ↓
5. If "See Pricing" → /pricing (PricingPage with PricingTableWithFeatures)
   ↓
6. Clicks "Get Started" on plan card
   ↓
7. CheckoutButton calls createCheckoutSession (backend)
   ↓
8. Redirects to Stripe Checkout
   ↓
9. After payment → onboarding flow (existing system)
```

## Design System

- **Colors**: Blue primary (#00AEEF), slate grays for text/borders
- **Typography**: Montserrat for headings, Inter for body
- **Spacing**: Consistent padding/margin using Tailwind scale
- **Components**: Reusable cards, buttons, sections
- **Responsive**: Mobile-first, optimized for all viewports

## Key Features

✅ **Industry-Specific Content**: 9 fully tailored industries with distinct messaging  
✅ **SaaS Control Map Integration**: Reads plans/features from centralized config  
✅ **Conversion Optimized**: Clear CTAs, ROI metrics, social proof per industry  
✅ **Mobile Responsive**: Works on all devices  
✅ **Stripe Ready**: Production checkout flow with sandbox detection  
✅ **Maintainable**: All content in one config file; components are reusable  
✅ **Fast**: Lazy loading, minimal dependencies, static content  
✅ **SEO Friendly**: Meta tags, structured data (can add JSON-LD per industry)  

## Data Maintenance

To add/edit industry content:

1. Edit `data/industryMarketingConfig.js`
2. Update industry object in `INDUSTRY_MARKETING_DATA`
3. Fields: slug, industry_name, display_name, hero content, pain points, use cases, ROI metrics, testimonials, features, recommended plan
4. Changes apply immediately to all pages

To update pricing/features shown on industry pages:

1. Edit `lib/saasProductizationConfig.js`
2. Update `PLAN_REGISTRY`, `PLAN_FEATURE_MAPPING`, or `UPGRADE_LOGIC_RULES`
3. Pages automatically reflect updated plans and features

## Backend Functions Required

- `createCheckoutSession` — Creates Stripe checkout session, handles plan/billing selection
- Existing: `getAdminSettings`, `getBillingSummary`, etc. (already implemented)

## Testing Checklist

- [ ] All 9 industry pages load without errors
- [ ] Industry-specific content renders correctly
- [ ] Plan features display correctly (from SaaS config)
- [ ] Checkout button detects iframe (shows warning in preview)
- [ ] Checkout button works in production (redirects to Stripe)
- [ ] Mobile layout is responsive
- [ ] CTA buttons navigate correctly
- [ ] Pricing toggle (monthly/setup) works

## Future Enhancements

- A/B test different CTAs per industry
- Add video testimonials from real customers
- Implement case study detail pages
- Add industry-specific FAQs
- Integrate with analytics platform (GA4)
- Dynamic pricing based on region/seasonality
- Localization for international markets