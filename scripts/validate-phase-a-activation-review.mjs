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

async function getLiveRegions(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
    return Array.from(document.querySelectorAll("[aria-live], [role='status'], [role='alert']"))
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role"),
        live: element.getAttribute("aria-live"),
        owner: element.getAttribute("data-activation-announcement-owner") || element.closest("[data-activation-announcement-owner]")?.getAttribute("data-activation-announcement-owner") || null,
        text: normalize(element.textContent),
        className: element.className?.toString() || "",
      }))
      .filter((item) => item.text);
  });
}

async function assertStaticGuidanceNotLive(page) {
  const staticLive = await page.evaluate(() => {
    const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
    return Array.from(document.querySelectorAll(".cs-activation-resume, .cs-alert:not(.cs-validation-summary)"))
      .map((element) => ({
        role: element.getAttribute("role"),
        live: element.getAttribute("aria-live"),
        text: normalize(element.textContent).slice(0, 180),
      }))
      .filter((item) => item.role === "status" || item.role === "alert" || item.live);
  });

  if (staticLive.length) fail("static Activation guidance is live", { staticLive });
}

async function assertPersistenceState(page, state) {
  const statuses = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".cs-autosave-status span")).map((element) => ({
      text: element.textContent.trim(),
      live: element.getAttribute("aria-live"),
      owner: element.getAttribute("data-activation-announcement-owner"),
    }));
  });
  if (!statuses.some((item) => item.text.includes(expectedText[state]))) {
    fail(`save state text missing for ${state}`, { statuses });
  }
  if (statuses.length !== 1) fail(`expected one visible autosave status owner for ${state}`, { statuses });

  const liveRegions = await getLiveRegions(page);
  const duplicateLiveText = liveRegions
    .map((item) => item.text)
    .filter((text, index, values) => values.indexOf(text) !== index);
  if (duplicateLiveText.length) fail(`duplicate live announcement text for ${state}`, { liveRegions, duplicateLiveText });

  if (liveStates.has(state)) {
    if (liveRegions.length !== 1) fail(`expected one live-region owner for ${state}`, { liveRegions });
    if (liveRegions[0].owner !== "autosave") fail(`unexpected live-region owner for ${state}`, { liveRegions });
    if (!liveRegions[0].text.includes(expectedText[state])) fail(`live-region text missing expected state for ${state}`, { liveRegions });
  } else if (liveRegions.length > 0) {
    fail(`autosave live region too noisy for ${state}`, { liveRegions });
  }

  await assertStaticGuidanceNotLive(page);
}

async function assertSafeResume(page) {
  const text = await page.locator(".cs-activation-resume").evaluate((element) => element.textContent || "");
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
    const active = document.activeElement;
    const previous = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Previous"));
    const save = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Save and continue"));
    const footer = document.querySelector(".cs-activation-footer");
    const activeBox = active?.getBoundingClientRect();
    const previousBox = previous?.getBoundingClientRect();
    const saveBox = save?.getBoundingClientRect();
    const footerBox = footer?.getBoundingClientRect();
    const overlaps = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      viewportHeight: window.innerHeight,
      active: activeBox ? { top: activeBox.top, bottom: activeBox.bottom, left: activeBox.left, right: activeBox.right, width: activeBox.width, height: activeBox.height } : null,
      previous: previousBox ? { top: previousBox.top, bottom: previousBox.bottom, width: previousBox.width, height: previousBox.height } : null,
      save: saveBox ? { top: saveBox.top, bottom: saveBox.bottom, width: saveBox.width, height: saveBox.height } : null,
      footer: footerBox ? { top: footerBox.top, bottom: footerBox.bottom } : null,
      activeOverlapsFooter: overlaps(activeBox, footerBox),
    };
  });
  for (const [name, box] of [["previous", boxes.previous], ["save", boxes.save]]) {
    if (!box) fail(`${name} action missing at ${label}`, boxes);
    if (box.height < 44 || box.width < 44) fail(`${name} action touch target too small at ${label}`, boxes);
    if (box.bottom > boxes.viewportHeight + 1 || box.top < -1) fail(`${name} action not reachable at ${label}`, boxes);
  }
  if (!boxes.active || boxes.activeOverlapsFooter) fail(`sticky actions overlap the active input at ${label}`, boxes);
}

async function assertTouchTargets(page, label) {
  const failures = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, summary, a[href], [role='button']"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width < 44 || item.height < 44);
  });
  if (failures.length) fail(`small touch targets at ${label}`, { failures });
}

