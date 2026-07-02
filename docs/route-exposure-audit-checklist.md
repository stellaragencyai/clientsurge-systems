# Route Exposure Audit Checklist

This checklist tracks the public/internal route exposure cleanup pass.

## Required fixes

1. Admin routes must use `ProtectedRoute` with `allowedRoles={["admin", "super_admin"]}`.
2. `/launch-control` must be admin-only, not hidden-public.
3. `/dashboard-entry` must not expose client data as a public page.
4. `/setup/status/:orderId` must require auth or a signed setup token before showing order data.
5. `/setup/preview/:specId` must require auth or a signed preview token before showing website spec data.
6. Public directory output must exclude `/success`, `/order-success`, `/thank-you`, `/launch-control`, `/setup-lookup`, setup routes, client routes, admin routes, mission-control routes, SaaS admin routes, system observability, funnel optimization, function audit, reconciliation, task status, and runbook pages.
7. Sitemap must only include true public SEO pages.
8. Noindex must cover login/register/reset, product signup, setup lookup, setup routes, admin routes, client portal/dashboard routes, mission-control, SaaS admin, order-success, success, thank-you, and launch-control.
9. Default metadata must be ClientSurge-specific and must not expose Base44 fallback text.

## Verification evidence to collect after deployment

- Visit `/admin` while logged out: should redirect to login.
- Visit `/admin` as non-admin: should show access restricted.
- Visit `/launch-control` while logged out: should not render public launch data.
- View page index/directory: must not list admin/internal/setup/order routes.
- View sitemap: must not include admin/internal/setup/order routes.
- Inspect homepage metadata: must not say generic Base44 data-type text.
