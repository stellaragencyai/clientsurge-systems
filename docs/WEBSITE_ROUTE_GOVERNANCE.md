# Website Route Governance

Last updated: 2026-06-06

Source of truth: `src/App.jsx`, `src/lib/publicRouteMetadata.js`, `src/lib/routeSecurity.js`, `public/sitemap.xml`, and `public/robots.txt`.

## Governance Rules

- PUBLIC routes may be linked from navigation, indexed when included in `SITEMAP_STATIC_PATHS`, and must use the primary CTA language `Free Automation Audit`.
- PROTECTED routes require an authenticated user through `ProtectedRoute` and must be noindexed.
- ADMIN ONLY routes require `admin` or `super_admin` through `ProtectedRoute` and must be noindexed.
- NOINDEX routes may be public app-shell routes but must not be listed in `public/sitemap.xml`.
- HIDDEN routes are not primary navigation destinations and should only be reached from a completed workflow, direct support link, or controlled redirect.
- UNFINISHED and ARCHIVED routes must not be indexed or promoted from public navigation.

## Route Inventory

| Route | Purpose | User Type | Launch Status | Indexing Status | Primary CTA | Notes |
|---|---|---|---|---|---|---|
| `/` | Primary marketing homepage | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Anchors handle pricing, FAQ, system, and testimonials sections. |
| `/start` | Guided audit/start flow | Public visitor | Ready for controlled launch | Noindex | Free Automation Audit | Public app-shell utility route; keep out of sitemap. |
| `/book` | Free automation audit booking | Public visitor | Ready for controlled launch | Noindex | Free Automation Audit | Public app-shell utility route; keep out of sitemap. |
| `/book-demo` | Legacy booking alias | Public visitor | Redirect only | No sitemap | Free Automation Audit | Redirects to `/book`; keep for old links only. |
| `/contact` | General contact path | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Includes audit alternative. |
| `/store` | Package and service storefront | Public visitor | Ready for controlled launch | Noindex | Free Automation Audit | Reachable utility route; primary package discovery stays on `/pricing`. |
| `/automations` | Automation systems overview | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Removed launch-visible coming-soon copy. |
| `/industries` | Industry directory | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Links only to live canonical industry routes. |
| `/about` | Company overview | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Footer and nav link target. |
| `/blog` | Blog index and article shell | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Dynamic article route `/blog/:slug` renders through the same component. |
| `/roofing` | Roofing industry page | Public visitor | Ready for controlled launch | Index | Free Roofing Automation Audit | Canonical live industry route. |
| `/hvac` | HVAC industry page | Public visitor | Ready for controlled launch | Index | Free HVAC Automation Audit | Canonical live industry route. |
| `/plumbing` | Plumbing industry page | Public visitor | Ready for controlled launch | Index | Free Plumbing Automation Audit | Canonical live industry route and sitemap entry. |
| `/dental` | Dental industry page | Public visitor | Ready for controlled launch | Index | Free Dental Automation Audit | Canonical live industry route. |
| `/med-spa` | Med spa industry page | Public visitor | Ready for controlled launch | Index | Free Med Spa Automation Audit | Canonical live industry route. |
| `/chiropractic` | Chiropractic industry page | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Canonical live industry route. |
| `/contractors` | Contractor industry page | Public visitor | Ready for controlled launch | Index | Free Contractor Automation Audit | Canonical live industry route. |
| `/lead-capture-automation` | Automation service page | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Generated from automation service route set. |
| `/missed-call-text-back` | Automation service page | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Generated from automation service route set. |
| `/ai-lead-follow-up` | Automation service page | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Generated from automation service route set. |
| `/appointment-booking-automation` | Automation service page | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Generated from automation service route set. |
| `/review-automation` | Automation service page | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Generated from automation service route set. |
| `/customer-reactivation` | Automation service page | Public visitor | Ready for controlled launch | Index | Free Automation Audit | Generated from automation service route set. |
| `/privacy-policy` | Privacy policy | Public visitor | Ready for controlled launch | Index | None | Legal route. |
| `/terms` | Terms of service | Public visitor | Ready for controlled launch | Index | None | Legal route. |
| `/login` | Existing client login | Existing client | Ready for controlled launch | Noindex | None | Publicly reachable but noindexed. |
| `/client-portal` | Client portal | Authenticated client | Protected | Noindex | None | Wrapped in `ProtectedRoute`. |
| `/client-dashboard` | Client dashboard | Authenticated client | Protected | Noindex | None | Wrapped in `ProtectedRoute`. |
| `/onboarding` | Client onboarding flow | Authenticated or invited client | Hidden / protected operational route | Noindex | None | App-shell public for load behavior; robots disallow and noindex. |
| `/setup` | Business setup flow | Authenticated or invited client | Hidden / protected operational route | Noindex | None | App-shell public for load behavior; robots disallow and noindex. |
| `/setup/credentials` | Credential collection flow | Authenticated or invited client | Hidden / protected operational route | Noindex | None | No public navigation link. |
| `/setup/status` | Setup status | Authenticated or invited client | Hidden / protected operational route | Noindex | None | No public navigation link. |
| `/setup/preview` | Website preview flow | Internal / invited client | Internal | Noindex | None | Internal route prefix. |
| `/order-success` | Post-checkout success | Customer after checkout | Hidden | Noindex | None | No sitemap entry. |
| `/success` | Generic success screen | Workflow completion | Hidden | Noindex | None | No sitemap entry. |
| `/thank-you` | Lead/booking thank-you | Workflow completion | Hidden | Noindex | None | No sitemap entry. |
| `/leads/capture` | Lead capture route | Public form workflow | Hidden | Noindex by route policy gap | None | Public app-shell route; not promoted in navigation or sitemap. |
| `/admin` | Admin dashboard | Admin | Admin only | Noindex | None | Wrapped in `ProtectedRoute` with admin roles. |
| `/admin/leads` | Admin lead management | Admin | Admin only | Noindex | None | Redirects/loads within admin shell. |
| `/admin/automations` | Admin automation management | Admin | Admin only | Noindex | None | Wrapped in admin `ProtectedRoute`. |
| `/admin/onboarding` | Admin onboarding management | Admin | Admin only | Noindex | None | Wrapped in admin `ProtectedRoute`. |
| `/admin/install-guide` | Admin install guide | Admin | Admin only | Noindex | None | Wrapped in admin `ProtectedRoute`. |
| `/admin/ai-sales` | AI sales command center | Admin | Admin only | Noindex | None | Wrapped in admin `ProtectedRoute`. |
| `/admin/performance-wars` | Internal performance route | Admin | Admin only / internal | Noindex | None | Wrapped in admin `ProtectedRoute`. |
| `/motion-lab` | Motion QA lab | Internal | Internal | Noindex | None | Internal prefix; should not be linked in public nav. |

## Discovery Findings

- `/plumbing` is now an active public industry route, metadata route, and sitemap route.
- No duplicate React Router route definitions were found in the active app router.
- Legacy aliases are centralized in `LEGACY_REDIRECTS` and `STATIC_ROUTE_ALIASES`.
- Admin and client routes are protected by `ProtectedRoute`; no admin route is intentionally exposed as PUBLIC.
- `/leads/capture` is a hidden public app-shell route but is not in sitemap. It should stay unpromoted unless a lead-capture campaign explicitly requires it.

## Owner Decisions Needed

- None for current route governance.
