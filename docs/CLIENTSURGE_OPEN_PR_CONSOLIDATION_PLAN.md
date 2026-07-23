# ClientSurge Open PR Consolidation Plan

Parent program: #1346  
Execution issue: #1347

## Objective

Stop overlapping branches from independently owning authentication, activation, design-system, communications, release, data-quality, and homepage behavior. This plan classifies the currently active work and establishes the order in which it may enter the authoritative ClientSurge OS program.

## Governing rules

1. `main` remains the production source of truth.
2. No stale branch is merged directly while materially behind `main`.
3. Product-surface work must be rebased or recreated on current `main` after the blueprint foundation is accepted.
4. One branch owns one customer-facing route or contract at a time.
5. Runtime changes require build, targeted tests, and route-specific smoke evidence.
6. Homepage work remains deferred until the purchase, activation, Command Center, billing, and admin operating environment are established.
7. Platform-specific release tooling may remain only where it is required to deploy the GitHub-built artifact; it is not the product development source of truth.

## Current classifications

### PR #1352 — Blueprint foundation and modernization audit

**Classification: KEEP — merge first**

Reason: documentation-only, current-main based, establishes the authoritative product, architecture, and execution model without runtime risk.

Required gate:

- Review documents for alignment.
- Merge before opening major replacement implementation branches.

### PR #1345 — Design System v2 brand tokens and atmospheric primitives

**Classification: REVISE / PORT SELECTIVELY**

Reason:

- Contains useful tokens, design-system primitives, and login migration work.
- It is a stacked branch containing authentication and activation history.
- It is substantially behind current `main`.
- Its first version overweights the dark atmospheric environment relative to the now-locked white-dominant product workspace.

Action:

- Do not merge the branch directly.
- Port reusable tokens and components into the new current-main branch for #1348.
- Retain dark atmospheric surfaces only for authentication, marketing, launch moments, and selected brand panels.
- Rebuild normal product surfaces around white workspace, navy navigation, and controlled electric-blue emphasis.

### PR #1335 — Premium credentials wizard entry experience

**Classification: REVISE / PORT INTO #1350**

Reason:

- Contains useful wizard primitives and credentials-flow work.
- Branch has diverged from its parent and is behind current `main`.
- Its components should be evaluated against the canonical activation data model before reuse.

Action:

- Do not merge as a stacked PR.
- Port qualified components and interaction patterns into the authoritative activation branch created from current `main`.
- Preserve order verification and secure credential contracts.

### PR #1334 — Premium business setup experience

**Classification: REVISE / PORT INTO #1350**

Reason:

- Contains a useful redesign of Business Setup and Quick Setup Wizard.
- It is stacked on stale authentication work and behind current `main`.

Action:

- Recreate the accepted experience on the authoritative activation branch.
- Keep business logic and initialize-business contracts stable unless separately migrated and tested.

### PR #1330 — Authentication experience sprint

**Classification: REVISE / PORT INTO AUTHENTICATION WORKSTREAM**

Reason:

- Contains broad auth-page, modal, forgot-password, signup, and reset-password work.
- Branch is materially behind `main` and overlaps with #1345.

Action:

- Do not merge directly.
- Use it as the source candidate for auth UX during the current-main migration.
- Extract only after route behavior, redirects, user roles, and recovery contracts are independently verified.

### PR #1299 — Earlier premium SaaS login redesign

**Classification: SUPERSEDED — close after preserving useful notes**

Reason:

- Earlier version of the login redesign.
- Superseded by #1330 and the newer design-system direction.

Action:

- Preserve any unique acceptance criteria in the auth issue.
- Close to remove ambiguity.

### PR #1338 — Live signup route and lead-capture deployment fix

**Classification: KEEP LOGIC / REBASE URGENTLY**

Reason:

- Addresses a live buyer-flow defect and hardened public lead capture.
- Branch is behind current `main` and also includes deployment-specific utilities.

Action:

- Rebase or recreate the minimum safe fix on current `main`.
- Separate runtime route/lead fixes from deployment helper scripts where practical.
- Validate package query preservation, public-origin guard, honeypot behavior, and live function response.

### PR #1289 — Twilio dual-number architecture

**Classification: KEEP DOMAIN WORK / REBASE AND SPLIT**

Reason:

