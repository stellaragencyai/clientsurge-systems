#!/usr/bin/env node

import http from "node:http";
import https from "node:https";
import vm from "node:vm";

import {
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_METADATA,
  STATIC_ROUTE_ALIASES,
} from "../src/lib/publicRouteMetadata.js";

const defaultBaseUrl = process.env.CLIENTSURGE_SMOKE_BASE_URL || "http://127.0.0.1:4173";
const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = new URL(baseUrlArg ? baseUrlArg.split("=").slice(1).join("=") : defaultBaseUrl);

const routes = [
  "/",
  "/start",
  "/store",
  "/about",
  "/blog",
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
  "/login",
];

function normalizePath(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0].replace(/\/+$/, "");
  return value || "/";
}

function shouldNoindex(pathname) {
  const normalized = normalizePath(pathname);
  return NOINDEX_ROUTE_PREFIXES.some((prefix) => {
    const normalizedPrefix = normalizePath(prefix);
    return (
      normalized === normalizedPrefix ||
      (normalizedPrefix !== "/" && normalized.startsWith(`${normalizedPrefix}/`))
    );
  });
}

function createAttributeNode(initial = {}) {
  const attributes = new Map(Object.entries(initial));
  return {
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
  };
}

function extractInlineRouteScript(html) {
  const match = html.match(
    /<script>\s*\(function \(\) \{([\s\S]*?)\}\)\(\);\s*<\/script>/i
  );
  if (!match) {
    throw new Error("inline route metadata script not found");
  }
  return `(function () {${match[1]}})();`;
}

function hasInlineLiteral(html, variableName) {
  return new RegExp(`var\\s+${variableName}\\s*=`).test(html);
}

function simulateStaticRouteSignals({ html, route }) {
  const canonical = createAttributeNode({ href: "https://clientsurgesystems.com/" });
  const description = createAttributeNode({ content: "" });
  const robots = createAttributeNode({ content: "index,follow" });
  const ogUrl = createAttributeNode({ content: "" });
  const ogTitle = createAttributeNode({ content: "" });
  const ogDescription = createAttributeNode({ content: "" });
  const twitterUrl = createAttributeNode({ content: "" });
  const twitterTitle = createAttributeNode({ content: "" });
  const twitterDescription = createAttributeNode({ content: "" });
  const documentElementAttributes = new Map();

  const document = {
    title: "",
    documentElement: {
      setAttribute(name, value) {
        documentElementAttributes.set(name, String(value));
      },
      getAttribute(name) {
        return documentElementAttributes.get(name) || null;
      },
    },
    querySelector(selector) {
      const nodes = {
        'meta[name="description"]': description,
        'meta[name="robots"]': robots,
        'link[rel="canonical"]': canonical,
        'meta[property="og:url"]': ogUrl,
        'meta[property="og:title"]': ogTitle,
        'meta[property="og:description"]': ogDescription,
        'meta[property="twitter:url"]': twitterUrl,
        'meta[property="twitter:title"]': twitterTitle,
        'meta[property="twitter:description"]': twitterDescription,
      };
      return nodes[selector] || null;
    },
  };

  const window = {
    location: {
      pathname: route,
    },
  };

  const script = extractInlineRouteScript(html);
  vm.runInNewContext(script, { window, document });

  return {
    title: document.title,
    description: description.getAttribute("content") || "",
    robots: robots.getAttribute("content") || "",
    canonical: canonical.getAttribute("href") || "",
    ogTitle: ogTitle.getAttribute("content") || "",
    routeKey: document.documentElement.getAttribute("data-static-route") || "",
  };
}

function expectedSignals(route) {
  const normalizedRoute = normalizePath(route);
  const canonicalPath = STATIC_ROUTE_ALIASES[normalizedRoute] || normalizedRoute;
  const metadata = PUBLIC_ROUTE_METADATA[canonicalPath] || PUBLIC_ROUTE_METADATA["/"];
  return {
    canonicalPath,
    title: metadata.title,
    description: metadata.description,
    routeKey: metadata.key,
    robots: shouldNoindex(canonicalPath) ? "noindex,nofollow" : "index,follow",
    canonical: `https://clientsurgesystems.com${canonicalPath}`,
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
    failures.push(`expected 200, received ${statusCode}`);
  }

  if (!contentType.includes("text/html")) {
    failures.push(`expected text/html, received ${contentType || "no content-type"}`);
  }

  if (!html.includes('<div id="root">')) {
    failures.push("response does not look like the Vite app shell");
  }

  if (/404\s*\|\s*ClientSurge Systems/i.test(html)) {
    failures.push("route appears to be serving a not-found shell");
  }

  if (!hasInlineLiteral(html, "routeMap")) {
    failures.push("route metadata script missing routeMap literal");
  }

  if (!hasInlineLiteral(html, "aliases")) {
    failures.push("route metadata script missing aliases literal");
  }

  if (!hasInlineLiteral(html, "noindexPrefixes")) {
    failures.push("route metadata script missing noindexPrefixes literal");
  }

  let actualSignals = null;
  let expected = null;

  try {
    actualSignals = simulateStaticRouteSignals({ html, route });
    expected = expectedSignals(route);
  } catch (error) {
    failures.push(`failed to evaluate static route signals: ${error.message}`);
  }

  if (actualSignals && expected) {
    if (actualSignals.title !== expected.title) {
      failures.push(`expected title "${expected.title}", received "${actualSignals.title}"`);
    }

    if (actualSignals.description !== expected.description) {
      failures.push(`description mismatch for ${route}`);
    }

    if (actualSignals.robots !== expected.robots) {
      failures.push(`expected robots "${expected.robots}", received "${actualSignals.robots}"`);
    }

    if (actualSignals.canonical !== expected.canonical) {
      failures.push(`expected canonical "${expected.canonical}", received "${actualSignals.canonical}"`);
    }

    if (actualSignals.routeKey !== expected.routeKey) {
      failures.push(`expected route key "${expected.routeKey}", received "${actualSignals.routeKey}"`);
    }

    if (actualSignals.ogTitle !== expected.title) {
      failures.push(`expected og:title "${expected.title}", received "${actualSignals.ogTitle}"`);
    }
  }

  return {
    route,
    url: url.href,
    status: failures.length ? "fail" : "pass",
    http_status: statusCode,
    content_type: contentType,
    static_route_key: actualSignals?.routeKey || null,
    title: actualSignals?.title || null,
    canonical: actualSignals?.canonical || null,
    robots: actualSignals?.robots || null,
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
    "This verifies production-style route delivery plus evaluated static route identity signals from the inline metadata script.",
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(failed.length ? 1 : 0);
