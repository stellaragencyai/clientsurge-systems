# SaaS Agency Layer — Multi-Client White-Label Architecture

Lightweight multi-tenant agency extension enabling ClientSurge to support agencies managing multiple client accounts with basic white-label branding and provisioning workflows.

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│          ClientSurge Platform                   │
│     (Original single-client functionality)      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│        SaaS Agency Layer (NEW)                   │
│  (Multi-client management + white-label)        │
└─────────────────────────────────────────────────┘
            ↓                       ↓
┌──────────────────────┐  ┌──────────────────────┐
│  AgencyWorkspace     │  │  WhiteLabelConfig    │
│  (Agency account)    │  │  (Custom branding)   │
└──────────────────────┘  └──────────────────────┘
            ↓                       
┌──────────────────────┐  
│   AgencyClient       │  
│  (Client 1)          │  
│  (Client 2)          │  
│  (Client N)          │  
└──────────────────────┘
            ↓
┌──────────────────────┐
│  ClientProvisioningPipeline
│  (Setup workflow)    │
└──────────────────────┘
            ↓
┌──────────────────────┐
│ AgencyPerformanceDashboard
│ (Aggregated metrics) │
└──────────────────────┘
```

---

## Entities

### 1. AgencyWorkspace
Represents a single agency account managing multiple clients.

**Key Fields:**
- `agency_id`: Unique identifier
- `agency_name`: Human-readable agency name
- `owner_email`: Primary contact
- `plan_type`: starter (1 client) | growth (10 clients) | enterprise (unlimited)
- `status`: onboarding | active | paused | suspended
- `total_clients`: Count of managed clients
- `clients_limit`: Max clients allowed for plan
- `revenue_mtd`: Monthly revenue from all clients
- `stripe_customer_id`: Billing reference
- `white_label_enabled`: White-label branding access

**Usage:**
```javascript
// Get agency workspace
const agency = await base44.entities.AgencyWorkspace.filter({
  owner_email: "agency@example.com",
  status: "active"
});

console.log(`Managing ${agency[0].total_clients} clients`);
```

### 2. AgencyClient
Links a client business to an agency workspace.

**Key Fields:**
- `agency_client_id`: Unique relationship identifier
- `agency_id`: Reference to parent agency
- `client_id`: Reference to Client entity
- `business_name`: Client's business name
- `industry`: Vertical served (roofing, hvac, dental, etc.)
- `status`: onboarding | active | paused | offboarded
- `subscription_plan`: starter_system | growth_system | elite_system
- `monthly_revenue`: MRR from this client
- `leads_generated`: Total leads for this client
- `active_automations`: Number of active systems

**Usage:**
```javascript
// List all clients for an agency
const clients = await base44.entities.AgencyClient.filter({
  agency_id: "agency-123"
});

// Calculate total revenue
const totalRevenue = clients.reduce((sum, c) => sum + c.monthly_revenue, 0);
```

### 3. ClientProvisioningPipeline
Tracks the setup workflow when adding a new client.

**Key Fields:**
- `provisioning_id`: Unique identifier
- `agency_id`: Reference to agency
- `client_id`: Reference to client being set up
- `status`: pending | in_progress | completed | failed
- `progress_percent`: Overall progress (0-100)
- `steps`: Object with status of each step:
  - `stripe_setup`: Billing configuration
  - `landing_pages_setup`: Deploy landing pages
  - `automations_setup`: Configure automation systems
  - `onboarding_setup`: Ready email/SMS sequences
- `started_at`: When provisioning began
- `completed_at`: When provisioning finished
- `failure_reason`: Details if failed

**Usage:**
```javascript
// Get provisioning status for new client
const provisioning = await base44.entities.ClientProvisioningPipeline.filter({
  client_id: "client-123"
});

console.log(`Progress: ${provisioning[0].progress_percent}%`);
console.log(`Stripe setup: ${provisioning[0].steps.stripe_setup.status}`);
```

### 4. WhiteLabelBrandingConfig
Stores white-label customization per agency.

**Key Fields:**
- `branding_id`: Unique identifier
- `agency_id`: Reference to agency
- `brand_name`: Custom brand name (replaces "ClientSurge")
- `logo_url`: Agency's logo
- `favicon_url`: Custom favicon
- `primary_color`: Brand color (hex)
- `secondary_color`: Secondary color (hex)
- `support_email`: Custom support email
- `support_phone`: Custom support phone
- `custom_domain`: White-label domain (e.g., clients.myagency.com)
- `email_signature`: Custom email footer
- `terms_url`: Custom terms of service
- `privacy_url`: Custom privacy policy
- `is_active`: Whether white-label is enabled

**Usage:**
```javascript
// Get agency branding
const branding = await base44.entities.WhiteLabelBrandingConfig.filter({
  agency_id: "agency-123"
});

