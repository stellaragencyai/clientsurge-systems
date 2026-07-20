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

const resultsDir = path.join(repoRoot, "work", "phase-a-review", "results");

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

async function assertNoDuplicateIds(page) {
  const duplicates = await page.evaluate(() => {
    const counts = new Map();
    document.querySelectorAll("[id]").forEach((element) => {
      counts.set(element.id, (counts.get(element.id) || 0) + 1);
    });
    return Array.from(counts.entries()).filter(([, count]) => count > 1);
  });
  if (duplicates.length) fail("duplicate IDs found", { duplicates });
}

async function assertAriaControlsResolve(page) {
  const unresolved = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("[aria-controls]")).map((element) => {
      const id = element.getAttribute("aria-controls");
      return {
        text: element.textContent.trim(),
        id,
        matches: id ? document.querySelectorAll(`#${CSS.escape(id)}`).length : 0,
      };
    }).filter((item) => item.matches !== 1);
  });
  if (unresolved.length) fail("aria-controls did not resolve exactly once", { unresolved });
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

async function assertFallbackField(page) {
  const field = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll("label")).find((item) => item.textContent.includes("Fallback identity"));
    if (!label) return null;
    const control = document.getElementById(label.htmlFor);
    const describedBy = control?.getAttribute("aria-describedby") || "";
    return {
      labelFor: label.htmlFor,
      controlId: control?.id || null,
      required: control?.required || control?.getAttribute("aria-required") === "true",
      describedBy,
      describedByTargets: describedBy.split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.id || null),
    };
  });
  if (!field?.controlId) fail("fallback CSField did not create a control id", { field });
  if (field.labelFor !== field.controlId) fail("fallback CSField label is not linked", { field });
  if (!field.required) fail("fallback CSField required semantics missing", { field });
  if (!field.describedBy || field.describedByTargets.some((id) => !id)) fail("fallback CSField describedby target missing", { field });
}

async function assertLiveRegionRestraint(page) {
  const alertRoles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".cs-alert")).map((element) => ({
      title: element.textContent.trim(),
      role: element.getAttribute("role"),
      live: element.getAttribute("aria-live"),
    }));
  });
  const staticLiveAlerts = alertRoles.filter((item) => item.title !== "Dynamic save statusSaved after reconnecting." && (item.role === "status" || item.role === "alert" || item.live));
  if (staticLiveAlerts.length) fail("static alerts announced without opt-in", { staticLiveAlerts });
  const dynamic = alertRoles.find((item) => item.title === "Dynamic save statusSaved after reconnecting.");
  if (!dynamic?.role || !dynamic.live) fail("dynamic alert did not opt in to announcement", { alertRoles });
}

async function assertTouchTargets(page) {
  const tooSmall = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a[href]"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { label: element.textContent.trim() || element.getAttribute("aria-label"), width: rect.width, height: rect.height };
      })
      .filter((item) => item.width < 44 || item.height < 44);
  });
  if (tooSmall.length) fail("touch target below 44px", { tooSmall: tooSmall.slice(0, 10) });
}

async function assertDrawerBehavior(page, label) {
  await page.getByLabel("Open navigation").click();
  await page.locator(".cs-app-shell__mobile-panel").waitFor({ state: "visible" });
  await assertAriaControlsResolve(page);

  const initial = await page.evaluate(() => ({
    activeInDrawer: Boolean(document.querySelector(".cs-app-shell__mobile-panel")?.contains(document.activeElement)),
    workspaceInert: document.querySelector(".cs-app-shell__workspace")?.hasAttribute("inert") || false,
    workspaceHidden: document.querySelector(".cs-app-shell__workspace")?.getAttribute("aria-hidden") === "true",
    bodyLocked: document.body.classList.contains("nav-open"),
  }));
  if (!initial.activeInDrawer || !initial.workspaceInert || !initial.workspaceHidden || !initial.bodyLocked) {
    fail(`drawer modal contract failed at ${label}`, initial);
  }

  await page.keyboard.press("Shift+Tab");
  const shiftTrap = await page.evaluate(() => Boolean(document.querySelector(".cs-app-shell__mobile-panel")?.contains(document.activeElement)));
  if (!shiftTrap) fail(`drawer shift-tab escaped at ${label}`);

  await page.keyboard.press("Tab");
  const tabTrap = await page.evaluate(() => Boolean(document.querySelector(".cs-app-shell__mobile-panel")?.contains(document.activeElement)));
  if (!tabTrap) fail(`drawer tab escaped at ${label}`);

  await page.keyboard.press("Escape");
  await page.locator(".cs-app-shell__mobile-panel").waitFor({ state: "detached" });
  const closed = await page.evaluate(() => ({
    focusRestored: document.activeElement?.getAttribute("aria-label") === "Open navigation",
    bodyLocked: document.body.classList.contains("nav-open"),
    workspaceInert: document.querySelector(".cs-app-shell__workspace")?.hasAttribute("inert") || false,
  }));
  if (!closed.focusRestored || closed.bodyLocked || closed.workspaceInert) {
    fail(`drawer close restoration failed at ${label}`, closed);
  }
}

async function assertAxeCritical(page) {
  await page.addScriptTag({ content: axe.source });
  const axeResult = await page.evaluate(async () => {
    return window.axe.run(document, {
      resultTypes: ["violations"],
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
  });
  const critical = axeResult.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  if (critical.length) {
    fail("axe serious/critical violations found", {
      violations: critical.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        nodes: nodes.slice(0, 5).map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
    });
  }
}

async function run() {
  await mkdir(resultsDir, { recursive: true });
  const port = await findOpenPort();
  const server = startDevServer(port);
  const baseUrl = `http://127.0.0.1:${port}`;
  const reviewUrl = `${baseUrl}/review/phase-a/`;
  let browser;

  try {
    await waitForServer(reviewUrl);
    browser = await chromium.launch({ headless: true });

    for (const viewport of viewports) {
      const label = `${viewport.width}x${viewport.height}`;
      const context = await browser.newContext({
        viewport,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      await page.goto(reviewUrl, { waitUntil: "networkidle" });
      if (consoleErrors.length) fail(`console errors at ${label}`, { consoleErrors });

      await assertNoDuplicateIds(page);
      await assertNoHorizontalOverflow(page, label);
      await assertFallbackField(page);
      await assertLiveRegionRestraint(page);
      await assertTouchTargets(page);

      if (viewport.width <= 390) {
        await assertDrawerBehavior(page, label);
      }

      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await assertNoHorizontalOverflow(page, `${label} at 200% text zoom`);

      if (viewport.width === 1440 || viewport.width === 390) {
        await assertAxeCritical(page);
        await page.screenshot({ path: path.join(resultsDir, `phase-a-foundation-${label}.png`), fullPage: true });
      }

      await context.close();
    }

    console.log(JSON.stringify({
      ok: true,
      checked: viewports.length,
      viewports,
      reviewUrl: "/review/phase-a/",
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
