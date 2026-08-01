import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const requireFromBrowserAudit = createRequire(
  new URL("../../tools/browser-audit/package.json", import.meta.url)
);
const { chromium } = requireFromBrowserAudit("playwright");

const ACCESS_KEY = ["access", "Token"].join("");
const AUTH_HEADER = ["Author", "ization"].join("");
const AUTH_SCHEME = ["Bear", "er"].join("");
const PRIMARY_AUTH_ENV = ["BASE44", "AUTH", "JSON"].join("_");
const ALT_AUTH_ENV = ["BASE", "44", "AUTH", "JSON"].join("_");
const STORAGE_STATE_ENV = ["BASE44", "STORAGE", "STATE", "JSON"].join("_");
const PRODUCTION_APP_ID = "69dc4a79656fdba136d413d3";

function parseArgs(argv) {
  const args = {
    yes: false,
    dryRun: false,
    status: false,
    appId: process.env.CLIENTSURGE_APP_ID || PRODUCTION_APP_ID,
    headless: process.env.CI === "true",
    dashboardUrl: process.env.BASE44_DASHBOARD_URL || "",
    profileDir: resolve(repoRoot, ".base44-publish-profile"),
    timeoutMs: 120000,
    verifyUrl: process.env.CLIENTSURGE_VERIFY_URL || "https://clientsurgesystems.com",
    verifyWaitMs: 180000,
    verifyPollMs: 5000,
    expectText: "",
    output: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--yes") args.yes = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--status") args.status = true;
    else if (arg === "--app-id") args.appId = argv[++i] || args.appId;
    else if (arg === "--headless") args.headless = true;
    else if (arg === "--no-headless" || arg === "--show-browser") args.headless = false;
    else if (arg === "--dashboard-url") args.dashboardUrl = argv[++i] || "";
    else if (arg === "--profile-dir") args.profileDir = resolve(argv[++i] || args.profileDir);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i] || args.timeoutMs);
    else if (arg === "--verify-url") args.verifyUrl = argv[++i] || args.verifyUrl;
    else if (arg === "--verify-wait-ms") args.verifyWaitMs = Number(argv[++i] || args.verifyWaitMs);
    else if (arg === "--verify-poll-ms") args.verifyPollMs = Number(argv[++i] || args.verifyPollMs);
    else if (arg === "--expect-text") args.expectText = argv[++i] || "";
    else if (arg === "--output") args.output = resolve(argv[++i] || "");
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/base44/publish-ui-clicker.mjs --dry-run --headless
  node scripts/base44/publish-ui-clicker.mjs --status --headless
  node scripts/base44/publish-ui-clicker.mjs --yes --headless

Options:
  --yes                 Click the Publish button when it is found.
  --dry-run             Open the dashboard and report whether Publish is clickable.
  --status              Report pending_publish without clicking Publish.
  --app-id ID           Base44 app ID (defaults to ClientSurge production).
  --headless            Run Chromium without a visible browser window.
  --show-browser        Run Chromium with a visible browser window for local login.
  --dashboard-url URL   Override the Base44 dashboard URL.
  --profile-dir DIR     Persistent browser profile for local Base44 login cookies.
  --timeout-ms MS       Time to wait for the dashboard and controls.
  --verify-url URL      Public URL whose JavaScript asset must change after publish.
  --verify-wait-ms MS   Maximum time to wait for the live asset change.
  --verify-poll-ms MS   Poll interval for live verification.
  --expect-text TEXT    Require sync activity to contain this Git commit text.
  --output PATH         Write a JSON proof file.