if (branding[0].is_active) {
  document.title = branding[0].brand_name;
  // Apply branding colors to UI
  document.documentElement.style.setProperty('--primary-color', branding[0].primary_color);
}
```

### 5. AgencyPerformanceDashboard
Aggregated metrics for agency-level visibility.

**Key Fields:**
- `dashboard_id`: Unique identifier
- `agency_id`: Reference to agency
- `report_period`: weekly | monthly | quarterly | yearly
- `total_clients`: Count of all clients
- `active_clients`: Count of active clients
- `total_leads`: Leads across all clients
- `total_revenue`: Revenue from all clients
- `mrr`: Monthly recurring revenue
- `arr`: Annual recurring revenue (MRR × 12)
- `avg_client_value`: Average revenue per client
- `avg_conversion_rate`: Average conversion rate
- `churn_rate`: % clients lost
- `new_clients_this_period`: New signups
- `top_client_by_revenue`: Best performer
- `worst_performing_client`: Lowest performer

**Usage:**
```javascript
// Get monthly performance snapshot
const dashboard = await base44.entities.AgencyPerformanceDashboard.filter({
  agency_id: "agency-123",
  report_period: "monthly"
});

console.log(`Agency MRR: $${dashboard[0].mrr}`);
console.log(`Avg client value: $${dashboard[0].avg_client_value}`);
```

---

## Workflow: Adding a New Client

### 1. Create AgencyClient Entry
```javascript
const newClient = await base44.entities.AgencyClient.create({
  agency_client_id: "agc-123",
  agency_id: "agency-123",
  client_id: "client-456",
  business_name: "Acme Roofing",
  industry: "roofing",
  status: "onboarding",
  subscription_plan: "growth_system"
});
```

### 2. Initialize Provisioning Pipeline
```javascript
const provisioning = await base44.entities.ClientProvisioningPipeline.create({
  provisioning_id: "prov-123",
  agency_id: "agency-123",
  client_id: "client-456",
  status: "pending",
  steps: {
    stripe_setup: { status: "pending" },
    landing_pages_setup: { status: "pending" },
    automations_setup: { status: "pending" },
    onboarding_setup: { status: "pending" }
  },
  started_at: new Date().toISOString()
});
```

### 3. Run Provisioning Steps (Background Job)
Each step executes asynchronously:

**Step 1: Stripe Setup**
- Create Stripe customer for client
- Configure subscription for selected plan
- Set up billing email

**Step 2: Landing Pages Setup**
- Deploy industry-specific landing pages
- Configure GA4 tracking
- Verify page health

**Step 3: Automations Setup**
- Enable lead capture workflows
- Configure SMS/email sequences
- Set up webhook endpoints

**Step 4: Onboarding Setup**
- Prepare onboarding email sequence
- Generate client portal access
- Send welcome materials

### 4. Update Provisioning Status
```javascript
await base44.entities.ClientProvisioningPipeline.update("prov-123", {
  status: "completed",
  progress_percent: 100,
  completed_at: new Date().toISOString()
});

// Mark client as active
await base44.entities.AgencyClient.update("agc-123", {
  status: "active",
  activated_at: new Date().toISOString()
});

// Update agency client count
await base44.entities.AgencyWorkspace.update("agency-123", {
  active_clients: 3,
  total_clients: 3
});
```

---

## Plan Tiers & Limits

### Starter Plan
- Max 1 client
- Basic white-label (custom email only)
- Monthly: $199
- Client features: SMS + Email + Basic landing page

### Growth Plan
- Max 10 clients
- Full white-label (logo, colors, domain)
- Monthly: $799
- Client features: SMS + Email + 9 industry pages + Automations

### Enterprise Plan
- Unlimited clients
- Custom white-label + API access
- Custom pricing
- Dedicated support + Advanced features

---

## Data Isolation & Multi-Tenancy

### Agency Isolation
Each agency sees only:
- Their own workspace data (AgencyWorkspace)
- Their own clients (AgencyClient)
- Their own branding (WhiteLabelBrandingConfig)
- Their own metrics (AgencyPerformanceDashboard)

**RLS Rules:**
```
AgencyWorkspace: Admin only, OR owner_email == user.email
AgencyClient: Admin only
AgencyPerformanceDashboard: Admin only
```

### Client Isolation
Each client (AgencyClient) can see:
- Their own lead list
- Their own automation status
- Their own revenue/metrics
- (Client portal shows client-specific data only)

---

## White-Label Implementation

### For Agencies
1. **Create branding config:**
```javascript
const branding = await base44.entities.WhiteLabelBrandingConfig.create({
  branding_id: "brand-123",
  agency_id: "agency-123",
  brand_name: "Digital Growth Pro",
  logo_url: "https://...",
  primary_color: "#0066CC",
  support_email: "support@myagency.com",
  custom_domain: "clients.myagency.com",
  is_active: true
});
```

2. **Apply branding in UI** (pseudo-code):
```javascript
// Load branding
const branding = await getBranding(agencyId);

