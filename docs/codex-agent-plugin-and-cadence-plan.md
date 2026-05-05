# Codex Agent Plugin And Cadence Plan

Last updated: 2026-05-05 MST

## Purpose

This document defines how the 9 ClientSurge Systems agents should be customized, what memory they should use, which Codex plugins/skills help them most, and how often they should run follow-up checks.

## Memory Model

### Shared memory

All agents should read:

- `C:\Users\nolan\Desktop\clientsurge-systems-main-clean\.agents\sharedmemory.md`

### Role memory

Each agent should also read its own:

- `SKILL.md`
- `MEMORY.md`

### Operational memory enhancement

The next-level memory system for this project is:

1. Shared mission and rules in `sharedmemory.md`
2. Role scope in each `SKILL.md`
3. Current-state short-term memory in each `MEMORY.md`
4. Machine-local sync reports in `logs/base44-sync/<machine>/`
5. Periodic heartbeat summaries in the Codex thread

This is enough for strong coordination without pretending the agents have magical permanent memory. The safest way to “enhance memory” is to keep updating durable repo files and logs that future agents can re-read.

## Top 3 Plugins For This Project

These are the most useful plugins for ClientSurge Systems during build, launch, and early operations:

### 1. Browser Use

Best for:

- QA Release
- Frontend Conversion
- Backend Integrations

Why it matters:

- lets agents test the real public flow on localhost or the live Base44 app
- verifies route behavior, scrolling, forms, cart, checkout, and portal redirects
- provides the truth layer for launch-critical user journeys

### 2. GitHub

Best for:

- Launch Director
- Backend Integrations
- QA Release

Why it matters:

- tracks Base44-synced upstream changes
- supports PRs, branch review, CI inspection, and release hygiene
- acts as the stable hub between Base44, desktop, and laptop

### 3. Figma

Best for:

- Visual Brand
- Frontend Conversion

Why it matters:

- strongest design-to-code bridge available in this environment
- useful for building a cleaner premium brand system, social templates, and high-trust landing assets
- can connect design context to actual code components when a Figma file is in use

## Strong Secondary Plugins

- `Gmail`: high value for Sales Voice Client Success once inbox-connected workflows matter
- `Linear`: useful if the backlog is moved into ticket-based execution
- `Spreadsheets`: useful for lead lists, content calendars, and launch trackers
- `Documents` and `Presentations`: useful for sales assets, onboarding packs, and executive launch decks

## Skill Recommendations

### Browser skill

Use for:

- route testing
- public QA
- post-fix verification

### GitHub skills

Use for:

- PR review
- CI debugging
- publishing clean changes

### imagegen skill

Use for:

- founder/brand asset mockups
- social graphics
- launch creative concepts

### openai-docs skill

Use when:

- an agent is building or validating OpenAI-powered workflows or API integrations

## Agent Customization Matrix

| Agent | Primary memory | Best plugins | Best skills | Best cadence |
|---|---|---|---|---|
| Launch Director | shared + launch-director memory | GitHub | github, browser | 60 min |
| Backend Integrations | shared + backend-integrations memory | GitHub, Browser Use | github, browser, openai-docs | 30 min while blockers are red |
| QA Release | shared + qa-release memory | Browser Use, GitHub | browser, github | 30 min during active remediation |
| Frontend Conversion | shared + frontend-conversion memory | Browser Use, Figma | browser, imagegen | 60 min |
| Visual Brand | shared + visual-brand memory | Figma | imagegen | 60 min |
| SEO Content | shared + seo-content memory | GitHub | none required by default | 60 min |
| Social Distribution | shared + social-distribution memory | Figma, Spreadsheets | imagegen | 60 min |
| Lead Intelligence CRM | shared + lead-intelligence-crm memory | Spreadsheets, GitHub | none required by default | 60 min |
| Sales Voice Client Success | shared + sales-voice-client-success memory | Gmail, Spreadsheets | none required by default | 60 min |

## Recommended Cadence Rules

### Every 30 minutes

Only agents tied to launch-blocking truth should run this often:

- Backend Integrations
- QA Release
- Sync Watch / overlap classification

These agents are close to the critical path, so faster polling is worth it.

### Every 60 minutes

Use hourly reviews for:

- Launch Director
- Frontend Conversion
- Visual Brand
- SEO Content
- Social Distribution
- Lead Intelligence CRM
- Sales Voice Client Success

These functions benefit more from focused batch updates than from constant interruption.

## Current Automation Pattern

### Already active

- Local machine scheduled task:
  - `ClientSurge-Base44-SyncMirror`
  - runs every 15 minutes
  - updates the clean mirror and writes overlap reports

- Thread heartbeat:
  - `ClientSurge Sync Watch`
  - runs every 30 minutes
  - reports Base44/GitHub drift and overlap status back into this thread

### Recommended next automation

If thread-level limits allow, add a workspace-level hourly launch-readiness sweep that reviews:

- top blockers
- new origin/main drift
- launch gate status
- the single best next implementation batch

## Specific Launch Sequence

### Wave 1

- Launch Director
- Backend Integrations
- QA Release
- Frontend Conversion
- Visual Brand
- SEO Content

Reason:

- this wave establishes truth, fixes the core, and prepares conversion assets

### Wave 2

- Social Distribution
- Lead Intelligence CRM
- Sales Voice Client Success

Reason:

- this wave becomes far more effective once the core booking, lead, and checkout paths are verified

## Important Guardrails

- No agent should auto-merge Base44 or GitHub changes into an active dirty branch.
- No agent should auto-publish Base44 after code changes without deliberate approval.
- Revenue-path agents outrank polish agents when priorities conflict.
- Memory should live in durable repo files and logs, not only in ephemeral thread context.
