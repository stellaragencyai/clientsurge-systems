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
  for (const forbidden of ["Operational", "Healthy", "Live", "Live operational view", "You are caught up", "All clear", "Everything is working"]) {
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

async function assertNoTruthContradictions(page, label) {
  const result = await page.evaluate(() => {
    const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
    const text = document.body.innerText;
    const statusLine = normalize(document.querySelector(".cs-command-center__status-line")?.textContent);
    const prohibited = [
      ["Operational", "Status being verified"],
      ["Operational", "Limited data available"],
      ["Live", "Stale"],
      ["Live", "Partial"],
      ["Live", "Not connected"],
      ["Live", "Unknown"],
      ["Healthy", "Unverified"],
      ["All clear", "Permission restricted"],
    ].filter(([a, b]) => text.includes(a) && text.includes(b));
    return { text, statusLine, prohibited };
  });
  if (result.prohibited.length) fail(`truth contradiction at ${label}`, result);
}

async function assertFirstViewportPriority(page, label) {
  const positions = await page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        inFirstViewport: rect.top < window.innerHeight && rect.bottom > 0,
        fullyInFirstViewport: rect.top >= 0 && rect.bottom <= window.innerHeight + 1,
        text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 240),
      };
    };
    const business = document.querySelector("#business-condition");
    const attention = document.querySelector("#attention-required");
    const actions = document.querySelector("#daily-actions");
    const outcomes = document.querySelector("#verified-outcome-summary");
    const compare = (a, b) => {
      if (!a || !b) return null;
      return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    };
    return {
      summary: read("#command-center-summary"),
      business: read("#business-condition"),
      attention: read("#attention-required"),
      actions: read("#daily-actions"),
      outcomes: read("#verified-outcome-summary"),
      aiWorkforce: read("#ai-workforce"),
      activity: read("#activity"),
      systemHealth: read("#system-health"),
      domOrder: {
        businessBeforeAttention: compare(business, attention),
        businessBeforeActions: compare(business, actions),
        attentionBeforeActions: attention ? compare(attention, actions) : true,
        actionsBeforeOutcomes: outcomes ? compare(actions, outcomes) : true,
      },
      headings: Array.from(document.querySelectorAll("h2")).map((heading) => (heading.textContent || "").replace(/\s+/g, " ").trim()).slice(0, 12),
      priorityHeadings: Array.from(document.querySelectorAll("#business-condition > .cs-command-summary__item-header h3, #attention-required > .cs-command-summary__item-header h3, #daily-actions > .cs-command-summary__item-header h3, #verified-outcome-summary > .cs-command-summary__item-header h3"))
        .map((heading) => (heading.textContent || "").replace(/\s+/g, " ").trim()),
      viewportHeight: window.innerHeight,
    };
  });

  if (!positions.summary || !positions.business || !positions.attention || !positions.actions || !positions.outcomes) fail(`executive summary priority sections missing at ${label}`, positions);
  if (!positions.summary.inFirstViewport) fail(`Command Center Summary is not visible in first viewport at ${label}`, positions);
  for (const [name, section] of [["Business Condition", positions.business], ["Attention Required", positions.attention], ["Next Best Action", positions.actions], ["Verified Outcome Summary", positions.outcomes]]) {
    if (!section.fullyInFirstViewport) fail(`${name} is not fully contained in first viewport at ${label}`, positions);
  }
  const visuallyBefore = (a, b) => a.top < b.top - 1 || (Math.abs(a.top - b.top) <= 1 && a.left <= b.left);
  if (!visuallyBefore(positions.business, positions.attention)) fail(`Business Condition does not visually precede Attention Required at ${label}`, positions);
  if (!visuallyBefore(positions.attention, positions.actions)) fail(`Attention Required does not visually precede Next Best Action at ${label}`, positions);
  if (!visuallyBefore(positions.actions, positions.outcomes)) fail(`Verified Outcome Summary does not follow actions at ${label}`, positions);
  const pairs = [
    ["business/attention", positions.business, positions.attention],
    ["attention/actions", positions.attention, positions.actions],
    ["actions/outcomes", positions.actions, positions.outcomes],
  ];
  const overlappedPair = pairs.find(([, a, b]) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1);
  if (overlappedPair) {
    fail(`priority sections visually overlap at ${label}`, positions);
  }
  if (positions.domOrder.businessBeforeAttention === false || positions.domOrder.businessBeforeActions === false || positions.domOrder.attentionBeforeActions === false || positions.domOrder.actionsBeforeOutcomes === false) {
    fail(`DOM order does not match required priority order at ${label}`, positions);
  }
  const expectedPriorityHeadings = ["Business Condition", "Attention Required", "Next Best Action", "Verified Outcome Summary"];
  const actualPriorityHeadings = positions.priorityHeadings.slice(0, expectedPriorityHeadings.length);
  if (actualPriorityHeadings.join(" > ") !== expectedPriorityHeadings.join(" > ")) {
    fail(`heading order does not match required priority hierarchy at ${label}`, { ...positions, expectedPriorityHeadings, actualPriorityHeadings });
  }
  if (positions.aiWorkforce?.top < positions.actions.top) fail(`AI Workforce displaces core priority hierarchy at ${label}`, positions);
  if (positions.activity && positions.activity.top < positions.actions.top) fail(`Activity Timeline is not secondary at ${label}`, positions);
}

