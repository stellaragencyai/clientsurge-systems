# Communication Preferences — CI and Live Provisioning Audit

Date: 2026-07-11
Repository: `stellaragencyai/clientsurge-systems`
App ID: `69dc4a79656fdba136d413d3`

## Scope

This audit closes the two previously disclosed verification gaps:

1. No CI workflow had been attached to the communication-preferences implementation.
2. Repository inspection alone could not prove that the live Base44 app had provisioned the new entities and functions.

## GitHub CI Status

A dedicated workflow now exists at:

`.github/workflows/communication-preferences-ci.yml`

The workflow runs on relevant pushes, pull requests, and manual dispatch. It performs:

- `npm ci`
- communication-preference tests
- lint
- production build

Workflow commit:

`34e9db6e4adfcb7bf7846f5c219317401c6c08f7`

### Current verification result

GitHub returned no combined status checks and no pull-request workflow runs for the commit at the time of this audit. Therefore the workflow file is present, but a successful execution is not yet proven.

## Base44 Live Provisioning Status

The live app was queried directly for these entity schemas:

- `CommunicationPreference`
- `CommunicationPreferenceHistory`

### Result

Base44 returned zero matching schemas.

### Verdict

**NOT PROVISIONED IN THE LIVE APP**

The repository contains the entity definitions and backend functions, but the live Base44 environment does not currently expose the two preference entities. The client-dashboard settings UI must not be treated as production-ready until live provisioning succeeds.

## Required Release Actions

1. Run the existing GitHub-to-Base44 backend publish/sync process.
2. Re-query Base44 and confirm both entity schemas exist.
3. Confirm these functions are deployed and callable:
   - `getCommunicationPreferences`
   - `updateCommunicationPreferences`
4. Log into a real client portal and perform an end-to-end save test.
5. Confirm a `CommunicationPreferenceHistory` record is created.
6. Confirm the communication eligibility guard blocks disabled channels before provider calls.
7. Re-run the GitHub CI workflow and capture a green result.

## Release Gate

This phase is complete only when all items below are true:

- [x] Repository entity definitions exist
- [x] Repository backend functions exist
- [x] Client dashboard UI exists
- [x] Dedicated CI workflow exists
- [ ] CI workflow has passed
- [ ] Base44 entity schemas are provisioned
- [ ] Base44 functions are deployed
- [ ] Live client save test passes
- [ ] Consent history record is created
- [ ] Outbound send paths enforce preferences

## Current Overall Verdict

**REPOSITORY READY / LIVE DEPLOYMENT BLOCKED**
