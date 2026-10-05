import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import worker, {
  EVENT_PATH,
  TELEGRAM_EDGE_HEADER,
  TELEGRAM_TRACKER_SCRIPT_ID,
  TRACKER_PATH,
} from "../cloudflare/clientsurge-security-telegram-wrapper.mjs";

const env = {
  TELEGRAM_BOT_TOKEN: "test-token",
  TELEGRAM_CHAT_ID: "test-chat",
  ALLOWED_ORIGINS: "https://clientsurgesystems.com",
  VISITOR_ALERT_ENABLED: "true",
};

function withCf(request, cf = { country: "US", region: "Arizona" }) {
  Object.defineProperty(request, "cf", { value: cf });
  return request;
}

function validPayload(overrides = {}) {
  return {
    event: "website_click",
    eventName: "book_demo",
    label: "Book a Demo",
    targetUrl: "https://clientsurgesystems.com/book",
    pageUrl: "https://clientsurgesystems.com/",
    pageTitle: "ClientSurge Systems",
    referrer: "",
    utm: { utm_source: "codex", utm_campaign: "telegram_repair" },
    sessionId: "session_test",
    eventId: "evt_test_unique",
    timestamp: "2026-07-24T16:00:00.000Z",
    deviceCategory: "desktop",
    browserSummary: "Chrome on Windows",
    ...overrides,
  };
}

function trackingRequest(body, options = {}) {
  return withCf(new Request(`https://clientsurgesystems.com${EVENT_PATH}`, {
    method: options.method || "POST",
    headers: {
      Origin: options.origin || "https://clientsurgesystems.com",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 Chrome/126 Safari/537.36",
      ...(options.headers || {}),
    },
    body,
  }));
}

test("Cloudflare security deploy entrypoint includes the Telegram tracker wrapper", () => {
  const wranglerConfig = readFileSync(new URL("../wrangler.clientsurge-security.toml", import.meta.url), "utf8");
  const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");

  assert.match(wranglerConfig, /main\s*=\s*"cloudflare\/clientsurge-security-telegram-wrapper\.mjs"/);
  assert.match(packageJson, /"cloudflare:security:deploy": "npx wrangler deploy --config wrangler\.clientsurge-security\.toml"/);
});

