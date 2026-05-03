import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

const args = new Set(process.argv.slice(2));
const runBrowser = args.has("--browser");

for (const stream of [process.stdout, process.stderr]) {
  stream.on("error", (error) => {
    if (error.code !== "EPIPE") {
      throw error;
    }
  });
}

const relative = (targetPath) => path.relative(root, targetPath).replaceAll("\\", "/");

function run(label, command, commandArgs) {
  console.log(`\n[qa-watch] ${label}`);
  const executable =
    process.platform === "win32" && (command === "npm" || command === "npx")
      ? `${command}.cmd`
      : command;
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  return result.status ?? 1;
}

function shouldTriggerBrowser(filePath) {
  const rel = relative(filePath);
  return (
    rel.startsWith("src/") ||
    rel.startsWith("playwright/") ||
    rel === "playwright.customer-experience.config.mjs"
  );
}

function sync({ browser = false, reason = "manual" } = {}) {
  console.log(`\n[qa-watch] Sync triggered (${reason})`);
  const codeStatus = run(
    "Refreshing code audit",
    "node",
    ["scripts/qa/run-customer-experience-code-audit.mjs"]
  );

  const changeAwareStatus = run(
    "Refreshing change-aware QA tasks",
    "node",
    ["scripts/qa/generate-change-aware-customer-checks.mjs"]
  );

  let browserStatus = 0;
  if (browser) {
    browserStatus = run(
      "Refreshing browser checks",
      "npx",
      ["playwright", "test", "-c", "playwright.customer-experience.config.mjs"]
    );
  }

  const extractStatus = run(
    "Refreshing browser status summary",
    "node",
    ["scripts/qa/extract-customer-experience-playwright-status.mjs"]
  );

  const generateStatus = run(
    "Refreshing live markdown tracker",
    "node",
    ["scripts/qa/generate-customer-experience-live-report.mjs"]
  );

  const failed = [codeStatus, changeAwareStatus, browserStatus, extractStatus, generateStatus].some((status) => status !== 0);
  console.log(
    failed
      ? "[qa-watch] Sync completed with one or more errors."
      : "[qa-watch] Tracker refresh completed successfully."
  );
}

const watchRoots = [
  path.join(root, "src"),
  path.join(root, "playwright"),
  path.join(root, "qa", "results"),
  path.join(root, "qa", "customer-experience-qa-template.md"),
  path.join(root, "playwright.customer-experience.config.mjs"),
];

let debounceTimer = null;
let browserRequested = false;

function scheduleSync(filePath) {
  const rel = relative(filePath);

  if (
    rel === "docs/customer-experience-qa-tracker.md" ||
    rel === "docs/customer-experience-qa-live.md"
  ) {
    return;
  }

  if (runBrowser && shouldTriggerBrowser(filePath)) {
    browserRequested = true;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    const shouldRunBrowser = browserRequested;
    browserRequested = false;
    sync({
      browser: shouldRunBrowser,
      reason: rel,
    });
  }, 1200);
}

for (const target of watchRoots) {
  if (!fs.existsSync(target)) {
    continue;
  }

  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    fs.watch(
      target,
      { recursive: true },
      (_eventType, filename) => {
        if (!filename) {
          return;
        }
        scheduleSync(path.join(target, filename.toString()));
      }
    );
    console.log(`[qa-watch] Watching ${relative(target)}/`);
  } else {
    fs.watch(target, () => scheduleSync(target));
    console.log(`[qa-watch] Watching ${relative(target)}`);
  }
}

console.log(
  runBrowser
    ? "[qa-watch] Browser mode enabled. Playwright checks rerun after relevant changes."
    : "[qa-watch] Fast mode enabled. Reuses latest browser results and refreshes the tracker immediately."
);

sync({ browser: false, reason: "startup" });

process.stdin.resume();
