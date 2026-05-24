#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const DEFAULT_CANONICAL_ORIGIN =
  process.env.CLIENTSURGE_CANONICAL_ORIGIN || "https://clientsurgesystems.com";
export const DEFAULT_ALTERNATE_ORIGIN =
  process.env.CLIENTSURGE_ALTERNATE_ORIGIN || "https://www.clientsurgesystems.com";

export const PUBLIC_PAGE_PATHS = ["/"];
export const SENSITIVE_PAGE_PATHS = [
  "/admin/",
  "/onboarding",
  "/setup/preview/security-check",
  "/motion-lab",
  "/client-portal",
];
export const DOCUMENT_PATHS = [
  "/robots.txt",
  "/sitemap.xml",
  "/.well-known/security.txt",
];

const REQUIRED_PUBLIC_HEADERS = [
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "strict-transport-security",
];

function normalizeOrigin(origin) {
  return String(origin || "").replace(/\/+$/, "");
}

function absoluteUrl(origin, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizeOrigin(origin)}${normalizedPath}`;
}

export function headersToObject(headers = {}) {
  if (typeof headers.entries === "function") {
    return Object.fromEntries(
      [...headers.entries()].map(([key, value]) => [key.toLowerCase(), value])
    );
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)])
  );
}

function getHeader(headers, name) {
  return headersToObject(headers)[name.toLowerCase()] || "";
}

function createCheck({ id, target, status, severity = "fail", message, details = {} }) {
  return { id, target, status, severity, message, details };
}

export function evaluateCanonicalRedirect({
  fromUrl,
  status,
  location,
  expectedUrl,
}) {
  const redirectStatus = [301, 302, 307, 308].includes(status);
  const normalizedLocation = location ? new URL(location, fromUrl).toString() : "";
  const expected = new URL(expectedUrl).toString();

  if (redirectStatus && normalizedLocation === expected) {
    return createCheck({
      id: "canonical-redirect",
      target: fromUrl,
      status: "pass",
      message: `Redirects to ${expected}`,
      details: { status, location: normalizedLocation },
    });
  }

  return createCheck({
    id: "canonical-redirect",
    target: fromUrl,
    status: "fail",
    message: `Expected redirect to ${expected}`,
    details: { status, location: normalizedLocation || null },
  });
}

export function evaluatePublicHeaders({ target, headers, allowPlatformHeaderDrift = false }) {
  const normalizedHeaders = headersToObject(headers);
  const checks = [];

  for (const headerName of REQUIRED_PUBLIC_HEADERS) {
    const value = normalizedHeaders[headerName] || "";
    const isPresent = Boolean(value);
    const demotePlatformHeader =
      allowPlatformHeaderDrift &&
      ["content-security-policy", "x-frame-options", "permissions-policy", "cross-origin-opener-policy"].includes(headerName);

    checks.push(createCheck({
      id: `header:${headerName}`,
      target,
      status: isPresent ? "pass" : demotePlatformHeader ? "warn" : "fail",
      severity: demotePlatformHeader ? "warn" : "fail",
      message: isPresent ? `${headerName} present` : `${headerName} missing`,
      details: { value },
    }));
  }

  const csp = normalizedHeaders["content-security-policy"] || "";
  if (csp) {
    for (const directive of ["default-src", "base-uri", "object-src", "frame-ancestors"]) {
      checks.push(createCheck({
        id: `csp:${directive}`,
        target,
        status: csp.includes(directive) ? "pass" : "fail",
        message: csp.includes(directive)
          ? `CSP includes ${directive}`
          : `CSP missing ${directive}`,
      }));
    }
  }

  return checks;
}

export function evaluateSensitiveHeaders({ target, headers }) {
  const robots = getHeader(headers, "x-robots-tag").toLowerCase();
  const cacheControl = getHeader(headers, "cache-control").toLowerCase();

  return [
    createCheck({
      id: "sensitive:noindex",
      target,
      status: robots.includes("noindex") ? "pass" : "fail",
      message: robots.includes("noindex")
        ? "Sensitive route has X-Robots-Tag noindex"
        : "Sensitive route lacks X-Robots-Tag noindex",
      details: { value: robots || null },
    }),
    createCheck({
      id: "sensitive:no-store",
      target,
      status: cacheControl.includes("no-store") ? "pass" : "fail",
      message: cacheControl.includes("no-store")
        ? "Sensitive route has Cache-Control no-store"
        : "Sensitive route lacks Cache-Control no-store",
      details: { value: cacheControl || null },
    }),
  ];
}

export function evaluateCanonicalText({
  target,
  body,
  canonicalOrigin = DEFAULT_CANONICAL_ORIGIN,
  alternateOrigin = DEFAULT_ALTERNATE_ORIGIN,
}) {
  const canonical = normalizeOrigin(canonicalOrigin);
  const alternate = normalizeOrigin(alternateOrigin);
  const text = String(body || "");

  if (text.includes(alternate)) {
    return createCheck({
      id: "canonical-text",
      target,
      status: "fail",
      message: `Document still references alternate domain ${alternate}`,
    });
  }

  if (!text.includes(canonical)) {
    return createCheck({
      id: "canonical-text",
      target,
      status: "fail",
      message: `Document does not reference canonical domain ${canonical}`,
    });
  }

  return createCheck({
    id: "canonical-text",
    target,
    status: "pass",
    message: `Document references canonical domain ${canonical}`,
  });
}

function summarize(checks) {
  return checks.reduce(
    (summary, check) => {
      summary.total += 1;
      summary[check.status] += 1;
      return summary;
    },
    { total: 0, pass: 0, warn: 0, fail: 0 }
  );
}

async function fetchWithTimeout(fetchImpl, url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);
  try {
    return await fetchImpl(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyProductionSecurity({
  fetchImpl = globalThis.fetch,
  canonicalOrigin = DEFAULT_CANONICAL_ORIGIN,
  alternateOrigin = DEFAULT_ALTERNATE_ORIGIN,
  allowPlatformHeaderDrift = false,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is required to verify production security");
  }

  const canonical = normalizeOrigin(canonicalOrigin);
  const alternate = normalizeOrigin(alternateOrigin);
  const checks = [];

  const alternateRoot = `${alternate}/`;
  const alternateResponse = await fetchWithTimeout(fetchImpl, alternateRoot, {
    redirect: "manual",
  });
  checks.push(evaluateCanonicalRedirect({
    fromUrl: alternateRoot,
    status: alternateResponse.status,
    location: alternateResponse.headers.get("location"),
    expectedUrl: `${canonical}/`,
  }));

  const httpRoot = `http://${new URL(canonical).host}/`;
  const httpResponse = await fetchWithTimeout(fetchImpl, httpRoot, {
    redirect: "manual",
  });
  checks.push(evaluateCanonicalRedirect({
    fromUrl: httpRoot,
    status: httpResponse.status,
    location: httpResponse.headers.get("location"),
    expectedUrl: `${canonical}/`,
  }));

  for (const path of PUBLIC_PAGE_PATHS) {
    const target = absoluteUrl(canonical, path);
    const response = await fetchWithTimeout(fetchImpl, target, { redirect: "follow" });
    const finalUrl = response.url || target;

    checks.push(createCheck({
      id: "canonical-final-url",
      target,
      status: finalUrl.startsWith(canonical) ? "pass" : "fail",
      message: finalUrl.startsWith(canonical)
        ? `Final URL remains on ${canonical}`
        : `Final URL drifted to ${finalUrl}`,
      details: { status: response.status, finalUrl },
    }));
    checks.push(...evaluatePublicHeaders({
      target,
      headers: response.headers,
      allowPlatformHeaderDrift,
    }));
  }

  for (const path of SENSITIVE_PAGE_PATHS) {
    const target = absoluteUrl(canonical, path);
    const response = await fetchWithTimeout(fetchImpl, target, { redirect: "follow" });
    checks.push(createCheck({
      id: "sensitive:status",
      target,
      status: response.status < 500 ? "pass" : "fail",
      message: `Sensitive route responded with ${response.status}`,
      details: { finalUrl: response.url || target },
    }));
    checks.push(...evaluateSensitiveHeaders({ target, headers: response.headers }));
  }

  for (const path of DOCUMENT_PATHS) {
    const target = absoluteUrl(canonical, path);
    const response = await fetchWithTimeout(fetchImpl, target, { redirect: "follow" });
    const body = await response.text();
    checks.push(createCheck({
      id: "document:status",
      target,
      status: response.ok ? "pass" : "fail",
      message: `${path} responded with ${response.status}`,
    }));
    checks.push(evaluateCanonicalText({
      target,
      body,
      canonicalOrigin: canonical,
      alternateOrigin: alternate,
    }));
  }

  return {
    canonical_origin: canonical,
    alternate_origin: alternate,
    allow_platform_header_drift: allowPlatformHeaderDrift,
    checked_at: new Date().toISOString(),
    summary: summarize(checks),
    checks,
  };
}

export function formatReport(report) {
  const lines = [
    "Production security verification",
    `Canonical: ${report.canonical_origin}`,
    `Alternate: ${report.alternate_origin}`,
    `Summary: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`,
    "",
  ];

  for (const check of report.checks) {
    const marker = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
    lines.push(`${marker} ${check.id} ${check.target} - ${check.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function parseCliArgs(argv) {
  return {
    canonicalOrigin:
      argv.find((arg) => arg.startsWith("--canonical="))?.split("=")[1] ||
      DEFAULT_CANONICAL_ORIGIN,
    alternateOrigin:
      argv.find((arg) => arg.startsWith("--alternate="))?.split("=")[1] ||
      DEFAULT_ALTERNATE_ORIGIN,
    allowPlatformHeaderDrift: argv.includes("--allow-platform-header-drift"),
    json: argv.includes("--json"),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseCliArgs(process.argv.slice(2));
  try {
    const report = await verifyProductionSecurity(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatReport(report));
    }
    process.exitCode = report.summary.fail > 0 ? 1 : 0;
  } catch (error) {
    console.error(`Production security verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