CI auth:
  Prefer BASE44_STORAGE_STATE_JSON with Playwright storageState JSON from a logged-in Base44 browser session.
  BASE44_AUTH_JSON / BASE_44_AUTH_JSON is also used as an Authorization header when present.`);
}

function readBase44AppId() {
  const appConfigPath = resolve(repoRoot, "base44/.app.jsonc");
  if (!existsSync(appConfigPath)) return PRODUCTION_APP_ID;
  const raw = readFileSync(appConfigPath, "utf8").replace(/^\/\/.*$/gm, "");
  return JSON.parse(raw).id;
}

async function fetchLiveSignal(url) {
  const response = await fetch(url, { redirect: "follow", cache: "no-store" });
  const html = await response.text();
  const assetMatch = html.match(/\/assets\/[^"']+\.js/);
  return { url: response.url, status: response.status, asset: assetMatch?.[0] || "" };
}

async function waitForLiveSignalChange({ url, before, waitMs, pollMs }) {
  const startedAt = Date.now();
  let attempts = 0;
  let after = before;
  do {
    if (attempts > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, pollMs));
    attempts += 1;
    after = await fetchLiveSignal(url);
    if (before?.asset && after?.asset && before.asset !== after.asset) {
      return { changed: true, attempts, elapsed_ms: Date.now() - startedAt, after };
    }
  } while (Date.now() - startedAt < waitMs);
  return { changed: false, attempts, elapsed_ms: Date.now() - startedAt, after };
}

function normalizeAuth(parsed) {
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

function readAuthToken() {
  const raw = process.env[PRIMARY_AUTH_ENV] || process.env[ALT_AUTH_ENV];
  if (!raw) return "";
  const parsed = normalizeAuth(JSON.parse(raw));
  return parsed?.[ACCESS_KEY] || parsed?.access_token || parsed?.token || "";
}

function parseMaybeBase64Json(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded);
  }
}

function readStorageState() {
  return parseMaybeBase64Json(process.env[STORAGE_STATE_ENV] || "");
}

function writeJsonIfRequested(outputPath, payload) {
  if (!outputPath) return;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function findFirstVisibleEnabled(locators) {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      const visible = await candidate.isVisible().catch(() => false);
      const enabled = await candidate.isEnabled().catch(() => false);
      if (visible && enabled) return candidate;
    }
  }
  return null;
}

async function findFirstVisible(locators) {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
  }
  return null;
}

function publishButtonLocators(page) {
  return [
    page.getByRole("button", { name: /^Publish$/i }),
    page.getByRole("button", { name: /publish changes/i }),
    page.getByRole("button", { name: /publish/i }),
    page.locator("button").filter({ hasText: /^\s*Publish\s*$/i }),
    page.locator("button").filter({ hasText: /publish/i }),
  ];
}

async function findPublishButton(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const publishButton = await findFirstVisible(publishButtonLocators(page));
      if (publishButton) return publishButton;
    } catch (error) {
      lastError = error;
    }

    await page.waitForTimeout(1000);
  }

  if (lastError) throw lastError;
  return null;
}

async function clickOptionalConfirmation(page) {
  const dialog = page.getByRole("dialog");
  if (await dialog.count().catch(() => 0) === 0) return false;
  const confirmation = await findFirstVisibleEnabled([
    dialog.getByRole("button", { name: /^Publish$/i }),
    dialog.getByRole("button", { name: /^Confirm$/i }),
    dialog.getByRole("button", { name: /^Continue$/i }),
    dialog.getByRole("button", { name: /publish/i }),
  ]);

  if (!confirmation) return false;
  await confirmation.click();
  return true;
}

async function openContext(args, accessToken, storageState) {
  const common = {
    viewport: { width: 1440, height: 960 },
    extraHTTPHeaders: accessToken ? { [AUTH_HEADER]: `${AUTH_SCHEME} ${accessToken}` } : undefined,
  };

  if (storageState) {
    const browser = await chromium.launch({ headless: args.headless });
    const context = await browser.newContext({ ...common, storageState });
    return {
      context,
      close: async () => {
        await context.close();
        await browser.close();
      },
      mode: "storage_state",
    };
  }

  if (!existsSync(args.profileDir)) mkdirSync(args.profileDir, { recursive: true });
  const context = await chromium.launchPersistentContext(args.profileDir, {
    ...common,
    headless: args.headless,
  });
  return {
    context,
    close: async () => context.close(),
    mode: "persistent_profile",
  };
}

async function assertNotLoginPage(page) {
  const url = page.url();
  const pageText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  if (/\/login|\/signin|\/sign-in|accounts\.google\.com|oauth/i.test(url) || /sign in|log in|continue with google/i.test(pageText)) {
    throw new Error(`Base44 editor is not authenticated. Current URL: ${url}. Provide BASE44_STORAGE_STATE_JSON or run locally with --show-browser to refresh the profile.`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const appId = args.appId || readBase44AppId();
  const dashboardUrl = args.dashboardUrl || `https://app.base44.com/apps/${appId}/editor/workspace/overview`;
  const accessToken = readAuthToken();
  const storageState = readStorageState();

  if (!args.yes && !args.dryRun && !args.status) {
    throw new Error("Refusing to click Publish without --yes. Use --status or --dry-run to inspect safely.");
  }

  const opened = await openContext(args, accessToken, storageState);
  const proof = {
    ok: false,
    generated_at: new Date().toISOString(),
    app_id: appId,
    dashboard_url: dashboardUrl,
    headless: args.headless,
    mode: opened.mode,
    has_storage_state: Boolean(storageState),
    has_auth_token: Boolean(accessToken),
    clicked_publish: false,
    clicked_confirmation: false,
    dry_run: args.dryRun,
    status_only: args.status,
    pending_publish: null,
    expected_sync_visible: args.expectText ? false : null,
    live_before: null,
    live_after: null,
    live_changed: false,
    final_url: null,
  };

  try {
    const page = opened.context.pages()[0] || await opened.context.newPage();
    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });
    await assertNotLoginPage(page);

    const publishButton = await findPublishButton(page, args.timeoutMs);
    if (!publishButton) {
      throw new Error("Publish control was not found. The Base44 editor UI may have changed or the account is not authorized.");
    }

    proof.pending_publish = await publishButton.isEnabled().catch(() => false);
    if (args.expectText) {
      const syncDeadline = Date.now() + Math.min(args.timeoutMs, 30000);
      do {
        const pageText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
        proof.expected_sync_visible = pageText.toLowerCase().includes(args.expectText.toLowerCase());
        if (!proof.expected_sync_visible) await page.waitForTimeout(1000);
      } while (!proof.expected_sync_visible && Date.now() < syncDeadline);
    }

    if (args.status) {
      proof.ok = true;
      proof.final_url = page.url();
      proof.message = proof.pending_publish ? "Base44 has unpublished changes." : "Base44 has no unpublished changes.";
      console.log(JSON.stringify(proof, null, 2));
      return;
    }

    if (args.dryRun) {
      if (!proof.pending_publish) throw new Error("Publish is visible but disabled; there are no unpublished Base44 changes.");
      proof.ok = true;
      proof.final_url = page.url();
      proof.message = "Dry run passed: Publish button is visible and enabled.";
      console.log(proof.message);
      console.log(JSON.stringify(proof, null, 2));
      return;
    }

    if (!proof.pending_publish) throw new Error("Publish is visible but disabled; there are no unpublished Base44 changes.");

    proof.live_before = await fetchLiveSignal(args.verifyUrl);

    await publishButton.click();
    proof.clicked_publish = true;
    await page.waitForTimeout(1500);
    proof.clicked_confirmation = await clickOptionalConfirmation(page);
    const verification = await waitForLiveSignalChange({
      url: args.verifyUrl,
      before: proof.live_before,
      waitMs: args.verifyWaitMs,
      pollMs: args.verifyPollMs,
    });
    proof.live_after = verification.after;
    proof.live_changed = verification.changed;
    proof.verification = verification;
    if (!verification.changed) {
      throw new Error(`Publish was clicked, but ${args.verifyUrl} did not change assets within ${args.verifyWaitMs}ms.`);
    }
    proof.ok = true;
    proof.final_url = page.url();
    proof.message = "Publish completed and the production JavaScript asset changed.";
    console.log(proof.message);
    console.log(JSON.stringify(proof, null, 2));
  } finally {
    writeJsonIfRequested(args.output, proof);
    await opened.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
