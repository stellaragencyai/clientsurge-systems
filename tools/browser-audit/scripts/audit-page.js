#!/usr/bin/env node

import { chromium } from "playwright";
import axe from "axe-core";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(__dirname, "..");
const defaultScreenshotsDir = resolve(auditRoot, "screenshots");

export const DEFAULT_START_URL = "https://clientsurgesystems.com";
export const IMPORTANT_ROUTES = [
  "/",
  "/automations",
  "/store",
  "/about",
  "/contact",
  "/blog",
  "/industries",
  "/roofing",
  "/hvac",
  "/dental",
  "/med-spa",
  "/chiropractic",
  "/contractors",
  "/privacy-policy",
  "/login",
];

const DESKTOP_VIEWPORT = { width: 1440, height: 1200 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const WAIT_UNTIL = "networkidle";
const NAV_TIMEOUT_MS = 45000;
const LINK_CHECK_TIMEOUT_MS = 10000;
const MAX_LINK_CHECKS_PER_PAGE = 90;
const PRIVATE_ROUTE_PATTERN = /\/(admin|dashboard|setup|portal|internal|operator|openclaw|api)(\/|$|\?)/i;
const PLACEHOLDER_PATTERN = /\b(lorem ipsum|placeholder|todo|tbd|coming soon|industry template|replace this|sample text)\b/i;
const JS_REQUIRED_PATTERN = /javascript is required|enable javascript/i;

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export function normalizeUrl(rawUrl, baseUrl = DEFAULT_START_URL) {
  try {
    const url = new URL(rawUrl, baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isInternalUrl(rawUrl, baseUrl = DEFAULT_START_URL) {
  try {
    const url = new URL(rawUrl, baseUrl);
    const base = new URL(baseUrl);
    const host = stripWww(url.hostname);
    const baseHost = stripWww(base.hostname);
    return host === baseHost;
  } catch {
    return false;
  }
}

export function importantRouteUrls(baseUrl = DEFAULT_START_URL) {
  return IMPORTANT_ROUTES.map((route) => normalizeUrl(route, baseUrl)).filter(Boolean);
}

export function makeScreenshotName(url, viewportName) {
  const parsed = new URL(url);
  const pathPart = parsed.pathname === "/" ? "home" : parsed.pathname.replace(/^\/+/, "").replace(/\/+/g, "-");
  const safePath = pathPart.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 8);
  return `${safePath || "page"}-${viewportName}-${hash}.png`;
}

export async function auditPage(url, options = {}) {
  const browser = options.browser ?? (await chromium.launch({ headless: true }));
  const ownsBrowser = !options.browser;
  const screenshotsDir = options.screenshotsDir ?? defaultScreenshotsDir;
  const baseUrl = options.baseUrl ?? DEFAULT_START_URL;
  const normalizedUrl = normalizeUrl(url, baseUrl);

  if (!normalizedUrl) {
    throw new Error(`Invalid URL: ${url}`);
  }

  await mkdir(screenshotsDir, { recursive: true });

  const desktop = await inspectViewport(browser, normalizedUrl, {
    baseUrl,
    viewportName: "desktop",
    viewport: DESKTOP_VIEWPORT,
    screenshotsDir,
    includeLinks: true,
  });

  const mobile = await inspectViewport(browser, normalizedUrl, {
    baseUrl,
    viewportName: "mobile",
    viewport: MOBILE_VIEWPORT,
    screenshotsDir,
    includeLinks: false,
  });

  if (ownsBrowser) {
    await browser.close();
  }

  const brokenLinks = await checkLinks([...desktop.internalLinks, ...desktop.externalLinks], baseUrl);
  const visualChecks = buildVisualChecks(desktop, mobile);

  return {
    url: normalizedUrl,
    finalUrl: desktop.finalUrl,
    status: desktop.status,
    pageTitle: desktop.pageTitle,
    metaDescription: desktop.metaDescription,
    h1: desktop.h1,
    h2h3: desktop.h2h3,
    ctaTexts: desktop.ctaTexts,
    internalLinks: desktop.internalLinks,
    externalLinks: desktop.externalLinks,
    exposedInternalAdminLinks: desktop.exposedInternalAdminLinks,
    brokenLinks,
    consoleErrors: desktop.consoleErrors,
    pageErrors: desktop.pageErrors,
    failedNetworkRequests: desktop.failedNetworkRequests,
    httpErrorResponses: desktop.httpErrorResponses,
    screenshots: {
      desktop: desktop.screenshot,
      mobile: mobile.screenshot,
    },
    accessibility: desktop.accessibility,
    visibleTextSample: desktop.visibleTextSample,
    visibleTextLength: desktop.visibleTextLength,
    visibleTextHash: hashText(desktop.normalizedVisibleText),
    appearsBlankOrJsBroken: desktop.appearsBlankOrJsBroken || mobile.appearsBlankOrJsBroken,
    duplicateSignals: [],
    visualChecks,
    mobile: {
      finalUrl: mobile.finalUrl,
      status: mobile.status,
      consoleErrors: mobile.consoleErrors,
      failedNetworkRequests: mobile.failedNetworkRequests,
      httpErrorResponses: mobile.httpErrorResponses,
      visibleTextLength: mobile.visibleTextLength,
      appearsBlankOrJsBroken: mobile.appearsBlankOrJsBroken,
      visualChecks: mobile.visualChecks,
    },
  };
}

async function inspectViewport(browser, url, options) {
  const context = await browser.newContext({
    viewport: options.viewport,
    deviceScaleFactor: options.viewportName === "mobile" ? 2 : 1,
    isMobile: options.viewportName === "mobile",
    userAgent:
      options.viewportName === "mobile"
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedNetworkRequests = [];
  const httpErrorResponses = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleErrors.push({
        type: message.type(),
        text: message.text(),
        location: message.location(),
      });
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push({ message: error.message, stack: error.stack ?? "" });
  });

  page.on("requestfailed", (request) => {
    failedNetworkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText ?? "unknown",
    });
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      httpErrorResponses.push({
        url: response.url(),
        status,
        statusText: response.statusText(),
        requestMethod: response.request().method(),
        resourceType: response.request().resourceType(),
      });
    }
  });

  let response = null;
  let navigationError = null;
  try {
    response = await page.goto(url, { waitUntil: WAIT_UNTIL, timeout: NAV_TIMEOUT_MS });
  } catch (error) {
    navigationError = error;
    try {
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    } catch (fallbackError) {
      navigationError = fallbackError;
    }
  }

  await page.waitForTimeout(1200);

  const screenshotPath = resolve(options.screenshotsDir, makeScreenshotName(url, options.viewportName));
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const pageData = await page.evaluate(
    ({ baseUrl, includeLinks, privateRouteSource, placeholderSource, jsRequiredSource }) => {
      const privateRoutePattern = new RegExp(privateRouteSource, "i");
      const placeholderPattern = new RegExp(placeholderSource, "i");
      const jsRequiredPattern = new RegExp(jsRequiredSource, "i");
      const bodyText = document.body?.innerText ?? "";
      const normalizedVisibleText = bodyText.replace(/\s+/g, " ").trim();
      const elements = Array.from(document.querySelectorAll("a, button, [role='button'], input[type='button'], input[type='submit']"));
      const ctaTexts = unique(
        elements
          .filter((element) => isVisible(element))
          .map((element) => accessibleText(element))
          .filter(Boolean)
      ).slice(0, 120);
      const anchors = includeLinks ? Array.from(document.querySelectorAll("a[href]")) : [];
      const links = anchors
        .map((anchor) => {
          const href = anchor.getAttribute("href") ?? "";
          let absoluteUrl = "";
          try {
            absoluteUrl = new URL(href, location.href).toString();
          } catch {
            absoluteUrl = href;
          }
          return {
            text: accessibleText(anchor),
            href,
            url: absoluteUrl,
            visible: isVisible(anchor),
          };
        })
        .filter((link) => link.url.startsWith("http://") || link.url.startsWith("https://"));
      const baseHost = stripWww(new URL(baseUrl).hostname);
      const internalLinks = [];
      const externalLinks = [];
      for (const link of links) {
        const linkHost = stripWww(new URL(link.url).hostname);
        const clean = { text: link.text, url: withoutHash(link.url), visible: link.visible };
        if (linkHost === baseHost) internalLinks.push(clean);
        else externalLinks.push(clean);
      }
      const buttonDestinationIssues = elements
        .filter((element) => isVisible(element))
        .map((element) => {
          const tag = element.tagName.toLowerCase();
          const text = accessibleText(element);
          const href = tag === "a" ? element.getAttribute("href") : "";
          const disabled = element.disabled || element.getAttribute("aria-disabled") === "true";
          const weakHref = tag === "a" && (!href || href === "#" || href.toLowerCase().startsWith("javascript:"));
          return text && (disabled || weakHref)
            ? { text, tag, href: href ?? "", disabled: Boolean(disabled) }
            : null;
        })
        .filter(Boolean)
        .slice(0, 40);
      const exposedInternalAdminLinks = uniqueByUrl(
        internalLinks.filter((link) => privateRoutePattern.test(new URL(link.url).pathname))
      );
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const scrollWidth = Math.max(
        document.body?.scrollWidth ?? 0,
        document.documentElement?.scrollWidth ?? 0
      );
      const horizontalOverflow = scrollWidth > viewportWidth + 8;
      const lowContrast = collectLowContrast();
      const headingTexts = (selector) =>
        Array.from(document.querySelectorAll(selector))
          .filter((element) => isVisible(element))
          .map((element) => element.innerText.replace(/\s+/g, " ").trim())
          .filter(Boolean);
      const blank = normalizedVisibleText.length < 80 || jsRequiredPattern.test(normalizedVisibleText.slice(0, 500));
      return {
        pageTitle: document.title.trim(),
        metaDescription: document.querySelector("meta[name='description']")?.getAttribute("content")?.trim() ?? "",
        h1: headingTexts("h1"),
        h2h3: headingTexts("h2, h3").slice(0, 80),
        ctaTexts,
        internalLinks: uniqueByUrl(internalLinks),
        externalLinks: uniqueByUrl(externalLinks),
        exposedInternalAdminLinks,
        visibleTextSample: normalizedVisibleText.slice(0, 1200),
        visibleTextLength: normalizedVisibleText.length,
        normalizedVisibleText,
        appearsBlankOrJsBroken: blank,
        visualChecks: {
        horizontalOverflow,
        scrollWidth,
        viewportWidth,
        placeholderTextFound: placeholderPattern.test(normalizedVisibleText),
        placeholderTextSnippets: collectPatternSnippets(normalizedVisibleText, placeholderPattern),
        jsRequiredVisible: jsRequiredPattern.test(normalizedVisibleText.slice(0, 800)),
        buttonDestinationIssues,
        lowContrast,
          duplicateSectionHeadings: duplicateValues(headingTexts("h1, h2, h3")),
          missingContentSignals: normalizedVisibleText.length < 300 ? ["Very little visible text"] : [],
        },
      };

      function accessibleText(element) {
        return (
          element.getAttribute("aria-label") ||
          element.innerText ||
          element.value ||
          element.textContent ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim();
      }

      function isVisible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      }

      function withoutHash(rawUrl) {
        const url = new URL(rawUrl);
        url.hash = "";
        if (url.pathname !== "/" && url.pathname.endsWith("/")) {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        return url.toString();
      }

      function unique(values) {
        return Array.from(new Set(values));
      }

      function uniqueByUrl(links) {
        const seen = new Set();
        const output = [];
        for (const link of links) {
          if (seen.has(link.url)) continue;
          seen.add(link.url);
          output.push(link);
        }
        return output;
      }

      function duplicateValues(values) {
        const counts = new Map();
        for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
        return Array.from(counts.entries())
          .filter(([, count]) => count > 1)
          .map(([text, count]) => ({ text, count }));
      }

      function collectPatternSnippets(text, pattern) {
        const snippets = [];
        const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
        const globalPattern = new RegExp(pattern.source, flags);
        for (const match of text.matchAll(globalPattern)) {
          const index = match.index ?? 0;
          snippets.push(text.slice(Math.max(0, index - 70), index + match[0].length + 70).trim());
          if (snippets.length >= 8) break;
        }
        return snippets;
      }

      function collectLowContrast() {
        const candidates = Array.from(document.querySelectorAll("a, button, p, li, h1, h2, h3, h4, span"))
          .filter((element) => isVisible(element))
          .slice(0, 250);
        const issues = [];
        for (const element of candidates) {
          const text = accessibleText(element);
          if (!text || text.length < 3) continue;
          const style = window.getComputedStyle(element);
          const fg = parseColor(style.color);
          const bg = findBackgroundColor(element);
          if (!fg || !bg) continue;
          const ratio = contrastRatio(fg, bg);
          const fontSize = Number.parseFloat(style.fontSize);
          const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
          const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
          const threshold = largeText ? 3 : 4.5;
          if (ratio < threshold) {
            issues.push({
              text: text.slice(0, 90),
              tag: element.tagName.toLowerCase(),
              ratio: Number(ratio.toFixed(2)),
              expected: threshold,
              color: style.color,
              backgroundColor: bg.css,
            });
          }
          if (issues.length >= 25) break;
        }
        return issues;
      }

      function findBackgroundColor(element) {
        let current = element;
        while (current && current !== document.documentElement) {
          const bg = window.getComputedStyle(current).backgroundColor;
          const parsed = parseColor(bg);
          if (parsed && parsed.a > 0.95) return { ...parsed, css: bg };
          current = current.parentElement;
        }
        return { r: 255, g: 255, b: 255, a: 1, css: "rgb(255, 255, 255)" };
      }

      function parseColor(value) {
        const match = value.match(/rgba?\(([^)]+)\)/i);
        if (!match) return null;
        const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
        if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
        return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
      }

      function contrastRatio(fg, bg) {
        const l1 = relativeLuminance(fg);
        const l2 = relativeLuminance(bg);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      function relativeLuminance({ r, g, b }) {
        const channels = [r, g, b].map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      }

      function stripWww(hostname) {
        return hostname.replace(/^www\./i, "");
      }
    },
    {
      baseUrl: options.baseUrl,
      includeLinks: options.includeLinks,
      privateRouteSource: PRIVATE_ROUTE_PATTERN.source,
      placeholderSource: PLACEHOLDER_PATTERN.source,
      jsRequiredSource: JS_REQUIRED_PATTERN.source,
    }
  );

  const accessibility = await collectAccessibility(page);
  await context.close();

  return {
    ...pageData,
    finalUrl: page.url(),
    status: response?.status() ?? null,
    navigationError: navigationError ? navigationError.message : null,
    consoleErrors,
    pageErrors,
    failedNetworkRequests,
    httpErrorResponses,
    screenshot: screenshotPath,
    accessibility,
  };
}

async function collectAccessibility(page) {
  const result = {
    snapshotAvailable: false,
    snapshotSummary: null,
    axeViolations: [],
    axeIncomplete: [],
    error: null,
  };

  try {
    const snapshot =
      page.accessibility?.snapshot
        ? await page.accessibility.snapshot({ interestingOnly: true })
        : await snapshotAccessibilityViaCdp(page);
    result.snapshotAvailable = true;
    result.snapshotSummary = summarizeAccessibilitySnapshot(snapshot);
  } catch (error) {
    result.error = `Accessibility snapshot failed: ${error.message}`;
  }

  try {
    await page.addScriptTag({ content: axe.source });
    const axeResults = await page.evaluate(async () => {
      return window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "best-practice"],
        },
      });
    });
    result.axeViolations = axeResults.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.slice(0, 8).map((node) => ({
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    }));
    result.axeIncomplete = axeResults.incomplete.map((item) => ({
      id: item.id,
      impact: item.impact,
      help: item.help,
      nodes: item.nodes.length,
    }));
  } catch (error) {
    result.error = [result.error, `axe-core failed: ${error.message}`].filter(Boolean).join(" ");
  }

  return result;
}

