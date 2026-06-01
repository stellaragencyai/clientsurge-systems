#!/usr/bin/env node

import http from "node:http";
import https from "node:https";

const defaultBaseUrl = process.env.CLIENTSURGE_SMOKE_BASE_URL || "http://127.0.0.1:4173";
const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = new URL(baseUrlArg ? baseUrlArg.split("=").slice(1).join("=") : defaultBaseUrl);

const routes = [
  "/roofing",
  "/hvac",
  "/dental",
  "/med-spa",
  "/chiropractic",
  "/contractors",
  "/industries",
  "/automations",
  "/contact",
  "/book",
];

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
    failures.push(`expected 200, received ${statusCode}`);
  }

  if (!contentType.includes("text/html")) {
    failures.push(`expected text/html, received ${contentType || "no content-type"}`);
  }

  if (!html.includes('<div id="root">')) {
    failures.push("response does not look like the Vite app shell");
  }

  if (/Industry Template/i.test(html)) {
    failures.push("raw HTML still contains generic Industry Template copy");
  }

  if (/404\s*\|\s*ClientSurge Systems/i.test(html)) {
    failures.push("route appears to be serving a not-found shell");
  }

  return {
    route,
    url: url.href,
    status: failures.length ? "fail" : "pass",
    http_status: statusCode,
    content_type: contentType,
    title: html.match(/<title>(.*?)<\/title>/i)?.[1] || null,
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

const results = await Promise.all(routes.map(checkRoute));
const failed = results.filter((result) => result.status !== "pass");

const summary = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl.href.replace(/\/$/, ""),
  checked_count: results.length,
  pass_count: results.length - failed.length,
  fail_count: failed.length,
  note:
    "This verifies production-style route delivery from a running preview/deploy URL. Dynamic browser metadata is covered by source tests.",
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(failed.length ? 1 : 0);
