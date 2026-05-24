import test from "node:test";
import assert from "node:assert/strict";

import {
  decorateHeaders,
  handleRequest,
  isSensitivePath,
  SECURITY_HEADERS,
} from "../edge/clientsurge-security-headers-worker.mjs";

test("edge security worker marks private SPA routes as noindex and no-store", () => {
  for (const path of ["/admin/", "/client-portal", "/onboarding", "/setup/preview/security-check", "/motion-lab"]) {
    assert.equal(isSensitivePath(path), true, `${path} should be sensitive`);
    const headers = decorateHeaders(new Headers(), path);

    assert.equal(headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive");
    assert.equal(headers.get("Cache-Control"), "no-store");
  }
});

test("edge security worker injects required public hardening headers", () => {
  const headers = decorateHeaders(new Headers(), "/");

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    assert.equal(headers.get(name), value);
  }

  assert.equal(headers.has("X-Robots-Tag"), false);
  assert.equal(headers.has("Cache-Control"), false);
});

test("edge security worker redirects www requests to canonical apex", async () => {
  const response = await handleRequest(new Request("https://www.clientsurgesystems.com/store?package=growth"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://clientsurgesystems.com/store?package=growth");
});

test("edge security worker decorates origin responses without changing status", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("ok", {
    status: 202,
    headers: {
      "Content-Type": "text/plain",
    },
  });

  try {
    const response = await handleRequest(new Request("https://clientsurgesystems.com/client-portal"));

    assert.equal(response.status, 202);
    assert.equal(await response.text(), "ok");
    assert.equal(response.headers.get("Content-Type"), "text/plain");
    assert.equal(response.headers.get("Content-Security-Policy"), SECURITY_HEADERS["Content-Security-Policy"]);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
