# Seraph Raspberry Pi Browser Audit Agent

This playbook equips a Raspberry Pi agent to use the browser audit toolkit safely. It uses the two generated report files together:

- `reports/site-audit.json` is the machine-readable source of truth for routes, screenshots, console/network errors, axe findings, links, and marketplace checks.
- `reports/site-audit.md` is the human-readable brief Seraph can summarize or hand to Neo.

## Pi Setup

Use a Raspberry Pi 4/5 with a 64-bit OS when possible. Chromium-based browser automation is memory hungry, so 4 GB RAM or more is preferred.

```bash
sudo apt update
sudo apt install -y git nodejs npm
cd ~/clientsurge-systems/tools/browser-audit
npm ci
npx playwright install chromium
```

If Playwright reports missing Linux packages, run the exact install command it prints. Do not disable browser sandboxing unless Neo explicitly approves it for that Pi.

## Safe Agent Operating Rules

- Inspect public pages only unless Neo gives explicit authenticated-test approval.
- Do not store API keys, passwords, cookies, session tokens, or customer data in the repo.
- Do not submit forms, purchase packages, publish content, change account settings, or trigger destructive actions.
- Do not bypass OpenClaw approvals, auth, browser security settings, or site safety controls.
- Save outputs only under `tools/browser-audit/reports/` and `tools/browser-audit/screenshots/`.

## Runbook

```bash
cd ~/clientsurge-systems/tools/browser-audit
npm run audit:all
```

For one page:

```bash
npm run audit:page -- --url https://clientsurgesystems.com/store --out reports/store-audit.json
```

For screenshots only:

```bash
npm run screenshot -- --url https://clientsurgesystems.com/
```

## How Seraph Should Use The Two Report Files

1. Read `site-audit.json` first and group findings by severity and URL.
2. Use `site-audit.md` to produce the operator-facing summary.
3. Treat repeated `401` or `500` public-page requests as reliability fixes unless they are expected protected routes.
4. Treat placeholder text, blank pages, broken media, and broken CTAs as conversion blockers.
5. Treat axe findings as accessibility leads, then confirm visually with screenshots.
6. Rerun `npm run audit:all` after every code or Base44 publish batch.

## Recommended Seraph Prompt

```text
You are Seraph running a safe public website audit. Use tools/browser-audit/reports/site-audit.json as structured evidence and tools/browser-audit/reports/site-audit.md as the human summary. Do not bypass auth, approvals, browser policies, or safety controls. Do not submit forms or change accounts. Identify the highest-impact public-site fixes for lead capture, package selection, browser reliability, accessibility, SEO, and conversion. Output exact URLs, evidence, likely owner, and next safe action.
```
