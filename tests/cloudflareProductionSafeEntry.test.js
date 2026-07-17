import test from "node:test";
import assert from "node:assert/strict";

import safeEntry, {
  sanitizeHtmlResponse,
  stripInjectedDirectoryBeforeFallback,
  stripInjectedDirectoryBeforeRoot,
} from "../cloudflare/clientsurge-production-safe-entry.mjs";

const RAW_BASE44_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <title>Home | Base44</title>
    <meta name="description" content="ClientSurge Systems manages 5 data types including launch gates." />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="https://grinning-apex-flow-growth.base44.app/" />
    <meta property="og:title" content="Home | Base44" />
    <meta property="og:description" content="ClientSurge Systems manages 5 data types including launch gates." />
    <meta property="og:url" content="https://grinning-apex-flow-growth.base44.app/" />
  </head>
  <body>
    <section data-base44-directory>
      <h1>ClientSurge Systems</h1>
      <p>ClientSurge Systems manages 5 data types including launch gates. Helps you organize, track, and share your work in 1 place.</p>
      <h2>Pages</h2>
      <ul>
        <li><a href="/pricing">Pricing Page</a></li>
        <li><a href="/admin/ConversionInsights">Admin / Conversion Insights</a></li>
        <li><a href="/client-dashboard">Client Dashboard</a></li>
      </ul>
    </section>
    <div id="root">
      <main class="static-fallback">
        <h1>Turn your website into an AI-powered sales system.</h1>
        <a href="/pricing">Compare Packages</a>
      </main>
    </div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

const INSIDE_ROOT_DIRECTORY = `<!doctype html><html><head><title>Old</title></head><body>
<div id="root">
  <section><p>ClientSurge Systems manages 5 data types including launch gates.</p><h2>Pages</h2><ul><li><a href="/admin">Admin Dashboard</a></li></ul></section>
  <main class="static-fallback">Safe fallback</main>
</div>
<script type="module" src="/src/main.jsx"></script>
</body></html>`;

test("strips generated directory injected before the React root", () => {
  const result = stripInjectedDirectoryBeforeRoot(RAW_BASE44_SHELL);
  assert.equal(result.changed, true);
  assert.equal(result.reason, "removed_directory_before_root");
  const bodyOnly = result.html.replace(/^[\s\S]*<body[^>]*>/i, "").replace(/<\/body>[\s\S]*$/i, "");
  assert.doesNotMatch(result.html, /Admin \/ Conversion Insights/);
  assert.doesNotMatch(bodyOnly, /manages 5 data types/i);
  assert.match(result.html, /<div id="root">/);
  assert.match(result.html, /<script type="module" src="\/src\/main\.jsx"><\/script>/);
});

test("strips generated directory injected inside root before the safe fallback", () => {
  const result = stripInjectedDirectoryBeforeFallback(INSIDE_ROOT_DIRECTORY);
  assert.equal(result.changed, true);
  assert.equal(result.reason, "removed_directory_before_fallback");
  assert.doesNotMatch(result.html, /Admin Dashboard/);
  assert.match(result.html, /Safe fallback/);
  assert.match(result.html, /\/src\/main\.jsx/);
});

test("sanitizes raw Base44 directory output while preserving React bootstrap", async () => {
  const response = await sanitizeHtmlResponse(
    new Request("https://clientsurgesystems.com/", {
      headers: { accept: "text/html" },
    }),
    new Response(RAW_BASE44_SHELL, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-length": String(RAW_BASE44_SHELL.length),
        "content-encoding": "gzip",
        etag: '"stale-origin-etag"',
        "last-modified": "Sat, 11 Jul 2026 00:00:00 GMT",
      },
    }),
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-clientsurge-route-exposure-sanitized"), "removed-preserved-react");
  assert.equal(response.headers.get("content-length"), null);
  assert.equal(response.headers.get("content-encoding"), null);
  assert.equal(response.headers.get("etag"), null);
  assert.equal(response.headers.get("last-modified"), null);
  assert.doesNotMatch(body, /manages 5 data types/i);
  assert.doesNotMatch(body, /Admin \/ Conversion Insights/);
  assert.doesNotMatch(body, /<h2>Pages<\/h2>/);
  assert.match(body, /Turn your website into an AI-powered sales system/);
  assert.match(body, /<script type="module" src="\/src\/main\.jsx"><\/script>/);
  assert.match(body, /ClientSurge Systems \| AI-Powered Sales Systems for Local Businesses/);
});

