#!/usr/bin/env node

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_START_URL, makeScreenshotName, normalizeUrl, parseArgs } from "./audit-page.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(__dirname, "..");
const defaultScreenshotsDir = resolve(auditRoot, "screenshots");

async function screenshotPage(url, options = {}) {
  const normalizedUrl = normalizeUrl(url, options.baseUrl ?? DEFAULT_START_URL);
  if (!normalizedUrl) throw new Error(`Invalid URL: ${url}`);

  const screenshotsDir = options.screenshotsDir ?? defaultScreenshotsDir;
  await mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const outputs = {};
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1200 },
    mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: name === "mobile" ? 2 : 1,
      isMobile: name === "mobile",
    });
    const page = await context.newPage();
    await page.goto(normalizedUrl, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1000);
    const path = resolve(screenshotsDir, makeScreenshotName(normalizedUrl, name));
    await page.screenshot({ path, fullPage: true });
    outputs[name] = path;
    await context.close();
  }
  await browser.close();
  return outputs;
}

async function main() {
  const args = parseArgs();
  const outputs = await screenshotPage(args.url ?? DEFAULT_START_URL, {
    baseUrl: args.base ?? DEFAULT_START_URL,
    screenshotsDir: args.screenshots ? resolve(process.cwd(), args.screenshots) : defaultScreenshotsDir,
  });
  process.stdout.write(`${JSON.stringify(outputs, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
