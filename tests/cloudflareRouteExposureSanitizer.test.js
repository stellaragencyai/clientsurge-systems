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
    <p>ClientSurge Systems manages 5 data types including launch gates. Helps you organize, track, and share your work in 1 place for teams and solo users.</p>
    <h2>Pages</h2>
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/automations">Automations</a></li>
      <li><a href="/admin/AIStatusDashboard">Admin / AI Status Dashboard</a></li>
      <li><a href="/admin/runbook">Admin / System Runbook</a></li>
      <li><a href="/admin/task-status">Admin / Task Status Dashboard</a></li>
      <li><a href="/admin/conversion-insights">Admin / Conversion Insights</a></li>
    </ul>
    <nav><a href="/pricing">Packages</a><a href="/automations">Automations</a><a href="/contact">Contact</a></nav>
    <section><p>Automate Your Lead Flow</p><h1>Capture. Follow Up. Book.</h1></section>
  </main>
</body></html>`;

function stripInjectedEdgeGuard(html = "") {
  return String(html).replace(
    new RegExp(`<script id="${ROUTE_EXPOSURE_GUARD_SCRIPT_ID}">[\\s\\S]*?<\\/script>`, "gi"),
    "",
  );
}

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

test("edge route exposure sanitizer removes current live Pages directory shape and preserves marketing content", () => {
  const sanitized = sanitizeGeneratedPagesDirectoryHtml(currentLivePagesDirectoryHtml);

  assert.doesNotMatch(sanitized, />Pages</i);
  assert.doesNotMatch(sanitized, /Admin \/ AI Status Dashboard|Admin \/ System Runbook|href="\/admin/i);
  assert.doesNotMatch(sanitized, /ClientSurge Systems manages 5 data types/i);
  assert.match(sanitized, /Automate Your Lead Flow/);
  assert.match(sanitized, /Capture\. Follow Up\. Book\./);
  assert.match(sanitized, /href="\/pricing"/);
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
    const publicBody = stripInjectedEdgeGuard(body);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(ROUTE_EXPOSURE_SANITIZED_HEADER), "removed");
    assert.match(body, new RegExp(ROUTE_EXPOSURE_GUARD_SCRIPT_ID));
    assert.doesNotMatch(publicBody, />Pages</i);
    assert.doesNotMatch(publicBody, /Admin Dashboard|Business Setup|Client Portal|System Observability/i);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare wrapper sanitizes current live directory fixture and keeps homepage body", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(currentLivePagesDirectoryHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  try {
    const response = await worker.fetch(new Request("https://clientsurgesystems.com/"));
    const body = await response.text();
    const publicBody = stripInjectedEdgeGuard(body);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(ROUTE_EXPOSURE_SANITIZED_HEADER), "removed");
    assert.doesNotMatch(publicBody, />Pages</i);
    assert.doesNotMatch(publicBody, /Admin \/ AI Status Dashboard|href="\/admin/i);
    assert.match(publicBody, /Capture\. Follow Up\. Book\./);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
