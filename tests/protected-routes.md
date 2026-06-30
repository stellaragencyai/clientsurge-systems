# Protected Route Proof

This is an operator checklist for proving that private ClientSurge routes are not publicly reachable.

## Route groups

Client routes:

- `/client-portal`
- `/client-dashboard`
- `/dashboard-entry`
- `/onboarding`
- `/setup`

Admin routes:

- `/admin`
- `/dashboard`
- `/admin-settings`
- `/mission-control`
- `/saas/admin`

## Required proof

1. In a signed-out browser, each private route must redirect to login, show access restricted, or otherwise avoid rendering private data.
2. As a normal client user, admin routes must not render admin data.
3. As an admin user, admin routes may render only after authentication.
4. Public navigation, sitemap, and public route directories must not promote private/admin routes.
5. Attach screenshots or logs to the release PR.

## Pass condition

The route passes only when source route guards and live-domain behavior match.
