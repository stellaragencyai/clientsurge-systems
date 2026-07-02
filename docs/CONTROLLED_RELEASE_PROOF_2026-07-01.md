# Controlled Release Proof — 2026-07-01

## Purpose

Prove whether a small GitHub commit on `main` reaches the live Base44/ClientSurge production environment.

## Controlled marker

Marker added to admin System Identity panel:

`release-proof-2026-07-01.1`

## Commit under test

`25b0d5a91b1a8eb8af5ce8de1fb8026cbdcf24e4`

## File changed

`src/components/admin/SystemIdentityPanel.jsx`

## Expected production location

Admin dashboard / System Identity area.

## What counts as success

This proof is successful only if all are true:

1. GitHub workflow/release gate passes for commit `25b0d5a91b1a8eb8af5ce8de1fb8026cbdcf24e4`.
2. Base44 sync/publish runs successfully after that commit.
3. The admin dashboard in the live Base44/production environment shows `release-proof-2026-07-01.1`.
4. The live site remains healthy after deploy.

## Current connector limitation

The GitHub connector did not return workflow runs for the commit immediately after the push, even though the GitHub UI shows workflows exist and many recent runs are passing. Human-visible confirmation from the GitHub Actions page is required.

## Do not contaminate this test

Do not apply this same marker directly through Base44 editor. The point is to prove the path:

`GitHub commit -> Actions/release gate -> Base44 sync/publish -> live app`