async function assertKeyboardOrderMatchesVisualFlow(page, label) {
  const result = await page.evaluate(() => {
    const focusables = Array.from(document.querySelectorAll([
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(","))).filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    }).map((element, index) => {
      const rect = element.getBoundingClientRect();
      const section = element.closest("section")?.id || element.closest("header")?.className || "unknown";
      return {
        index,
        section,
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        text: (element.textContent || element.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 120),
      };
    });
    const backwards = [];
    for (let index = 1; index < focusables.length; index += 1) {
      const previous = focusables[index - 1];
      const current = focusables[index];
      if (current.top + 8 < previous.top) backwards.push({ previous, current });
    }
    return { focusables, backwards };
  });
  if (result.backwards.length) fail(`keyboard order moves upward against visual flow at ${label}`, result);
}

async function assertModuleSubordination(page, label) {
  const result = await page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        role: element.getAttribute("data-command-role"),
        prominence: element.getAttribute("data-prominence"),
        text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 220),
      };
    };
    return {
      business: read("#business-condition"),
      growthSnapshot: read("#growth-snapshot"),
      daily: read("#daily-actions"),
      opportunities: read("#opportunities"),
      activity: read("#activity"),
      systemHealth: read("#system-health"),
      aiWorkforce: read("#ai-workforce"),
    };
  });
  if (result.growthSnapshot && result.growthSnapshot.prominence === "primary") fail(`Growth Snapshot is equal-weight primary at ${label}`, result);
  if (result.activity && result.activity.prominence !== "secondary") fail(`Activity Timeline is not secondary at ${label}`, result);
  if (result.aiWorkforce && result.aiWorkforce.top < result.daily.top) fail(`AI Workforce displaces actions at ${label}`, result);
  if (result.opportunities && result.opportunities.top < result.daily.top) fail(`Opportunities displace immediate actions at ${label}`, result);
}

async function assertRenderedSecondaryContent(page, label) {
  const result = await page.evaluate(() => {
    const selectors = ["#ai-workforce", "#opportunities", "#website-intelligence", "#activity", "#system-health"];
    return selectors.map((selector) => {
      const element = document.querySelector(selector);
      const style = element ? window.getComputedStyle(element) : null;
      return {
        selector,
        renderedText: (element?.innerText || "").replace(/\s+/g, " ").trim(),
        htmlText: (element?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 180),
        contentVisibility: style?.contentVisibility,
      };
    });
  });
  const emptyRenderedSections = result.filter((section) => section.htmlText && !section.renderedText);
  if (emptyRenderedSections.length) fail(`secondary module content is present in HTML but not rendered at ${label}`, { result });
}

