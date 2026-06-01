# Base44 Donor Merge Audit

Last updated: 2026-06-01

## Source Roles

- Production spine: `C:\Users\nolan\Code\ClientSurge\clientsurge-systems`
- Donor export: `C:\Users\nolan\Documents\base44-eject-clientsurge`
- Production Base44 app: `69dc4a79656fdba136d413d3`
- Donor/staging Base44 app: `69f959e2bc665e019e19840c`

Production remains authoritative for source code, tests, release scripts, docs, app identity, and the live domain. The donor export is used as a metadata and feature-slice donor only.

## Imported Safely

- Base44 function metadata for every production function entry:
  - `242` production `entry.ts` files now have matching `function.jsonc`.
  - `169` metadata files were donor-backed.
  - `73` metadata files were generated for production-only functions.
- Stripe connector metadata:
  - `base44/connectors/stripe.jsonc`
  - Contains connector type/scopes only, no secrets.
- Repeatable sync command:
  - `npm run base44:sync-metadata`
  - `npm run base44:sync-metadata -- --write`
- Repeatable donor audit command:
  - `npm run base44:audit-donor`

This keeps the richer production function implementations while making the Base44 source inventory explicit and reproducible across both apps and both computers.

## Intentionally Not Imported

- Donor local identity files:
  - `.env.local`
  - `base44/.app.jsonc`
  - account/session data
- Donor `_shared/installPipeline/entry.ts`:
  - Production already has the canonical shared implementation at `base44/functions/_shared/installPipeline.js`.
  - Production also has the live callable `base44/functions/installPipeline/entry.ts` with timeout, runtime, and package activation coverage.
  - Copying the donor shared entry would create a competing shared install pipeline path.
- Donor `src/pages/*.jsx` legacy page copies:
  - Production has moved these into the current route structure under `src/internal-pages`, `src/legacy-pages`, and the current public pages.
  - Production has stronger coverage and route guards around admin, portal, public routes, checkout truth, and publish automation.
  - Copying donor pages directly would reintroduce older route names and duplicate admin/client surfaces.

## Remaining Donor-Only Files After Metadata Import

Base44:

- `base44/functions/_shared/installPipeline/entry.ts`
- `base44/functions/_shared/installPipeline/function.jsonc`

Source pages:

- `src/pages/AdminAutomation.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/AdminInstallGuide.jsx`
- `src/pages/AdminLeadDetail.jsx`
- `src/pages/AdminLeads.jsx`
- `src/pages/AdminOnboarding.jsx`
- `src/pages/AdminSettings.jsx`
- `src/pages/AutomationsDemo.jsx`
- `src/pages/BusinessSetup.jsx`
- `src/pages/CaptureLeads.jsx`
- `src/pages/Chiropractic.jsx`
- `src/pages/ClientDashboard.jsx`
- `src/pages/ClientPortal.jsx`
- `src/pages/Contractors.jsx`
- `src/pages/CredentialsSetup.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Dental.jsx`
- `src/pages/HVAC.jsx`
- `src/pages/LeadIntelligence.jsx`
- `src/pages/LegalPage.jsx`
- `src/pages/MedSpa.jsx`
- `src/pages/MedSpaDashboard.jsx`
- `src/pages/Onboarding.jsx`
- `src/pages/OrderSuccess.jsx`
- `src/pages/Roofing.jsx`
- `src/pages/Sam.jsx`
- `src/pages/Success.jsx`
- `src/pages/ThankYou.jsx`
- `src/MASTER_TASK_LIST_250.md`

These are audit-tracked, not silently ignored. Import them only as scoped feature slices if a current production route or tested workflow needs a missing behavior.

## Current Verification

- `npm run base44:sync-metadata`
- `npm run base44:audit-donor`
- `node --test tests/base44PublishAutomation.test.js`
- `npm run sync:status`
