#!/usr/bin/env node

import crypto from "node:crypto";
import http from "node:http";
import https from "node:https";

const defaultBaseUrl = process.env.CLIENTSURGE_RAW_HTML_AUDIT_BASE_URL || "https://clientsurgesystems.com";
const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = new URL(baseUrlArg ? baseUrlArg.split("=").slice(1).join("=") : defaultBaseUrl);

const routes = [
  "/",
  "/about",
  "/blog",
  "/contact",
  "/roofing",
  "/login",
];

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
        timeout: 7000,
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

function extractMeta(html, regex) {
  return html.match(regex)?.[1] || "";
}

function normalizeHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fingerprint(html) {
  return crypto.createHash("sha256").update(normalizeHtml(html)).digest("hex");
}

async function inspectRoute(route) {
  const url = new URL(route, baseUrl);
  const response = await requestHtml(url);
  const { html } = response;

  return {
    route,
    url: url.href,
    http_status: response.statusCode,
    title: extractMeta(html, /<title>(.*?)<\/title>/i),
    canonical: extractMeta(html, /<link rel="canonical" href="([^"]+)"/i),
    robots: extractMeta(html, /<meta name="robots" content="([^"]+)"/i),
    description: extractMeta(html, /<meta name="description" content="([^"]+)"/i),
    normalized_sha256: fingerprint(html),
    html_bytes: Buffer.byteLength(html, "utf8"),
  };
}

const results = await Promise.all(routes.map(inspectRoute));
const rootHash = results[0]?.normalized_sha256 || "";

const summary = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl.href.replace(/\/$/, ""),
  root_normalized_sha256: rootHash,
  identical_to_root_count: results.filter((item) => item.normalized_sha256 === rootHash).length,
  results: results.map((item) => ({
    ...item,
    identical_to_root: item.normalized_sha256 === rootHash,
  })),
  note:
    "If multiple major routes share the same normalized SHA-256 fingerprint, their pre-hydration HTML is effectively the same document to non-JS fetchers.",
};

console.log(JSON.stringify(summary, null, 2));
