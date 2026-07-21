import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAdminGlobalSearchResponse } from "../src/lib/adminGlobalSearch.js";

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

const mobileFallbackViewports = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];

const resultsDir = path.join(repoRoot, "work", "final-ux-accessibility");

const searchFixturesByEntity = {
  ClientProject: [
    {
      id: "client_phoenix_roofing",
      business_name: "Phoenix Roofing",
      client_email: "owner@phoenixroofing.example",
      owner: "Client Success",
      updated_date: "2026-07-20T16:30:00Z",
    },
  ],
  Client: [],
  Leads: [
    {
      id: "lead_phoenix_medspa",
      business_name: "Phoenix Med Spa",
      email: "lead@phoenixmedspa.example",
      source: "Website",
      created_date: "2026-07-20T16:20:00Z",
    },
  ],
  Lead: [],
  WebsiteLead: [],
  Opportunity: [
    {
      id: "opp_phoenix_restoration",
      business_name: "Phoenix Restoration",
      activation_priority: "High",
      next_action: "Review proposal",
      updated_date: "2026-07-20T16:10:00Z",
    },
  ],
  LeadOpportunity: [],
  LeadPriorityQueue: [],
  Appointment: [
    {
      id: "appt_phoenix_dental",
      business_name: "Phoenix Dental",
      scheduled_date: "2026-07-21",
      email: "frontdesk@phoenixdental.example",
    },
  ],
  DemoBooking: [],
  Booking: [],
  CalendarEvent: [],
  SupportMessage: [
    {
      id: "msg_phoenix_portal",
      subject: "Phoenix portal question",
      sender_email: "client@phoenixportal.example",
      created_date: "2026-07-20T16:05:00Z",
    },
  ],
  CommunicationEvent: [],
  CommunicationLog: [],
  AIWorker: [
    {
      id: "worker_phoenix_responder",
      name: "Phoenix responder",
      owner: "AI Ops",
      status: "Current",
      updated_date: "2026-07-20T16:00:00Z",
    },
  ],
  AutomationAgent: [],
  AutomationJob: [],
  Agent: [],
  ClientTimelineEvent: [
    {
      id: "event_phoenix_handoff",
      type: "Phoenix handoff",
      actor: "Nolan",
      timestamp: "2026-07-20T15:55:00Z",
    },
  ],
  AuditLog: [],
  AutomationProofLog: [],
  AdminSettings: [
    {
      id: "roles",
      title: "Phoenix role settings",
      scope: "Organization",
      updated_date: "2026-07-20T15:45:00Z",
    },
  ],
  Order: [
    {
      id: "order_phoenix_growth",
      business_name: "Phoenix Growth System",
      customer_email: "billing@phoenixgrowth.example",
      order_status: "pending_payment",
      updated_date: "2026-07-20T15:40:00Z",
    },
  ],
  Subscription: [],
  Invoice: [],
  Document: [
    {
      id: "doc_phoenix_launch",
      title: "Phoenix launch plan",
      owner: "Ops",
      published_at: "2026-07-20T15:30:00Z",
    },
  ],
  Resource: [],
  KnowledgeBaseArticle: [],
};

function parseArgs() {
  const args = new Map();
  for (const arg of process.argv.slice(2)) {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    args.set(key, value);
  }
  return args;
}

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
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

async function waitForServer(url, timeoutMs = 45000) {
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

function spawnCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    ...options,
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  return {
    child,
    getOutput: () => output,
    wait: () => new Promise((resolve, reject) => {
      child.once("exit", (code) => {
        if (code === 0) resolve(output);
        else reject(Object.assign(new Error(`${command} ${args.join(" ")} failed with ${code}`), { output }));
      });
      child.once("error", reject);
    }),
  };
}

