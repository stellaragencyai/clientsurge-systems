# ClientSurge SEO Internal Linking Strategy

## Purpose

Create a clear crawl path from the homepage to industry, automation, store, audit, and blog pages so controlled launch traffic can understand what ClientSurge does, who it serves, and what action to take next.

## Principles

- Link from high-authority pages to the most commercially important pages.
- Use descriptive anchors, not vague `learn more` text when context allows.
- Keep protected, admin, setup, order success, and client portal routes out of indexable navigation.
- Route traffic toward one of three conversion destinations: `/book`, `/store`, or `/contact`.
- Keep proof links truthful: illustrative examples can point to workflow explanations, but verified case studies require real assets first.

## Parent Pages

| Parent | Role | Primary Children | CTA Destination |
| --- | --- | --- | --- |
| `/` | Main authority hub | Industry pages, `/automations`, `/store`, `/blog`, `/about` | `/book` |
| `/automations` | Service hub | Six automation pages, `/store`, relevant blog guides | `/book` and `/store` |
| `/industries` | Industry hub | `/roofing`, `/hvac`, `/plumbing`, `/dental`, `/med-spa`, `/chiropractic`, `/contractors` | `/book` |
| `/blog` | Topical authority hub | Launch guides and future cluster articles | Contextual |
| `/store` | Commercial comparison hub | Package detail, automation detail, `/book` | Checkout/audit |

## Child Page Linking

### Industry Pages

Each industry page should link to:

- Matching automation guide or closest live guide.
- `/automations` for system overview.
- `/store` for package comparison.
- `/book` for the audit CTA.

Current related guide mapping:

| Industry | Page | Primary Guide | Secondary Links |
| --- | --- | --- | --- |
| Roofing | `/roofing` | `/blog/roofing-lead-response-automation` | `/missed-call-text-back`, `/store`, `/book` |
| HVAC | `/hvac` | `/blog/hvac-missed-call-text-back` | `/missed-call-text-back`, `/appointment-booking-automation`, `/book` |
| Plumbing | `/plumbing` | `/blog/hvac-missed-call-text-back` until plumbing guide exists | `/missed-call-text-back`, `/contact`, `/book` |
| Dental | `/dental` | `/blog/dental-missed-call-automation` | `/appointment-booking-automation`, `/review-automation`, `/book` |
| Med Spa | `/med-spa` | `/blog/med-spa-lead-response-automation` | `/ai-lead-follow-up`, `/appointment-booking-automation`, `/book` |
| Chiropractic | `/chiropractic` | `/blog/ai-appointment-booking-local-business` | `/appointment-booking-automation`, `/review-automation`, `/book` |
| Contractors | `/contractors` | `/blog/contractor-lead-follow-up-system` | `/lead-capture-automation`, `/customer-reactivation`, `/book` |

### Automation Pages

Each automation page should link to:

- `/automations` as parent.
- 2-3 industry pages where the automation is most relevant.
- One supporting blog guide.
- `/store` for package fit.
- `/book` for audit.

Recommended anchors:

- `missed-call text-back workflow`
- `AI lead follow-up automation`
- `appointment booking automation`
- `review request automation`
- `lead reactivation system`
- `local service automation package`

## Supporting Blog Clusters

| Cluster | Pillar | Supporting Pages | CTA |
| --- | --- | --- | --- |
| Missed Calls Revenue Leak | `/blog/missed-call-text-back-guide` | HVAC, plumbing, dental, roofing missed-call articles | `/book` |
| Speed-to-Lead | `/blog/lead-response-speed-to-lead` | industry response-time articles | `/book` |
| AI Receptionist | Future `/blog/ai-receptionist-local-business` | voice agent, after-hours, dispatch handoff | `/automations` |
| Website Automation Checklist | Future `/blog/website-automation-checklist` | forms, tracking, routing, audit prep | `/book` |
| Local Business Lead Capture | Future `/blog/local-business-lead-capture-system` | forms, attribution, CRM routing | `/store` |

## Authority Flow

1. Homepage links to industry hub, automation hub, store, blog, and audit page.
2. Industry hub links to every industry page.
3. Each industry page links to one matching guide plus `/automations` and `/book`.
4. Blog guides link back to the relevant industry and automation pages.
5. Automation pages link to store packages and audit conversion.
6. Footer repeats only durable public routes: industries, automations, store, blog, contact, legal.

## Exclusions

Do not internally promote or index:

- `/admin`
- `/client-portal`
- `/client-dashboard`
- `/setup`
- `/setup/*`
- `/onboarding`
- `/order-success`
- `/success`
- `/thank-you`
- `/motion-lab`
- `/api/*`
- `/base44/*`

## Immediate Fixes Completed

- `/plumbing` is now represented in shared metadata, static shell fallback, smoke routes, and `public/sitemap.xml`.
- Static Twitter/X tags now use `name="twitter:*"` to match runtime metadata.
- Launch-visible proof copy was tightened to avoid unsupported customer-result claims.

## Next Internal Links To Add

Immediate:

- Add a plumbing-specific blog guide and update `/plumbing` to link to it.
- Add automation page cross-links to the two strongest industry examples per automation.
- Add a small `Related guides` block to automation pages.

Next:

- Add breadcrumb UI or visible related-page modules on `/blog/:slug`.
- Add industry-specific package-fit links from `/store` to industry pages.

Later:

- Add real case-study pages only after verified customer proof exists.