test("public shell loads the same-origin session-aware tracker", () => {
  const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const fallbackTracker = readFileSync(new URL("../public/clientsurge-telegram-click-tracker.js", import.meta.url), "utf8");

  assert.match(indexHtml, /script\.src = "\/clientsurge-telegram-click-tracker\.js\?v=2026-07-27-session-v1"/);
  assert.doesNotMatch(indexHtml, /clientsurge-telegram-tracker\.nolanfstrommer\.workers\.dev/);
  assert.match(fallbackTracker, /\/api\/analytics\/v1\/session-event/);
  assert.match(fallbackTracker, /sendSessionEvent\("heartbeat"/);
  assert.match(fallbackTracker, /window\.__clientsurgeSessionDurationTracker = true/);
});

test("Cloudflare Telegram tracker serves same-origin sendBeacon script", async () => {
  const response = await worker.fetch(new Request(`https://clientsurgesystems.com${TRACKER_PATH}`, {
    headers: { Origin: "https://clientsurgesystems.com" },
  }), env, {});
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /application\/javascript/);
  assert.match(response.headers.get(TELEGRAM_EDGE_HEADER) || "", /script-2026-07-27/);
  assert.match(body, /navigator\.sendBeacon/);
  assert.match(body, /window\.location\.origin \+ "\/__cs_telegram_click"/);
  assert.match(body, /window\.location\.origin \+ "\/api\/analytics\/v1\/session-event"/);
  assert.match(body, /HEARTBEAT_INTERVAL/);
  assert.match(body, /visibilitychange/);
  assert.match(body, /pushState/);
  assert.match(body, /pagehide/);
  assert.match(body, /data-track-click/);
  assert.match(body, /website_click/);
  assert.match(body, /sendSessionEvent\("heartbeat"/);
  assert.doesNotMatch(body, /workers\.dev/);
});

test("Cloudflare Telegram wrapper injects tracker into HTML after production-safe entry", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("<!doctype html><html><head><title>ClientSurge</title></head><body><div id=\"root\"></div></body></html>", {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  try {
    const response = await worker.fetch(new Request("https://clientsurgesystems.com/"), env, {});
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get(TELEGRAM_EDGE_HEADER) || "", /injected-2026-07-27/);
    assert.match(body, new RegExp(`id="${TELEGRAM_TRACKER_SCRIPT_ID}"`));
    assert.match(body, new RegExp(TRACKER_PATH));
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare Telegram event sends one redacted production alert", async () => {
  const previousFetch = globalThis.fetch;
  const telegramCalls = [];
  globalThis.fetch = async (url, options = {}) => {
    telegramCalls.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json({ ok: true, result: { message_id: 123 } });
  };

  try {
    const request = trackingRequest(JSON.stringify(validPayload({ eventId: "evt_redacted_1" })));
    request.headers.set("CF-Connecting-IP", "203.0.113.10");
    const response = await worker.fetch(request, env, {});
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(TELEGRAM_EDGE_HEADER), "sent");
    assert.equal(body.ok, true);
    assert.equal(body.eventId, "evt_redacted_1");
    assert.equal(telegramCalls.length, 1);
    assert.match(telegramCalls[0].url, /api\.telegram\.org\/bottest-token\/sendMessage/);
    assert.equal(telegramCalls[0].body.chat_id, "test-chat");
    assert.match(telegramCalls[0].body.text, /Environment: PRODUCTION/);
    assert.match(telegramCalls[0].body.text, /Clicked: Book a Demo/);
    assert.match(telegramCalls[0].body.text, /Country\/Region: US \/ Arizona/);
    assert.doesNotMatch(telegramCalls[0].body.text, /203\.0\.113\.10/);
    assert.doesNotMatch(telegramCalls[0].body.text, /test-token/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare Telegram event deduplicates repeated event ids", async () => {
  const previousFetch = globalThis.fetch;
  let telegramCount = 0;
  globalThis.fetch = async () => {
    telegramCount += 1;
    return Response.json({ ok: true });
  };

  try {
    const body = JSON.stringify(validPayload({ eventId: "evt_duplicate_1" }));
    const first = await worker.fetch(trackingRequest(body), env, {});
    const second = await worker.fetch(trackingRequest(body), env, {});

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.headers.get(TELEGRAM_EDGE_HEADER), "duplicate");
    assert.equal((await second.json()).duplicate, true);
    assert.equal(telegramCount, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare Telegram event rejects invalid origins and malformed payloads", async () => {
  const invalidOrigin = await worker.fetch(
    trackingRequest(JSON.stringify(validPayload({ eventId: "evt_invalid_origin" })), {
      origin: "https://example.com",
    }),
    env,
    {},
  );
  assert.equal(invalidOrigin.status, 403);
  assert.equal(invalidOrigin.headers.get(TELEGRAM_EDGE_HEADER), "invalid-origin");

  const malformed = await worker.fetch(trackingRequest("{bad json"), env, {});
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error, "malformed_json");

  const meaningless = await worker.fetch(trackingRequest(JSON.stringify(validPayload({
    eventId: "evt_not_qualified",
    eventName: "general_click",
  }))), env, {});
  assert.equal(meaningless.status, 400);
  assert.equal((await meaningless.json()).error, "invalid_payload");
});

test("Cloudflare Telegram event enforces payload size limit", async () => {
  const tooLarge = JSON.stringify(validPayload({
    eventId: "evt_large_payload",
    label: "x".repeat(9000),
  }));
  const response = await worker.fetch(trackingRequest(tooLarge), env, {});
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, "payload_too_large");
});
