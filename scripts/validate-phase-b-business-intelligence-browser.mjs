import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("../tools/browser-audit/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const modules = [
  "morningBrief",
  "businessHealth",
  "opportunityCenter",
  "revenueIntelligence",
  "websiteIntelligence",
];

const states = [
  "loading",
  "empty",
  "unknown",
  "permission",
  "unavailable",
  "partial",
  "stale",
  "delayed",
  "current",
];

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 820 },
  { width: 1024, height: 768 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];

function parseArgs() {
  const args = new Map();
  for (const arg of process.argv.slice(2)) {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    args.set(key, value);
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const baseUrl = args.get("url");
  if (!baseUrl) {
    throw new Error("Usage: node scripts/validate-phase-b-business-intelligence-browser.mjs --url=http://127.0.0.1:5174/work/phase-b-browser/phase-b.html");
  }

  const screenshotDir = path.resolve(repoRoot, "work", "phase-b-browser", "results");
  await fs.mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const moduleKey of modules) {
      for (const stateKey of states) {
        for (const viewport of viewports) {
          const page = await browser.newPage({ viewport });
          const url = new URL(baseUrl);
          url.searchParams.set("module", moduleKey);
          url.searchParams.set("state", stateKey);

          const consoleErrors = [];
          page.on("console", (message) => {
            if (message.type() === "error") consoleErrors.push(message.text());
          });

          const response = await page.goto(url.toString(), { waitUntil: "networkidle" });
          if (!response?.ok()) {
            throw new Error(`${moduleKey}/${stateKey}/${viewport.width}: HTTP ${response?.status()}`);
          }

          await page.waitForSelector(".cs-bi-surface h1", { timeout: 5000 });
          const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
          const headingCount = await page.locator("h1").count();
          const sourceDisclosureCount = await page.locator(".cs-bi-source-disclosure").count();
          const statusCount = await page.locator(".cs-status-badge, .cs-bi-freshness, .cs-bi-owner").count();

          if (horizontalOverflow) {
            throw new Error(`${moduleKey}/${stateKey}/${viewport.width}: horizontal overflow`);
          }
          if (headingCount !== 1) {
            throw new Error(`${moduleKey}/${stateKey}/${viewport.width}: expected exactly one h1, saw ${headingCount}`);
          }
          if (stateKey !== "loading" && stateKey !== "empty" && stateKey !== "unknown" && stateKey !== "permission" && stateKey !== "unavailable" && sourceDisclosureCount === 0) {
            throw new Error(`${moduleKey}/${stateKey}/${viewport.width}: missing source disclosure`);
          }
          if (statusCount === 0) {
            throw new Error(`${moduleKey}/${stateKey}/${viewport.width}: missing text status metadata`);
          }
          if (consoleErrors.length) {
            throw new Error(`${moduleKey}/${stateKey}/${viewport.width}: console errors: ${consoleErrors.join(" | ")}`);
          }

          if (stateKey === "current" && (viewport.width === 1440 || viewport.width === 390)) {
            await page.screenshot({
              path: path.join(screenshotDir, `${moduleKey}-${viewport.width}x${viewport.height}.png`),
              fullPage: true,
            });
          }

          results.push({ module: moduleKey, state: stateKey, viewport });
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ ok: true, checked: results.length, modules, states, viewports }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
