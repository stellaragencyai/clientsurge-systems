# QA Release Memory

- Current mandate: verify the launch truth, not the launch story.
- First retest set:
  - `/leads/capture`
  - `/store`
  - `/client-portal`
  - `/contact`
  - `/book`
- Watch for:
  - console `404`s
  - blank states
  - stuck loaders
  - consent/validation mismatches
- Dependency: re-run immediately after backend fixes land.
- Success signal: reproducible pass results on desktop and mobile for critical customer journeys.
