#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const defaultBaseUrl = process.env.CLIENTSURGE_PRODUCT_SIGNUP_SMOKE_BASE_URL || "http://127.0.0.1:4173";
const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = new URL(baseUrlArg ? baseUrlArg.split("=").slice(1).join("=") : defaultBaseUrl);
const builtFallbackPath = "dist/product-signup";

const requiredMarkers = [
  "Complete your ClientSurge signup",
  "Starter System",
  "Growth System",
  "Pro System",
  "Your information",
  "Continue to Secure Checkout",
  "createCheckoutSession",
  "69dc4a79656fdba136d413d3",
  "/api/apps/",
  "/functions/createCheckoutSession",
];

const routes = [
  "/product-signup",
  "/product-signup?package=growth_system",
  "/product-signup?package=starter_system",
  "/product-signup?package=pro_system",
];

function looksBlank(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length < 120;
}

function validateHtml(html) {
  const failures = [];

  if (!html || looksBlank(html)) {
    failures.push("page appears blank or nearly blank");
  }

  if (/404\s*\|\s*ClientSurge Systems/i.test(html) || /page not found/i.test(html)) {
    failures.push("page appears to be a not-found page");
  }

  if (/Access Restricted/i.test(html)) {
    failures.push("page appears to be behind an auth/access restriction screen");
  }

  for (const marker of requiredMarkers) {
    if (!html.includes(marker)) {
      failures.push(`missing required marker: ${marker}`);
    }
  }

  return failures;
}

function checkBuiltFallback() {
  if (!fs.existsSync(builtFallbackPath)) {
    return {
      status: "fail",
      bytes: 0,
      failures: [`built fallback file not found: ${builtFallbackPath}`],
    };
  }

  const html = fs.readFileSync(builtFallbackPath, "utf8");
  const failures = validateHtml(html);
  return {
    status: failures.length ? "fail" : "pass",
    bytes: Buffer.byteLength(html, "utf8"),
    failures,
  };
}

async function checkRoute(route) {
  const url = new URL(route, baseUrl);
  const failures = [];

  let result;
  try {
    result = await requestHtml(url);
  } catch (error) {
    return {
      route,
      url: url.href,
      status: "fail",
      failures: [`request failed: ${error.message}`],
    };
  }

  const { statusCode, headers, html } = result;
  const contentType = headers["content-type"] || "";

  if (statusCode !== 200) {
    failures.push(`expected HTTP 200, received ${statusCode}`);
  }

  if (!contentType.includes("text/html")) {
    failures.push(`expected text/html, received ${contentType || "no content-type"}`);
  }

  failures.push(...validateHtml(html));

  return {
    route,
    url: url.href,
    status: failures.length ? "fail" : "pass",
    http_status: statusCode,
    content_type: contentType,
    bytes: Buffer.byteLength(html, "utf8"),
    failures,
  };
}

function requestHtml(url) {
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(
      url,
      {
        headers: {
          Accept: "text/html",
          Connection: "close",
        },
        timeout: 10000,
      },
      (response) => {
        response.setEncoding("utf8");
        let html = "";

        response.on("data", (chunk) => {
          html += chunk;
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            html,
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("request timed out"));
    });

    request.on("error", reject);
  });
}

const builtFallback = checkBuiltFallback();
const routeResults = await Promise.all(routes.map(checkRoute));
const hardFailures = [
  ...(builtFallback.status === "pass" ? [] : [{ check: "built-fallback", failures: builtFallback.failures }]),
  ...routeResults
    .filter((result) => result.status !== "pass")
    .map((result) => ({ check: result.route, failures: result.failures })),
];

const summary = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl.href.replace(/\/$/, ""),
  built_fallback: builtFallback,
  route_results: routeResults,
  checked_count: 1 + routeResults.length,
  pass_count: 1 + routeResults.filter((result) => result.status === "pass").length,
  fail_count: hardFailures.length,
  note: "This verifies the built product-signup fallback and the preview route both expose non-blank checkout HTML.",
};

console.log(JSON.stringify(summary, null, 2));
process.exit(hardFailures.length ? 1 : 0);
