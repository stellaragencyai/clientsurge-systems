# Required CI Gate Proof

This checklist exists because a build-only green check is not enough for ClientSurge release control.

## Required on every pull request into `main`

The `ClientSurge Base44 Sync Control` workflow must run these checks automatically:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run test:node
```

## Manual promotion checks

These remain manual because they may require provider credentials, live-domain access, or operator approval:

```bash
npm run test:deno
npm run smoke:public-routes -- --base-url=https://clientsurgesystems.com
```

## Pass condition

A PR is not eligible to merge until the required workflow passes. If lint/typecheck/tests fail, fix the underlying source or explicitly document why the check itself is wrong.

## Release rule

Do not downgrade a failed required check to warning just to merge. That turns GitHub back into theater.
