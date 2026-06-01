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
    yes: false,
    dryRun: false,
    dashboardUrl: "",
    profileDir: resolve(repoRoot, ".base44-publish-profile"),
    timeoutMs: 120000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--yes") args.yes = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--dashboard-url") args.dashboardUrl = argv[++i] || "";
    else if (arg === "--profile-dir") args.profileDir = resolve(argv[++i] || args.profileDir);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i] || args.timeoutMs);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/base44/publish-ui-clicker.mjs --dry-run
  node scripts/base44/publish-ui-clicker.mjs --yes

Options:
  --yes                 Click the Publish button when it is found.
  --dry-run             Open the dashboard and report whether Publish is clickable.
  --dashboard-url URL   Override the Base44 dashboard URL.
  --profile-dir DIR     Persistent browser profile for Base44 login cookies.
  --timeout-ms MS       Time to wait for the dashboard and controls.`);
}

function readBase44AppId() {
  const appConfigPath = resolve(repoRoot, "base44/.app.jsonc");
  const raw = readFileSync(appConfigPath, "utf8").replace(/^\/\/.*$/gm, "");
  return JSON.parse(raw).id;
}

async function findPublishButton(page, timeoutMs) {
  const candidates = [
    page.getByRole("button", { name: "Publish", exact: true }),
    page.getByRole("button", { name: "Publish changes", exact: true }),
    page.getByText("Publish", { exact: true }),
  ];

  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    for (const locator of candidates) {
      try {
        const count = await locator.count();
        if (count === 1 && await locator.isVisible() && await locator.isEnabled()) {
          return locator;
        }
      } catch (error) {
        lastError = error;
      }
    }

    await page.waitForTimeout(1000);
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}

async function clickOptionalConfirmation(page) {
  const confirmationButtons = [
    page.getByRole("button", { name: "Publish", exact: true }),
    page.getByRole("button", { name: "Confirm", exact: true }),
    page.getByRole("button", { name: "Continue", exact: true }),
  ];

  for (const locator of confirmationButtons) {
    try {
      if (await locator.count() === 1 && await locator.isVisible() && await locator.isEnabled()) {
        await locator.click();
        return true;
      }
    } catch {
      // Some dialogs disappear quickly after publish; keep moving.
    }
  }

  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const appId = readBase44AppId();
  const dashboardUrl = args.dashboardUrl || `https://app.base44.com/apps/${appId}/editor/workspace/overview`;

  if (!args.yes && !args.dryRun) {
    throw new Error("Refusing to click Publish without --yes. Use --dry-run to inspect safely.");
  }

  if (!existsSync(args.profileDir)) {
    mkdirSync(args.profileDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(args.profileDir, {
    headless: false,
    viewport: { width: 1440, height: 960 },
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });

  const publishButton = await findPublishButton(page, args.timeoutMs);
  if (!publishButton) {
    console.log("Publish button was not found or not enabled.");
    console.log("If Base44 is asking you to sign in, complete login in the opened browser and rerun this script.");
    await context.close();
    process.exit(2);
  }

  if (args.dryRun) {
    console.log(`Dry run passed: Publish button is visible at ${dashboardUrl}`);
    await context.close();
    return;
  }

  await publishButton.click();
  await page.waitForTimeout(1500);
  await clickOptionalConfirmation(page);
  await page.waitForTimeout(3000);

  console.log("Publish click was sent. Check the Base44 dashboard for final publish status.");
  await context.close();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
