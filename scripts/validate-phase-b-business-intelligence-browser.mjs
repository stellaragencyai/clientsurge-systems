import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import net from "node:net";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const browserAuditRequire = createRequire(path.join(repoRoot, "tools", "browser-audit", "package.json"));
const { chromium } = browserAuditRequire("playwright");
const axe = browserAuditRequire("axe-core");

const modules = [
  "morningBrief",
  "businessHealth",
  "opportunityCenter",
  "revenueIntelligence",
  "websiteIntelligence",
];

const moduleRoutePaths = {
  morningBrief: "morning-brief",
  businessHealth: "business-health",
  opportunityCenter: "opportunities",
  revenueIntelligence: "revenue",
  websiteIntelligence: "website",
};

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

const statesRequiringDisclosure = new Set(["partial", "stale", "delayed", "current"]);
const resultsDir = path.join(repoRoot, "work", "phase-b-browser", "results");

function parseArgs() {
  const args = new Map();
  for (const arg of process.argv.slice(2)) {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    args.set(key, value);
  }
  return args;
}

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startDevServer(port) {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npm run dev -- --host 127.0.0.1 --port ${port}`]
    : ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)];
  const child = spawn(command, args, { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });

  return {
    getOutput: () => output,
    stop: () => new Promise((resolve) => {
      if (process.platform === "win32") {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        killer.once("exit", resolve);
        setTimeout(resolve, 2500);
        return;
      }
      child.once("exit", resolve);
      child.kill("SIGTERM");
      setTimeout(resolve, 2500);
    }),
  };
}

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function reviewModuleUrl(baseUrl, moduleKey, params = {}) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const routePath = moduleRoutePaths[moduleKey];
  const url = new URL(routePath ? `${routePath}/` : "", normalizedBaseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1 || overflow.bodyScrollWidth > overflow.clientWidth + 1) {
    fail(`horizontal overflow at ${label}`, overflow);
  }
}

async function assertNoDuplicateIds(page, label) {
  const duplicates = await page.evaluate(() => {
    const counts = new Map();
    document.querySelectorAll("[id]").forEach((element) => counts.set(element.id, (counts.get(element.id) || 0) + 1));
    return Array.from(counts.entries()).filter(([, count]) => count > 1);
  });
  if (duplicates.length) fail(`duplicate IDs at ${label}`, { duplicates });
}

async function assertTouchTargets(page, label) {
  const failures = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("a[href], button, [role='button']"));
    return nodes
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: element.textContent.trim(),
          tag: element.tagName.toLowerCase(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width < 40 || item.height < 40);
  });
  if (failures.length) fail(`small interactive targets at ${label}`, { failures });
}

async function assertAxeCritical(page, label) {
  await page.addScriptTag({ content: axe.source });
  const axeResult = await page.evaluate(async () => window.axe.run(document, {
    resultTypes: ["violations"],
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  }));
  const critical = axeResult.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  if (critical.length) {
    fail(`axe serious/critical violations at ${label}`, {
      violations: critical.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        nodes: nodes.slice(0, 5).map((node) => ({ target: node.target, html: node.html })),
      })),
    });
  }
}

async function assertSurfaceContracts(page, moduleKey, stateKey, viewport) {
  const label = `${moduleKey}/${stateKey}/${viewport.width}x${viewport.height}`;
  await page.waitForSelector(".cs-bi-surface h1", { timeout: 5000 });

  const headingCount = await page.locator(".cs-bi-surface h1").count();
  const statusCount = await page.locator(".cs-status-badge, .cs-bi-freshness, .cs-bi-owner").count();
  const sourceDisclosureCount = await page.locator(".cs-bi-source-disclosure").count();
  const text = await page.locator(".cs-bi-surface").innerText();
  const lowerText = text.toLowerCase();

  if (headingCount !== 1) fail(`expected exactly one surface h1 at ${label}`, { headingCount });
  if (statusCount === 0) fail(`missing text status metadata at ${label}`);
  if (statesRequiringDisclosure.has(stateKey) && sourceDisclosureCount === 0) {
    fail(`missing source disclosure at ${label}`);
  }
  if (statesRequiringDisclosure.has(stateKey)) {
    const disclosureText = await page.locator(".cs-bi-source-disclosure").first().innerText();
    const disclosureLower = disclosureText.toLowerCase();
    for (const required of ["source", "truth", "freshness"]) {
      if (!disclosureLower.includes(required)) fail(`source disclosure missing ${required} at ${label}`, { disclosureText });
    }
  }

  const requiredStateLanguage = {
    loading: ["loading", "checking", "preparing"],
    empty: ["no ", "not treated", "does not mean", "connect"],
    unknown: ["unknown", "insufficient"],
    permission: ["permission"],
    unavailable: ["unavailable"],
    partial: ["partial", "missing"],
    stale: ["stale"],
    delayed: ["delayed", "delay"],
    current: ["current", "verified"],
  }[stateKey];
  if (!requiredStateLanguage.some((phrase) => lowerText.includes(phrase))) {
    fail(`state language not explicit at ${label}`, { requiredStateLanguage, text });
  }

  for (const forbidden of ["all clear", "you're all set", "everything looks good", "guaranteed outcome"]) {
    if (lowerText.includes(forbidden)) fail(`unsupported certainty language at ${label}`, { forbidden, text });
  }

  if (moduleKey === "businessHealth") {
    const numericScore = /\b\d{1,3}\s*(?:\/\s*100|%)\b/.exec(text);
    if (numericScore) fail(`business health rendered unsupported numeric score at ${label}`, { numericScore: numericScore[0], text });
  }

  if (moduleKey === "opportunityCenter" && text.includes("$")) {
    fail(`opportunity center rendered unsupported dollar impact at ${label}`, { text });
  }

  if (moduleKey === "revenueIntelligence" && statesRequiringDisclosure.has(stateKey)) {
    for (const required of ["Collected", "Estimated", "Unknown"]) {
      if (!text.includes(required)) fail(`revenue class boundary missing ${required} at ${label}`, { text });
    }
  }

  if (moduleKey === "websiteIntelligence" && statesRequiringDisclosure.has(stateKey)) {
    for (const required of ["Technical", "Business outcomes"]) {
      if (!text.includes(required)) fail(`website boundary language missing ${required} at ${label}`, { text });
    }
  }
}

async function main() {
  await mkdir(resultsDir, { recursive: true });
  const args = parseArgs();
  let server = null;
  let reviewUrl = args.get("url");
  if (!reviewUrl) {
    const port = await findOpenPort();
    server = startDevServer(port);
    reviewUrl = `http://127.0.0.1:${port}/review/phase-b/`;
  }

  let browser;
  let checked = 0;
  let axeChecked = 0;

  try {
    await waitForServer(reviewUrl);
    browser = await chromium.launch({ headless: true });

    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      await page.goto(reviewUrl, { waitUntil: "networkidle" });
      if (consoleErrors.length) fail("console errors on default controls route", { consoleErrors });
      await assertNoHorizontalOverflow(page, "controls/default");
      await assertTouchTargets(page, "controls/default");
      await context.close();
    }

    for (const moduleKey of modules) {
      for (const stateKey of states) {
        for (const viewport of viewports) {
          const label = `${moduleKey}/${stateKey}/${viewport.width}x${viewport.height}`;
          const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
          const page = await context.newPage();
          const consoleErrors = [];
          page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
          page.on("pageerror", (error) => consoleErrors.push(error.message));

          try {
            const response = await page.goto(reviewModuleUrl(reviewUrl, moduleKey, {
              state: stateKey,
              controls: "0",
            }), { waitUntil: "networkidle" });
            if (!response?.ok()) fail(`HTTP failure at ${label}`, { status: response?.status() });
            if (consoleErrors.length) fail(`console errors at ${label}`, { consoleErrors });

            await assertSurfaceContracts(page, moduleKey, stateKey, viewport);
            await assertNoDuplicateIds(page, label);
            await assertNoHorizontalOverflow(page, label);
            await assertTouchTargets(page, label);

            if (stateKey === "current" && (viewport.width === 1440 || viewport.width === 390)) {
              await assertAxeCritical(page, label);
              axeChecked++;
              await page.screenshot({
                path: path.join(resultsDir, `${moduleKey}-${viewport.width}x${viewport.height}.png`),
                fullPage: true,
              });
            }

            checked++;
          } finally {
            await context.close();
          }
        }
      }
    }

    console.log(JSON.stringify({
      ok: true,
      checked,
      axeChecked,
      controlsChecked: true,
      modules,
      states,
      viewports,
      reviewUrl: "/review/phase-b/",
      reviewRoutes: Object.values(moduleRoutePaths).map((routePath) => `/review/phase-b/${routePath}/`),
      screenshots: resultsDir,
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      message: error.message,
      details: error.details || null,
      serverOutput: server?.getOutput?.() || null,
    }, null, 2));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) await server.stop();
  }
}

await main();