async function snapshotAccessibilityViaCdp(page) {
  const session = await page.context().newCDPSession(page);
  const tree = await session.send("Accessibility.getFullAXTree");
  const nodes = tree.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const root = nodes.find((node) => node.role?.value === "RootWebArea") ?? nodes[0];
  return convertAxNode(root, byId);
}

function convertAxNode(node, byId) {
  if (!node) return null;
  return {
    role: node.role?.value ?? "",
    name: node.name?.value ?? "",
    children: (node.childIds ?? [])
      .map((childId) => convertAxNode(byId.get(childId), byId))
      .filter(Boolean),
  };
}

function summarizeAccessibilitySnapshot(node, depth = 0) {
  if (!node || depth > 2) return null;
  return {
    role: node.role,
    name: node.name,
    children: (node.children ?? [])
      .slice(0, 8)
      .map((child) => summarizeAccessibilitySnapshot(child, depth + 1))
      .filter(Boolean),
  };
}

function buildVisualChecks(desktop, mobile) {
  return {
    desktop: desktop.visualChecks,
    mobile: mobile.visualChecks,
    highPriorityFindings: [
      desktop.appearsBlankOrJsBroken || mobile.appearsBlankOrJsBroken ? "Page appears blank or JavaScript-broken" : null,
      desktop.visualChecks.horizontalOverflow ? "Desktop has horizontal overflow" : null,
      mobile.visualChecks.horizontalOverflow ? "Mobile has horizontal overflow" : null,
      desktop.visualChecks.jsRequiredVisible || mobile.visualChecks.jsRequiredVisible
        ? "JavaScript-required fallback appears visible"
        : null,
      desktop.visualChecks.placeholderTextFound || mobile.visualChecks.placeholderTextFound
        ? "Placeholder/template text appears visible"
        : null,
      desktop.exposedInternalAdminLinks.length ? "Internal/admin-style links are visible publicly" : null,
    ].filter(Boolean),
  };
}

