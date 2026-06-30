import test from "node:test";
import assert from "node:assert/strict";

import worker, {
  injectEdgeRouteExposureGuard,
  looksLikeRouteExposureHtml,
  ROUTE_EXPOSURE_GUARD_SCRIPT_ID,
  ROUTE_EXPOSURE_SANITIZED_HEADER,
  sanitizeGeneratedPagesDirectoryHtml,
} from "../cloudflare/clientsurge-security-edge-wrapper.mjs";

const stalePagesDirectoryHtml = `<!doctype html>
<html><head><title>ClientSurge Systems</title></head><body>
  <main>
    <h1>ClientSurge Systems</h1>
    <p>ClientSurge Systems manages 5 data types including launch gates.</p>
    <h2>Pages</h2>
    <ul>
      <li><a href="/admin">Admin Dashboard</a></li>
      <li><a href="/setup">Business Setup</a></li>
      <li><a href="/client-portal">Client Portal</a></li>
      <li><a href="/admin/system-observability">System Observability</a></li>
    </ul>
  </main>
</body></html>`;

const currentLivePagesDirectoryHtml = `<!doctype html>
<html><head><title>ClientSurge Systems</title></head><body>
  <main>
    <h1>ClientSurge Systems</h1>
    <p>Premium AI-driven automation systems built to increase bookings.</p>
    <h2>Pages</h2>
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/automations">Automations</a></li>
      <li><a href="/admin">Admin / AI Status Dashboard</a></li>
    </ul>
    <section><h1>AI Automation Systems That Help Local Businesses</h1></section>
  </main>
</body></html>`;

test("edge route exposure detector recognizes generated Pages directory HTML", () => {
  assert.equal(looksLikeRouteExposureHtml(stalePagesDirectoryHtml), true);
  assert.equal(looksLikeRouteExposureHtml(currentLivePagesDirectoryHtml), true);
  assert.equal(looksLikeRouteExposureHtml("<main><h1>ClientSurge Systems</h1><p>Real homepage</p></main>"), false);
});

test("edge route exposure sanitizer removes generated Pages directory from raw HTML", () => {
  const sanitized = sanitizeGeneratedPagesDirectoryHtml(stalePagesDirectoryHtml);

  assert.doesNotMatch(sanitized, />Pages</i);
  assert.doesNotMatch(sanitized, /Admin Dashboard|Business Setup|Client Portal|System Observability/i);
  assert.doesNotMatch(sanitized, /href="\/(admin|setup|client-portal)/i);
});

test("edge route exposure sanitizer removes current live Pages directory shape", () => {
  const sanitized = sanitizeGeneratedPagesDirectoryHtml(currentLivePagesDirectoryHtml);

  assert.doesNotMatch(sanitized, />Pages</i);
  assert.doesNotMatch(sanitized, /Admin \/ AI Status Dashboard|href="\/admin/i);
  assert.match(sanitized, /AI Automation Systems That Help Local Businesses/);
});

test("edge route exposure guard injection is idempotent", () => {
  const injected = injectEdgeRouteExposureGuard("<html><body><main>ok</main></body></html>");
  assert.match(injected, new RegExp(ROUTE_EXPOSURE_GUARD_SCRIPT_ID));
  assert.equal(injectEdgeRouteExposureGuard(injected), injected);
});

test("Cloudflare wrapper sanitizes stale origin HTML and adds proof header", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(stalePagesDirectoryHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  try {
    const response = await worker.fetch(new Request("https://clientsurgesystems.com/"));
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(ROUTE_EXPOSURE_SANITIZED_HEADER), "removed");
    assert.match(body, new RegExp(ROUTE_EXPOSURE_GUARD_SCRIPT_ID));
    assert.doesNotMatch(body, />Pages</i);
    assert.doesNotMatch(body, /Admin Dashboard|Business Setup|Client Portal|System Observability/i);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
