# ClientSurge Browser Audit Toolkit

Safe local tooling for inspecting public websites in a real Chromium browser. It is designed for rendered-page inspection, screenshots, link crawling, accessibility checks, console/network error capture, and repeatable report generation.

## What It Does

- Crawls public same-site links from `https://clientsurgesystems.com`
- Visits discovered internal pages plus important known ClientSurge routes
- Captures desktop and mobile screenshots
- Records console errors, page errors, failed requests, HTTP error responses, headings, meta data, CTA/button text, links, and visible text samples
- Runs basic visual QA checks for blank/JS-broken pages, horizontal overflow, missing content, placeholder copy, exposed admin/setup/dashboard links, low-contrast text, and weak button destinations
- Runs axe-core accessibility checks and captures a Playwright accessibility snapshot when available
- Checks package/marketplace positioning for the “Amazon of AI services” direction
- Writes structured JSON and Markdown reports

## Install

From this folder:

```powershell
npm install
npm run install:browsers
```

The browser install downloads Playwright’s managed Chromium build into the user Playwright cache. No credentials or secrets are required.

## Run A Full Public Audit

```powershell
npm run audit:all
```

Equivalent site-audit alias:

```powershell
npm run audit:site
```

Optional arguments:

```powershell
node scripts/audit-all-public-pages.js --start https://clientsurgesystems.com --max-pages 40
```

Outputs:

- `reports/site-audit.json`
- `reports/site-audit.md`
- screenshots in `screenshots/`

## Crawl Links Only

```powershell
npm run crawl
```

Optional:

```powershell
node scripts/crawl-site.js --start https://clientsurgesystems.com --max-pages 40 --out reports/crawl.json
```

## Audit One Page

```powershell
npm run audit:page -- --url https://clientsurgesystems.com/
```

Optional:

```powershell
node scripts/audit-page.js --url https://clientsurgesystems.com/store --out reports/store-audit.json
```

## Screenshot One Page

```powershell
npm run screenshot -- --url https://clientsurgesystems.com/store
```

This saves desktop and mobile screenshots under `screenshots/`.

## Permissions Needed

- Outbound HTTP/HTTPS access to the target site and linked assets
- Permission to download Playwright Chromium during setup
- Local filesystem write access to `tools/browser-audit/reports/` and `tools/browser-audit/screenshots/`

This toolkit does not bypass authentication, OpenClaw approvals, browser security settings, or site safety policies. It does not submit forms, buy products, post content, change accounts, or store secrets.

## Known Limitations

- Broken-link checks use anonymous `HEAD`/`GET` requests and may report false positives when a server blocks bots or `HEAD` requests.
- Visual QA checks are heuristics. They can flag probable layout issues, but a human should review screenshots for final judgment.
- Low-contrast detection uses computed foreground/background colors and may miss contrast created by images, overlays, gradients, or inherited transparent backgrounds.
- Buttons handled entirely by JavaScript modals may not have URL destinations; the audit flags only clearly weak destinations such as `#`, `javascript:`, disabled controls, or empty anchors.
- Accessibility results are automated axe-core findings and do not replace a manual accessibility review.
- Crawling is constrained to public same-site links and skips `mailto:`, `tel:`, hashes, downloads, and private-looking paths.

## Optional Add-Ons

Useful later, but intentionally not installed here:

- Lighthouse CLI for performance and SEO lab metrics
- `@axe-core/playwright` if the team wants Playwright test-runner integration
- `linkinator` or `broken-link-checker` for dedicated link validation
- Pixelmatch or Playwright snapshot testing for screenshot diffs
- Sitemap validators for comparing crawl output to `sitemap.xml`

## Raspberry Pi Agent

For Seraph or another Raspberry Pi agent, use `SERAPH_PI_AGENT.md`. The short version is: install Node/npm, run `npm ci`, install Playwright Chromium, run `npm run audit:all`, then have the agent read both `reports/site-audit.json` and `reports/site-audit.md`.
