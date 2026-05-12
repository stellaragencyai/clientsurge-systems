# AGENTS.md

This repository is a Base44-synced website project and the ClientSurge AI Acquisition Engine.

PRIMARY OPERATING RULES:
- SQLite is the only source of truth.
- Base44 is only a CRM/UI projection layer.
- OpenClaw/Codex orchestrate work; they do not become storage.
- No Airtable.
- No outreach automation unless explicitly requested.
- No Twilio, Resend, Gmail, or Calendly changes unless explicitly requested.
- No demo website generation inside the acquisition-engine repo.
- Do not touch unrelated repositories.
- Do not commit secrets.
- Do not create or modify `.env`.
- Only update `.env.example` when needed.
- Use Windows PowerShell-compatible commands in all docs.
- Prefer small, reviewable branches.
- Preserve all existing migrations.
- Add or update tests/sanity scripts for every new functional layer.
- Never overwrite non-null canonical lead fields with null values.
- Always preserve dedupe, ingestion run logging, and lead change history.
- New scripts must support safe dry-run behavior where practical.
- Final task reports must include files changed, tests run, branch, commit hash, blockers, and exact next PowerShell command.

Rules:
- Preserve existing working behavior unless explicitly improving a known issue.
- Do not reference other repositories or projects.
- Reuse existing components and patterns whenever possible.
- Prioritize business-critical flows, lead capture, backend reliability, and conversion improvements.
- Avoid broad rewrites.
- Make changes in reviewable chunks.
- Always summarize touched files, risks, and next steps.
- Base44 is the primary editor for frontend visuals, layout, copy, and rapid page design changes.
- Codex should avoid modifying actively edited frontend page structure unless explicitly instructed.
- Codex should focus on backend logic, forms, data flow, SEO, integrations, validation, testing, documentation, and technical hardening.
- Before editing shared UI files, first identify whether the change overlaps with current Base44 work.
- Prefer isolated, reversible changes over sweeping refactors.

EXECUTION ORDER:
Work through the findings from the first 10 prompts using this order unless the repo state proves a different order is safer:

1. Broken business-critical flows
2. Lead capture and contact form reliability
3. Backend/data flow gaps
4. Validation and error handling
5. CRM / notification / storage integrations
6. Payment or onboarding flow gaps
7. Conversion improvements
8. Technical SEO improvements
9. Accessibility improvements
10. Performance and cleanup
11. Documentation and maintainability polish

EXECUTION METHOD:
- Use the audit findings and backlog as the source of truth.
- Group fixes into logical implementation batches.
- Complete the first batch now.
- After finishing the batch, do not stop at a vague summary. Provide exact next steps and continue into the next batch unless blocked by uncertainty or a high-risk decision.
- If blocked, explain exactly what is blocking progress and propose the safest path forward.

IMPORTANT:
- When choosing between a visual/UI edit and a backend/reliability fix, prefer the backend/reliability fix first.
- Do not overwrite or fight Base44-style visual structure unless necessary.
- If a finding from the audit is weak, low-value, or cosmetic, deprioritize it.
- Focus on changes that improve conversion, reliability, lead capture, technical integrity, and scalability.
- When a task touches canonical lead data, treat SQLite as authoritative and preserve dedupe, ingestion run logging, and lead change history.
- Do not introduce new storage layers or use Base44, OpenClaw, or Codex as a system of record.
