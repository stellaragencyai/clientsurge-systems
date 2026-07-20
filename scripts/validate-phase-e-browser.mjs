import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PHASE_E_ROUTES,
  PHASE_E_SECTIONS,
  PHASE_E_VIEWPORTS,
} from "../src/lib/phaseELifecycleFoundation.js";

const baseUrl =
  process.env.PHASE_E_BASE_URL ||
  getArgValue("--url") ||
  "http://127.0.0.1:5173";
const screenshotDir = join(process.cwd(), "work", "phase-e-browser-screens");

mkdirSync(screenshotDir, { recursive: true });

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function findBrowserExecutable() {
  const candidates = [
    process.env.PHASE_E_BROWSER_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "chrome",
    "chrome.exe",
    "msedge",
    "msedge.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes("\\") && existsSync(candidate)) return candidate;
    if (!candidate.includes("\\")) {
      const command = process.platform === "win32" ? "where.exe" : "which";
      const result = spawnSync(command, [candidate], { stdio: "ignore" });
      if (result.status === 0) return candidate;
    }
  }

  throw new Error(
    "No Chrome or Edge executable found. Set PHASE_E_BROWSER_PATH to a Chromium browser before running this validator.",
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForProcessExit(processToWait, timeoutMs = 3000) {
  if (processToWait.exitCode !== null) return Promise.resolve();

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    processToWait.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function waitForActivePort(userDataDir, browserProcess) {
  const activePortPath = join(userDataDir, "DevToolsActivePort");
  const started = Date.now();

  while (Date.now() - started < 15000) {
    if (browserProcess.exitCode !== null) {
      throw new Error(`Browser exited before DevTools started with code ${browserProcess.exitCode}`);
    }
    if (existsSync(activePortPath)) {
      try {
        const [port, wsPath] = readFileSync(activePortPath, "utf8").trim().split(/\r?\n/);
        if (port && wsPath) return `ws://127.0.0.1:${port}${wsPath}`;
      } catch (error) {
        if (error.code !== "EBUSY") throw error;
      }
    }
    await delay(100);
  }

  throw new Error("Timed out waiting for browser DevToolsActivePort");
}

function launchBrowser() {
  const executable = findBrowserExecutable();
  const userDataDir = mkdtempSync(join(tmpdir(), "phase-e-browser-"));
  const browserProcess = spawn(
    executable,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDir}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "about:blank",
    ],
    {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    },
  );

  let stderr = "";
  browserProcess.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  return { browserProcess, executable, userDataDir, getStderr: () => stderr };
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.opened = new Promise((resolve, reject) => {
      this.webSocket.addEventListener("open", resolve, { once: true });
      this.webSocket.addEventListener("error", reject, { once: true });
    });
    this.webSocket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(`${message.error.message}: ${JSON.stringify(message.error.data || {})}`));
      } else {
        pending.resolve(message.result || {});
      }
    });
  }

  async send(method, params = {}, sessionId) {
    await this.opened;
    const id = this.nextId;
    this.nextId += 1;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    this.webSocket.send(JSON.stringify(message));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.webSocket.close();
  }
}

async function openPage(cdp) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  return { targetId, sessionId };
}

async function evaluate(cdp, sessionId, expression) {
  const { result, exceptionDetails } = await cdp.send(
    "Runtime.evaluate",
    {
      expression,
      awaitPromise: true,
      returnByValue: true,
    },
    sessionId,
  );

  if (exceptionDetails) {
    throw new Error(exceptionDetails.text || "Runtime evaluation failed");
  }
  return result?.value;
}

async function waitForPageReady(cdp, sessionId, label) {
  const started = Date.now();

  while (Date.now() - started < 30000) {
    const ready = await evaluate(
      cdp,
      sessionId,
      `document.readyState === "complete" && Boolean(document.querySelector("main h1"))`,
    );
    if (ready) return;
    await delay(250);
  }

  throw new Error(`${label} did not finish loading`);
}

async function dispatchTab(cdp, sessionId) {
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
    sessionId,
  );
}

async function warmPaintForFullPageScreenshot(cdp, sessionId) {
  await evaluate(
    cdp,
    sessionId,
    `new Promise((resolve) => {
      const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const steps = [0, Math.floor(height * 0.33), Math.floor(height * 0.66), height, 0];
      let index = 0;
      const tick = () => {
        window.scrollTo(0, steps[index]);
        index += 1;
        if (index >= steps.length) {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
          return;
        }
        setTimeout(tick, 80);
      };
      tick();
    })`,
  );
}

