import productionSafeEntry from "./clientsurge-production-safe-entry.mjs";

export const SITE_ORIGIN = "https://clientsurgesystems.com";
export const WWW_ORIGIN = "https://www.clientsurgesystems.com";
export const TRACKER_PATH = "/clientsurge-telegram-click-tracker.js";
export const EVENT_PATH = "/__cs_telegram_click";
export const DIAGNOSTIC_PATH = "/__cs_telegram_click/diagnostic";
export const TELEGRAM_TRACKER_SCRIPT_ID = "clientsurge-telegram-click-tracker";
export const TELEGRAM_EDGE_HEADER = "x-clientsurge-telegram-tracker";
export const TRACKING_VERSION = "2026-07-24-telegram-click-v2";

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

    const response = await productionSafeEntry.fetch(request, env, ctx);
    if (!shouldInjectTracker(request, response)) return response;

    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("etag");
    headers.set(TELEGRAM_EDGE_HEADER, `injected-${TRACKING_VERSION}`);
    headers.set("Cache-Control", "no-store, max-age=0");

    const html = injectTelegramTracker(await response.text());
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export const TRACKER_JS = `
(() => {
  if (window.__clientsurgeTelegramClickTracker) return;
  window.__clientsurgeTelegramClickTracker = true;

  const privatePath = /^\\/(admin|dashboard|client-saas|dashboard-entry|onboarding|setup|functions?|function|internal|private|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44|client-portal)(\\/|$)/i;
  const path = window.location.pathname || "/";
  if (privatePath.test(path)) return;

  const hostname = window.location.hostname || "";
  if (hostname.includes("preview-sandbox") || hostname.includes("base44.app") || hostname.includes("preview")) return;

  const EVENT_URL = window.location.origin + "${EVENT_PATH}";
  const INTERNAL_KEY = "cs_internal_traffic";
  const SESSION_KEY = "cs_telegram_session";
  const VISITOR_KEY = "cs_visitor_id";
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const DEDUPE_WINDOW = 1500;
  let lastSignature = "";
  let lastSignatureAt = 0;

  const params = new URLSearchParams(window.location.search);
  if (params.get("internal") === "true") localStorage.setItem(INTERNAL_KEY, "true");
  if (params.get("internal") === "false") localStorage.removeItem(INTERNAL_KEY);
  if (localStorage.getItem(INTERNAL_KEY) === "true") return;

  const ua = navigator.userAgent || "";
  if (/bot|crawler|spider|crawling|slurp|ahrefs|semrush|gptbot|claudebot|facebookexternalhit|linkedinbot|bingpreview|pingdom|uptimerobot|headlesschrome|python-requests|curl|wget/i.test(ua)) return;

  function makeId(prefix) {
    return window.crypto?.randomUUID
      ? prefix + "_" + window.crypto.randomUUID()
      : prefix + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function getVisitorId() {
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = makeId("visitor");
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
    return visitorId;
  }

  function getSession() {
    const now = Date.now();
    let session = read(SESSION_KEY);
    if (!session || !session.sessionId || now - Number(session.lastSeenAt || 0) > SESSION_TIMEOUT) {
      session = {
        sessionId: makeId("session"),
        visitorId: getVisitorId(),
        startedAt: now,
        lastSeenAt: now,
        landingPage: window.location.href,
        referrer: document.referrer || ""
      };
    }
    session.lastSeenAt = now;
    write(SESSION_KEY, session);
    return session;
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

  getSession();
  document.addEventListener("click", function (event) {
    const el = event.target?.closest?.("a, button, [role='button'], [data-track-click]");
    if (!el) return;
    sendClick(el);
  }, true);
})();
`;
