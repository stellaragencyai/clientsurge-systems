# SaaS Layer Implementation Guide

## Overview

ClientSurge now operates as a true multi-tenant SaaS platform using existing infrastructure without rewrites. This document defines the tenant isolation model, data flow, and integration points.

---

## 1. Tenant Boundary Definition

### Primary Tenant Keys
- **Client ID** (`client_id`): Root tenant container
- **ClientProject ID** (`client_project_id`): Sub-tenant for multi-project clients

### Tenant Isolation Rules

All queries must include tenant filtering:

```javascript
// WRONG: Queries all tenants globally
const leads = await base44.entities.Leads.list();

// RIGHT: Filters by tenant context
import { getTenantLeads } from '@/lib/tenantQueryHelpers';
const leads = await getTenantLeads(tenantFilter);
```

### Entities with Tenant Boundaries

| Entity | Filter By | Notes |
|--------|-----------|-------|
| `Leads` | `client_id` + `client_project_id` | Primary CRM |
| `CommunicationEvent` | `client_id` + `client_project_id` | Audit log |
| `ConversationThread` | `client_id` | Thread grouping |
| `Messages` | `lead_id` (resolve via Leads) | Message history |
| `Order` | `client_id` + `client_project_id` | Billing scope |
| `Subscription` | `client_id` | Subscription scope |
| `WebsiteLead` | `client_project_id` | Legacy bridge |

### Entities WITHOUT Tenant Boundaries (Admin-Only)

| Entity | Access |
|--------|--------|
| `Client` | Admin reads all, non-admin filters by email |
| `ClientProject` | Admin reads all, non-admin filters by client_id |
| `Subscription` | Admin reads all |
| `Order` | Admin reads all |
| `ClientInstallationOS` | Admin only |

---

## 2. Architecture Components

### A. Tenant Context Hook (`lib/useTenantContext.js`)

Manages tenant selection and provides filter builders.

```javascript
import { useTenantContext } from '@/lib/useTenantContext';

function MyComponent() {
  const { selectedClientId, selectedProjectId, getTenantFilter, isAdmin } = useTenantContext();

  // Get filter for queries
  const filter = getTenantFilter(); // { client_id: '...', client_project_id: '...' }
}
```

**Key behaviors:**
- **Admins**: Can switch between any Client/Project or view globally (no filter)
- **Non-admins**: Automatically scoped to their Client (filtered by email)

### B. Tenant Query Helpers (`lib/tenantQueryHelpers.js`)

Utility functions for filtering common entities:

```javascript
import { getTenantLeads, getTenantCommunicationEvents } from '@/lib/tenantQueryHelpers';

// Usage
const filter = tenantContext.getTenantFilter();
const leads = await getTenantLeads(filter, '-created_date', 100);
const events = await getTenantCommunicationEvents(filter, '-created_date', 100);
```

### C. Tenant Switcher Component (`components/mission-control/TenantSwitcher.jsx`)

Admin-only UI for switching between clients/projects. Automatically updates all dependent views.

### D. SaaS Admin Panel (`internal-pages/SaaSAdminPanel.jsx`)

Global admin dashboard showing:
- All Clients with status overview
- Projects per Client with activation status
- Subscription and Order status
- Quick access to client portals

**Route**: `/saas/admin` (admin-only)

### E. Mission Control Enhancement

Integrated `TenantSwitcher` into Mission Control Dashboard:
- Shows tenant selection UI (admin only)
- Scopes all data feeds to selected tenant
- Displays confirmation banner when scoped

---

## 3. User Access Model

### Admin Users (`role: 'admin'` or `role: 'super_admin'`)

**Capabilities:**
- View all Clients and ClientProjects
- Switch between tenants using `TenantSwitcher`
- Access `/mission-control` with full cross-tenant visibility
- Access `/saas/admin` for global overview
- Can view data with or without tenant filter (global view)

**Data Access:**
```javascript
// Admins can see all data
const filter = getTenantFilter(); // {} when no tenant selected
const allLeads = await getTenantLeads(filter); // All tenants
```

### Client Users (`role: 'user'`)

**Capabilities:**
- View only their assigned Client's data
- Cannot switch tenants
- Cannot access `/mission-control` (403 Forbidden)
- Cannot access `/saas/admin` (403 Forbidden)
- View `/client-portal` with automatic tenant scoping

**Data Access:**
```javascript
// Non-admins always scoped to their client
const filter = getTenantFilter(); // { client_id: userClientId }
const leads = await getTenantLeads(filter); // Only their data
```

---

## 4. Integration Safety Guarantees

### ✅ PRESERVED (No Changes)

1. **Cloudflare Workers**: No modifications to webhook processing
2. **Twilio Integration**: `receiveTwilioInboundSms` works unchanged
3. **CommunicationEvent Schema**: No structural changes
4. **Webhook Logic**: No changes to ingestion or routing
5. **Backend Functions**: All existing functions work as-is

