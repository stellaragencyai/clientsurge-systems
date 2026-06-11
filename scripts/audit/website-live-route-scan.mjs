#!/usr/bin/env node

import http from "node:http";
import https from "node:https";

import {
  PUBLIC_ROUTE_METADATA,
  SITEMAP_STATIC_PATHS,
} from "../../src/lib/publicRouteMetadata.js";

const DEFAULT_BASE_URL = "https://clientsurgesystems.com";
const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const routeArgs = process.argv
  .filter((arg) => arg.startsWith("--route="))
  .map((arg) => arg.slice("--route=".length));
const baseUrl = new URL(baseUrlArg ? baseUrlArg.split("=").slice(1).join("=") : DEFAULT_BASE_URL);
const routes = routeArgs.length
  ? routeArgs
  : Array.from(new Set(["/", ...Object.keys(PUBLIC_ROUTE_METADATA), ...SITEMAP_STATIC_PATHS]));

function requestText(url) {
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve) => {
    const request = client.get(
      url,
      {
        headers: {
          Accept: "text/html",
          "User-Agent": "ClientSurgeWebsiteRouteScan/1.0",
        },
        timeout: 12000,
      },
      (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            ok: true,
            statusCode: response.statusCode || 0,
            headers: response.headers,
            body,
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("request timed out"));
    });
    request.on("error", (error) => {
      resolve({ ok: false, statusCode: 0, headers: {}, body: "", error: error.message });
    });
  });
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function extractBundleHash(html) {
  const match =
    html.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/) ||
    html.match(/\/assets\/([^/"']+)\.js/);
  return match ? match[1] : "";
}

async function scanRoute(route) {
  const url = new URL(route, baseUrl);
  const result = await requestText(url);
  const errors = [];

  if (!result.ok) errors.push(result.error || "request failed");
  if (result.ok && result.statusCode >= 400) errors.push(`http ${result.statusCode}`);
  if (result.ok && !String(result.headers["content-type"] || "").includes("text/html")) {
    errors.push(`non-html content-type ${result.headers["content-type"] || "unknown"}`);
  }

  return {
    route,
    url: url.href,
    status_code: result.statusCode,
    page_title: extractTitle(result.body),
    contains_free_automation_audit: /free automation audit/i.test(result.body),
    contains_demo: /\bdemo\b/i.test(result.body),
    contains_coming_soon: /coming soon/i.test(result.body),
    bundle_hash: extractBundleHash(result.body),
    errors,
  };
}

const results = await Promise.all(routes.map(scanRoute));
const failed = results.filter((result) => result.errors.length > 0);
const drift = results.filter(
  (result) => result.contains_demo || result.contains_coming_soon || !result.contains_free_automation_audit
);

const summary = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl.href.replace(/\/$/, ""),
  checked_count: results.length,
  failed_count: failed.length,
  drift_count: drift.length,
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(failed.length ? 1 : 0);