async function validateRouteViewport(cdp, route, viewport) {
  const section = PHASE_E_SECTIONS[route.id];
  const label = `${route.id}-${viewport.width}`;
  const { targetId, sessionId } = await openPage(cdp);

  try {
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.width < 768,
      },
      sessionId,
    );
    await cdp.send(
      "Emulation.setTouchEmulationEnabled",
      { enabled: viewport.width <= 390, configuration: "mobile" },
      sessionId,
    );
    await cdp.send(
      "Emulation.setEmulatedMedia",
      {
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      },
      sessionId,
    );

    await cdp.send("Page.navigate", { url: `${baseUrl}${route.path}` }, sessionId);
    await waitForPageReady(cdp, sessionId, label);
    await delay(350);

    const pageState = await evaluate(
      cdp,
      sessionId,
      `(() => {
        const h1 = document.querySelector("main h1");
        const focusables = Array.from(document.querySelectorAll("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])"));
        const visibleTargets = focusables
          .filter((element) => {
            const className = String(element.getAttribute("class") || "");
            if (className.includes("sr-only")) return false;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              text: element.textContent.trim().slice(0, 80),
              tagName: element.tagName,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          });
        return {
          heading: h1?.textContent?.trim(),
          mainCount: document.querySelectorAll("main").length,
          headingCount: document.querySelectorAll("h1,h2,h3").length,
          navCurrent: Boolean(document.querySelector("[aria-current='page']")),
          labelledCount: document.querySelectorAll("[aria-label], [aria-labelledby]").length,
          statusCount: document.querySelectorAll("[role='status'], [aria-live]").length,
          componentCount: document.querySelectorAll("[data-phase-e-component-card='true']").length,
          truthRules: ${JSON.stringify(PHASE_E_SECTIONS["launch-readiness"].acceptance)}.length,
          commandText: document.body.textContent.includes("Command K / Ctrl K"),
          overflow: {
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
          },
          smallTargets: visibleTargets.filter((target) => target.height < 44 || target.width < 44),
          runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
        };
      })()`,
    );

    assert.equal(pageState.heading, section.title, `${label} heading mismatch`);
    assert.equal(pageState.mainCount, 1, `${label} should expose one main landmark`);
    assert.ok(pageState.headingCount >= 6, `${label} should expose a useful heading hierarchy`);
    assert.equal(pageState.navCurrent, true, `${label} should mark the active route with aria-current`);
    assert.ok(pageState.labelledCount > 0, `${label} should expose labels or labelled regions`);
    assert.ok(pageState.statusCount > 0, `${label} should expose status/live semantics`);
    assert.ok(pageState.componentCount >= 5, `${label} should render component inventory`);
    assert.ok(
      pageState.overflow.scrollWidth <= pageState.overflow.clientWidth + 1,
      `${label} has horizontal overflow: ${JSON.stringify(pageState.overflow)}`,
    );
    assert.deepEqual(pageState.smallTargets, [], `${label} has undersized visible touch targets`);
    assert.equal(pageState.runningAnimations, 0, `${label} should not require running animations under reduced motion`);

    await dispatchTab(cdp, sessionId);
    const focusState = await evaluate(
      cdp,
      sessionId,
      `(() => {
        const element = document.activeElement;
        const rect = element?.getBoundingClientRect();
        return {
          tagName: element?.tagName,
          text: element?.textContent?.trim().slice(0, 80),
          width: rect?.width || 0,
          height: rect?.height || 0,
        };
      })()`,
    );
    assert.notEqual(focusState.tagName, "BODY", `${label} should move keyboard focus`);
    assert.ok(focusState.width > 0 && focusState.height > 0, `${label} focused element should be visible`);
    await evaluate(cdp, sessionId, `document.activeElement?.blur?.(); window.scrollTo(0, 0); true`);
    await delay(100);

    let zoom200 = "not-run";
    if (viewport.width === 1280) {
      await evaluate(cdp, sessionId, `document.documentElement.style.fontSize = "200%"; true`);
      await delay(200);
      const zoomState = await evaluate(
        cdp,
        sessionId,
        `({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          heading: document.querySelector("main h1")?.textContent?.trim()
        })`,
      );
      assert.equal(zoomState.heading, section.title, `${label} 200% zoom heading mismatch`);
      assert.ok(
        zoomState.scrollWidth <= zoomState.clientWidth + 1,
        `${label} has horizontal overflow at 200% zoom: ${JSON.stringify(zoomState)}`,
      );
      await evaluate(cdp, sessionId, `document.documentElement.style.fontSize = ""; true`);
      await delay(200);
      zoom200 = "pass";
    }

    await warmPaintForFullPageScreenshot(cdp, sessionId);
    const layoutMetrics = await cdp.send("Page.getLayoutMetrics", {}, sessionId);
    const contentHeight = Math.max(
      viewport.height,
      Math.ceil(layoutMetrics.contentSize?.height || viewport.height),
    );
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      {
        width: viewport.width,
        height: Math.min(contentHeight, 12000),
        deviceScaleFactor: 1,
        mobile: viewport.width < 768,
      },
      sessionId,
    );
    await delay(250);
    const screenshot = await cdp.send(
      "Page.captureScreenshot",
      { format: "png", fromSurface: true },
      sessionId,
    );
    const screenshotPath = join(screenshotDir, `${label}.png`);
    writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));

    return {
      route: route.path,
      heading: section.title,
      viewport: viewport.width,
      keyboard: "pass",
      focus: "pass",
      aria: "pass",
      screenReader: "pass",
      reducedMotion: "pass",
      touchTargets: "pass",
      contrast: "manual-worker3-review-required",
      zoom200,
      overflow: "pass",
      screenshot: screenshotPath,
    };
  } finally {
    await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
  }
}

async function run() {
  const { browserProcess, executable, userDataDir, getStderr } = launchBrowser();
  let cdp;

  try {
    const webSocketUrl = await waitForActivePort(userDataDir, browserProcess);
    cdp = new CdpClient(webSocketUrl);
    await cdp.opened;

    const results = [];
    for (const route of PHASE_E_ROUTES) {
      for (const viewport of PHASE_E_VIEWPORTS) {
        results.push(await validateRouteViewport(cdp, route, viewport));
      }
    }

    const summaryPath = join(screenshotDir, "summary.json");
    writeFileSync(summaryPath, `${JSON.stringify(results, null, 2)}\n`);
    console.log(`Phase E browser checks passed: ${results.length}`);
    console.log(`Browser: ${executable}`);
    console.log(`Screenshots: ${screenshotDir}`);
    console.log(`Summary: ${summaryPath}`);
  } catch (error) {
    const stderr = getStderr();
    if (stderr) console.error(stderr.trim());
    throw error;
  } finally {
    cdp?.close();
    browserProcess.kill();
    await waitForProcessExit(browserProcess);
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Could not remove temporary browser profile ${userDataDir}: ${error.message}`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
