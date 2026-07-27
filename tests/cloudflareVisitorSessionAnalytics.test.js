import test from "node:test";
import assert from "node:assert/strict";

import {
  ENGAGEMENT_LEVELS,
  SESSION_ANALYTICS_HEADER,
  buildSessionArrivalMessage,
  buildSessionCompletionMessage,
  classifyEngagement,
  finalizeInactiveSessions,
  formatDuration,
  handleSessionEvent,
  isBounceSession,
} from "../cloudflare/visitor-session-analytics.mjs";

const baseEnv = {
  TELEGRAM_BOT_TOKEN: "test-token",
  TELEGRAM_CHAT_ID: "test-chat",
  ALLOWED_ORIGINS: "https://clientsurgesystems.com",
  VISITOR_ALERT_ENABLED: "true",
};

class FakeD1 {
  constructor() {
    this.sessions = new Map();
    this.pageviews = new Map();
    this.events = new Map();
  }

  prepare(sql) {
    return {
      bind: (...values) => ({
        run: async () => this.run(sql, values),
        first: async () => this.first(sql, values),
        all: async () => ({ results: await this.all(sql, values) }),
      }),
    };
  }

  pageKey(sessionId, pageInstanceId) {
    return `${sessionId}|${pageInstanceId}`;
  }

  clone(value) {
    return value ? JSON.parse(JSON.stringify(value)) : null;
  }

