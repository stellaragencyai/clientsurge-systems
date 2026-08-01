import productionSafeEntry from "./clientsurge-production-safe-entry.mjs";
import {
  ACTIVE_ENGAGEMENT_WINDOW_MS,
  HEARTBEAT_INTERVAL_MS,
  SESSION_ANALYTICS_HEADER,
  SESSION_ANALYTICS_VERSION,
  SESSION_EVENT_PATH,
  SESSION_TIMEOUT_MS,
  finalizeInactiveSessions,
  handleSessionEvent,
} from "./visitor-session-analytics.mjs";

export const SITE_ORIGIN = "https://clientsurgesystems.com";
export const WWW_ORIGIN = "https://www.clientsurgesystems.com";
export const TRACKER_PATH = "/clientsurge-telegram-click-tracker.js";
export const EVENT_PATH = "/__cs_telegram_click";
export const DIAGNOSTIC_PATH = "/__cs_telegram_click/diagnostic";
export const TELEGRAM_TRACKER_SCRIPT_ID = "clientsurge-telegram-click-tracker";
export const TELEGRAM_EDGE_HEADER = "x-clientsurge-telegram-tracker";
export const TRACKING_VERSION = "2026-07-27-telegram-session-v1";

const DEFAULT_ALLOWED_ORIGINS = [SITE_ORIGIN, WWW_ORIGIN];
const MAX_PAYLOAD_BYTES = 8 * 1024;
const DEDUPE_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;
const DIAGNOSTIC_MESSAGE = "ClientSurge tracking diagnostic: Telegram connection successful.";

const QUALIFYING_EVENTS = new Set([
  "book_demo",
  "request_consultation",
  "start_setup",
  "select_pricing_plan",
  "open_checkout",
  "call_business",
  "send_email",
  "submit_lead_form",
]);

const dedupeCache = new Map();
const rateLimitCache = new Map();

function nowIso() {
  return new Date().toISOString();
}

function createCorrelationId() {
  if (globalThis.crypto?.randomUUID) return `cs_${globalThis.crypto.randomUUID()}`;
  return `cs_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function pruneMap(map, now = Date.now()) {
  for (const [key, value] of map.entries()) {
    if (value.expiresAt <= now) map.delete(key);
  }
}

function allowedOrigins(env) {
  const configured = String(env?.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function requestOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin) return origin;
  return new URL(request.url).origin;
}

function isAllowedOrigin(request, env) {
  return allowedOrigins(env).has(requestOrigin(request));
}

function corsHeaders(request, env, extra = {}) {
  const origin = requestOrigin(request);
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-ClientSurge-Tracking-Secret",
    "Access-Control-Max-Age": "600",
    [TELEGRAM_EDGE_HEADER]: TRACKING_VERSION,
    ...extra,
  });

  if (allowedOrigins(env).has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function jsonResponse(request, env, body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: corsHeaders(request, env, extraHeaders),
  });
}

function trackerScriptResponse(request, env) {
  const headers = new Headers({
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    [TELEGRAM_EDGE_HEADER]: `script-${TRACKING_VERSION}`,
    [SESSION_ANALYTICS_HEADER]: `script-${SESSION_ANALYTICS_VERSION}`,
  });
  const origin = requestOrigin(request);
  if (allowedOrigins(env).has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(TRACKER_JS, { status: 200, headers });
}

function safeString(value, fallback = "unknown", maxLength = 240) {
  const normalized = String(value ?? fallback)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (normalized || fallback).slice(0, maxLength);
}

function normalizeEventName(value) {
  return safeString(value, "", 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanUrl(value, fallback = "") {
  const raw = safeString(value, fallback, 900);
  if (!raw) return "";
  if (/^(tel:|mailto:)/i.test(raw)) return raw.slice(0, 300);
  try {
    const parsed = new URL(raw, SITE_ORIGIN);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.toString().slice(0, 900);
  } catch {
    return raw.slice(0, 300);
  }
}

function isClientSurgePageUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.origin === SITE_ORIGIN || parsed.origin === WWW_ORIGIN;
  } catch {
    return false;
  }
}

function normalizeUtm(utm = {}) {
  const result = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "msclkid"]) {
    if (utm?.[key]) result[key] = safeString(utm[key], "", 120);
  }
  return result;
}

function formatUtm(utm = {}) {
  const entries = Object.entries(normalizeUtm(utm));
  if (!entries.length) return "none";
  return entries.map(([key, value]) => `${key}=${value}`).join(" | ");
}

function browserSummaryFromUserAgent(userAgent = "") {
  const ua = String(userAgent || "");
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Safari\//i.test(ua) && !/Chrome\//i.test(ua)
          ? "Safari"
          : /Firefox\//i.test(ua)
            ? "Firefox"
            : "Unknown browser";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS X/i.test(ua)
      ? "macOS"
      : /iPhone|iPad|iPod/i.test(ua)
        ? "iOS"
        : /Android/i.test(ua)
          ? "Android"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${os}`;
}

