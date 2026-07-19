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

const keyboardViewports = [
  { width: 390, height: 520 },
  { width: 375, height: 500 },
];

const states = ["dirty", "saving", "saved_local", "saved_remote", "offline", "error"];
const liveStates = new Set(["saved_remote", "offline", "error"]);
const expectedText = {
  dirty: "Unsaved changes",
  saving: "Saving changes",
  saved_local: "Saved locally",
  saved_remote: "Saved to service",
  offline: "Offline - changes are local only",
  error: "Save failed - retry available",
};

const resultsDir = path.join(repoRoot, "work", "phase-a-activation-review", "results");

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
  const child = spawn(command, args, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });

  return {
    child,
    getOutput: () => output,
    stop: () => new Promise((resolve) => {
      if (child.killed) return resolve();
      if (process.platform === "win32") {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        killer.once("exit", () => resolve());
        setTimeout(resolve, 2500);
        return;
      }
      child.once("exit", () => resolve());
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

async function assertBlockedStep(page) {
  const blocked = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll(".cs-activation-nav__item")).find((item) => item.textContent.includes("Payments"));
    if (!button) return null;
    const describedBy = button.getAttribute("aria-describedby");
    const reason = describedBy ? document.getElementById(describedBy)?.textContent || "" : "";
    return {
      ariaDisabled: button.getAttribute("aria-disabled"),
      nativeDisabled: button.hasAttribute("disabled"),
      tabIndex: button.tabIndex,
      reason,
    };
  });
  if (!blocked) fail("blocked Payments step missing");
  if (blocked.ariaDisabled !== "true" || blocked.nativeDisabled || blocked.tabIndex < 0) fail("blocked step is not keyboard-discoverable", { blocked });
  for (const phrase of ["Missing requirement:", "Unlock action:", "Where:"]) {
    if (!blocked.reason.includes(phrase)) fail(`blocked reason missing ${phrase}`, { blocked });
  }
}

async function assertPersistenceState(page, state) {
  const statuses = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".cs-autosave-status span")).map((element) => ({
      text: element.textContent.trim(),
      live: element.getAttribute("aria-live"),
    }));
  });
  if (!statuses.some((item) => item.text.includes(expectedText[state]))) {
    fail(`save state text missing for ${state}`, { statuses });
  }
  const liveCount = statuses.filter((item) => item.live).length;
  if (liveStates.has(state) && liveCount === 0) fail(`meaningful save transition not announced for ${state}`, { statuses });
  if (!liveStates.has(state) && liveCount > 0) fail(`autosave live region too noisy for ${state}`, { statuses });
}

async function assertSafeResume(page) {
  const text = await page.locator(".cs-activation-resume").innerText();
  for (const phrase of ["Leave and resume", "Progress is represented", "Leaving returns"]) {
    if (!text.includes(phrase)) fail(`safe resume notice missing ${phrase}`, { text });
  }
  if (!text.includes("latest edit") && !text.includes("No unsaved change")) {
    fail("safe resume notice does not explain loss risk", { text });
  }
}

async function assertStickyActions(page, label) {
  await page.locator("#activation-business-description").focus();
  const boxes = await page.evaluate(() => {
    const previous = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Previous"));
    const save = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Save and continue"));
    const footer = document.querySelector(".cs-activation-footer");
    const previousBox = previous?.getBoundingClientRect();
    const saveBox = save?.getBoundingClientRect();
    const footerBox = footer?.getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      previous: previousBox ? { top: previousBox.top, bottom: previousBox.bottom, width: previousBox.width, height: previousBox.height } : null,
      save: saveBox ? { top: saveBox.top, bottom: saveBox.bottom, width: saveBox.width, height: saveBox.height } : null,
      footer: footerBox ? { top: footerBox.top, bottom: footerBox.bottom } : null,
    };
  });
  for (const [name, box] of [["previous", boxes.previous], ["save", boxes.save]]) {
    if (!box) fail(`${name} action missing at ${label}`, boxes);
    if (box.height < 44 || box.width < 44) fail(`${name} action touch target too small at ${label}`, boxes);
    if (box.bottom > boxes.viewportHeight + 1 || box.top < -1) fail(`${name} action not reachable at ${label}`, boxes);
  }
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
  const reviewUrl = `${baseUrl}/review/phase-a-activation/`;
  let browser;
  let checked = 0;

  try {
    await waitForServer(`${reviewUrl}?state=dirty`);
    browser = await chromium.launch({ headless: true });

    for (const state of states) {
      for (const viewport of viewports) {
        const label = `${state}/${viewport.width}x${viewport.height}`;
        const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
        const page = await context.newPage();
        const consoleErrors = [];
        page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
        page.on("pageerror", (error) => consoleErrors.push(error.message));
        await page.goto(`${reviewUrl}?state=${state}`, { waitUntil: "networkidle" });
        if (consoleErrors.length) fail(`console errors at ${label}`, { consoleErrors });
        await assertNoDuplicateIds(page);
        await assertNoHorizontalOverflow(page, label);
        await assertBlockedStep(page);
        await assertPersistenceState(page, state);
        await assertSafeResume(page);
        if ((state === "dirty" && viewport.width === 1440) || (state === "offline" && viewport.width === 390)) {
          await assertAxeCritical(page);
          await page.screenshot({ path: path.join(resultsDir, `activation-${label.replace("/", "-")}.png`), fullPage: true });
        }
        await context.close();
        checked++;
      }
    }

    for (const viewport of keyboardViewports) {
      const label = `keyboard/${viewport.width}x${viewport.height}`;
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${reviewUrl}?state=error&keyboard=1`, { waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page, label);
      await assertStickyActions(page, label);
      await context.close();
      checked++;
    }

    console.log(JSON.stringify({
      ok: true,
      checked,
      states,
      viewports,
      keyboardViewports,
      reviewUrl: "/review/phase-a-activation/",
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