function startDevServer(port) {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npm run dev -- --host 127.0.0.1 --port ${port}`]
    : ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)];
  const processHandle = spawnCommand(command, args);
  return {
    getOutput: processHandle.getOutput,
    stop: () => stopProcess(processHandle.child),
  };
}

function stopProcess(child) {
  return new Promise((resolve) => {
    if (!child || child.killed || child.exitCode !== null) return resolve();
    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      killer.once("exit", resolve);
      setTimeout(resolve, 2500);
      return;
    }
    child.once("exit", resolve);
    child.kill("SIGTERM");
    setTimeout(resolve, 2500);
  });
}

async function ensureBuiltFallback(skipBuild) {
  const fallbackPath = path.join(repoRoot, "dist", "product-signup", "index.html");
  if (skipBuild && !existsSync(fallbackPath)) {
    fail("built product-signup fallback is missing", { fallbackPath, nextAction: "Run npm run build before this validator or omit --skip-build." });
  }
  if (existsSync(fallbackPath)) return;

  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm run build"]
    : ["run", "build"];
  const build = spawnCommand(command, args);
  try {
    await build.wait();
  } catch (error) {
    fail("npm run build failed while preparing static product-signup fallback", { output: error.output || build.getOutput() });
  }
}

function contentTypeFor(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function startStaticServer() {
  const port = await findOpenPort();
  const distRoot = path.join(repoRoot, "dist");
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const safePath = pathname.replace(/^\/+/, "").replace(/\.\.(?:\/|\\)/g, "");
    let filePath = path.join(distRoot, safePath);

    if (pathname.endsWith("/")) filePath = path.join(filePath, "index.html");
    if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");

    if (!existsSync(filePath)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": contentTypeFor(filePath) });
    createReadStream(filePath).pipe(response);
  });

  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", resolve);
    server.on("error", reject);
  });

  return {
    url: `http://127.0.0.1:${port}`,
    stop: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function installSearchApiFixtures(context) {
  await context.route("**/api/apps/**", async (route) => {
    const url = new URL(route.request().url());
    const entityMatch = url.pathname.match(/\/entities\/([^/?]+)/);
    if (entityMatch) {
      const entityName = decodeURIComponent(entityMatch[1]);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(searchFixturesByEntity[entityName] || []),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

async function assertNoDuplicateIds(page, label) {
  const duplicates = await page.evaluate(() => {
    const counts = new Map();
    document.querySelectorAll("[id]").forEach((element) => counts.set(element.id, (counts.get(element.id) || 0) + 1));
    return Array.from(counts.entries()).filter(([, count]) => count > 1);
  });
  if (duplicates.length) fail(`duplicate IDs at ${label}`, { duplicates });
}

async function assertAriaReferencesResolve(page, label) {
  const broken = await page.evaluate(() => {
    const attrs = ["aria-controls", "aria-describedby", "aria-labelledby", "aria-activedescendant"];
    return Array.from(document.querySelectorAll(attrs.map((attr) => `[${attr}]`).join(","))).flatMap((element) => {
      return attrs.flatMap((attr) => {
        const value = element.getAttribute(attr);
        if (!value) return [];
        return value.split(/\s+/).filter(Boolean).map((id) => ({
          attr,
          id,
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 120),
          matches: document.querySelectorAll(`#${CSS.escape(id)}`).length,
        })).filter((item) => item.matches !== 1);
      });
    });
  });
  if (broken.length) fail(`broken ARIA references at ${label}`, { broken });
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  const widest = Math.max(overflow.scrollWidth, overflow.bodyScrollWidth);
  if (widest > overflow.clientWidth + 1) {
    fail(`horizontal overflow at ${label}`, overflow);
  }
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
        nodes: nodes.slice(0, 5).map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
    });
  }
}

async function assertPlatformScrollRegion(page, label) {
  const region = page.getByRole("region", { name: "Universal search source contract table" });
  await region.waitFor({ timeout: 5000 });
  await region.focus();
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  if (focused !== "Universal search source contract table") {
    fail(`platform table scroll region did not receive focus at ${label}`, { focused });
  }

  const before = await region.evaluate((element) => ({
    scrollLeft: element.scrollLeft,
    maxScrollLeft: element.scrollWidth - element.clientWidth,
  }));
  if (before.maxScrollLeft > 1) {
    for (let index = 0; index < 16; index += 1) {
      await page.keyboard.press("ArrowRight");
    }
    const after = await region.evaluate((element) => element.scrollLeft);
    if (after <= before.scrollLeft) {
      fail(`platform table scroll region did not respond to keyboard scrolling at ${label}`, { before, after });
    }
  }
}

async function assertAdminGlobalSearch(page, label, activateResult = false) {
  const search = page.getByRole("combobox", { name: "Universal admin search" });
  await search.waitFor({ timeout: 5000 });
  await search.fill("settings");
  await page.getByRole("listbox", { name: "Universal search results" }).waitFor({ timeout: 12000 });

  const searchState = await search.evaluate((element) => {
    const controls = element.getAttribute("aria-controls");
    const describedBy = element.getAttribute("aria-describedby");
    const active = element.getAttribute("aria-activedescendant");
    return {
      role: element.getAttribute("role"),
      expanded: element.getAttribute("aria-expanded"),
      controls,
      controlsFound: controls ? document.getElementById(controls)?.getAttribute("role") : null,
      describedBy,
      describedText: describedBy ? document.getElementById(describedBy)?.textContent || "" : "",
      active,
      activeFound: active ? Boolean(document.getElementById(active)) : false,
      optionCount: document.querySelectorAll("[role='listbox'] [role='option']").length,
      nestedInteractive: document.querySelectorAll("[role='listbox'] button, [role='listbox'] a[href], [role='option'] button, [role='option'] a[href]").length,
    };
  });

  if (searchState.role !== "combobox") fail(`search input is not a combobox at ${label}`, searchState);
  if (searchState.expanded !== "true") fail(`search combobox did not expand at ${label}`, searchState);
  if (searchState.controlsFound !== "listbox") fail(`search aria-controls does not reference listbox at ${label}`, searchState);
  if (!/result[s]? available/i.test(searchState.describedText)) fail(`search status did not announce result count at ${label}`, searchState);
  if (!searchState.activeFound) fail(`search active descendant does not resolve at ${label}`, searchState);
  if (searchState.optionCount < 1) fail(`search returned too few fixture results at ${label}`, searchState);
  if (searchState.nestedInteractive !== 0) fail(`search results contain nested interactive controls at ${label}`, searchState);

  const firstActive = await search.getAttribute("aria-activedescendant");
  await page.keyboard.press("ArrowDown");
  const secondActive = await search.getAttribute("aria-activedescendant");
  if (!secondActive || secondActive === firstActive) {
    fail(`search arrow navigation did not move active option at ${label}`, { firstActive, secondActive });
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("[role='combobox']")?.getAttribute("aria-expanded") === "false");
  await assertAriaReferencesResolve(page, `${label}/search-closed`);

  await search.fill("zzzz-no-result");
  await page.waitForFunction(() => {
    const describedBy = document.querySelector("[role='combobox']")?.getAttribute("aria-describedby");
    return describedBy && document.getElementById(describedBy)?.textContent?.includes("No results found");
  });

  if (!activateResult) return;

  const currentUrl = page.url();
  await search.fill("settings");
  await page.getByRole("listbox", { name: "Universal search results" }).waitFor({ timeout: 12000 });
  await page.keyboard.press("Enter");
  await page.waitForFunction((previousUrl) => window.location.href !== previousUrl, currentUrl, { timeout: 10000 });
}

async function assertAdminPlatformViewport(browser, baseUrl, viewport) {
  const label = `/admin/platform ${viewport.width}x${viewport.height}`;
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await installSearchApiFixtures(context);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    const response = await page.goto(`${baseUrl}/admin/platform?local_admin=true&local_super_admin=true`, { waitUntil: "networkidle" });
    if (!response?.ok()) fail(`HTTP failure at ${label}`, { status: response?.status() });
    await page.getByRole("heading", { name: "Platform Integration Foundation" }).waitFor({ timeout: 10000 });
    if (consoleErrors.length) fail(`console errors at ${label}`, { consoleErrors });

    await assertNoDuplicateIds(page, label);
    await assertAriaReferencesResolve(page, label);
    await assertNoHorizontalOverflow(page, label);
    await assertPlatformScrollRegion(page, label);
    await assertAdminGlobalSearch(page, label, viewport.width === 1440 || viewport.width === 390);
    await assertAxeCritical(page, label);
    await page.screenshot({ path: path.join(resultsDir, `admin-platform-${viewport.width}x${viewport.height}.png`), fullPage: true });
  } finally {
    await context.close();
  }
}