function isLikelyBot(request) {
  const cf = request.cf || {};
  const ua = request.headers.get("User-Agent") || "";
  const botSignals = [
    /bot/i,
    /crawl/i,
    /crawler/i,
    /spider/i,
    /slurp/i,
    /ahrefs/i,
    /semrush/i,
    /gptbot/i,
    /claudebot/i,
    /facebookexternalhit/i,
    /linkedinbot/i,
    /bingpreview/i,
    /pingdom/i,
    /uptimerobot/i,
    /headlesschrome/i,
    /python-requests/i,
    /curl/i,
    /wget/i,
  ];

  return cf?.botManagement?.verifiedBot === true || botSignals.some((pattern) => pattern.test(ua));
}

function isTrackingEnabled(env) {
  const value = String(env?.VISITOR_ALERT_ENABLED ?? "true").toLowerCase();
  return !["0", "false", "off", "disabled", "no"].includes(value);
}

function isRateLimited(request) {
  const now = Date.now();
  pruneMap(rateLimitCache, now);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = rateLimitCache.get(ip) || { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };
  if (bucket.expiresAt <= now) {
    bucket.count = 0;
    bucket.expiresAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  rateLimitCache.set(ip, bucket);
  return bucket.count > RATE_LIMIT_MAX;
}

function alreadyProcessed(eventId) {
  const now = Date.now();
  pruneMap(dedupeCache, now);
  if (dedupeCache.has(eventId)) return true;
  dedupeCache.set(eventId, { expiresAt: now + DEDUPE_TTL_MS });
  return false;
}

function mapLegacyIntent(raw) {
  const intent = normalizeEventName(raw?.intent);
  const href = String(raw?.href || raw?.targetUrl || "").toLowerCase();
  const label = String(raw?.text || raw?.label || "").toLowerCase();
  const combined = `${intent} ${href} ${label}`;
  if (href.startsWith("tel:")) return "call_business";
  if (href.startsWith("mailto:")) return "send_email";
  if (/checkout|stripe|buy|purchase|package|plan/.test(combined)) return "open_checkout";
  if (/pricing|compare/.test(combined)) return "select_pricing_plan";
  if (/setup|start|get_started/.test(combined)) return "start_setup";
  if (/book|demo|audit/.test(combined)) return "book_demo";
  if (/contact|consult|quote|call/.test(combined)) return "request_consultation";
  return "";
}

function normalizeClickPayload(raw, request, correlationId) {
  const eventName = normalizeEventName(raw?.eventName || raw?.event_name || raw?.eventKey || mapLegacyIntent(raw));
  const event = safeString(raw?.event || (raw?.eventType === "click" ? "website_click" : ""), "", 80);
  const label = safeString(raw?.label || raw?.text, "", 180);
  const pageUrl = cleanUrl(raw?.pageUrl || raw?.page || "", "");
  const timestamp = safeString(raw?.timestamp || nowIso(), "", 80);
  const sessionId = safeString(raw?.sessionId, "", 120);
  const eventId = safeString(raw?.eventId || raw?.event_id || correlationId, "", 160);

  const errors = [];
  if (event !== "website_click") errors.push("event must be website_click");
  if (!eventName || !QUALIFYING_EVENTS.has(eventName)) errors.push("eventName is not a configured qualifying click");
  if (!label) errors.push("label is required");
  if (!pageUrl || !isClientSurgePageUrl(pageUrl)) errors.push("pageUrl must be a ClientSurge URL");
  if (!sessionId) errors.push("sessionId is required");
  if (!eventId) errors.push("eventId is required");
  if (Number.isNaN(Date.parse(timestamp))) errors.push("timestamp must be ISO-8601 compatible");

  if (errors.length) {
    return { ok: false, errors };
  }

  const userAgentSummary = browserSummaryFromUserAgent(request.headers.get("User-Agent") || "");
  return {
    ok: true,
    event: {
      event: "website_click",
      eventName,
      label,
      targetUrl: cleanUrl(raw?.targetUrl || raw?.href || "", ""),
      pageUrl,
      pageTitle: safeString(raw?.pageTitle, "unknown", 180),
      referrer: cleanUrl(raw?.referrer || "", "direct/unknown") || "direct/unknown",
      utm: normalizeUtm(raw?.utm),
      sessionId,
      eventId,
      timestamp,
      deviceCategory: safeString(raw?.deviceCategory || raw?.device, "unknown", 60),
      browserSummary: safeString(raw?.browserSummary || raw?.browser || userAgentSummary, userAgentSummary, 120),
      source: safeString(raw?.source || "edge_tracker", "edge_tracker", 80),
    },
  };
}

async function parseJsonPayload(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_PAYLOAD_BYTES) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }

  try {
    return { ok: true, data: JSON.parse(text || "{}") };
  } catch {
    return { ok: false, status: 400, error: "malformed_json" };
  }
}