  async run(sql, values) {
    if (sql.includes("INSERT OR IGNORE INTO analytics_events")) {
      const [event_id, session_id, page_instance_id, event_type, received_at] = values;
      if (this.events.has(event_id)) return { meta: { changes: 0 } };
      this.events.set(event_id, { event_id, session_id, page_instance_id, event_type, received_at });
      return { meta: { changes: 1 } };
    }

    if (sql.includes("INSERT OR IGNORE INTO visitor_sessions")) {
      const [
        session_id,
        visitor_id,
        first_seen_at,
        last_seen_at,
        landing_url,
        landing_path,
        current_url,
        current_path,
        referrer,
        page_title,
        last_event_type,
        engagement_level,
        country,
        city,
        region,
        postal_code,
        timezone,
        network,
        asn,
        ip_address,
        browser,
        operating_system,
        device_type,
        screen_resolution,
        language,
        user_agent,
        created_at,
        updated_at,
      ] = values;
      if (this.sessions.has(session_id)) return { meta: { changes: 0 } };
      this.sessions.set(session_id, {
        session_id,
        visitor_id,
        first_seen_at,
        last_seen_at,
        completed_at: null,
        landing_url,
        landing_path,
        current_url,
        current_path,
        exit_url: null,
        exit_path: null,
        referrer,
        page_title,
        page_count: 1,
        elapsed_ms: 0,
        visible_ms: 0,
        engaged_ms: 0,
        last_event_type,
        status: "active",
        completion_reason: null,
        is_bounce: 1,
        engagement_level,
        telegram_chat_id: null,
        telegram_start_message_id: null,
        telegram_completion_sent: 0,
        conversion_count: 0,
        country,
        city,
        region,
        postal_code,
        timezone,
        network,
        asn,
        ip_address,
        browser,
        operating_system,
        device_type,
        screen_resolution,
        language,
        user_agent,
        created_at,
        updated_at,
      });
      return { meta: { changes: 1 } };
    }

    if (sql.includes("INSERT OR IGNORE INTO visitor_pageviews")) {
      const [
        session_id,
        visitor_id,
        page_instance_id,
        url,
        path,
        page_title,
        referrer,
        entered_at,
        last_seen_at,
        created_at,
        updated_at,
      ] = values;
      const key = this.pageKey(session_id, page_instance_id);
      if (this.pageviews.has(key)) return { meta: { changes: 0 } };
      this.pageviews.set(key, {
        session_id,
        visitor_id,
        page_instance_id,
        url,
        path,
        page_title,
        referrer,
        entered_at,
        last_seen_at,
        exited_at: null,
        elapsed_ms: 0,
        visible_ms: 0,
        engaged_ms: 0,
        exit_reason: null,
        created_at,
        updated_at,
      });
      return { meta: { changes: 1 } };
    }

    if (sql.includes("UPDATE visitor_sessions SET page_count = page_count + 1")) {
      const [updated_at, session_id] = values;
      const session = this.sessions.get(session_id);
      if (!session || session.status !== "active") return { meta: { changes: 0 } };
      session.page_count += 1;
      session.updated_at = updated_at;
      return { meta: { changes: 1 } };
    }

    if (sql.includes("UPDATE visitor_pageviews")) {
      const [
        last_seen_at,
        should_exit,
        exited_at,
        elapsed_ms,
        visible_ms,
        engaged_ms,
        should_set_reason,
        exit_reason,
        updated_at,
        session_id,
        page_instance_id,
      ] = values;
      const page = this.pageviews.get(this.pageKey(session_id, page_instance_id));
      if (!page) return { meta: { changes: 0 } };
      page.last_seen_at = Math.max(page.last_seen_at, last_seen_at);
      if (should_exit && !page.exited_at) page.exited_at = exited_at;
      page.elapsed_ms = Math.max(page.elapsed_ms, elapsed_ms);
      page.visible_ms = Math.max(page.visible_ms, visible_ms);
      page.engaged_ms = Math.max(page.engaged_ms, engaged_ms);
      if (should_set_reason && !page.exit_reason) page.exit_reason = exit_reason;
      page.updated_at = updated_at;
      return { meta: { changes: 1 } };
    }

    if (sql.includes("current_url = ?")) {
      const [
        last_seen_at,
        current_url,
        current_path,
        page_title,
        page_count,
        elapsed_ms,
        visible_ms,
        engaged_ms,
        last_event_type,
        is_bounce,
        engagement_level,
        device_type,
        screen_resolution,
        language,
        updated_at,
        session_id,
      ] = values;
      const session = this.sessions.get(session_id);
      if (!session || session.status !== "active") return { meta: { changes: 0 } };
      Object.assign(session, {
        last_seen_at: Math.max(session.last_seen_at, last_seen_at),
        current_url,
        current_path,
        page_title,
        page_count,
        elapsed_ms,
        visible_ms,
        engaged_ms,
        last_event_type,
        is_bounce,
        engagement_level,
        device_type: device_type || session.device_type,
        screen_resolution: screen_resolution || session.screen_resolution,
        language: language || session.language,
        updated_at,
      });
      return { meta: { changes: 1 } };
    }

    if (sql.includes("conversion_count = conversion_count + 1")) {
      const [last_event_type, updated_at, session_id] = values;
      const session = this.sessions.get(session_id);
      if (!session || session.status !== "active") return { meta: { changes: 0 } };
      session.conversion_count += 1;
      session.is_bounce = 0;
      session.last_event_type = last_event_type;
      session.updated_at = updated_at;
      return { meta: { changes: 1 } };
    }

    if (sql.includes("telegram_chat_id = ?")) {
      const [telegram_chat_id, telegram_start_message_id, updated_at, session_id] = values;
      const session = this.sessions.get(session_id);
      if (!session) return { meta: { changes: 0 } };
      session.telegram_chat_id = telegram_chat_id;
      session.telegram_start_message_id = telegram_start_message_id;
      session.updated_at = updated_at;
      return { meta: { changes: 1 } };
    }

    if (sql.includes("status = 'completed'")) {
      const [
        completed_at,
        last_seen_at,
        elapsed_ms,
        exit_url,
        exit_path,
        completion_reason,
        is_bounce,
        engagement_level,
        updated_at,
        session_id,
      ] = values;
      const session = this.sessions.get(session_id);
      if (!session || session.status !== "active") return { meta: { changes: 0 } };
      Object.assign(session, {
        status: "completed",
        completed_at,
        last_seen_at: Math.max(session.last_seen_at, last_seen_at),
        elapsed_ms: Math.max(session.elapsed_ms, elapsed_ms),
        exit_url,
        exit_path,
        completion_reason,
        is_bounce,
        engagement_level,
        updated_at,
      });
      return { meta: { changes: 1 } };
    }

    if (sql.includes("telegram_completion_sent = 1")) {
      const [updated_at, session_id] = values;
      const session = this.sessions.get(session_id);
      if (!session) return { meta: { changes: 0 } };
      session.telegram_completion_sent = 1;
      session.updated_at = updated_at;
      return { meta: { changes: 1 } };
    }

    throw new Error(`Unhandled fake D1 run: ${sql}`);
  }

  async first(sql, values) {
    if (sql.includes("SELECT * FROM visitor_sessions WHERE session_id = ?")) {
      return this.clone(this.sessions.get(values[0]));
    }
    if (sql.includes("SELECT * FROM visitor_pageviews WHERE session_id = ? AND page_instance_id = ?")) {
      return this.clone(this.pageviews.get(this.pageKey(values[0], values[1])));
    }
    if (sql.includes("COUNT(*) AS page_count")) {
      const sessionId = values[0];
      const pages = [...this.pageviews.values()].filter((page) => page.session_id === sessionId);
      return {
        page_count: pages.length,
        visible_ms: pages.reduce((sum, page) => sum + page.visible_ms, 0),
        engaged_ms: pages.reduce((sum, page) => sum + page.engaged_ms, 0),
      };
    }
    throw new Error(`Unhandled fake D1 first: ${sql}`);
  }