- Contains valuable phone-number registry, sender resolution, affinity, voice fallback, and tests.
- Branch is significantly behind current `main`.
- Scope combines registry, SMS sending, voice fallback, audit tooling, and deployment instructions.

Action:

- Split into independently reviewable current-main PRs:
  1. canonical phone-number registry and sender resolution,
  2. outbound SMS enforcement and affinity,
  3. inbound voice fallback,
  4. deployment and production verification.
- No credentials in source.

### PR #1283 — Exact-artifact staging deployment proof

**Classification: KEEP CONCEPT / CONSOLIDATE WITH RELEASE PROGRAM**

Reason:

- Correctly requires exact source-SHA proof on staging.
- Branch is significantly behind current `main`.
- Overlaps with #1282.

Action:

- Consolidate staging proof primitives with the canonical release branch.
- Preserve production refusal and exact-SHA verification.
- Do not maintain duplicate verifier implementations.

### PR #1282 — Automatic exact-commit production releases

**Classification: REVISE / BECOME CANONICAL RELEASE WORKSTREAM**

Reason:

- Strong architectural direction: one publisher, exact artifact, exact SHA, post-deploy smoke proof, and duplicate-publisher prevention.
- Branch is significantly behind current `main` and overlaps with #1283 and later live-fix deployment helpers.

Action:

- Recreate from current `main` after inventorying all active publish workflows.
- One release workflow owns production.
- UI-click publishing remains emergency-only or is removed.
- Success requires exact live SHA and critical-flow smoke proof.

### PR #1270 — Canonical lead industry classification and backfill

**Classification: KEEP DOMAIN WORK / REBASE AND VALIDATE**

Reason:

- Valuable classifier, conflict handling, dry-run backfill, and regression tests.
- Branch is significantly behind current `main`.

Action:

- Rebase or selectively port onto current `main`.
- Run Deno tests and a dry-run against production-shaped data before any write mode.
- Preserve explicit confirmation phrase and manual-review outcomes.

### PR #1267 — Homepage simplification

**Classification: DEFER / DO NOT MERGE NOW**

Reason:

- Homepage is intentionally the final major product phase.
- The category, offer, activation flow, and product experience have materially evolved since this branch.
- Branch is significantly behind current `main`.

Action:

- Keep as a reference only.
- Close or supersede when the final public-website workstream starts.
- Reuse accessibility improvements and concise FAQ patterns where still applicable.

## Authoritative merge and execution order

1. Merge #1352 blueprint foundation.
2. Recreate and land the minimum current-main live signup / lead-capture fix from #1338.
3. Create the current-main Design System 2.1 application-shell branch for #1348.
4. Migrate authentication into that system from selected #1330/#1345 work.
5. Build the current-main package and checkout workstream for #1349.
6. Build the current-main activation and installation workstream for #1350, selectively porting #1334/#1335.
7. Build the consolidated Command Center for #1351.
8. Rebase and split Twilio domain work from #1289.
9. Rebase and validate lead-industry work from #1270.
10. Consolidate #1282/#1283 into one exact-artifact release program.
11. Defer homepage redesign until customer and internal product surfaces reach feature completeness.

## Route and ownership map

| Surface | Authoritative workstream |
|---|---|
| `/login`, registration, password recovery | Design System 2.1 + authentication migration |
| package selection and `/product-signup` | #1349 |
| checkout and paid-order handoff | #1349 |
| `/setup` and business activation | #1350 |
| `/setup/credentials` | #1350 |
| setup progress and launch tracker | #1350 |
| customer home / Command Center | #1351 |
| leads, conversations, bookings, website, services | post-Command-Center module workstreams |
| admin operations | Admin OS workstream |
| homepage and public marketing | final public-website phase |
| production release | consolidated exact-artifact release workstream |

## Immediate branch actions

- Create new implementation branches only from current `main` after #1352 merges.
- Do not extend the existing stacked auth/activation chain.
- Add a superseded notice to older PRs before closing them.
- Keep domain logic recoverable through commits until it is safely ported.
- Require an explicit migration checklist in every replacement PR linking the source branch and the ported files/contracts.

## Completion criteria for #1347

- This plan is merged.
- Superseded PRs are labeled or commented and closed.
- Replacement branches are created from current `main`.
- Every overlapping product surface has one owner.
- Release engineering has one canonical direction.
- No stale branch remains a candidate for direct production merge.