async function checkLinks(links, baseUrl) {
  const uniqueLinks = [];
  const seen = new Set();
  for (const link of links) {
    const normalized = normalizeUrl(link.url, baseUrl);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    uniqueLinks.push({ ...link, url: normalized });
    if (uniqueLinks.length >= MAX_LINK_CHECKS_PER_PAGE) break;
  }

  const broken = [];
  await Promise.all(
    uniqueLinks.map(async (link) => {
      const result = await probeLink(link.url);
      if (!result.ok) {
        broken.push({
          text: link.text,
          url: link.url,
          status: result.status,
          error: result.error,
        });
      }
    })
  );
  return broken.sort((a, b) => a.url.localeCompare(b.url));
}

async function probeLink(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "ClientSurgeBrowserAudit/0.1" },
    });
    if (response.status >= 400) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "ClientSurgeBrowserAudit/0.1" },
      });
    }
    return { ok: response.status < 400, status: response.status, error: null };
  } catch (error) {
    return { ok: false, status: null, error: error.name === "AbortError" ? "timeout" : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function hashText(text) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
  return createHash("sha1").update(normalized).digest("hex");
}

function stripWww(hostname) {
  return hostname.replace(/^www\./i, "");
}

async function main() {
  const args = parseArgs();
  const url = args.url ?? DEFAULT_START_URL;
  const out = args.out ? resolve(process.cwd(), args.out) : null;
  const result = await auditPage(url, {
    baseUrl: args.base ?? DEFAULT_START_URL,
    screenshotsDir: args.screenshots ? resolve(process.cwd(), args.screenshots) : defaultScreenshotsDir,
  });

  if (out) {
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
