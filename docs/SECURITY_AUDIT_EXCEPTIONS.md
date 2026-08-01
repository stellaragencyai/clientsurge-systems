# Security Audit Exceptions

Last reviewed: 2026-08-01

This file tracks production dependency findings that cannot currently be removed with a compatible package upgrade. Each entry must have a scope, mitigation, owner, and recheck trigger. Remove an entry as soon as a compatible non-vulnerable package is available and tested.

## SEC-AUDIT-2026-08-01-001 - React Router RSC-Mode Advisory

Status: Accepted temporary exception

Severity reported by `npm audit --omit=dev`: high

Packages:

- `react-router-dom@7.18.2`
- `react-router@7.18.2`

Audit finding:

- `React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response`
- Advisory range reported by npm for `react-router`: `>=7.12.0 <8.3.0`

Why it remains:

- `react-router-dom@7.18.2` is the latest `react-router-dom` release available from the registry used by this project.
- NPM's advisory metadata can suggest `react-router-dom@7.11.0`, but testing that downgrade exposed a broader set of older React Router 7 advisories. Keeping `7.18.2` is the narrower audited exposure for this React 18 app.
- `react-router@8.3.0` exists, but it requires `react >=19.2.7`, `react-dom >=19.2.7`, and `node >=22.22.0`.
- ClientSurge currently ships a Vite client-side React 18 app using `BrowserRouter`, `Routes`, `Route`, `Link`, `Navigate`, `useNavigate`, `useLocation`, `useParams`, and `useSearchParams` from `react-router-dom`.
- Migrating to React 19 plus React Router 8 is a framework upgrade, not a safe dependency patch for this remediation branch.

Current mitigation:

- The app does not use React Server Components mode.
- The app does not use React Router server actions, server loaders, or an SSR data-router request handler.
- Production routing is a client-side Vite build served through Base44/Cloudflare.
- External redirects and production app parameter overrides are separately guarded in application code and tests.

Required recheck:

- Re-run `npm view react-router-dom dist-tags --json` and `npm audit --omit=dev --json` before release.
- If a compatible non-vulnerable `react-router-dom` package is published for React 18, upgrade and remove this exception.
- If the project intentionally migrates to React 19 and React Router 8, run full route, auth, build, browser, and production-security gates before release.

Verification run on 2026-08-01:

- `npm view react-router-dom dist-tags --json` reported `latest: 7.18.2`.
- `npm view react-router@8.3.0 peerDependencies engines --json` reported React 19.2.7 and Node 22.22 minimums.
- `npm audit --omit=dev --json` still reports this finding after pinning `react-router-dom@7.18.2`.
- `react-router-dom@7.11.0` was tested and rejected because `npm audit --omit=dev --json` then reported multiple older React Router advisories affecting `6.0.0 - 7.17.0`.