async function assertMobileStagePresentation(page, label) {
  const result = await page.evaluate(() => {
    const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
    const stageSummary = document.querySelector("[data-stage-summary='current']");
    const stages = Array.from(document.querySelectorAll(".cs-activation-nav__stage"));
    const currentStage = document.querySelector("[data-current-stage='true']");
    const compressedStages = Array.from(document.querySelectorAll("[data-completed-stage-compressed='true']"));
    const openStepButtons = Array.from(document.querySelectorAll(".cs-activation-nav__item"))
      .filter((element) => element.closest("details")?.open)
      .map((element) => normalize(element.textContent));
    const stageSummaries = Array.from(document.querySelectorAll(".cs-activation-nav__stage-summary")).map((element) => normalize(element.textContent));
    const summaryRect = stageSummary?.getBoundingClientRect();
    const navRect = document.querySelector(".cs-activation-nav__stages")?.getBoundingClientRect();
    return {
      stageSummaryText: normalize(stageSummary?.textContent),
      stageCount: stages.length,
      currentStageText: normalize(currentStage?.textContent),
      compressedStageCount: compressedStages.length,
      openStepButtonCount: openStepButtons.length,
      openStepButtons,
      stageSummaries,
      summaryBeforeNav: summaryRect && navRect ? summaryRect.top <= navRect.top : false,
    };
  });

  if (!result.stageSummaryText.includes("Current stage")) fail(`mobile stage summary missing at ${label}`, result);
  if (result.stageCount < 3 || result.stageCount > 4) fail(`mobile stage count must be 3 or 4 at ${label}`, result);
  if (!result.currentStageText.includes("Services") || !result.currentStageText.includes("Offer")) {
    fail(`current stage/current step not discoverable at ${label}`, result);
  }
  if (!result.stageSummaryText.includes("Blocked requirement") || !result.stageSummaryText.includes("Stripe checkout proof")) {
    fail(`blocked requirement summary missing at ${label}`, result);
  }
  if (result.compressedStageCount < 1) fail(`completed stages are not compressed at ${label}`, result);
  if (!result.stageSummaries.some((summary) => summary.includes("Payments blocked"))) fail(`blocked stage summary not discoverable at ${label}`, result);
  if (result.openStepButtonCount > 3) fail(`mobile presents too many equal-weight step items at ${label}`, result);
  if (!result.summaryBeforeNav) fail(`stage summary does not precede full navigation at ${label}`, result);
}

async function collectAnnouncementForState(page, reviewUrl, state) {
  await page.goto(`${reviewUrl}?state=${state}`, { waitUntil: "networkidle" });
  const liveRegions = await getLiveRegions(page);
  return {
    state,
    liveRegions: liveRegions.map((item) => ({ owner: item.owner, live: item.live, role: item.role, text: item.text })),
  };
}

async function assertTransitionEvidence(browser, reviewUrl) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const transitions = [
    ["saved_remote", "offline", "online_to_offline"],
    ["saving", "error", "saving_to_failed"],
    ["error", "saving", "failed_to_retry"],
    ["offline", "saved_remote", "offline_to_restored"],
    ["saving", "saved_remote", "saving_to_saved_remotely"],
  ];
  const evidence = [];

  for (const [fromState, toState, label] of transitions) {
    await collectAnnouncementForState(page, reviewUrl, fromState);
    const to = await collectAnnouncementForState(page, reviewUrl, toState);
    const expectedLiveCount = liveStates.has(toState) ? 1 : 0;
    if (to.liveRegions.length !== expectedLiveCount) fail(`transition ${label} produced wrong live region count`, { fromState, toState, to });
    if (expectedLiveCount && to.liveRegions[0].owner !== "autosave") fail(`transition ${label} used wrong live-region owner`, { fromState, toState, to });
    evidence.push({ label, fromState, toState, liveRegions: to.liveRegions });
  }

  await context.close();
  return evidence;
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
  let transitionEvidence = [];

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
        await assertTouchTargets(page, label);
        if (viewport.width <= 390) await assertMobileStagePresentation(page, label);
        if (
          (state === "dirty" && viewport.width === 1440) ||
          (state === "offline" && (viewport.width === 390 || viewport.width === 375))
        ) {
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
      await assertMobileStagePresentation(page, label);
      await assertTouchTargets(page, label);
      await assertStickyActions(page, label);
      await page.screenshot({ path: path.join(resultsDir, `activation-${label.replace("/", "-")}.png`), fullPage: false });
      await context.close();
      checked++;
    }

    transitionEvidence = await assertTransitionEvidence(browser, reviewUrl);

    console.log(JSON.stringify({
      ok: true,
      checked,
      states,
      viewports,
      keyboardViewports,
      transitionEvidence,
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
