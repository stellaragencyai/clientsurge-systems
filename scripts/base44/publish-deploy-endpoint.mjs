import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

async function loadChromium() {
  try {
    const { createRequire } = await import("node:module");
    const requireFromBrowserAudit = createRequire(
      new URL("../../tools/browser-audit/package.json", import.meta.url)
    );
    return requireFromBrowserAudit("playwright").chromium;
  } catch (error) {
    throw new Error(
      `Playwright browser fallback is unavailable. CLI bearer deploy failed, and browser fallback could not load: ${error.message}`
    );
  }
}

function parseArgs(argv) {
  const args = {
    appId: "",
    profileDir: resolve(repoRoot, ".base44-publish-profile"),
    timeoutMs: 120000,
    verifyUrl: "",
    verifyWaitMs: 90000,
    verifyPollMs: 5000,
    showBrowser: false,
    dryRun: false,
    summary: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--app-id") args.appId = argv[++i] || "";
    else if (arg === "--profile-dir") args.profileDir = resolve(argv[++i] || args.profileDir);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i] || args.timeoutMs);
    else if (arg === "--verify-url") args.verifyUrl = argv[++i] || "";
    else if (arg === "--verify-wait-ms") args.verifyWaitMs = Number(argv[++i] || args.verifyWaitMs);
    else if (arg === "--verify-poll-ms") args.verifyPollMs = Number(argv[++i] || args.verifyPollMs);
    else if (arg === "--show-browser") args.showBrowser = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--summary") args.summary = true;
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
  --verify-wait-ms MS How long to poll for the live signal to change after deploy.
  --verify-poll-ms MS Poll interval while waiting for the live signal to change.
  --show-browser      Open a visible browser, useful for first-time login.
  --summary           Print a compact JSON result without the full app payload.
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

function buildSummary({ ok, appId, beforeSignal, deployResult, afterSignal }) {
  return {
    ok,
    appId,
    beforeSignal,
    deploy: {
      ok: deployResult?.ok ?? null,
      status: deployResult?.status ?? null,
      updatedDate: deployResult?.body?.updated_date || null,
      appName: deployResult?.body?.name || null,
    },
    afterSignal,
  };
}

function signalsMatch(beforeSignal, afterSignal) {
  if (!beforeSignal || !afterSignal) return false;
  return (
    beforeSignal.asset === afterSignal.asset &&
    beforeSignal.hasProductionAppId === afterSignal.hasProductionAppId &&
    beforeSignal.hasDonorAppId === afterSignal.hasDonorAppId
  );
}

async function waitForLiveSignalChange({
  verifyUrl,
  beforeSignal,
  waitMs,
  pollMs,
}) {
  if (!verifyUrl) {
    return {
      changed: false,
      attempts: 0,
      elapsedMs: 0,
      finalSignal: null,
      reason: "verify_url_missing",
    };
  }

  const startedAt = Date.now();
  let attempts = 0;
  let finalSignal = null;

  do {
    if (attempts > 0) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, pollMs));
    }

    attempts += 1;
    finalSignal = await fetchLiveSignal(verifyUrl);

    if (!signalsMatch(beforeSignal, finalSignal)) {
      return {
        changed: true,
        attempts,
        elapsedMs: Date.now() - startedAt,
        finalSignal,
        reason: "signal_changed",
      };
    }
  } while (Date.now() - startedAt < waitMs);

  return {
    changed: false,
    attempts,
    elapsedMs: Date.now() - startedAt,
    finalSignal,
    reason: "timeout_waiting_for_signal_change",
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
  const endpoint = `/api/apps/${appId}/deploy`;
  const cliAccessToken = await refreshCliAuthIfNeeded();
  if (args.dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, dashboardUrl, endpoint, hasCliAuth: Boolean(cliAccessToken) }, null, 2));
    return;
  }

  const cliDeployResult = await postDeployWithBearer(appId, cliAccessToken);
  if (cliDeployResult?.ok) {
    const verification = await waitForLiveSignalChange({
      verifyUrl: args.verifyUrl,
      beforeSignal,
      waitMs: args.verifyWaitMs,
      pollMs: args.verifyPollMs,
    });
    const afterSignal = verification.finalSignal;
    const result = {
      ok: true,
      appId,
      beforeSignal,
      deployResult: cliDeployResult,
      verification,
      afterSignal,
    };
    console.log(JSON.stringify(args.summary ? buildSummary(result) : result, null, 2));
    return;
  }

  const chromium = await loadChromium();
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

    const verification = await waitForLiveSignalChange({
      verifyUrl: args.verifyUrl,
      beforeSignal,
      waitMs: args.verifyWaitMs,
      pollMs: args.verifyPollMs,
    });
    const afterSignal = verification.finalSignal;
    const result = { ok: true, appId, beforeSignal, deployResult, verification, afterSignal };
    console.log(JSON.stringify(args.summary ? buildSummary(result) : result, null, 2));
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