test("recovers a Base44 public-route cache miss from the root SPA shell", async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input) => {
    const target = new URL(typeof input === "string" ? input : input.url);
    calls.push(`${target.hostname}${target.pathname}`);
    assert.equal(target.hostname, "grinning-apex-flow-growth.base44.app");

    if (target.pathname === "/how-it-works") {
      return new Response("Cache miss", {
        status: 500,
        statusText: "Cache miss",
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (target.pathname === "/") {
      return new Response(RAW_BASE44_SHELL, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    throw new Error(`Unexpected origin route ${target.pathname}`);
  };

  try {
    const response = await safeEntry.fetch(
      new Request("https://clientsurgesystems.com/how-it-works", {
        headers: { accept: "text/html", "sec-fetch-mode": "navigate" },
      }),
      {},
      {},
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("x-clientsurge-app-shell-fallback") || "", /from=\/how-it-works/);
    assert.deepEqual(calls, [
      "grinning-apex-flow-growth.base44.app/how-it-works",
      "grinning-apex-flow-growth.base44.app/",
    ]);
    assert.doesNotMatch(body, /Cache miss/);
    assert.doesNotMatch(body, /manages 5 data types/i);
    assert.doesNotMatch(body, /Admin \/ Conversion Insights/);
    assert.match(body, /<link rel="canonical" href="https:\/\/clientsurgesystems\.com\/how-it-works" \/>/);
    assert.match(body, /How It Works \| ClientSurge Systems/);
    assert.match(body, /\/src\/main\.jsx/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("client portal gets the sanitized SPA shell instead of a private-route 403", async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input) => {
    const target = new URL(typeof input === "string" ? input : input.url);
    calls.push(`${target.hostname}${target.pathname}`);
    assert.equal(target.hostname, "grinning-apex-flow-growth.base44.app");

    if (target.pathname === "/") {
      return new Response(RAW_BASE44_SHELL, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Cache miss", {
      status: 500,
      statusText: "Cache miss",
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  };

  try {
    const response = await safeEntry.fetch(
      new Request("https://clientsurgesystems.com/client-portal", {
        headers: { accept: "text/html", "sec-fetch-mode": "navigate" },
      }),
      {},
      {},
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-clientsurge-client-portal-edge"), "app-shell");
    assert.match(response.headers.get("x-clientsurge-app-shell-fallback") || "", /from=\/client-portal/);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    assert.ok(calls.includes("grinning-apex-flow-growth.base44.app/"));
    assert.doesNotMatch(body, /Cache miss|Login Required|manages 5 data types/i);
    assert.match(body, /<script type="module" src="\/src\/main\.jsx"><\/script>/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("legacy client dashboard redirects to the canonical client portal", async () => {
  const response = await safeEntry.fetch(
    new Request("https://clientsurgesystems.com/client-dashboard?tab=billing", {
      headers: { accept: "text/html" },
    }),
    {},
    {},
  );

  assert.equal(response.status, 308);
  assert.equal(response.headers.get("x-clientsurge-client-dashboard-redirect"), "canonical-client-portal");
  assert.equal(response.headers.get("location"), "https://clientsurgesystems.com/client-portal?tab=billing");
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
});

test("product signup hotfix is still served through the safe-entry sanitizer", async () => {
  const response = await safeEntry.fetch(
    new Request("https://clientsurgesystems.com/product-signup?package=starter_system", {
      headers: { accept: "text/html" },
    }),
    {},
    {},
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-clientsurge-product-signup-hotfix"), "2026-07-05-product-signup-edge-hotfix-v1");
  assert.equal(response.headers.get("x-clientsurge-route-exposure-sanitized"), "removed-preserved-react");
  assert.doesNotMatch(body, /Available Pages|Admin \/ Conversion Insights|manages 5 data types/i);
  assert.match(body, /Complete your ClientSurge signup/);
  assert.match(body, /createCheckoutSession/);
});

test("private routes remain blocked and are never converted to a public SPA fallback", async () => {
  const response = await safeEntry.fetch(
    new Request("https://clientsurgesystems.com/admin", {
      headers: { accept: "text/html" },
    }),
    {},
    {},
  );
  const body = await response.text();

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("x-clientsurge-app-shell-fallback"), null);
  assert.match(body, /Login Required/);
});
