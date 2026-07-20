import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { PHASE_C_STATE_MATRIX } from "../src/components/customer-operations/phaseCFixtures.js";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const browserAuditRequire = createRequire(path.join(repoRoot, "tools", "browser-audit", "package.json"));
const { chromium } = browserAuditRequire("playwright");
const axe = browserAuditRequire("axe-core");

const systems = Object.keys(PHASE_C_STATE_MATRIX);
const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 820 },
  { width: 1024, height: 768 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];

const screenshotTargets = new Set([
  "aiWorkforce/healthy/1440x900",
  "aiWorkforce/blocked/390x844",
  "clientTimeline/normal/1440x900",
  "clientTimeline/restricted/390x844",
  "communicationCenter/unread/1440x900",
  "communicationCenter/failed/390x844",
  "customerSuccess/risk/1440x900",
  "customerSuccess/incomplete_setup/390x844",
]);

const resultsDir = path.join(repoRoot, "work", "phase-c-browser", "results");

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

function reviewUrlWithParams(baseUrl, params = {}) {
  const url = new URL(baseUrl);
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
          text: element.textContent.trim().slice(0, 120),
          tag: element.tagName.toLowerCase(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width < 44 || item.height < 44);
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

async function assertCoreContracts(page, systemKey, stateKey, viewport) {
  const label = `${systemKey}/${stateKey}/${viewport.width}x${viewport.height}`;
  await page.waitForSelector(".cs-co-surface h1", { timeout: 5000 });

  const result = await page.evaluate(() => {
    const text = document.querySelector(".cs-co-surface")?.innerText || "";
    const headings = Array.from(document.querySelectorAll(".cs-co-surface h1, .cs-co-surface h2, .cs-co-surface h3")).map((heading) => heading.textContent.trim());
    return {
      h1Count: document.querySelectorAll(".cs-co-surface h1").length,
      text,
      headings,
      situationLabels: Array.from(document.querySelectorAll(".cs-co-situation span")).map((node) => node.textContent.trim()),
      sourceCount: document.querySelectorAll(".cs-co-source").length,
      ownerCount: document.querySelectorAll(".cs-co-owner").length,
      evidenceCount: document.querySelectorAll(".cs-co-evidence").length,
      statusCount: document.querySelectorAll(".cs-status-badge, .cs-co-freshness, .cs-co-owner").length,
    };
  });

  if (result.h1Count !== 1) fail(`expected exactly one h1 at ${label}`, result);
  for (const required of ["What is happening", "Needs attention", "Next action"]) {
    if (!result.situationLabels.includes(required)) fail(`missing five-second situation label ${required} at ${label}`, result);
  }
  const lowerText = result.text.toLowerCase();
  for (const required of ["source", "truth", "freshness", "permission scope"]) {
    if (!lowerText.includes(required)) fail(`missing disclosure field ${required} at ${label}`, result);
  }
  if (result.statusCount === 0) fail(`missing status metadata at ${label}`, result);

  for (const forbidden of ["guaranteed outcome", "everything looks good", "all clear"]) {
    if (lowerText.includes(forbidden)) fail(`unsupported certainty language at ${label}`, { forbidden, text: result.text });
  }
}

async function assertSystemContracts(page, systemKey, stateKey, viewport) {
  const label = `${systemKey}/${stateKey}/${viewport.width}x${viewport.height}`;
  const text = await page.locator(".cs-co-surface").innerText();
  const lowerText = text.toLowerCase();

  if (systemKey === "aiWorkforce") {
    if (stateKey === "loading") {
      if (!text.includes("Loading AI worker evidence")) fail(`AI Workforce loading state missing loading evidence language at ${label}`, { text });
      return;
    }
    for (const required of [
      "Identity",
      "Role",
      "Responsibility",
      "Current status",
      "Configuration",
      "Recent work",
      "Completed work",
      "Business result",
      "Blocked work",
      "Evidence",
      "Confidence",
      "Recommendation",
      "Owner",
      "Human handoff",
    ]) {
      if (!lowerText.includes(required.toLowerCase())) fail(`AI Workforce missing ${required} at ${label}`, { text });
    }
    if (/\b(Connected|Active|Running)\b/.test(text) && !text.includes("Business result")) {
      fail(`AI Workforce status lacks business result context at ${label}`, { text });
    }
    if (stateKey === "unknown") {
      const statusBadges = await page.evaluate(() => Array.from(document.querySelectorAll(".cs-co-surface__header .cs-status-badge")).map((node) => node.textContent.trim()));
      if (statusBadges.includes("Healthy")) fail(`AI Workforce unknown rendered healthy status at ${label}`, { statusBadges, text });
    }
  }

  if (systemKey === "clientTimeline") {
    if (stateKey !== "empty") {
      for (const required of ["Event ID", "Timestamp", "Source", "Actor", "Verification state", "Business summary", "Related object", "Permission scope", "Open event detail"]) {
        if (!lowerText.includes(required.toLowerCase())) fail(`Client Timeline missing ${required} at ${label}`, { text });
      }
    }
    for (const category of ["Customer", "Human", "AI", "System", "Communication", "Appointment", "Payment", "Website", "Configuration", "Status change", "Support"]) {
      if (stateKey === "normal" && !lowerText.includes(category.toLowerCase())) fail(`Client Timeline missing category ${category} at ${label}`, { text });
    }
    if (lowerText.includes("appointment created")) fail(`Client Timeline flattened provenance at ${label}`, { text });
  }

  if (systemKey === "communicationCenter") {
    for (const required of ["Conversation list", "Conversation detail", "Ownership", "Assignment", "Unread state", "Unresolved state", "AI assistance", "Human escalation", "Permissions"]) {
      if (!lowerText.includes(required.toLowerCase())) fail(`Communication Center missing ${required} at ${label}`, { text });
    }
    for (const required of ["Sent does not mean delivered", "Delivered does not mean read"]) {
      if (!lowerText.includes(required.toLowerCase())) fail(`Communication Center missing delivery distinction ${required} at ${label}`, { text });
    }
    if (stateKey === "failed" && !lowerText.includes("failed")) fail(`Communication failed state missing failed language at ${label}`, { text });
  }

  if (systemKey === "customerSuccess") {
    for (const required of ["Installation progress", "Adoption", "Automation coverage", "AI usage", "Risk signals", "Success plan", "Account owner", "Interventions", "Renewal readiness"]) {
      if (!lowerText.includes(required.toLowerCase())) fail(`Customer Success missing ${required} at ${label}`, { text });
    }
    if (/\b\d{1,3}\s*(?:\/\s*100|%)\b/.test(text)) fail(`Customer Success rendered unsupported numeric health score at ${label}`, { text });
    if (stateKey === "risk") {
      for (const required of ["Evidence", "Reason", "Impact", "Owner", "Next action"]) {
        if (!lowerText.includes(required.toLowerCase())) fail(`Customer Success risk missing ${required} at ${label}`, { text });
      }
    }
  }
}

async function assertTextZoom(page, label) {
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await page.waitForTimeout(200);
  await assertNoHorizontalOverflow(page, `${label}/text-zoom-200`);
  const textLength = await page.locator(".cs-co-surface").innerText().then((value) => value.length);
  if (textLength < 100) fail(`text zoom left too little rendered content at ${label}`, { textLength });
}

async function main() {
  await mkdir(resultsDir, { recursive: true });
  const args = parseArgs();
  let server = null;
  let reviewUrl = args.get("url");
  if (!reviewUrl) {
    const port = await findOpenPort();
    server = startDevServer(port);
    reviewUrl = `http://127.0.0.1:${port}/review/phase-c/`;
  }

  let browser;
  let checked = 0;
  let axeChecked = 0;
  let textZoomChecked = 0;
  const checkedStates = {};

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

    for (const systemKey of systems) {
      checkedStates[systemKey] = [];
      for (const stateKey of PHASE_C_STATE_MATRIX[systemKey]) {
        checkedStates[systemKey].push(stateKey);
        for (const viewport of viewports) {
          const viewportLabel = `${viewport.width}x${viewport.height}`;
          const label = `${systemKey}/${stateKey}/${viewportLabel}`;
          const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
          const page = await context.newPage();
          const consoleErrors = [];
          page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
          page.on("pageerror", (error) => consoleErrors.push(error.message));

          try {
            const response = await page.goto(reviewUrlWithParams(reviewUrl, {
              system: systemKey,
              state: stateKey,
              controls: "0",
            }), { waitUntil: "networkidle" });
            if (!response?.ok()) fail(`HTTP failure at ${label}`, { status: response?.status() });
            if (consoleErrors.length) fail(`console errors at ${label}`, { consoleErrors });

            await assertCoreContracts(page, systemKey, stateKey, viewport);
            await assertSystemContracts(page, systemKey, stateKey, viewport);
            await assertNoDuplicateIds(page, label);
            await assertNoHorizontalOverflow(page, label);
            await assertTouchTargets(page, label);

            if (screenshotTargets.has(label)) {
              await assertAxeCritical(page, label);
              axeChecked++;
              await page.screenshot({
                path: path.join(resultsDir, `${systemKey}-${stateKey}-${viewportLabel}.png`),
                fullPage: true,
              });
            }

            if ((viewport.width === 390 || viewport.width === 375) && stateKey === PHASE_C_STATE_MATRIX[systemKey][0]) {
              await assertTextZoom(page, label);
              textZoomChecked++;
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
      textZoomChecked,
      controlsChecked: true,
      systems,
      states: checkedStates,
      viewports,
      reducedMotion: "reduce",
      reviewUrl: "/review/phase-c/",
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