function buildTelegramMessage(event, request, correlationId) {
  const cf = request.cf || {};
  return [
    "ClientSurge Website Click",
    "Environment: PRODUCTION",
    `Action: ${safeString(event.eventName)}`,
    `Clicked: ${safeString(event.label)}`,
    `Target: ${safeString(event.targetUrl || "none", "none", 500)}`,
    `Page URL: ${safeString(event.pageUrl, "unknown", 500)}`,
    `Page title: ${safeString(event.pageTitle, "unknown", 220)}`,
    `Timestamp: ${safeString(event.timestamp)}`,
    `Referrer: ${safeString(event.referrer || "direct/unknown", "direct/unknown", 500)}`,
    `UTM: ${formatUtm(event.utm)}`,
    `Session ID: ${safeString(event.sessionId)}`,
    `Device: ${safeString(event.deviceCategory)}`,
    `Browser: ${safeString(event.browserSummary)}`,
    `Country/Region: ${safeString(cf.country)} / ${safeString(cf.region)}`,
    `Correlation ID: ${safeString(correlationId)}`,
  ].join("\n");
}

async function sendTelegram(text, env, correlationId) {
  if (!env?.TELEGRAM_BOT_TOKEN || !env?.TELEGRAM_CHAT_ID) {
    console.warn(`[telegram-click:${correlationId}] missing_telegram_secrets`);
    return { ok: false, status: 500, error: "missing_telegram_secrets" };
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.warn(`[telegram-click:${correlationId}] telegram_api_error status=${response.status} body=${safeString(body, "", 240)}`);
    return { ok: false, status: 502, error: "telegram_api_error" };
  }

  return { ok: true };
}

