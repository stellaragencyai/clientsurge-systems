# Base44 Publish Readiness Checklist

Use this before publishing ClientSurge Systems to production through Base44.

## Production target

- Base44 app ID: `69dc4a79656fdba136d413d3`
- Production URL: `https://clientsurgesystems.com`
- Repo: `stellaragencyai/clientsurge-systems`
- Branch: `main`

## Hard gate

Do not publish unless every required item below is true.

## GitHub proof

- [ ] Latest `main` commit is known.
- [ ] Build Proof workflow is visible.
- [ ] `npm ci` passes.
- [ ] Public form safety scan runs.
- [ ] `npm run build` passes.
- [ ] No unreviewed broad PRs are being mixed into the release.

## Form/revenue proof

- [ ] Contact form fields are editable.
- [ ] Lead forms block invalid email.
- [ ] Lead forms block invalid phone.
- [ ] Consent is required for SMS/email follow-up.
- [ ] Demo booking blocks missing date/time.
- [ ] Opt-out accepts valid email or phone and blocks bad values.
- [ ] Product signup/checkout recovery path is known.

## Base44 sync proof

- [ ] Publisher machine has clean mirror worktree.
- [ ] Publisher machine has Base44 auth available.
- [ ] Sync target app ID is `69dc4a79656fdba136d413d3`.
- [ ] Sync pulls latest `origin/main`.
- [ ] Sync waits for GitHub checks before publish.
- [ ] No broad Base44 builder edit is pending.

## Publish commands

From the publisher machine:

```powershell
npm run sync:status
npm run github:wait-main-ci
npm run base44:check-app
npm run base44:watch-main-publish -- -Once
```

If direct API publish is intentionally used:

```powershell
npm run base44:publish-api
```

## Post-publish smoke

Run:

```powershell
npm run smoke:clientsurge-production -- --base-url=https://clientsurgesystems.com
npm run smoke:public-routes -- --base-url=https://clientsurgesystems.com
curl.exe -I https://clientsurgesystems.com/
curl.exe -I https://www.clientsurgesystems.com/
```

Then complete `docs/PRODUCTION_MANUAL_QA_CHECKLIST.md`.

## Release decision

- If all required checks pass: publish can be considered production-acceptable.
- If any hard gate fails: do not publish; fix in GitHub first.
- If production breaks after publish: follow `docs/CLIENTSURGE_ROLLBACK_RUNBOOK.md`.