async function assertProductFallbackViewport(browser, staticBaseUrl, viewport) {
  const label = `/product-signup static fallback ${viewport.width}x${viewport.height}`;
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();

  try {
    const response = await page.goto(`${staticBaseUrl}/product-signup/?package=growth_system`, { waitUntil: "networkidle" });
    if (!response?.ok()) fail(`HTTP failure at ${label}`, { status: response?.status() });
    await page.getByRole("heading", { name: "Complete your ClientSurge signup" }).waitFor({ timeout: 5000 });

    const fallbackState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const button = Array.from(document.querySelectorAll("button")).find((element) => /Retry Secure Checkout/i.test(element.textContent || ""));
      const rect = button?.getBoundingClientRect();
      return {
        bodyText,
        hasPaymentIncomplete: /Payment has not completed/i.test(bodyText),
        hasNextAction: /retry checkout|contact support/i.test(bodyText),
        falseSuccessLanguage: /\b(payment completed|payment succeeded|order complete|purchase complete)\b/i.test(bodyText),
        buttonVisible: Boolean(rect && rect.width > 0 && rect.height > 0),
        buttonRight: rect ? Math.round(rect.right) : null,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    if (!fallbackState.hasPaymentIncomplete || !fallbackState.hasNextAction || fallbackState.falseSuccessLanguage || !fallbackState.buttonVisible) {
      fail(`static checkout fallback messaging failed at ${label}`, fallbackState);
    }
    if (fallbackState.buttonRight > fallbackState.viewportWidth + 1) {
      fail(`static checkout fallback action is off-screen at ${label}`, fallbackState);
    }

    await assertNoDuplicateIds(page, label);
    await assertAriaReferencesResolve(page, label);
    await assertNoHorizontalOverflow(page, label);
    await assertAxeCritical(page, label);

    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page, `${label} at 200% text zoom`);
    await page.getByRole("button", { name: "Retry Secure Checkout" }).focus();
    await page.screenshot({ path: path.join(resultsDir, `product-signup-fallback-${viewport.width}x${viewport.height}.png`), fullPage: true });
  } finally {
    await context.close();
  }
}