async function handleDiagnostic(request, env, correlationId) {
  const secret = request.headers.get("X-ClientSurge-Tracking-Secret") || "";
  if (!env?.TRACKING_SHARED_SECRET || secret !== env.TRACKING_SHARED_SECRET) {
    return jsonResponse(request, env, { ok: false, eventId: correlationId, error: "diagnostic_secret_required" }, 403, {
      [TELEGRAM_EDGE_HEADER]: "diagnostic-forbidden",
    });
  }

  const telegram = await sendTelegram(DIAGNOSTIC_MESSAGE, env, correlationId);
  if (!telegram.ok) {
    return jsonResponse(request, env, { ok: false, eventId: correlationId, error: telegram.error }, telegram.status, {
      [TELEGRAM_EDGE_HEADER]: "diagnostic-telegram-error",
    });
  }

  return jsonResponse(request, env, { ok: true, eventId: correlationId }, 200, {
    [TELEGRAM_EDGE_HEADER]: "diagnostic-sent",
  });
}

async function handleTelegramEvent(request, env) {
  const correlationId = createCorrelationId();

  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(request, env)) {
      return jsonResponse(request, env, { ok: false, eventId: correlationId, error: "origin_not_allowed" }, 403, {
        [TELEGRAM_EDGE_HEADER]: "invalid-origin",
      });
    }
    return jsonResponse(request, env, { ok: true, eventId: correlationId }, 200, {
      [TELEGRAM_EDGE_HEADER]: "preflight-ok",
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(request, env, { ok: false, eventId: correlationId, error: "method_not_allowed" }, 405, {
      Allow: "POST, OPTIONS",
      [TELEGRAM_EDGE_HEADER]: "method-not-allowed",
    });
  }

  if (!isAllowedOrigin(request, env)) {
    return jsonResponse(request, env, { ok: false, eventId: correlationId, error: "origin_not_allowed" }, 403, {
      [TELEGRAM_EDGE_HEADER]: "invalid-origin",
    });
  }

  if (!isTrackingEnabled(env)) {
    return jsonResponse(request, env, { ok: true, eventId: correlationId, skipped: "visitor_alert_disabled" }, 200, {
      [TELEGRAM_EDGE_HEADER]: "disabled",
    });
  }

  if (isLikelyBot(request)) {
    return jsonResponse(request, env, { ok: true, eventId: correlationId, skipped: "bot" }, 200, {
      [TELEGRAM_EDGE_HEADER]: "bot-ignored",
    });
  }

  if (isRateLimited(request)) {
    return jsonResponse(request, env, { ok: false, eventId: correlationId, error: "rate_limited" }, 429, {
      [TELEGRAM_EDGE_HEADER]: "rate-limited",
    });
  }

  const parsed = await parseJsonPayload(request);
  if (!parsed.ok) {
    return jsonResponse(request, env, { ok: false, eventId: correlationId, error: parsed.error }, parsed.status, {
      [TELEGRAM_EDGE_HEADER]: parsed.error,
    });
  }

  if (new URL(request.url).pathname === DIAGNOSTIC_PATH) {
    return handleDiagnostic(request, env, correlationId);
  }

  const normalized = normalizeClickPayload(parsed.data, request, correlationId);
  if (!normalized.ok) {
    return jsonResponse(request, env, { ok: false, eventId: correlationId, error: "invalid_payload", details: normalized.errors }, 400, {
      [TELEGRAM_EDGE_HEADER]: "invalid-payload",
    });
  }

  if (alreadyProcessed(normalized.event.eventId)) {
    return jsonResponse(request, env, { ok: true, eventId: normalized.event.eventId, duplicate: true }, 200, {
      [TELEGRAM_EDGE_HEADER]: "duplicate",
    });
  }

  const telegram = await sendTelegram(buildTelegramMessage(normalized.event, request, correlationId), env, correlationId);
  if (!telegram.ok) {
    return jsonResponse(request, env, { ok: false, eventId: normalized.event.eventId, error: telegram.error }, telegram.status, {
      [TELEGRAM_EDGE_HEADER]: "telegram-error",
    });
  }

  console.log(`[telegram-click:${correlationId}] sent event=${normalized.event.eventName} id=${normalized.event.eventId}`);
  return jsonResponse(request, env, { ok: true, eventId: normalized.event.eventId }, 200, {
    [TELEGRAM_EDGE_HEADER]: "sent",
  });
}

