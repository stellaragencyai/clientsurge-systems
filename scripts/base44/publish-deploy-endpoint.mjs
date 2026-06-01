import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const requireFromBrowserAudit = createRequire(
  new URL("../../tools/browser-audit/package.json", import.meta.url)
);
const { chromium } = requireFromBrowserAudit("playwright");

function parseArgs(argv) {
  const args = {
    appId: "",
    profileDir: resolve(repoRoot, ".base44-publish-profile"),
    timeoutMs: 120000,
    verifyUrl: "",
    showBrowser: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--app-id") args.appId = argv[++i] || "";
    else if (arg === "--profile-dir") args.profileDir = resolve(argv[++i] || args.profileDir);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i] || args.timeoutMs);
    else if (arg === "--verify-url") args.verifyUrl = argv[++i] || "";
    else if (arg === "--show-browser") args.showBrowser = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/base44/publish-deploy-endpoint.mjs --app-id 69dc4a79656fdba136d413d3 --verify-url https://clientsurgesystems.com

Options:
  --app-id ID          Base44 app ID to publish. Defaults to base44/.app.jsonc.
  --profile-dir DIR   Persistent browser profile with Base44 login cookies.
  --timeout-ms MS     Navigation timeout.
  --verify-url URL    Live URL to fetch after deploy.
  --show-browser      Open a visible browser, useful for first-time login.
  --dry-run           Verify auth and print the deploy endpoint without POSTing.`);
}

function readBase44AppId() {
  const appConfigPath = resolve(repoRoot, "base44/.app.jsonc");
  const raw = readFileSync(appConfigPath, "utf8").replace(/^\/\/.*$/gm, "");
  return JSON.parse(raw).id;
}

async function fetchLiveSignal(url) {
  if (!url) return null;
  const response = await fetch(url, { redirect: "follow" });
  const html = await response.text();
  const assetMatch = html.match(/\/assets\/[^"']+\.js/);
  return {
    url: response.url,
    status: response.status,
    asset: assetMatch?.[0] || "",
    hasProductionAppId: html.includes("69dc4a79656fdba136d413d3"),
    hasDonorAppId: html.includes("69f959e2bc665e019e19840c"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const appId = args.appId || readBase44AppId();
  const dashboardUrl = `https://app.base44.com/apps/${appId}/editor/workspace/overview`;

  if (!existsSync(args.profileDir)) {
    mkdirSync(args.profileDir, { recursive: true });
  }

  const beforeSignal = await fetchLiveSignal(args.verifyUrl);
  const context = await chromium.launchPersistentContext(args.profileDir, {
    headless: !args.showBrowser,
    viewport: { width: 1440, height: 960 },
  });

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });

    if (page.url().includes("/login")) {
      throw new Error(
        `Base44 login is required. Re-run with --show-browser, sign in, then run the publish command again.`
      );
    }

    const endpoint = `/api/apps/${appId}/deploy`;
    if (args.dryRun) {
      console.log(JSON.stringify({ ok: true, dryRun: true, dashboardUrl, endpoint }, null, 2));
      return;
    }

    const deployResult = await page.evaluate(async (deployEndpoint) => {
      const response = await fetch(deployEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const text = await response.text();
      let body = text;
      try {
        body = JSON.parse(text);
      } catch {
        // Keep raw text when the API does not return JSON.
      }
      return { ok: response.ok, status: response.status, body };
    }, endpoint);

    if (!deployResult.ok) {
      throw new Error(`Base44 deploy endpoint failed with HTTP ${deployResult.status}: ${JSON.stringify(deployResult.body)}`);
    }

    await page.waitForTimeout(5000);
    const afterSignal = await fetchLiveSignal(args.verifyUrl);
    console.log(JSON.stringify({ ok: true, appId, beforeSignal, deployResult, afterSignal }, null, 2));
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
