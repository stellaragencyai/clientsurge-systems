import test from "node:test";
import assert from "node:assert/strict";

import wrapper, {
  APP_SHELL_FALLBACK_HEADER,
  HOMEPAGE_REPAIR_HEADER,
  ROUTE_EXPOSURE_SANITIZED_HEADER,
} from "../cloudflare/clientsurge-security-edge-wrapper.mjs";

const ROOT_APP_SHELL_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Home | Base44</title>
    <meta name="description" content="old" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="https://grinning-apex-flow-growth.base44.app/" />
    <meta property="og:title" content="old" />
    <meta property="og:url" content="https://grinning-apex-flow-growth.base44.app/" />
    <meta property="twitter:title" content="old" />
    <meta property="twitter:url" content="https://grinning-apex-flow-growth.base44.app/" />
  </head>
  <body>
    <h1>ClientSurge Systems</h1>
    <p>ClientSurge Systems manages 5 data types including launch gates.</p>
    <h2>Pages</h2>
    <ul>
      <li><a href="/admin">Admin Dashboard</a></li>
      <li><a href="/store">Store</a></li>
    </ul>
    <div id="root">
      <main class="static-fallback">Capture. Follow Up. Book.</main>
    </div>
  </body>
</html>`;

test("Cloudflare wrapper repairs generated Base44 homepage directory into clean homepage", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const target = new URL(typeof input === "string" ? input : input.url);
    assert.equal(target.hostname, "grinning-apex-flow-growth.base44.app");
    assert.equal(target.pathname, "/");
    return new Response(ROOT_APP_SHELL_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };

  try {
    const response = await wrapper.fetch(
      new Request("https://clientsurgesystems.com/", {
        headers: { accept: "text/html" },
      })
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(HOMEPAGE_REPAIR_HEADER), "2026-06-30T23-58Z");
    assert.equal(response.headers.get(ROUTE_EXPOSURE_SANITIZED_HEADER), "homepage-repaired");
    assert.match(body, /ClientSurge Systems \| AI Automation for Local Businesses/);
    assert.match(body, /Capture\. Follow Up\. Book\./);
    assert.match(body, /Compare Packages/);
    assert.doesNotMatch(body, /<h2>Pages<\/h2>/);
    assert.doesNotMatch(body, /Admin Dashboard/);
    assert.doesNotMatch(body, /ClientSurge Systems manages 5 data types/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare wrapper falls back public route cache misses to the app shell", async () => {
  const previousFetch = globalThis.fetch;
  const originCalls = [];

  globalThis.fetch = async (input) => {
    const target = new URL(typeof input === "string" ? input : input.url);
    originCalls.push(target.pathname);

    if (target.hostname !== "grinning-apex-flow-growth.base44.app") {
      throw new Error(`Unexpected host: ${target.hostname}`);
    }

    if (target.pathname === "/store") {
      return new Response("Cache miss", {
        status: 500,
        statusText: "Cache miss",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (target.pathname === "/") {
      return new Response(ROOT_APP_SHELL_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    throw new Error(`Unexpected origin path: ${target.pathname}`);
  };

  try {
    const response = await wrapper.fetch(
      new Request("https://clientsurgesystems.com/store", {
        headers: { accept: "text/html" },
      })
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get(APP_SHELL_FALLBACK_HEADER) || "", /from=\/store/);
    assert.equal(response.headers.get(ROUTE_EXPOSURE_SANITIZED_HEADER), "removed");
    assert.deepEqual(originCalls, ["/store", "/"]);
    assert.match(body, /AI Automation Store \| ClientSurge Systems/);
    assert.match(body, /<link rel="canonical" href="https:\/\/clientsurgesystems\.com\/store" \/>/);
    assert.match(body, /Capture\. Follow Up\. Book\./);
    assert.doesNotMatch(body, /Cache miss/);
    assert.doesNotMatch(body, /Admin Dashboard/);
    assert.doesNotMatch(body, /ClientSurge Systems manages 5 data types/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare wrapper does not bypass private-route blocking", async () => {
  const response = await wrapper.fetch(
    new Request("https://clientsurgesystems.com/admin", {
      headers: { accept: "text/html" },
    })
  );
  const body = await response.text();

  assert.equal(response.status, 403);
  assert.equal(response.headers.get(APP_SHELL_FALLBACK_HEADER), null);
  assert.equal(response.headers.get(HOMEPAGE_REPAIR_HEADER), null);
  assert.match(body, /Login required/);
});
