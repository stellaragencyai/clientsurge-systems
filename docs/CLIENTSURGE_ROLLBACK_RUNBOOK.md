# ClientSurge Rollback Runbook

Use this if a GitHub change, Base44 sync, or production publish breaks the public website.

## Priority order

1. Stop additional publishes.
2. Identify the last known good commit.
3. Revert the breaking commit or disable the broken path.
4. Republish through the controlled Base44 path.
5. Run live smoke checks.
6. Document the incident in issue `#1218` or the active release issue.

## Stop the bleeding

Do not stack more Base44 builder prompts on top of a broken publish.

If local sync automation is running, pause it before making additional changes.

Recommended checks on the publisher machine:

```powershell
Get-ScheduledTask | Where-Object TaskName -like '*Base44*'
npm run sync:status
npm run sync:doctor
```

## Identify the breaking commit

Start with the latest GitHub commits on `main`:

```bash
git log --oneline -10
```

Find the last known good point by checking:

- GitHub Build Proof status
- Base44 publish timestamp
- manual QA checklist result
- live smoke result

## Preferred rollback: revert commit

Use a normal Git revert instead of rewriting history:

```bash
git revert <bad_commit_sha>
git push origin main
```

Then wait for Build Proof before publishing again.

## Emergency rollback: disable broken feature path

If the failure is isolated to a public route or form, prefer a small surgical disable/fallback commit instead of broad redesign.

Examples:

- Disable a broken CTA.
- Route users to `/contact` or `/book`.
- Display a direct support fallback.
- Keep checkout recovery links visible.

## Base44 publish after rollback

Only publish after:

```text
GitHub revert/fix commit -> Build Proof visible -> public form scan acceptable -> controlled Base44 publish
```

Do not use broad Base44 builder edits to roll back production unless GitHub/source control is unavailable.

## Live verification after rollback

Run:

```powershell
curl.exe -I https://clientsurgesystems.com/
curl.exe -I https://www.clientsurgesystems.com/
npm run smoke:public-routes -- --base-url=https://clientsurgesystems.com
```

Then manually check:

- `/`
- `/contact`
- `/book`
- `/start`
- `/product-signup`
- `/opt-out`
- `/pricing`

## Incident note template

```text
Incident:
Broken route/form:
Bad commit or publish timestamp:
Rollback commit:
Base44 publish timestamp:
Live smoke result:
Remaining follow-up:
```