  async all(sql, values) {
    if (sql.includes("SELECT * FROM visitor_sessions WHERE status = 'active'")) {
      const [cutoff, limit] = values;
      return [...this.sessions.values()]
        .filter((session) => session.status === "active" && session.last_seen_at <= cutoff)
        .sort((a, b) => a.last_seen_at - b.last_seen_at)
        .slice(0, limit)
        .map((session) => this.clone(session));
    }
    throw new Error(`Unhandled fake D1 all: ${sql}`);
  }
}

function withCf(request, cf = {}) {
  Object.defineProperty(request, "cf", {
    value: {
      country: "US",
      city: "Phoenix",
      region: "Arizona",
      postalCode: "85001",
      timezone: "America/Phoenix",
      asOrganization: "Example ISP",
      asn: 64512,
      ...cf,
    },
  });
  return request;
}

function sessionPayload(overrides = {}) {
  return {
    event_type: "session_start",
    event_id: `evt_${Math.random().toString(16).slice(2)}`,
    session_id: "session_test",
    visitor_id: "visitor_test",
    page_instance_id: "page_home",
    url: "https://clientsurgesystems.com/?utm_source=codex",
    path: "/?utm_source=codex",
    page_title: "ClientSurge Systems",
    referrer: "",
    landing_url: "https://clientsurgesystems.com/?utm_source=codex",
    landing_path: "/?utm_source=codex",
    language: "en-US",
    screen_resolution: "1440x900",
    device_type: "desktop",
    client_sent_at: Date.now(),
    page_elapsed_ms: 0,
    page_visible_ms: 0,
    page_engaged_ms: 0,
    session_elapsed_ms: 0,
    ...overrides,
  };
}

function sessionRequest(payload, options = {}) {
  return withCf(new Request("https://clientsurgesystems.com/api/analytics/v1/session-event", {
    method: options.method || "POST",
    headers: {
      Origin: options.origin || "https://clientsurgesystems.com",
      "Content-Type": options.contentType || "application/json",
      "User-Agent": options.userAgent || "Mozilla/5.0 Chrome/126 Safari/537.36",
      "CF-Connecting-IP": options.ip || "203.0.113.10",
      ...(options.headers || {}),
    },
    body: options.rawBody ?? JSON.stringify(payload),
  }), options.cf);
}

async function withNow(value, callback) {
  const previous = Date.now;
  Date.now = () => value;
  try {
    return await callback({
      advance(ms) {
        value += ms;
      },
      now() {
        return value;
      },
    });
  } finally {
    Date.now = previous;
  }
}

