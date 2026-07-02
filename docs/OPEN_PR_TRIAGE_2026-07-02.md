# Open PR Triage — 2026-07-02

Purpose: reduce release chaos by classifying open pull requests before any production publish.

## Triage rules

- Do not merge broad PRs during form/release hardening without proof.
- Do not merge draft PRs directly into production.
- Revenue, route security, messaging compliance, and provisioning PRs require focused review.
- Visual polish PRs wait until release proof is clean.

## Open PR snapshot

| PR | Title | Initial classification | Action |
|---:|---|---|---|
| #1220 | Fix signup onboarding 404 error handling | Revenue / onboarding candidate | Review first; likely important because it touches signup/onboarding error recovery. |
| #1217 | Wave 2 communications system: sender signatures | Messaging / compliance candidate | Review after current form hardening; do not merge blindly. |
| #1206 | Mark booking launch guide step complete from configured link | Booking workflow candidate | Review after booking forms are proven. |
| #1186 | Add cinematic premium landing page animations | Non-critical visual polish | Defer until release proof passes. |
| #1129 | Track E release hardening docs and CI gate | Release hardening candidate | Compare against current release docs/workflows before merging; may be stale or partially superseded. |
| #1112 | Add SMS gateway and audit guardrails | Messaging / gateway candidate | High-impact; review carefully after form and compliance proof. |
| #1109 | Wire website preview through guarded backend functions | Backend/preview guard candidate | Review for security and public-route side effects. |
| #1108 | Enforce setup token access for order and website preview data | Draft security candidate | Do not merge while draft; review access-control impact. |
| #1107 | Harden public route exposure and admin gates | Draft security candidate | Do not merge while draft; review route exposure carefully. |
| #1106 | Label admin dashboard truth states | Draft dashboard truth candidate | Useful but not public revenue-critical; defer until release proof. |
| #1102 | Fix post-payment provisioning truth gate | Draft revenue/provisioning candidate | High-risk/high-value; review only after Build Proof is visible. |
| #1090 | Fix ClientSurge public conversion blockers | Broad conversion blocker candidate | Too broad for blind merge; inspect diff and conflicts before considering. |

## Immediate recommendations

1. Prioritize #1220, #1102, and #1090 for focused review because they touch signup, payment/provisioning, and public conversion.
2. Defer #1186 until after release proof because animations are not critical.
3. Keep all draft security/backend PRs unmerged until their diffs are reviewed against current `main`.
4. Use the current release issue `#1218` as the active command center.