### ✅ SAFE MODIFICATIONS

1. **Query Filtering**: Added tenant filters at query layer only
2. **UI Segmentation**: Mission Control and dashboards now tenant-aware
3. **Access Control**: RLS enforced via TenantProvider (not DB-level)

### ✅ BACKWARD COMPATIBILITY

- Existing admin workflows still access all data globally
- Client-scoped queries are backward compatible (filter is optional)
- No breaking changes to entity schemas or APIs

---

## 5. Implementation Checklist

### Phase 1: Core Layer (✅ Complete)

- [x] TenantProvider context wrapper
- [x] TenantContext hook for tenant selection
- [x] Tenant query helpers for common entities
- [x] TenantSwitcher UI component
- [x] App.jsx integration with TenantProvider

### Phase 2: Dashboard Integration (✅ Complete)

- [x] Mission Control with tenant switcher
- [x] Tenant-scoped data views
- [x] SaaS Admin Panel for global overview
- [x] Route `/saas/admin` for admin access

### Phase 3: Future Enhancements (Optional)

- [ ] Database-level RLS rules (additional security layer)
- [ ] Audit logging for tenant access (compliance)
- [ ] Tenant usage metrics dashboard
- [ ] Client-level role delegation (sub-admins)
- [ ] Batch tenant operations (admin bulk actions)

---

## 6. Data Flow Example

### Creating a Lead as Non-Admin User

```
User submits contact form
  ↓
`submitLeadCapture` backend function
  ↓
Lead record created with `client_id` + `client_project_id`
  ↓
CommunicationEvent logged (audit trail)
  ↓
User navigates to Client Portal
  ↓
`useTenantContext` auto-scopes to their client_id
  ↓
Leads displayed only for their client
  ↓
All subsequent queries use tenant filter automatically
```

### Switching Tenants as Admin

```
Admin clicks TenantSwitcher → "Select Client"
  ↓
`setSelectedClientId(newClientId)` triggered
  ↓
`useTenantContext` recalculates `getTenantFilter()`
  ↓
All dependent components re-render with new filter
  ↓
Mission Control feeds automatically refresh with new tenant data
```

---

## 7. Testing Tenant Isolation

### Manual Testing

1. **Admin Cross-Tenant Visibility:**
   - Log in as admin
   - Navigate to `/mission-control`
   - Use TenantSwitcher to switch clients
   - Verify data changes per selection

2. **Non-Admin Isolation:**
   - Log in as client user
   - TenantSwitcher should be hidden
   - All data automatically scoped
   - Attempt to access `/saas/admin` → 403 Forbidden

3. **Global Admin View:**
   - Admin: Don't select a tenant
   - Verify all leads/events from all clients displayed
   - Scoping banner should not show

### Automated Testing (Future)

```javascript
test('Non-admin users see only their tenant data', async () => {
  const filter = tenantContext.getTenantFilter();
  expect(filter).toEqual({ client_id: userClientId });
});

test('Admin users see all data when no tenant selected', async () => {
  // Admin: don't select tenant
  const filter = tenantContext.getTenantFilter();
  expect(filter).toEqual({});
});
```

---

## 8. Troubleshooting

### Issue: User sees another tenant's data

**Cause**: Query not using tenant filter

**Fix**: 
```javascript
// BEFORE (broken)
const leads = await base44.entities.Leads.list();

// AFTER (fixed)
const filter = tenantContext.getTenantFilter();
const leads = await getTenantLeads(filter);
```

### Issue: Tenant switcher doesn't appear for admin

**Cause**: Mission Control not wrapped in TenantProvider

**Fix**: Verify App.jsx has `<TenantProvider>` wrapping routes

### Issue: Non-admin user is scoped but still sees other data

**Cause**: Component bypassing useTenantContext

**Fix**: Ensure all dashboard components use `useTenantContext()` and pass filter to queries

---

## 9. Future Roadmap

1. **Database-Level RLS**: Move tenant enforcement to PostgreSQL RLS policies
2. **Tenant Usage Analytics**: Track per-tenant resource consumption
3. **Client Sub-Admins**: Allow clients to delegate limited admin roles
4. **API Keys**: Per-tenant API access for integrations
5. **Audit Log Compliance**: HIPAA/SOC2 compliance for tenant access logs

---

## 10. References

- **Core Hook**: `lib/useTenantContext.js`
- **Query Helpers**: `lib/tenantQueryHelpers.js`
- **Components**: `components/mission-control/TenantSwitcher.jsx`
- **Admin Panel**: `internal-pages/SaaSAdminPanel.jsx`
- **Enhanced Dashboard**: `internal-pages/MissionControlDashboard.jsx`
- **Entity Reference**: See `SYSTEM_ENTITY_REFERENCE.md` for complete entity structure
- **Architecture**: See `ARCHITECTURE_SYSTEM_OF_TRUTH.md` for data flow

---

**Status**: ✅ Production-ready SaaS layer with zero breaking changes to existing systems.