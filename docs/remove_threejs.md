# Task #65 — Remove three.js from package.json

## Action Required
Run the following in the repo root to remove three.js:

```bash
npm uninstall three @types/three
```

Then search for any remaining imports:
```bash
grep -r "from 'three'" src/
grep -r "require('three')" src/
```

If none found, commit:
```
git commit -m "🤖 Agent Smith | #65 Remove three.js — saves ~600KB bundle | May 7 2026 MST"
```

## Impact
Removes ~600KB from the production bundle.
Vercel build time drops ~8-12 seconds.
