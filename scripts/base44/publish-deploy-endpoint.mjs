import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
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

function readCliAuth() {
  const authPath = resolve(homedir(), ".base44/auth/auth.json");
  if (!existsSync(authPath)) return null;
  return {
    authPath,
    auth: JSON.parse(readFileSync(authPath, "utf8")),
  };
}

async function refreshCliAuthIfNeeded() {
  const authRecord = readCliAuth();
  if (!authRecord?.auth?.accessToken) return null;

  if (Date.now() < Number(authRecord.auth.expiresAt || 0) - 60_000) {
    return authRecord.auth.accessToken;
  }

  if (!authRecord.auth.refreshToken) return authRecord.auth.accessToken;

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", authRecord.auth.refreshToken);
  body.set("client_id", "base44_cli");

  const response = await fetch("https://app.base44.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const payload = await response.json();
  if (!response.ok) {
    return authRecord.auth.accessToken;
  }

  const refreshed = {
    ...authRecord.auth,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || authRecord.auth.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
  };
  writeFileSync(authRecord.authPath, `${JSON.stringify(refreshed, null, 2)}\n`, "utf8");
  return refreshed.accessToken;
}

async function postDeployWithBearer(appId, accessToken) {
  if (!accessToken) return null;
  const response = await fetch(`https://app.base44.com/api/apps/${appId}/deploy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "ClientSurge Base44 publisher",
    },
  });
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep raw text when the API does not return JSON.
  }
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const appId = args.appId || readBase44AppId();
  const dashboardUrl = `https://app.base44.com/apps/${appId}/editor/workspace/overview`;

  if (!existsSync(args.profileDir)) {
    mkdirSync(args.profileDir, { recursive: true });
  }

  const beforeSignal = await fetchLiveSignal(args.verifyUrl);
  const endpoint = `/api/apps/${appId}/deploy`;
  const cliAccessToken = await refreshCliAuthIfNeeded();
  if (args.dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, dashboardUrl, endpoint, hasCliAuth: Boolean(cliAccessToken) }, null, 2));
    return;
  }

  const cliDeployResult = await postDeployWithBearer(appId, cliAccessToken);
  if (cliDeployResult?.ok) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 5000));
    const afterSignal = await fetchLiveSignal(args.verifyUrl);
    console.log(JSON.stringify({ ok: true, appId, beforeSignal, deployResult: cliDeployResult, afterSignal }, null, 2));
    return;
  }

  const context = await chromium.launchPersistentContext(args.profileDir, {
    headless: !args.showBrowser,
    viewport: { width: 1440, height: 960 },
  });

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });

    if (page.url().includes("/login")) {
      throw new Error(
        `Base44 login is required. Re-run with --show-browser, sign in, or run 'base44 login' to refresh CLI bearer auth.`
      );
    }

    const deployResult = await page.evaluate(async (deployEndpoint, bearerToken) => {
      const headers = {};
      if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
      const response = await fetch(deployEndpoint, {
        method: "POST",
        credentials: "include",
        headers,
      });
      const text = await response.text();
      let body = text;
      try {
        body = JSON.parse(text);
      } catch {
        // Keep raw text when the API does not return JSON.
      }
      return { ok: response.ok, status: response.status, body };
    }, endpoint, cliAccessToken);

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
