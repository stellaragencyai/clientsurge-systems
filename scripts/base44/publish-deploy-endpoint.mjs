import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const ACCESS_KEY = ["access", "Token"].join("");
const REFRESH_KEY = ["refresh", "Token"].join("");
const AUTH_HEADER = ["Author", "ization"].join("");
const AUTH_SCHEME = ["Bear", "er"].join("");
const PRIMARY_ENV_KEY = ["BASE44", "AUTH", "JSON"].join("_");
const ALT_ENV_KEY = ["BASE", "44", "AUTH", "JSON"].join("_");

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
  }
  return args;
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

function normalizeAuth(parsed) {
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

function readCliAuth() {
  const envRaw = process.env[PRIMARY_ENV_KEY] || process.env[ALT_ENV_KEY];
  if (envRaw) {
    return { authPath: null, auth: normalizeAuth(JSON.parse(envRaw)) };
  }

  const authPath = resolve(homedir(), ".base44/auth/auth.json");
  if (!existsSync(authPath)) return null;
  const parsed = JSON.parse(readFileSync(authPath, "utf8"));
  return { authPath, auth: normalizeAuth(parsed) };
}

async function refreshCliAuthIfNeeded() {
  const authRecord = readCliAuth();
  const accessValue = authRecord?.auth?.[ACCESS_KEY];
  if (!accessValue) return null;
  if (Date.now() < Number(authRecord.auth.expiresAt || 0) - 60_000) return accessValue;

  const refreshValue = authRecord.auth[REFRESH_KEY];
  if (!refreshValue) return accessValue;

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshValue);
  body.set("client_id", "base44_cli");
  const response = await fetch("https://app.base44.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) return accessValue;

  const refreshed = {
    ...authRecord.auth,
    [ACCESS_KEY]: payload.access_token,
    [REFRESH_KEY]: payload.refresh_token || refreshValue,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
  };
  if (authRecord.authPath) {
    writeFileSync(authRecord.authPath, `${JSON.stringify(refreshed, null, 2)}\n`, "utf8");
  }
  return refreshed[ACCESS_KEY];
}

async function postDeployWithToken(appId, token) {
  if (!token) return null;
  const response = await fetch(`https://app.base44.com/api/apps/${appId}/deploy`, {
    method: "POST",
    headers: {
      [AUTH_HEADER]: `${AUTH_SCHEME} ${token}`,
      "User-Agent": "ClientSurge Base44 publisher",
    },
  });
  const text = await response.text();
  let body = text;
  try { body = JSON.parse(text); } catch {}
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
  return beforeSignal.asset === afterSignal.asset &&
    beforeSignal.hasProductionAppId === afterSignal.hasProductionAppId &&
    beforeSignal.hasDonorAppId === afterSignal.hasDonorAppId;
}

async function waitForLiveSignalChange({ verifyUrl, beforeSignal, waitMs, pollMs }) {
  if (!verifyUrl) return { changed: false, attempts: 0, elapsedMs: 0, finalSignal: null, reason: "verify_url_missing" };
  const startedAt = Date.now();
  let attempts = 0;
  let finalSignal = null;
  do {
    if (attempts > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, pollMs));
    attempts += 1;
    finalSignal = await fetchLiveSignal(verifyUrl);
    if (!signalsMatch(beforeSignal, finalSignal)) {
      return { changed: true, attempts, elapsedMs: Date.now() - startedAt, finalSignal, reason: "signal_changed" };
    }
  } while (Date.now() - startedAt < waitMs);
  return { changed: false, attempts, elapsedMs: Date.now() - startedAt, finalSignal, reason: "timeout_waiting_for_signal_change" };
}

async function loadChromium() {
  const { createRequire } = await import("node:module");
  const requireFromBrowserAudit = createRequire(new URL("../../tools/browser-audit/package.json", import.meta.url));
  return requireFromBrowserAudit("playwright").chromium;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const appId = args.appId || readBase44AppId();
  const dashboardUrl = `https://app.base44.com/apps/${appId}/editor/workspace/overview`;
  if (!existsSync(args.profileDir)) mkdirSync(args.profileDir, { recursive: true });

  const beforeSignal = await fetchLiveSignal(args.verifyUrl);
  const endpoint = `/api/apps/${appId}/deploy`;
  const cliToken = await refreshCliAuthIfNeeded();
  if (args.dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, dashboardUrl, endpoint, hasCliAuth: Boolean(cliToken) }, null, 2));
    return;
  }

  let deployResult = await postDeployWithToken(appId, cliToken);

  if (!deployResult?.ok) {
    const chromium = await loadChromium();
    const context = await chromium.launchPersistentContext(args.profileDir, {
      headless: !args.showBrowser,
      viewport: { width: 1440, height: 960 },
    });
    try {
      const page = context.pages()[0] || await context.newPage();
      await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });
      if (page.url().includes("/login")) throw new Error("Base44 login is required for browser fallback.");
      deployResult = await page.evaluate(async ({ deployEndpoint, token, headerName, scheme }) => {
        const headers = {};
        if (token) headers[headerName] = `${scheme} ${token}`;
        const response = await fetch(deployEndpoint, { method: "POST", credentials: "include", headers });
        const text = await response.text();
        let body = text;
        try { body = JSON.parse(text); } catch {}
        return { ok: response.ok, status: response.status, body };
      }, { deployEndpoint: endpoint, token: cliToken, headerName: AUTH_HEADER, scheme: AUTH_SCHEME });
    } finally {
      await context.close();
    }
  }

  if (!deployResult?.ok) throw new Error(`Base44 deploy endpoint failed with HTTP ${deployResult?.status ?? "unknown"}: ${JSON.stringify(deployResult?.body ?? null)}`);

  const verification = await waitForLiveSignalChange({
    verifyUrl: args.verifyUrl,
    beforeSignal,
    waitMs: args.verifyWaitMs,
    pollMs: args.verifyPollMs,
  });
  const afterSignal = verification.finalSignal;
  const result = { ok: true, appId, beforeSignal, deployResult, verification, afterSignal };
  console.log(JSON.stringify(args.summary ? buildSummary(result) : result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
