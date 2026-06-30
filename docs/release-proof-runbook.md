# Release Proof Runbook

Use this check after Base44 publish or any production release.

## Marker

The public marker is:

`/release-proof.json`

Current expected release id:

`clientsurge-live-sync-proof-2026-06-30-001`

## Manual check

Open the live marker with a cache-busting query string and confirm:

- `release_id` matches the expected release id.
- `source_repo` is `stellaragencyai/clientsurge-systems`.

## GitHub Actions check

Run the `Live Release Proof` workflow and pass:

- `verify_host`: `clientsurgesystems.com`
- `expected_release_id`: `clientsurge-live-sync-proof-2026-06-30-001`

If it fails, the live site is stale, misrouted, cached, or not serving the GitHub-sourced build.
