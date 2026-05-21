#!/usr/bin/env node

import { createServer } from "node:http";

const selfTest =
  process.env.CLIENTSURGE_LOAD_TEST_SELF_TEST === "1" ||
  process.argv.includes("--self-test");
let targetUrl = process.env.CLIENTSURGE_LEAD_TEST_URL;
const concurrency = Number.parseInt(process.env.CLIENTSURGE_LOAD_TEST_CONCURRENCY || "50", 10);
const timeoutMs = Number.parseInt(process.env.CLIENTSURGE_LOAD_TEST_TIMEOUT_MS || "15000", 10);
let selfTestServer = null;

async function startSelfTestServer() {
  const server = createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "method_not_allowed" }));
      return;
    }

    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    try {
      const payload = JSON.parse(body || "{}");
      if (!payload.full_name || !payload.email || !payload.consent_given) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_payload" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, id: `self-test-${Date.now()}` }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid_json" }));
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    server,
    url: `http://127.0.0.1:${port}/api/functions/submitLeadCapture`,
  };
}

if (!targetUrl && selfTest) {
  const started = await startSelfTestServer();
  selfTestServer = started.server;
  targetUrl = started.url;
}

if (!targetUrl) {
  console.error("Set CLIENTSURGE_LEAD_TEST_URL to a local/staging submitLeadCapture endpoint before running.");
  console.error("For a no-network loopback check, set CLIENTSURGE_LOAD_TEST_SELF_TEST=1.");
  process.exit(1);
}

if (!/^https?:\/\/(localhost|127\.0\.0\.1|.*\.test|.*\.local|.*staging.*)/i.test(targetUrl)) {
  console.error("Refusing to load test a production-looking URL. Use local, .test, .local, or staging endpoint.");
  process.exit(1);
}

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index];
}

async function submitLead(index) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `127.0.0.${(index % 200) + 1}`,
      },
      body: JSON.stringify({
        full_name: `Load Test ${index}`,
        business_name: `Load Test Business ${index}`,
        email: `load-test-${Date.now()}-${index}@example.test`,
        phone: `+1555000${String(index).padStart(4, "0")}`,
        business_type: "qa",
        source: "load_test_harness",
        source_page: "local_load_test",
        consent_given: true,
        consent_source: "load_test_harness",
      }),
    });
    const elapsedMs = performance.now() - started;
    return { ok: response.ok, status: response.status, elapsedMs };
  } catch (error) {
    const elapsedMs = performance.now() - started;
    return { ok: false, status: error.name === "AbortError" ? "timeout" : "error", elapsedMs };
  } finally {
    clearTimeout(timer);
  }
}

const started = performance.now();
const results = await Promise.all(Array.from({ length: concurrency }, (_, index) => submitLead(index + 1)));
const totalMs = performance.now() - started;
const durations = results.map((result) => result.elapsedMs);
const failures = results.filter((result) => !result.ok);
const statusCounts = results.reduce((counts, result) => {
  counts[result.status] = (counts[result.status] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  target: targetUrl,
  self_test: selfTest,
  concurrency,
  total_ms: Math.round(totalMs),
  success_count: results.length - failures.length,
  failure_count: failures.length,
  status_counts: statusCounts,
  latency_ms: {
    min: Math.round(Math.min(...durations)),
    p50: Math.round(percentile(durations, 50)),
    p95: Math.round(percentile(durations, 95)),
    max: Math.round(Math.max(...durations)),
  },
}, null, 2));

if (selfTestServer) {
  await new Promise((resolve) => selfTestServer.close(resolve));
}

process.exitCode = failures.length === 0 ? 0 : 1;