async function assertSystemHealthProminence(page, expectedProminence, label) {
  const result = await page.evaluate(() => {
    const element = document.querySelector("#system-health");
    return {
      prominence: element?.getAttribute("data-prominence"),
      text: (element?.textContent || "").replace(/\s+/g, " ").trim(),
    };
  });
  if (result.prominence !== expectedProminence) {
    fail(`System Health prominence mismatch at ${label}`, { expectedProminence, result });
  }
}

async function assertTouchTargets(page, label) {
  const failures = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href], button, [role='button']"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width < 44 || item.height < 44);
  });
  if (failures.length) fail(`small touch targets at ${label}`, { failures });
}

async function assertCleanLiveFixture(page) {
  const text = await page.locator("body").innerText();
  await assertLiveGating(page, true);
  await assertSystemHealthProminence(page, "secondary", "clean-live");
  if (!text.includes("Operational")) fail("clean live fixture missing Operational", { text });
  if (text.includes("Attention required") || text.includes("Needs attention") || text.includes("not verified") || text.includes("may not send") || text.includes("No delivery proof")) {
    fail("clean live fixture contains contradictory warning copy", { text });
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
      await assertNoTruthContradictions(page, label);
      await assertFirstViewportPriority(page, label);
      await assertKeyboardOrderMatchesVisualFlow(page, label);
      await assertModuleSubordination(page, label);
      await assertRenderedSecondaryContent(page, label);
      await assertSystemHealthProminence(page, "contextual", label);
      await assertTouchTargets(page, label);
      if (viewport.width === 1440 || viewport.width === 1280 || viewport.width === 1024 || viewport.width === 768 || viewport.width === 390 || viewport.width === 375) {
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
      await assertFirstViewportPriority(page, `actionState/${state}`);
      await assertKeyboardOrderMatchesVisualFlow(page, `actionState/${state}`);
      await assertNoTruthContradictions(page, `actionState/${state}`);
      await assertNoHorizontalOverflow(page, `actionState/${state}`);
      await context.close();
      checked++;
    }

    for (const freshness of freshnessStates) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 820 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${reviewUrl}?freshness=${freshness}`, { waitUntil: "networkidle" });
      await assertLiveGating(page, false);
      await assertNoTruthContradictions(page, `freshness/${freshness}`);
      await context.close();
      checked++;
    }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${reviewUrl}?verified=1&freshness=live&withAction=1`, { waitUntil: "networkidle" });
      await assertLiveGating(page, false);
      await assertNoTruthContradictions(page, "verified/actionable");
      await assertFirstViewportPriority(page, "verified/actionable");
      await assertKeyboardOrderMatchesVisualFlow(page, "verified/actionable");
      await assertRenderedSecondaryContent(page, "verified/actionable");
      await assertActionAccountability(page);
      await assertNoHorizontalOverflow(page, "verified/actionable");
      await assertAxeCritical(page);
      await page.screenshot({ path: path.join(resultsDir, "command-verified-actionable-1440x900.png"), fullPage: true });
      await context.close();
      checked++;
    }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${reviewUrl}?verified=1&freshness=live&actionState=verified_zero&alert=0`, { waitUntil: "networkidle" });
      await assertCleanLiveFixture(page);
      await assertFirstViewportPriority(page, "verified/clean-live");
      await assertKeyboardOrderMatchesVisualFlow(page, "verified/clean-live");
      await assertModuleSubordination(page, "verified/clean-live");
      await assertRenderedSecondaryContent(page, "verified/clean-live");
      await assertNoHorizontalOverflow(page, "verified/clean-live");
      await assertAxeCritical(page);
      await page.screenshot({ path: path.join(resultsDir, "command-verified-clean-live-1440x900.png"), fullPage: true });
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
