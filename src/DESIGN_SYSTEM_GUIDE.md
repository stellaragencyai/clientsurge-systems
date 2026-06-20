# ClientSurge Design System

Complete guide for unified UI across Admin Dashboard, Client Portal, Landing Pages, and Analytics.

---

## Core Components

### MetricCard
Displays a key metric with value, status indicator, and optional delta change.

```jsx
import MetricCard from '@/components/design-system/MetricCard';

<MetricCard
  title="Conversion Rate"
  value="2.5"
  unit="%"
  delta={+0.5}
  status="healthy"
  size="md"
/>
```

**Props:**
- `title`: string (metric name)
- `value`: string | number
- `delta`: number | null (change, optional)
- `status`: 'healthy' | 'degraded' | 'failed' | 'unknown'
- `unit`: string (optional, e.g., "%", "$")
- `size`: 'sm' | 'md' | 'lg'

**Status Colors:**
- **healthy** (green): #10B981 — Normal, positive
- **degraded** (yellow): #F59E0B — Caution, needs attention
- **failed** (red): #EF4444 — Critical, immediate action
- **unknown** (gray): #9CA3AF — No data

---

### StatusBadge
Inline status indicator with dot + label.

```jsx
import StatusBadge from '@/components/design-system/StatusBadge';

<StatusBadge status="live" label="Live" size="md" />
```

**Props:**
- `status`: 'healthy' | 'degraded' | 'failed' | 'pending' | 'unknown' | 'live'
- `label`: string
- `size`: 'sm' | 'md'

---

### PanelContainer
Section wrapper with header, title, optional description, and action button.

```jsx
import PanelContainer from '@/components/design-system/PanelContainer';

<PanelContainer
  title="Lead Pipeline"
  description="Real-time overview"
  action={<button>Export</button>}
>
  {/* Content goes here */}
</PanelContainer>
```

**Props:**
- `title`: string
- `description`: string (optional)
- `children`: ReactNode
- `action`: ReactNode (optional)
- `isCollapsible`: boolean
- `isCollapsed`: boolean
- `onToggleCollapse`: function

---

### Button
Unified button with variants.

```jsx
import Button from '@/components/design-system/Button';

<Button variant="primary" size="md">
  Start Setup
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `onClick`: function

---

### AlertBanner
Critical system alerts and revenue leaks.

```jsx
import AlertBanner from '@/components/design-system/AlertBanner';

<AlertBanner
  type="error"
  title="Revenue Leak Detected"
  message="Conversion rate dropped 15% in the last 24 hours."
  action={<Button>View Details</Button>}
  onClose={() => setAlertClosed(true)}
