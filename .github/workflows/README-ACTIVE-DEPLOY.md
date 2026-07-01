# Active ClientSurge Security Edge Deployment

The active workflow is:

`ACTIVE - Deploy ClientSurge Security Edge`

File:

`.github/workflows/deploy-clientsurge-security-edge.yml`

## Current operational note

Commits made by automated GitHub connectors may not create GitHub Actions runs in this repository. If no run appears after a connector-made commit, manually run the active workflow:

1. Open GitHub Actions.
2. Select `ACTIVE - Deploy ClientSurge Security Edge`.
3. Click `Run workflow`.
4. Select branch `main`.
5. Run it.

## Pass condition

The final step must pass:

`Verify live public route exposure`

The live smoke output must show:

```json
"findings": []
```

If the final step fails, the production site is still exposing the generated Base44 Pages directory or internal/admin route links.