// Apply to document
if (branding?.is_active) {
  document.title = branding.brand_name;
  applyColors(branding.primary_color, branding.secondary_color);
  updateLogo(branding.logo_url);
  updateSupportContact(branding.support_email);
}
```

### For Clients
Clients see agency's custom branding in:
- Client portal header
- Email communications
- Landing pages
- Dashboard

---

## Agency Performance Metrics

**Monthly/Weekly Snapshots:**
```javascript
// Generate monthly dashboard
const dashboard = {
  agency_id: "agency-123",
  report_period: "monthly",
  period_start_date: "2026-06-01",
  period_end_date: "2026-06-30",
  total_clients: 5,
  active_clients: 4,
  total_leads: 487,
  total_revenue: 18500,
  mrr: 18500,
  arr: 222000,
  avg_client_value: 3700,
  avg_conversion_rate: 2.8,
  churn_rate: 0,
  new_clients_this_period: 1,
  top_client_by_revenue: "Acme Roofing",
  worst_performing_client: "Local HVAC"
};

await base44.entities.AgencyPerformanceDashboard.create(dashboard);
```

---

## Provisioning Checklist

When adding a new client, complete these steps:

**Pre-Provisioning:**
- [ ] Verify subscription plan selected
- [ ] Confirm client contact information
- [ ] Validate agency client limit not exceeded

**Provisioning:**
- [ ] Create AgencyClient record
- [ ] Initialize ClientProvisioningPipeline
- [ ] Stripe: Create customer + subscription
- [ ] Landing Pages: Deploy 1-9 pages per plan
- [ ] Automations: Configure SMS/email workflows
- [ ] Onboarding: Generate portal + send welcome

**Post-Provisioning:**
- [ ] Mark client as "active"
- [ ] Update agency metrics
- [ ] Send activation confirmation to client
- [ ] Log provisioning completion

**If Provisioning Fails:**
- [ ] Log failure reason
- [ ] Update provisioning status to "failed"
- [ ] Notify admin
- [ ] Provide manual remediation steps

---

## Success Criteria

✅ **Agencies can manage multiple clients**
- AgencyClient records link clients to agencies
- One AgencyWorkspace can have N clients

✅ **Provisioning is automated**
- ClientProvisioningPipeline tracks setup steps
- Each step (Stripe, landing pages, automations) is independent
- Workflow completes end-to-end

✅ **White-label branding is supported**
- WhiteLabelBrandingConfig stores customization
- Agency can customize brand name, colors, logo, domain, support contact

✅ **Agency metrics are visible**
- AgencyPerformanceDashboard aggregates MRR, leads, client count
- Agency owner can see portfolio-level metrics

✅ **System remains compatible**
- Existing ClientSurge features unchanged
- Agency layer is additive (new entities, not modifications)
- Agencies can use all existing automation, lead, and revenue features

---

## Future Enhancements

1. **Revenue Sharing:** Calculate agency commission on client revenue
2. **Team Management:** Allow agencies to add team members with role-based access
3. **Custom Webhooks:** Agencies can define custom integration endpoints
4. **Advanced Analytics:** Agency-level attribution, forecasting, benchmarking
5. **API Access:** REST API for agencies to build custom integrations
6. **Multi-Currency:** Support agencies operating in different regions

---

## Integration with Existing Systems

The agency layer is **non-invasive**:
- No changes to Leads, Orders, Automations, or Communication entities
- No changes to client dashboard or admin interface
- Agency features are opt-in (create AgencyWorkspace to use)
- Existing single-client deployment still works as before

**Data Flow:**
```
Client creates Lead → (agencyId implicit) → Lead stored
Agency dashboard aggregates Leads by AgencyClient → metrics displayed
``