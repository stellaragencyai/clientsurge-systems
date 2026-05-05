# ClientSurge Systems Shared Memory

Last updated: 2026-05-05 MST

## Mission

Launch ClientSurge Systems in 7 days with a revenue-ready website, reliable lead capture, working checkout, clean onboarding paths, active social distribution, and a repeatable outbound engine. The first priority is not aesthetics. The first priority is making the money and lead flows real, measurable, and stable.

## Repo Truth

- Clean coordination worktree: `C:\Users\nolan\Desktop\clientsurge-systems-main-clean`
- Clean branch: `codex/launch-main-clean`
- Clean branch base: `631ac87d6f68748f8545dd13034d722052c0e439`
- Clean branch commit title: `File changes`
- Existing implementation worktree preserved separately:
  - `C:\Users\nolan\Desktop\clientsurge-systems`
  - branch `codex/sync-base44-main`
  - commit `f0850fd77107e081e685179bc37680b3f4c91831`
  - title `fix: remediate public site auth, booking, and CSP issues`
- Never overwrite or discard work from the dirty branch without an explicit merge plan.

## Source Of Truth

Every agent reads these before making decisions:

1. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\AGENTS.md`
2. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\SITE_AUDIT_FIXES_MAY2026.md`
3. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\MASTER_TASK_LIST_560.md`
4. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\PRE_LAUNCH_100_TASKS.md`
5. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\DOMAIN_01_STRIPE_PAYMENTS.md`
6. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\DOMAIN_02_LEAD_PIPELINE.md`
7. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\DOMAIN_05_SEO_MARKETING.md`
8. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\DOMAIN_07_FRONTEND_VISUALS.md`
9. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\DOMAIN_08_CLIENT_PORTAL_ADMIN.md`
10. `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\src\DOMAIN_10_LAUNCH_CHECKLIST.md`

## Non-Negotiable Rules

- Preserve existing working behavior unless fixing a known issue.
- Prioritize business-critical flows, lead capture, backend reliability, and conversion improvements.
- Avoid broad rewrites.
- Make changes in reviewable chunks.
- Base44 remains the primary editor for major visual/layout work.
- Do not fight or overwrite active Base44-style page work unless the change is launch-critical.
- Prefer backend/reliability fixes over visual polish when the two compete.
- Every launch claim needs repo proof, QA proof, and live proof if the flow depends on real third-party services.

## Priority Stack

1. Broken business-critical flows
2. Lead capture and contact form reliability
3. Backend and data-flow gaps
4. Validation and error handling
5. CRM, notification, and storage integrations
6. Payment and onboarding flow gaps
7. Conversion improvements
8. Technical SEO
9. Accessibility
10. Performance and cleanup
11. Documentation and maintainability polish

## Known Critical Gaps

These are already high-confidence failures and should be treated as real until disproven:

- Lead capture submission is failing with a `404` path in local QA.
- Checkout session creation is failing with a `404` before Stripe opens.
- `/client-portal` redirects into a login surface that rendered blank in local QA.
- Public routes are showing repeated Base44 SDK `404` console errors.
- Contact flow contains duplicate SMS consent copy.
- Phone capture UX is inconsistent with the intended mask/format.
- Package and checkout validation must stay aligned with the three offer tiers.

## Launch Definition

Launch means all of the following are true:

- Homepage, industry pages, store, contact, and booking flows load cleanly on desktop and mobile.
- All major forms submit successfully and produce the expected data records, notifications, and follow-up actions.
- Checkout reaches Stripe, returns successfully, and initializes the paid-order pipeline correctly.
- The three public packages are accurate, consistent, and legally supported.
- SEO basics are in place across titles, metadata, schema, internal links, sitemap, and indexability.
- Social accounts are active with scheduled content for launch week.
- Lead generation and CRM intake are ready for the six core service verticals.
- Voice and outbound automation follow consent, opt-out, and disclosure requirements.

## Core Service Verticals

Use these as the default six lanes unless the business owner changes the lineup:

1. Med spa
2. Dental
3. HVAC
4. Roofing
5. Chiropractic
6. Contractors

## Seven-Day Sequence

- Day 1: Audit reality, preserve current work, fix the highest-risk conversion failures.
- Day 2: Repair lead intake, checkout initiation, contact flow, and core notifications.
- Day 3: Lock package logic, onboarding path, and admin visibility of new leads/orders.
- Day 4: Refine public-site conversion UX, credibility, and mobile clarity without broad redesign churn.
- Day 5: Publish SEO foundations and prepare the social/content calendar.
- Day 6: Run end-to-end QA, simulate real customer journeys, and confirm go-live dependencies.
- Day 7: Launch, monitor, post, respond, and iterate.

## Agent Roster

| Agent | Lane | Primary Outcome |
|---|---|---|
| Launch Director | Coordination | Keeps all work synchronized and launch-truthful |
| Frontend Conversion | Public UX | Improves clarity, flow, and conversion on the customer-facing site |
| Visual Brand | Creative | Makes the site and campaign feel premium and consistent |
| Backend Integrations | Data + logic | Makes forms, checkout, CRM, and automations actually work |
| QA Release | Verification | Proves or disproves readiness with repeatable checks |
| SEO Content | Search | Builds discoverability, authority, and landing-page quality |
| Social Distribution | Social | Creates and schedules content across channels |
| Lead Intelligence CRM | Prospecting | Builds, enriches, and manages lead pipelines |
| Sales Voice Client Success | Closing + support | Converts qualified leads and supports onboarding/retention |

## Handoff Protocol

- Start with the smallest launch-critical batch that removes risk.
- Hand off artifacts, not vague status:
  - changed files
  - validation run
  - blocker
  - next suggested owner
- When a task is environment-dependent, mark exactly what still requires live credentials or external access.
- If one agent discovers a likely Base44 overlap, pause and route the minimal request instead of rewriting shared UI structure.

## Voice, Outreach, And Compliance Guardrails

- Use the founder's voice likeness only with explicit permission.
- Do not impersonate a human in a deceptive way.
- Respect TCPA, A2P, platform, and opt-out requirements.
- Every outbound channel needs stop handling, consent logic, and suppression tracking.
- AI calling, SMS, and follow-up systems must identify themselves where law or platform rules require it.

## Ready-For-Green Checklist

A workflow is not complete until:

1. The code path exists and is reviewable.
2. The user journey was tested from the entry point to the expected result.
3. Logs or UI evidence show the system behaved correctly.
4. Any required third-party configuration is confirmed.
5. The next dependent agent can act without guessing.