/>
```

**Props:**
- `type`: 'error' | 'warning' | 'success' | 'info'
- `title`: string
- `message`: string
- `action`: ReactNode (optional)
- `onClose`: function

---

## Design Tokens

Import from `@/lib/designSystem`:

```javascript
import {
  TYPOGRAPHY,    // h1–caption styles
  SPACING,        // xs, sm, md, lg, xl, 2xl, 3xl
  COLORS,         // primary, success, warning, danger, neutral
  BORDER_RADIUS,  // sm, md, lg, xl
  SHADOWS,        // subtle, medium, elevated
  HIERARCHY,      // TIER_1, TIER_2, TIER_3 (info ranking)
  COMPONENT_SIZES // button, card, input sizes
  BREAKPOINTS,    // mobile, tablet, desktop, wide, ultraWide
} from '@/lib/designSystem';
```

### Typography Scale
- **h1**: 2–3.5rem (page titles)
- **h2**: 1.5–2.5rem (section titles)
- **h3**: 1.25–1.75rem (subsection titles)
- **h4**: 1.125rem (card titles)
- **body**: 0.9375rem (main text)
- **bodySmall**: 0.875rem (secondary text)
- **caption**: 0.75rem (labels, uppercase)

### Spacing (4px grid)
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **2xl**: 32px
- **3xl**: 48px

### Color System
- **Primary**: #00AEEF (actions, CTAs)
- **Success**: #10B981 (positive metrics)
- **Warning**: #F59E0B (degradation)
- **Danger**: #EF4444 (critical)
- **Foreground**: #0f172a (text)
- **Background**: #ffffff
- **Border**: #e2e8f0

---

## Information Hierarchy

### Tier 1: Critical Action Required
- **Color**: Red (#EF4444)
- **Placement**: Top of page/section
- **Visibility**: Always visible
- **Examples**: Revenue drop alerts, failed integrations, pending approvals

### Tier 2: Insights & Optimization
- **Color**: Blue/Primary (#00AEEF)
- **Placement**: Main content area
- **Visibility**: Always visible
- **Examples**: Conversion opportunities, lead trends, recommendations

### Tier 3: Logs & Raw Data
- **Color**: Neutral/Gray
- **Placement**: Bottom (collapsible)
- **Visibility**: Hidden by default (collapsible)
- **Examples**: Detailed logs, API responses, historical data

---

## Usage Guidelines

### 1. Dashboard Layouts
All dashboards must follow this structure:

```
┌─────────────────────────────────────────┐
│         TIER 1: Critical Alerts         │
├─────────────────────────────────────────┤
│  TIER 2: Metrics Grid (MetricCards)     │
│  - 3–4 columns on desktop               │
│  - 2 columns on tablet                  │
│  - 1 column on mobile                   │
├─────────────────────────────────────────┤
│  TIER 2: Main Insights (PanelContainers)│
│  - Charts, tables, analytics            │
├─────────────────────────────────────────┤
│  TIER 3: Details (Collapsible Panels)   │
│  - Logs, debug info, exports            │
└─────────────────────────────────────────┘
```

### 2. Metric Cards Grid
Use CSS Grid for consistent spacing:

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: SPACING.lg,
  marginBottom: SPACING.xl,
}}>
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
</div>
```

### 3. CTA Buttons
All primary actions use `Button variant="primary"`:

```jsx
<Button variant="primary" size="md" onClick={handleStart}>
  Start Setup
</Button>
```

### 4. Status Indicators
All system states use StatusBadge:

```jsx
<StatusBadge status="healthy" label="Healthy" size="md" />
```

### 5. Consistent Padding
All sections must use SPACING tokens:

```jsx
<div style={{ padding: SPACING.xl, marginBottom: SPACING.xl }}>
  Content here
</div>
```

---

## Migration Checklist

- [ ] Replace all ad-hoc MetricCard implementations with `MetricCard` component
- [ ] Replace all status indicators with `StatusBadge`
- [ ] Wrap all dashboard sections with `PanelContainer`
- [ ] Update all buttons to use `Button` component
- [ ] Add `AlertBanner` to critical alert areas
- [ ] Standardize spacing using SPACING tokens
- [ ] Update typography to use TYPOGRAPHY scale
- [ ] Apply color system to all UI elements
- [ ] Test responsiveness on mobile, tablet, desktop
- [ ] Review information hierarchy (Tier 1 > Tier 2 > Tier 3)

---

## Examples

### Admin Dashboard Metrics Section
```jsx
import { SPACING } from '@/lib/designSystem';
import MetricCard from '@/components/design-system/MetricCard';

<div style={{ marginBottom: SPACING.xl }}>
  <h2>Live Metrics</h2>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: SPACING.lg,
  }}>
    <MetricCard title="Leads Today" value={42} status="healthy" />
    <MetricCard title="Conversion Rate" value="2.5" unit="%" delta={+0.5} status="healthy" />
    <MetricCard title="Avg Response Time" value={4.2} unit="min" delta={-0.8} status="healthy" />
    <MetricCard title="Bounced Leads" value={3} status="degraded" />
  </div>
</div>
```

### Critical Alert at Top
```jsx
import AlertBanner from '@/components/design-system/AlertBanner';

<AlertBanner
  type="error"
  title="Revenue Leak"
  message="Checkout conversion dropped 20% in the last 6 hours. Investigate immediately."
/>
```

---

## Next Steps

1. **Audit existing dashboards** — identify duplicate/inconsistent components
2. **Replace incrementally** — convert one dashboard at a time
3. **Test responsiveness** — validate on all breakpoints
4. **Document customizations** — if a dashboard needs unique styling, document it
5. **Monthly review** — ensure new features follow the design system