function assertPermissionRestrictedContract() {
  const response = buildAdminGlobalSearchResponse({
    settings: [{ id: "roles", title: "Phoenix role settings", scope: "Organization" }],
  }, "phoenix", 10, { user: { role: "client" } });

  assert.equal(response.status, "Permission Restricted");
  assert.equal(response.results.length, 0);
  assert.equal(response.restrictedCount, 1);
}

async function main() {
  const args = parseArgs();
  await mkdir(resultsDir, { recursive: true });
  assertPermissionRestrictedContract();
  await ensureBuiltFallback(args.get("skip-build") === "true");

  const devPort = await findOpenPort();
  const devServer = startDevServer(devPort);
  const baseUrl = `http://127.0.0.1:${devPort}`;
  const staticServer = await startStaticServer();
  let browser;

  try {
    await waitForServer(`${baseUrl}/admin/platform?local_admin=true&local_super_admin=true`);
    browser = await chromium.launch({ headless: true });

    for (const viewport of viewports) {
      await assertAdminPlatformViewport(browser, baseUrl, viewport);
    }

    for (const viewport of viewports) {
      await assertProductFallbackViewport(browser, staticServer.url, viewport);
    }

    console.log(JSON.stringify({
      ok: true,
      adminPlatformViewports: viewports,
      productSignupFallbackViewports: viewports,
      mobileOverflowTargets: mobileFallbackViewports,
      routes: ["/admin/platform", "/product-signup"],
      checks: [
        "axe serious/critical",
        "search combobox/listbox semantics",
        "search keyboard open, navigate, activate, close",
        "search status announcements",
        "permission restricted contract",
        "platform contrast through axe",
        "platform keyboard scroll region",
        "horizontal overflow",
        "static checkout fallback messaging",
        "200% text zoom",
      ],
      screenshots: resultsDir,
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      message: error.message,
      details: error.details || null,
      devServerOutput: devServer.getOutput(),
    }, null, 2));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await staticServer.stop();
    await devServer.stop();
  }
}

await main();
