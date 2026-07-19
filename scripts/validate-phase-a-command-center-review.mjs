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

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 820 },
  { width: 1024, height: 768 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];

const actionStates = ["verified_zero", "not_loaded", "failed", "not_connected", "restricted", "unsupported", "unknown"];
const freshnessStates = ["live", "current", "delayed", "stale", "partial", "not_connected", "unavailable", "unknown"];
const resultsDir = path.join(repoRoot, "work", "phase-a-command-center-review", "results");

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

async function assertNoDuplicateIds(page) {
  const duplicates = await page.evaluate(() => {
    const counts = new Map();
    document.querySelectorAll("[id]").forEach((element) => counts.set(element.id, (counts.get(element.id) || 0) + 1));
    return Array.from(counts.entries()).filter(([, count]) => count > 1);
  });
  if (duplicates.length) fail("duplicate IDs found", { duplicates });
}

async function assertNeutralDefaults(page) {
  const text = await page.locator("body").innerText();
  for (const forbidden of ["Operational", "Live operational view", "You are caught up", "All clear"]) {
    if (text.includes(forbidden)) fail(`neutral default leaked ${forbidden}`, { text });
  }
  for (const required of ["Data not verified", "Status being verified", "Action queue not verified", "Business pulse not verified"]) {
    if (!text.includes(required)) fail(`neutral default missing ${required}`, { text });
  }
}

async function assertActionQueueState(page, state) {
  const text = await page.locator("#daily-actions").innerText();
  const expected = {
    verified_zero: "No human action is currently required",
    not_loaded: "Action queue not loaded",
    failed: "Action queue failed to load",
    not_connected: "Action source not connected",
    restricted: "Action queue restricted",
    unsupported: "Action queue unsupported",
    unknown: "Action queue not verified",
  }[state];
  if (!text.includes(expected)) fail(`action queue state ${state} missing ${expected}`, { text });
  if (text.includes("You are caught up")) fail("forbidden caught-up copy rendered", { text });
}

async function assertLiveGating(page, shouldBeLive) {
  const statusLine = await page.locator(".cs-command-center__status-line").innerText();
  if (shouldBeLive && !statusLine.includes("Live")) fail("verified live state did not display Live", { statusLine });
  if (!shouldBeLive && statusLine.includes("Live")) fail("unverified/non-current state displayed Live", { statusLine });
}

async function assertFirstViewportPriority(page) {
  const positions = await page.evaluate(() => {
    const daily = document.querySelector("#daily-actions")?.getBoundingClientRect();
    const metrics = document.querySelector(".cs-command-center__metrics")?.getBoundingClientRect();
    const workforce = document.querySelector("#ai-workforce")?.getBoundingClientRect();
    return {
      dailyTop: daily?.top ?? null,
      metricsTop: metrics?.top ?? null,
      workforceTop: workforce?.top ?? null,
    };
  });
  if (positions.dailyTop === null || positions.metricsTop === null || positions.workforceTop === null) {
    fail("priority sections missing", positions);
  }
  if (positions.dailyTop > positions.metricsTop || positions.dailyTop > positions.workforceTop) {
    fail("Daily Action Center is not first-viewport priority", positions);
  }
}

async function assertActionAccountability(page) {
  const text = await page.locator(".cs-action-item").innerText();
  for (const phrase of ["Owner", "Urgency", "Consequence", "Evidence", "Destination", "Lifecycle", "Open messaging verification"]) {
    if (!text.includes(phrase)) fail(`action item missing ${phrase}`, { text });
  }
  if (text.includes("View more")) fail("generic View more action rendered", { text });
}

async function assertAxeCritical(page) {
  await page.addScriptTag({ content: axe.source });
  const axeResult = await page.evaluate(async () => window.axe.run(document, {
    resultTypes: ["violations"],
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  }));
  const critical = axeResult.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  if (critical.length) {
    fail("axe serious/critical violations found", {
      violations: critical.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        nodes: nodes.slice(0, 5).map((node) => ({ target: node.target, html: node.html })),
      })),
    });
  }
}

async function run() {
  await mkdir(resultsDir, { recursive: true });
  const port = await findOpenPort();
  const server = startDevServer(port);
  const baseUrl = `http://127.0.0.1:${port}`;
  const reviewUrl = `${baseUrl}/review/phase-a-command-center/`;
  let browser;
  let checked = 0;

  try {
    await waitForServer(reviewUrl);
    browser = await chromium.launch({ headless: true });

    for (const viewport of viewports) {
      const label = `default/${viewport.width}x${viewport.height}`;
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      await page.goto(reviewUrl, { waitUntil: "networkidle" });
      if (consoleErrors.length) fail(`console errors at ${label}`, { consoleErrors });
      await assertNoDuplicateIds(page);
      await assertNoHorizontalOverflow(page, label);
      await assertNeutralDefaults(page);
      await assertLiveGating(page, false);
      await assertFirstViewportPriority(page);
      if (viewport.width === 1440 || viewport.width === 390) {
        await assertAxeCritical(page);
        await page.screenshot({ path: path.join(resultsDir, `command-default-${viewport.width}x${viewport.height}.png`), fullPage: true });
      }
      await context.close();
      checked++;
    }

    for (const state of actionStates) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${reviewUrl}?actionState=${state}`, { waitUntil: "networkidle" });
      await assertActionQueueState(page, state);
      await assertNoHorizontalOverflow(page, `actionState/${state}`);
      await context.close();
      checked++;
    }

    for (const freshness of freshnessStates) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 820 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${reviewUrl}?freshness=${freshness}`, { waitUntil: "networkidle" });
      await assertLiveGating(page, false);
      await context.close();
      checked++;
    }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${reviewUrl}?verified=1&freshness=live&withAction=1`, { waitUntil: "networkidle" });
      await assertLiveGating(page, true);
      await assertActionAccountability(page);
      await assertNoHorizontalOverflow(page, "verified/actionable");
      await assertAxeCritical(page);
      await page.screenshot({ path: path.join(resultsDir, "command-verified-actionable-1440x900.png"), fullPage: true });
      await context.close();
      checked++;
    }

    console.log(JSON.stringify({
      ok: true,
      checked,
      actionStates,
      freshnessStates,
      viewports,
      reviewUrl: "/review/phase-a-command-center/",
      screenshots: resultsDir,
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      message: error.message,
      details: error.details || null,
      serverOutput: server.getOutput(),
    }, null, 2));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await server.stop();
  }
}

await run();
