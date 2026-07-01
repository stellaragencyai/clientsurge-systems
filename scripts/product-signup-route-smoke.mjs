#!/usr/bin/env node

import http from "node:http";
import https from "node:https";

const defaultBaseUrl = process.env.CLIENTSURGE_PRODUCT_SIGNUP_SMOKE_BASE_URL || "http://127.0.0.1:4173";
const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = new URL(baseUrlArg ? baseUrlArg.split("=").slice(1).join("=") : defaultBaseUrl);

const checks = [
  {
    route: "/product-signup",
    required: [
      "Complete your ClientSurge signup",
      "Starter System",
      "Growth System",
      "Pro System",
      "Your information",
      "Continue to Secure Checkout",
      "createCheckoutSession",
    ],
  },
  {
    route: "/product-signup?package=growth_system",
    required: ["Complete your ClientSurge signup", "Growth System", "Continue to Secure Checkout"],
  },
  {
    route: "/product-signup?package=starter_system",
    required: ["Complete your ClientSurge signup", "Starter System", "Continue to Secure Checkout"],
  },
  {
    route: "/product-signup?package=pro_system",
    required: ["Complete your ClientSurge signup", "Pro System", "Continue to Secure Checkout"],
  },
];

function stripQuery(route) {
  return String(route || "/").split("?")[0];
}

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

async function checkRoute({ route, required }) {
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

  if (!html || looksBlank(html)) {
    failures.push("route appears blank or nearly blank");
  }

  if (/404\s*\|\s*ClientSurge Systems/i.test(html) || /page not found/i.test(html)) {
    failures.push("route appears to be serving a not-found page");
  }

  if (/Access Restricted/i.test(html)) {
    failures.push("route appears to be behind an auth/access restriction screen");
  }

  for (const needle of required) {
    if (!html.includes(needle)) {
      failures.push(`missing required visible/source marker: ${needle}`);
    }
  }

  if (!html.includes("69dc4a79656fdba136d413d3")) {
    failures.push("Base44 app id marker missing from checkout fallback");
  }

  if (!html.includes("/api/apps/") || !html.includes("/functions/createCheckoutSession")) {
    failures.push("checkout function endpoint marker missing");
  }

  return {
    route,
    normalized_path: stripQuery(route),
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

const results = await Promise.all(checks.map(checkRoute));
const failed = results.filter((result) => result.status !== "pass");

const summary = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl.href.replace(/\/$/, ""),
  checked_count: results.length,
  pass_count: results.length - failed.length,
  fail_count: failed.length,
  note: "This verifies product-signup does not return blank HTML and includes checkout UI/function markers.",
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(failed.length ? 1 : 0);