function shouldInjectTracker(request, response) {
  if (request.method !== "GET") return false;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

function injectTelegramTracker(html = "") {
  if (html.includes(TELEGRAM_TRACKER_SCRIPT_ID) || html.includes(TRACKER_PATH)) return html;
  const scriptTag = `<script id="${TELEGRAM_TRACKER_SCRIPT_ID}" src="${TRACKER_PATH}" defer></script>`;
  if (html.includes("</head>")) return html.replace("</head>", `${scriptTag}\n</head>`);
  if (html.includes("</body>")) return html.replace("</body>", `${scriptTag}\n</body>`);
  return `${scriptTag}\n${html}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === TRACKER_PATH && (request.method === "GET" || request.method === "HEAD")) {
      return request.method === "HEAD"
        ? new Response(null, { status: 200, headers: trackerScriptResponse(request, env).headers })
        : trackerScriptResponse(request, env);
    }

    if (url.pathname === EVENT_PATH || url.pathname === DIAGNOSTIC_PATH) {
      return handleTelegramEvent(request, env);
    }

    if (url.pathname === SESSION_EVENT_PATH) {
      return handleSessionEvent(request, env, createCorrelationId());
    }

    const response = await productionSafeEntry.fetch(request, env, ctx);
    if (!shouldInjectTracker(request, response)) return response;

    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("etag");
    headers.set(TELEGRAM_EDGE_HEADER, `injected-${TRACKING_VERSION}`);
    headers.set(SESSION_ANALYTICS_HEADER, `injected-${SESSION_ANALYTICS_VERSION}`);
    headers.set("Cache-Control", "no-store, max-age=0");

    const html = injectTelegramTracker(await response.text());
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },

  async scheduled(controller, env, ctx) {
    const scheduledAt = controller?.scheduledTime || Date.now();
    const correlationId = `cron_${scheduledAt}`;
    ctx.waitUntil(
      finalizeInactiveSessions(env, correlationId, scheduledAt)
        .then((result) => {
          console.log(`[session-analytics:${correlationId}] finalized=${result.finalized || 0} ok=${result.ok}`);
        })
        .catch((error) => {
          console.warn(`[session-analytics:${correlationId}] scheduled_error ${safeString(error?.message || error, "", 240)}`);
        }),
    );
  },
};

export const TRACKER_JS = `
(() => {
  if (window.__clientsurgeTelegramClickTracker) return;
  window.__clientsurgeTelegramClickTracker = true;
  window.__clientsurgeSessionDurationTracker = true;

  const privatePath = /^\\/(admin|dashboard|client-saas|dashboard-entry|onboarding|setup|functions?|function|internal|private|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44|client-portal)(\\/|$)/i;
  const path = window.location.pathname || "/";
  if (privatePath.test(path)) return;

  const hostname = window.location.hostname || "";
  if (hostname.includes("preview-sandbox") || hostname.includes("base44.app") || hostname.includes("preview")) return;

  const EVENT_URL = window.location.origin + "${EVENT_PATH}";
  const SESSION_EVENT_URL = window.location.origin + "${SESSION_EVENT_PATH}";
  const INTERNAL_KEY = "cs_internal_traffic";
  const LEGACY_CLICK_SESSION_KEY = "cs_telegram_session";
  const SESSION_KEY = "cs_visitor_session";
  const VISITOR_KEY = "cs_visitor_id";
  const SESSION_TIMEOUT = ${SESSION_TIMEOUT_MS};
  const HEARTBEAT_INTERVAL = ${HEARTBEAT_INTERVAL_MS};
  const ACTIVE_WINDOW = ${ACTIVE_ENGAGEMENT_WINDOW_MS};
  const DEDUPE_WINDOW = 1500;
  let lastSignature = "";
  let lastSignatureAt = 0;
  let activeSession = null;
  let pageInstanceId = "";
  let pageStartedAt = 0;
  let lastCheckpointAt = 0;
  let lastActivityAt = 0;
  let hiddenAt = 0;
  let pageElapsedMs = 0;
  let pageVisibleMs = 0;
  let pageEngagedMs = 0;
  let lastHref = window.location.href;

  const params = new URLSearchParams(window.location.search);
  if (params.get("internal") === "true") writeLocalRaw(INTERNAL_KEY, "true");
  if (params.get("internal") === "false") removeLocal(INTERNAL_KEY);
  if (readLocalRaw(INTERNAL_KEY) === "true") return;

  const ua = navigator.userAgent || "";
  if (/bot|crawler|spider|crawling|slurp|ahrefs|semrush|gptbot|claudebot|facebookexternalhit|linkedinbot|bingpreview|pingdom|uptimerobot|headlesschrome|python-requests|curl|wget/i.test(ua)) return;

  function makeId(prefix) {
    return window.crypto?.randomUUID
      ? prefix + "_" + window.crypto.randomUUID()
      : prefix + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function readLocalRaw(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function writeLocalRaw(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function removeLocal(key) {
    try { localStorage.removeItem(key); } catch {}
  }

  function readLocalJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  }

  function writeLocalJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function readSessionJson(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; }
  }

  function writeSessionJson(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function removeSessionJson(key) {
    try { sessionStorage.removeItem(key); } catch {}
  }

  function getVisitorId() {
    let visitorId = readLocalRaw(VISITOR_KEY);
    if (!visitorId) {
      visitorId = makeId("visitor");
      writeLocalRaw(VISITOR_KEY, visitorId);
    }
    return visitorId;
  }

  function getSession() {
    const now = Date.now();
    let session = activeSession || readSessionJson(SESSION_KEY);
    if (!session || !session.sessionId || now - Number(session.lastSeenAt || 0) > SESSION_TIMEOUT) {
      session = {
        sessionId: makeId("session"),
        visitorId: getVisitorId(),
        startedAt: now,
        lastSeenAt: now,
        landingPage: window.location.href,
        referrer: document.referrer || "",
        startedSent: false
      };
    }
    session.lastSeenAt = now;
    activeSession = session;
    writeSessionJson(SESSION_KEY, session);
    writeLocalJson(LEGACY_CLICK_SESSION_KEY, session);
    return session;
  }

  function resetSession() {
    activeSession = null;
    removeSessionJson(SESSION_KEY);
  }

  function rememberSession(session) {
    activeSession = session;
    session.lastSeenAt = Date.now();
    writeSessionJson(SESSION_KEY, session);
    writeLocalJson(LEGACY_CLICK_SESSION_KEY, session);
  }

  function normalizeEventName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function textOf(el) {
    return (
      el.getAttribute("data-track-click-label") ||
      el.getAttribute("data-cta-label") ||
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      el.innerText ||
      el.textContent ||
      el.id ||
      "Unknown click"
    ).replace(/\\s+/g, " ").trim().slice(0, 180);
  }

  function deviceCategory() {
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobile|iphone|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function browserSummary() {
    const browser = /Edg\\//i.test(ua) ? "Edge" : /OPR\\//i.test(ua) ? "Opera" : /Chrome\\//i.test(ua) ? "Chrome" : /Safari\\//i.test(ua) && !/Chrome\\//i.test(ua) ? "Safari" : /Firefox\\//i.test(ua) ? "Firefox" : "Unknown browser";
    const os = /Windows/i.test(ua) ? "Windows" : /Mac OS X/i.test(ua) ? "macOS" : /iPhone|iPad|iPod/i.test(ua) ? "iOS" : /Android/i.test(ua) ? "Android" : /Linux/i.test(ua) ? "Linux" : "Unknown OS";
    return browser + " on " + os;
  }

  function clampPageMetrics() {
    pageVisibleMs = Math.min(pageVisibleMs, pageElapsedMs);
    pageEngagedMs = Math.min(pageEngagedMs, pageVisibleMs);
  }

  function checkpoint() {
    const now = Date.now();
    if (!lastCheckpointAt) lastCheckpointAt = now;
    const delta = Math.max(0, now - lastCheckpointAt);
    pageElapsedMs += delta;
    if (!document.hidden) {
      pageVisibleMs += delta;
      if (now - lastActivityAt <= ACTIVE_WINDOW) pageEngagedMs += delta;
    }
    lastCheckpointAt = now;
    clampPageMetrics();
    const session = getSession();
    rememberSession(session);
    return now;
  }

  function markActivity() {
    lastActivityAt = Date.now();
  }

  function sessionPayload(eventType, extra) {
    const now = Date.now();
    const session = getSession();
    const url = window.location.href;
    const payload = {
      event_type: eventType,
      event_id: makeId("session_evt"),
      session_id: session.sessionId,
      visitor_id: session.visitorId,
      page_instance_id: pageInstanceId,
      url,
      path: window.location.pathname + window.location.search,
      page_title: document.title || "",
      referrer: session.referrer || document.referrer || "",
      landing_url: session.landingPage || url,
      landing_path: (() => {
        try {
          const landing = new URL(session.landingPage || url);
          return landing.pathname + landing.search;
        } catch {
          return window.location.pathname + window.location.search;
        }
      })(),
      language: navigator.language || "",
      screen_resolution: screen && screen.width ? String(screen.width) + "x" + String(screen.height || "") : "",
      device_type: deviceCategory(),
      source: "edge_session_tracker_v1",
      client_sent_at: now,
      page_elapsed_ms: pageElapsedMs,
      page_visible_ms: pageVisibleMs,
      page_engaged_ms: pageEngagedMs,
      session_elapsed_ms: Math.max(0, now - Number(session.startedAt || now)),
      ...(extra || {})
    };
    return payload;
  }

  function sendSessionEvent(eventType, extra, preferBeacon) {
    if (!pageInstanceId) return;
    const payload = sessionPayload(eventType, extra);
    const body = JSON.stringify(payload);
    if (preferBeacon && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(SESSION_EVENT_URL, blob)) return;
    }
    fetch(SESSION_EVENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
      .then((response) => response.json().catch(() => null))
      .then((data) => {
        if (data && data.newSessionRequired) {
          resetSession();
          startCurrentPage("server_finalized");
        }
      })
      .catch(() => {});
  }

  function startCurrentPage(reason) {
    const now = Date.now();
    const session = getSession();
    pageInstanceId = makeId("page");
    pageStartedAt = now;
    lastCheckpointAt = now;
    lastActivityAt = now;
    hiddenAt = document.hidden ? now : 0;
    pageElapsedMs = 0;
    pageVisibleMs = 0;
    pageEngagedMs = 0;
    lastHref = window.location.href;

    if (!session.startedSent) {
      sendSessionEvent("session_start", { start_reason: reason || "new_session" });
      session.startedSent = true;
      rememberSession(session);
    }
    sendSessionEvent("page_start", { start_reason: reason || "page_load" });
  }

  function finishCurrentPage(eventType, exitReason, isFinal, preferBeacon) {
    checkpoint();
    sendSessionEvent(eventType, {
      exit_reason: exitReason || "navigation_completed",
      is_final: Boolean(isFinal)
    }, preferBeacon);
  }

  function handleRouteChange() {
    const nextHref = window.location.href;
    if (nextHref === lastHref) return;
    finishCurrentPage("route_change", "navigation_completed", false, true);
    startCurrentPage("route_change");
  }

  function utmParams() {
    const source = new URL(window.location.href).searchParams;
    const stored = (() => {
      try { return JSON.parse(sessionStorage.getItem("cs_utm_session") || "{}"); } catch { return {}; }
    })();
    const utm = { ...stored };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "msclkid"].forEach((key) => {
      const value = source.get(key);
      if (value) utm[key] = value;
    });
    return utm;
  }

  function classifyEvent(el, label, href) {
    const explicit = normalizeEventName(el.getAttribute("data-track-click") || "");
    if (explicit) return explicit;

    const combined = String(label + " " + href + " " + el.className + " " + el.id).toLowerCase();
    if (href.startsWith("tel:")) return "call_business";
    if (href.startsWith("mailto:")) return "send_email";
    if (/checkout|stripe|buy|purchase|package|plan/.test(combined)) return "open_checkout";
    if (/pricing|compare/.test(combined)) return "select_pricing_plan";
    if (/product-signup|setup|start|get started/.test(combined)) return "start_setup";
    if (/book|demo|free audit|audit/.test(combined)) return "book_demo";
    if (/contact|consult|quote|call/.test(combined)) return "request_consultation";
    if (/submit|send/.test(combined) && el.closest("form")) return "submit_lead_form";
    return "";
  }

  function isQualifying(eventName) {
    return /^(book_demo|request_consultation|start_setup|select_pricing_plan|open_checkout|call_business|send_email|submit_lead_form)$/.test(eventName);
  }

  function sendPayload(payload) {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(EVENT_URL, blob)) return;
    }
    fetch(EVENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function sendClick(el) {
    const label = textOf(el);
    const href = el.href || el.getAttribute("href") || "";
    const eventName = classifyEvent(el, label, href);
    if (!isQualifying(eventName)) return;

    const signature = eventName + "|" + label + "|" + href + "|" + window.location.pathname;
    const now = Date.now();
    if (signature === lastSignature && now - lastSignatureAt < DEDUPE_WINDOW) return;
    lastSignature = signature;
    lastSignatureAt = now;

    const session = getSession();
    checkpoint();
    sendSessionEvent("conversion", { conversion_type: eventName });
    sendPayload({
      event: "website_click",
      eventName,
      label,
      targetUrl: href,
      pageUrl: window.location.href,
      pageTitle: document.title || "",
      referrer: session.referrer || document.referrer || "",
      utm: utmParams(),
      sessionId: session.sessionId,
      eventId: makeId("evt"),
      timestamp: new Date().toISOString(),
      deviceCategory: deviceCategory(),
      browserSummary: browserSummary(),
      source: "edge_tracker_v2"
    });
  }

  startCurrentPage("page_load");
  window.setInterval(function () {
    if (!document.hidden) {
      checkpoint();
      sendSessionEvent("heartbeat");
    }
  }, HEARTBEAT_INTERVAL);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      hiddenAt = Date.now();
      finishCurrentPage("page_hidden", "unknown", false, true);
      return;
    }
    if (hiddenAt && Date.now() - hiddenAt > SESSION_TIMEOUT) {
      finishCurrentPage("session_end", "browser_hidden_timeout", true, true);
      resetSession();
      startCurrentPage("visible_after_timeout");
      return;
    }
    checkpoint();
    sendSessionEvent("page_visible");
  }, true);

  window.addEventListener("pagehide", function () {
    finishCurrentPage("page_exit", "explicit_exit", true, true);
    finishCurrentPage("session_end", "explicit_exit", true, true);
  }, true);

  window.addEventListener("beforeunload", function () {
    finishCurrentPage("page_exit", "explicit_exit", true, true);
  }, true);

  ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (eventName) {
    document.addEventListener(eventName, markActivity, { capture: true, passive: true });
  });

  ["pushState", "replaceState"].forEach(function (methodName) {
    const original = history[methodName];
    if (typeof original !== "function") return;
    history[methodName] = function () {
      const result = original.apply(this, arguments);
      window.setTimeout(handleRouteChange, 0);
      return result;
    };
  });

  window.addEventListener("popstate", function () {
    window.setTimeout(handleRouteChange, 0);
  }, true);

  document.addEventListener("click", function (event) {
    const el = event.target?.closest?.("a, button, [role='button'], [data-track-click]");
    if (!el) return;
    sendClick(el);
  }, true);
})();
`;
