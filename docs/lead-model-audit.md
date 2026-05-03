# Lead Model Audit

## Boundary rules

- `Leads` is the canonical paid-customer CRM and automation lead model.
- `WebsiteLead` is reserved for the ClientSurge platform website funnel only.
- `Lead` is legacy discovery data and is not approved for launch-critical paid-customer runtime.
- Customer-facing lead actions should log `CommunicationEvent` against canonical `lead_id` when they operate on `Leads`.
- Platform website funnel activity should log `CommunicationEvent.website_lead_id` and stay isolated from customer CRM runtime.

## CUSTOMER-CANONICAL using `Leads`

- `base44/functions/getLeadPipelineSummary/entry.ts`
- `base44/functions/webhookLeadCapture/entry.ts`
- `base44/functions/_shared/leadPipeline.js`
- `base44/functions/_shared/customerLeadIngestion.js`
- `base44/functions/_shared/dripCampaign.js`
- `base44/functions/triggerFollowUpSequence/entry.ts`
- `base44/functions/updateLeadStatus/entry.ts`
- `base44/functions/manageLeadNotes/entry.ts`
- `base44/functions/routeLead/entry.ts`
- `base44/functions/scoreLeads/entry.ts`
- `base44/functions/syncLeadToCRM/entry.ts`
- `base44/functions/processDripCampaigns/entry.ts`
- `base44/functions/sendTestLead/entry.ts`
- `base44/functions/_shared/installRuntime.js`
- `base44/functions/getAdminAnalytics/entry.ts`
- `src/pages/AdminDashboard.jsx`
- `src/pages/AdminLeads.jsx`
- `src/pages/AdminLeadDetail.jsx`
- `src/components/admin/LeadManagementDashboard.jsx`
- `src/components/admin/AnalyticsDashboard.jsx`

## PLATFORM-WEBSITE-ONLY using `WebsiteLead`

- `base44/entities/WebsiteLead.jsonc`
- `base44/functions/submitLeadCapture/entry.ts`
- `base44/functions/submitContactInquiry/entry.ts`
- `base44/functions/scheduleDemoBooking/entry.ts`
- `base44/functions/trackContactFormCompletion/entry.ts`
- `base44/functions/createDemoCalendarEvent/entry.ts`

## LEGACY using `Lead`

- `base44/entities/Lead.jsonc`
- `base44/functions/discoverLeads/entry.ts`
- `base44/functions/calculateLeadAnalytics/entry.ts`
- `src/pages/LeadIntelligence.jsx`
- `src/pages/MedSpaDashboard.jsx`
- `src/pages/Dashboard.jsx`
- `src/components/leads/LeadsTableIntelligence.jsx`
- `src/components/leads/LeadDetail.jsx`

## Quarantined legacy runtime endpoints

- `base44/functions/sendLeadConfirmationEmail/entry.ts`
- `base44/functions/sendAdminLeadNotification/entry.ts`
- `base44/functions/sendFollowUpEmail/entry.ts`
- `base44/functions/onLeadCreated/entry.ts`
- `base44/functions/handleBookingTrigger/entry.ts`
- `base44/functions/sendBookingEmail/entry.ts`
- `base44/functions/sendBookingLinkSMS/entry.ts`

These now return legacy quarantine responses instead of operating on deprecated `Lead` runtime paths.

## AMBIGUOUS / needs follow-up

- Generic marketing copy still uses the word "lead" in the normal business sense. That language is not model-binding by itself, but admin and runtime surfaces should continue using explicit labels where operators could confuse data models.
- Order-scoped ingestion credentials now exist in the data model, but credential provisioning and rotation are still operational concerns rather than a completed admin UX.
