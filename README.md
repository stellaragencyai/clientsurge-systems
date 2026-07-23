**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

## Release flow

This repo uses the **Base44 app-code / GitHub sync** release path.

- Pushes to `main` sync code into Base44.
- The live site can be published from the CLI with `npm run base44:publish-site-cli`.
- Direct `base44 site deploy` from the full repo can fail if Base44 validates unrelated entity files first; the site CLI helper builds the app, packages only `dist/` plus the minimal Base44 site config, deploys that package, then verifies the custom domain and Base44 origin.
- Pre-launch QA belongs in the Base44 test database / test workspace; see `docs/STAGING_ENVIRONMENT.md` before running checkout, SMS, email, or activation smoke tests.

Helper command:

```bash
npm run release:base44
```

What it does:
- runs the production build
- runs the default regression test (`tests/seoBreadcrumb.test.js`)
- pushes `main`
- opens the Base44 dashboard so Publish is one click away

Useful options:

```powershell
pwsh -File scripts/release-base44.ps1 -LintPaths src/App.jsx,index.html
pwsh -File scripts/release-base44.ps1 -SkipPush
pwsh -File scripts/release-base44.ps1 -PublishMode backend-platform
```

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