test("visitor session event creates D1 rows and sends arrival Telegram without visit-time finality", async () => {
  const db = new FakeD1();
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json({ ok: true, result: { message_id: 101 } });
  };

  try {
    await withNow(100_000, async () => {
      const response = await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_start_1" })), {
        ...baseEnv,
        ANALYTICS_DB: db,
      }, "corr_start");
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(response.headers.get(SESSION_ANALYTICS_HEADER), "started");
      assert.equal(body.ok, true);
      assert.equal(body.arrivalTelegram, true);
      assert.equal(db.sessions.get("session_test").status, "active");
      assert.equal(db.pageviews.get("session_test|page_home").path, "/?utm_source=codex");
      assert.equal(calls.length, 1);
      assert.match(calls[0].body.text, /📍 VISIT DETAILS/);
      assert.match(calls[0].body.text, /Arrived at:/);
      assert.match(calls[0].body.text, /Session duration: Pending/);
      assert.doesNotMatch(calls[0].body.text, /Visit time:/);
      assert.doesNotMatch(calls[0].body.text, /test-token/);
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("heartbeat updates durations monotonically and duplicate event ids do not mutate rows", async () => {
  const db = new FakeD1();
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: true, result: { message_id: 102 } });

  try {
    await withNow(200_000, async (clock) => {
      const env = { ...baseEnv, ANALYTICS_DB: db };
      await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_start_2" })), env, "corr_start");

      clock.advance(15_000);
      await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "heartbeat",
        event_id: "evt_heartbeat_1",
        page_elapsed_ms: 15_000,
        page_visible_ms: 15_000,
        page_engaged_ms: 12_000,
      })), env, "corr_heartbeat");

      const afterHeartbeat = db.sessions.get("session_test");
      assert.equal(afterHeartbeat.visible_ms, 15_000);
      assert.equal(afterHeartbeat.engaged_ms, 12_000);
      assert.equal(afterHeartbeat.is_bounce, 0);

      clock.advance(2_000);
      const duplicate = await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "heartbeat",
        event_id: "evt_heartbeat_1",
        page_elapsed_ms: 1_000,
        page_visible_ms: 1_000,
        page_engaged_ms: 1_000,
      })), env, "corr_duplicate");

      assert.equal(duplicate.headers.get(SESSION_ANALYTICS_HEADER), "duplicate");
      assert.equal(db.sessions.get("session_test").visible_ms, 15_000);
      assert.equal(db.sessions.get("session_test").engaged_ms, 12_000);
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("route changes increment page count and conversion prevents bounce classification", async () => {
  const db = new FakeD1();
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: true, result: { message_id: 103 } });

  try {
    await withNow(300_000, async (clock) => {
      const env = { ...baseEnv, ANALYTICS_DB: db };
      await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_start_3" })), env, "corr_start");

      clock.advance(5_000);
      await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "route_change",
        event_id: "evt_route_1",
        page_elapsed_ms: 5_000,
        page_visible_ms: 5_000,
        page_engaged_ms: 2_000,
        exit_reason: "navigation_completed",
      })), env, "corr_route");

      clock.advance(1_000);
      await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "page_start",
        event_id: "evt_page_2",
        page_instance_id: "page_pricing",
        url: "https://clientsurgesystems.com/pricing",
        path: "/pricing",
        page_elapsed_ms: 0,
        page_visible_ms: 0,
        page_engaged_ms: 0,
      })), env, "corr_page");

      await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "conversion",
        event_id: "evt_conversion_1",
        page_instance_id: "page_pricing",
        url: "https://clientsurgesystems.com/pricing",
        path: "/pricing",
        conversion_type: "book_demo",
      })), env, "corr_conversion");

      const session = db.sessions.get("session_test");
      assert.equal(session.page_count, 2);
      assert.equal(session.conversion_count, 1);
      assert.equal(session.is_bounce, 0);
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("session end finalizes once and edits the original Telegram message", async () => {
  const db = new FakeD1();
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json({ ok: true, result: { message_id: 104 } });
  };

  try {
    await withNow(400_000, async (clock) => {
      const env = { ...baseEnv, ANALYTICS_DB: db };
      await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_start_4" })), env, "corr_start");
      clock.advance(20_000);
      const response = await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "session_end",
        event_id: "evt_end_1",
        page_elapsed_ms: 20_000,
        page_visible_ms: 18_000,
        page_engaged_ms: 14_000,
        exit_reason: "explicit_exit",
        is_final: true,
      })), env, "corr_end");

      assert.equal(response.headers.get(SESSION_ANALYTICS_HEADER), "completed");
      assert.equal(db.sessions.get("session_test").status, "completed");
      assert.equal(db.sessions.get("session_test").telegram_completion_sent, 1);
      assert.equal(calls.length, 2);
      assert.match(calls[1].url, /editMessageText/);
      assert.match(calls[1].body.text, /🏁 SESSION COMPLETED/);

      const stale = await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "heartbeat",
        event_id: "evt_after_completed",
      })), env, "corr_stale");
      const staleBody = await stale.json();
      assert.equal(staleBody.newSessionRequired, true);
      assert.equal(calls.length, 2);
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("completion falls back to sendMessage when Telegram edit fails", async () => {
  const db = new FakeD1();
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    if (String(url).includes("editMessageText")) {
      return Response.json({ ok: false, description: "message is not modified" }, { status: 400 });
    }
    return Response.json({ ok: true, result: { message_id: 105 } });
  };

  try {
    await withNow(500_000, async (clock) => {
      const env = { ...baseEnv, ANALYTICS_DB: db };
      await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_start_5" })), env, "corr_start");
      clock.advance(12_000);
      await handleSessionEvent(sessionRequest(sessionPayload({
        event_type: "page_exit",
        event_id: "evt_exit_5",
        page_elapsed_ms: 12_000,
        page_visible_ms: 12_000,
        page_engaged_ms: 10_000,
        exit_reason: "explicit_exit",
        is_final: true,
      })), env, "corr_exit");

      assert.equal(db.sessions.get("session_test").telegram_completion_sent, 1);
      assert.match(calls[1].url, /editMessageText/);
      assert.match(calls[2].url, /sendMessage/);
      assert.equal(calls[2].body.reply_to_message_id, "105");
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("inactive-session cron finalizes old active sessions without resending completion", async () => {
  const db = new FakeD1();
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json({ ok: true, result: { message_id: 106 } });
  };

  try {
    await withNow(600_000, async (clock) => {
      const env = { ...baseEnv, ANALYTICS_DB: db };
      await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_start_6" })), env, "corr_start");
      clock.advance(70_000);
      const first = await finalizeInactiveSessions(env, "cron_one", clock.now());
      const second = await finalizeInactiveSessions(env, "cron_two", clock.now() + 60_000);

      assert.equal(first.finalized, 1);
      assert.equal(second.finalized, 0);
      assert.equal(db.sessions.get("session_test").status, "completed");
      assert.equal(db.sessions.get("session_test").completion_reason, "inactivity_timeout");
      assert.equal(calls.length, 2);
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("session endpoint rejects unsafe inputs and gracefully reports database errors", async () => {
  const env = { ...baseEnv, ANALYTICS_DB: new FakeD1() };

  const invalidOrigin = await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_bad_origin" }), {
    origin: "https://example.com",
  }), env, "corr_origin");
  assert.equal(invalidOrigin.status, 403);

  const invalidType = await handleSessionEvent(sessionRequest(sessionPayload({
    event_id: "evt_bad_type",
    event_type: "screen_recording",
  })), env, "corr_type");
  assert.equal(invalidType.status, 400);

  const malformed = await handleSessionEvent(sessionRequest({}, {
    rawBody: "{bad json",
  }), env, "corr_json");
  assert.equal(malformed.status, 400);

  const tooLarge = await handleSessionEvent(sessionRequest({}, {
    rawBody: JSON.stringify({ value: "x".repeat(17 * 1024) }),
  }), env, "corr_large");
  assert.equal(tooLarge.status, 413);

  const bot = await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_bot" }), {
    userAgent: "curl/8.0",
  }), env, "corr_bot");
  assert.equal(bot.status, 200);
  assert.equal(bot.headers.get(SESSION_ANALYTICS_HEADER), "bot-ignored");

  const brokenDb = {
    prepare() {
      throw new Error("sqlite unavailable with secret test-token");
    },
  };
  const dbError = await handleSessionEvent(sessionRequest(sessionPayload({ event_id: "evt_db_error" })), {
    ...baseEnv,
    ANALYTICS_DB: brokenDb,
  }, "corr_db");
  assert.equal(dbError.status, 500);
  assert.equal((await dbError.json()).error, "database_error");
});

test("duration helpers and Telegram builders classify engagement without marking conversions as bounce", () => {
  assert.equal(formatDuration(59_000), "59s");
  assert.equal(formatDuration(90_000), "1m 30s");
  assert.equal(formatDuration(3_600_000), "1h");
  assert.equal(classifyEngagement(5_000), ENGAGEMENT_LEVELS.LIKELY_BOUNCE);
  assert.equal(classifyEngagement(45_000), ENGAGEMENT_LEVELS.INTERESTED);
  assert.equal(isBounceSession({ pageCount: 1, engagedMs: 5_000, conversionCount: 0 }), true);
  assert.equal(isBounceSession({ pageCount: 1, engagedMs: 5_000, conversionCount: 1 }), false);

  const session = {
    session_id: "session_safe",
    visitor_id: "visitor_safe",
    current_path: "/",
    current_url: "https://clientsurgesystems.com/",
    landing_url: "https://clientsurgesystems.com/",
    landing_path: "/",
    referrer: "",
    page_title: "ClientSurge\nSystems",
    country: "US",
    city: "Phoenix",
    region: "Arizona",
    postal_code: "85001",
    ip_address: "203.0.113.10",
    timezone: "America/Phoenix",
    network: "Example ISP",
    asn: "64512",
    browser: "Chrome",
    operating_system: "Windows",
    device_type: "desktop",
    screen_resolution: "1440x900",
    language: "en-US",
    page_count: 1,
    first_seen_at: 100_000,
    last_seen_at: 120_000,
    completed_at: 120_000,
    elapsed_ms: 20_000,
    visible_ms: 18_000,
    engaged_ms: 12_000,
    completion_reason: "explicit_exit",
    is_bounce: 0,
    engagement_level: ENGAGEMENT_LEVELS.BRIEF_VISIT,
    user_agent: "Mozilla/5.0",
  };

  assert.doesNotMatch(buildSessionArrivalMessage(session), /ClientSurge\nSystems/);
  assert.match(buildSessionCompletionMessage(session), /Elapsed time: 20s/);
});
