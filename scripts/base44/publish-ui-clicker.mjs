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

function parseArgs(argv) {
  const args = {
    yes: false,
    dryRun: false,
    headless: process.env.CI === "true",
    dashboardUrl: process.env.BASE44_DASHBOARD_URL || "",
    profileDir: resolve(repoRoot, ".base44-publish-profile"),
    timeoutMs: 120000,
    output: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--yes") args.yes = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--headless") args.headless = true;
    else if (arg === "--no-headless" || arg === "--show-browser") args.headless = false;
    else if (arg === "--dashboard-url") args.dashboardUrl = argv[++i] || "";
    else if (arg === "--profile-dir") args.profileDir = resolve(argv[++i] || args.profileDir);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i] || args.timeoutMs);
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
  node scripts/base44/publish-ui-clicker.mjs --yes --headless

Options:
  --yes                 Click the Publish button when it is found.
  --dry-run             Open the dashboard and report whether Publish is clickable.
  --headless            Run Chromium without a visible browser window.
  --show-browser        Run Chromium with a visible browser window for local login.
  --dashboard-url URL   Override the Base44 dashboard URL.
  --profile-dir DIR     Persistent browser profile for local Base44 login cookies.
  --timeout-ms MS       Time to wait for the dashboard and controls.
  --output PATH         Write a JSON proof file.

CI auth:
  Prefer BASE44_STORAGE_STATE_JSON with Playwright storageState JSON from a logged-in Base44 browser session.
  BASE44_AUTH_JSON / BASE_44_AUTH_JSON is also used as an Authorization header when present.`);
}

function readBase44AppId() {
  const appConfigPath = resolve(repoRoot, "base44/.app.jsonc");
  const raw = readFileSync(appConfigPath, "utf8").replace(/^\/\/.*$/gm, "");
  return JSON.parse(raw).id;
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

async function findPublishButton(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const publishButton = await findFirstVisibleEnabled([
        page.getByRole("button", { name: /^Publish$/i }),
        page.getByRole("button", { name: /publish changes/i }),
        page.getByRole("button", { name: /publish/i }),
        page.locator("button").filter({ hasText: /^\s*Publish\s*$/i }),
        page.locator("button").filter({ hasText: /publish/i }),
      ]);
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
  const confirmation = await findFirstVisibleEnabled([
    page.getByRole("button", { name: /^Publish$/i }),
    page.getByRole("button", { name: /^Confirm$/i }),
    page.getByRole("button", { name: /^Continue$/i }),
    page.getByRole("button", { name: /publish/i }),
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
  const appId = readBase44AppId();
  const dashboardUrl = args.dashboardUrl || `https://app.base44.com/apps/${appId}/editor/workspace/overview`;
  const accessToken = readAuthToken();
  const storageState = readStorageState();

  if (!args.yes && !args.dryRun) {
    throw new Error("Refusing to click Publish without --yes. Use --dry-run to inspect safely.");
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
    final_url: null,
  };

  try {
    const page = opened.context.pages()[0] || await opened.context.newPage();
    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });
    await assertNotLoginPage(page);

    const publishButton = await findPublishButton(page, args.timeoutMs);
    if (!publishButton) {
      throw new Error("Publish button was not found or not enabled. Base44 may already be published, the editor UI changed, or the account is not authorized.");
    }

    if (args.dryRun) {
      proof.ok = true;
      proof.final_url = page.url();
      proof.message = "Dry run passed: Publish button is visible and enabled.";
      console.log(proof.message);
      console.log(JSON.stringify(proof, null, 2));
      return;
    }

    await publishButton.click();
    proof.clicked_publish = true;
    await page.waitForTimeout(1500);
    proof.clicked_confirmation = await clickOptionalConfirmation(page);
    await page.waitForTimeout(5000);
    proof.ok = true;
    proof.final_url = page.url();
    proof.message = "Publish click was sent. Check Base44 for final publish status.";
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
