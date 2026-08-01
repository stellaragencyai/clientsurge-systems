export const SESSION_EVENT_PATH = "/api/analytics/v1/session-event";
export const SESSION_TIMEOUT_MS = 60 * 1000;
export const HEARTBEAT_INTERVAL_MS = 15 * 1000;
export const ACTIVE_ENGAGEMENT_WINDOW_MS = 30 * 1000;
export const MAX_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const MAX_SESSION_EVENT_PAYLOAD_BYTES = 16 * 1024;
export const SESSION_ANALYTICS_HEADER = "x-clientsurge-session-analytics";
export const SESSION_ANALYTICS_VERSION = "2026-07-27-session-duration-v1";

export const SESSION_EVENT_TYPES = new Set([
  "session_start",
  "page_start",
  "heartbeat",
  "page_hidden",
  "page_visible",
  "route_change",
  "page_exit",
  "session_end",
  "conversion",
]);

export const COMPLETION_REASONS = new Set([
  "explicit_exit",
  "inactivity_timeout",
  "navigation_completed",
  "browser_hidden_timeout",
  "unknown",
]);

export const ENGAGEMENT_LEVELS = Object.freeze({
  LIKELY_BOUNCE: "Likely bounce",
  BRIEF_VISIT: "Brief visit",
  INTERESTED: "Interested",
  HIGHLY_ENGAGED: "Highly engaged",
  STRONG_INTENT: "Strong-intent visitor",
});

const STRING_LIMITS = Object.freeze({
  event_id: 160,
  session_id: 160,
  visitor_id: 160,
  page_instance_id: 160,
  url: 900,
  path: 320,
  page_title: 220,
  referrer: 900,
  language: 80,
  screen_resolution: 80,
  device_type: 80,
  source: 120,
  conversion_type: 120,
  user_agent: 900,
});

const ALLOWED_COMPLETION_LABELS = Object.freeze({
  explicit_exit: "Explicit exit",
  inactivity_timeout: "Inactivity timeout",
  navigation_completed: "Navigation completed",
  browser_hidden_timeout: "Browser hidden timeout",
  unknown: "Unknown",
});

export function safeString(value, fallback = "", maxLength = 240) {
  const normalized = String(value ?? fallback)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (normalized || fallback).slice(0, maxLength);
}

export function safeInteger(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

export function normalizeEventType(value) {
  return safeString(value, "", 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function pathFromUrl(value) {
  try {
    const parsed = new URL(String(value || ""), "https://clientsurgesystems.com");
    return `${parsed.pathname}${parsed.search}`.slice(0, STRING_LIMITS.path);
  } catch {
    return "";
  }
}

export function cleanHttpUrl(value, fallback = "") {
  const raw = safeString(value, fallback, STRING_LIMITS.url);
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://clientsurgesystems.com");
    if (!["https:", "http:"].includes(parsed.protocol)) return "";
    return parsed.toString().slice(0, STRING_LIMITS.url);
  } catch {
    return "";
  }
}

export function isClientSurgeOrigin(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === "https://clientsurgesystems.com" || parsed.origin === "https://www.clientsurgesystems.com";
  } catch {
    return false;
  }
}

export function formatDuration(ms) {
  const seconds = Math.max(0, Math.round(Number(ms || 0) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function classifyEngagement(engagedMs) {
  const value = safeInteger(engagedMs);
  if (value < 10_000) return ENGAGEMENT_LEVELS.LIKELY_BOUNCE;
  if (value < 30_000) return ENGAGEMENT_LEVELS.BRIEF_VISIT;
  if (value < 90_000) return ENGAGEMENT_LEVELS.INTERESTED;
  if (value < 300_000) return ENGAGEMENT_LEVELS.HIGHLY_ENGAGED;
  return ENGAGEMENT_LEVELS.STRONG_INTENT;
}

export function isBounceSession({ pageCount = 0, engagedMs = 0, conversionCount = 0 } = {}) {
  return safeInteger(pageCount) <= 1 && safeInteger(engagedMs) < 10_000 && safeInteger(conversionCount) === 0;
}

function requestOrigin(request) {
  return request.headers.get("Origin") || new URL(request.url).origin;
}

function allowedOrigins(env) {
  const configured = String(env?.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set(["https://clientsurgesystems.com", "https://www.clientsurgesystems.com", ...configured]);
}

export function isAllowedSessionOrigin(request, env) {
  return allowedOrigins(env).has(requestOrigin(request));
}

function sessionCorsHeaders(request, env, extra = {}) {
  const origin = requestOrigin(request);
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    [SESSION_ANALYTICS_HEADER]: SESSION_ANALYTICS_VERSION,
    ...extra,
  });
  if (allowedOrigins(env).has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

export function sessionJsonResponse(request, env, body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: sessionCorsHeaders(request, env, extraHeaders),
  });
}

export function isVisitorAlertEnabled(env) {
  const value = String(env?.VISITOR_ALERT_ENABLED ?? "true").toLowerCase();
  return !["0", "false", "off", "disabled", "no"].includes(value);
}

export function ignoredIpSet(env) {
  return new Set(
    String(env?.VISITOR_ALERT_IP_ALLOWLIST || env?.VISITOR_ALERT_IGNORED_IPS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function shouldIgnoreSessionRequest(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  return ip && ignoredIpSet(env).has(ip);
}

export function isLikelyBotSessionRequest(request) {
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

export async function parseSessionJsonPayload(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/application\/json/i.test(contentType)) {
    return { ok: false, status: 415, error: "invalid_content_type" };
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_SESSION_EVENT_PAYLOAD_BYTES) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_SESSION_EVENT_PAYLOAD_BYTES) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }

  try {
    return { ok: true, data: JSON.parse(text || "{}") };
  } catch {
    return { ok: false, status: 400, error: "malformed_json" };
  }
}

export function browserSummaryFromUserAgent(userAgent = "") {
  const ua = String(userAgent || "");
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Safari\//i.test(ua) && !/Chrome\//i.test(ua)
          ? "Safari"
          : /Firefox/i.test(ua)
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
  return { browser, operatingSystem: os, summary: `${browser} on ${os}` };
}

export function trustedRequestMetadata(request) {
  const cf = request.cf || {};
  const ua = request.headers.get("User-Agent") || "";
  const summary = browserSummaryFromUserAgent(ua);
  return {
    country: safeString(cf.country, "unknown", 80),
    city: safeString(cf.city, "unknown", 120),
    region: safeString(cf.region, "unknown", 120),
    postal_code: safeString(cf.postalCode || cf.postal_code, "unknown", 40),
    timezone: safeString(cf.timezone, "unknown", 80),
    network: safeString(cf.asOrganization || cf.asnOrganization, "unknown", 180),
    asn: safeString(cf.asn, "unknown", 40),
    ip_address: safeString(request.headers.get("CF-Connecting-IP") || "unknown", "unknown", 80),
    user_agent: safeString(ua, "unknown", STRING_LIMITS.user_agent),
    browser: summary.browser,
    operating_system: summary.operatingSystem,
  };
}

export function normalizeSessionPayload(raw, request, correlationId) {
  const eventType = normalizeEventType(raw?.event_type || raw?.eventType || raw?.type);
  const now = Date.now();
  const url = cleanHttpUrl(raw?.url || raw?.page_url || raw?.pageUrl || new URL(request.url).origin, "");
  const referrer = cleanHttpUrl(raw?.referrer || raw?.document_referrer || "", "");
  const metadata = trustedRequestMetadata(request);
  const event = {
    event_id: safeString(raw?.event_id || raw?.eventId || correlationId, "", STRING_LIMITS.event_id),
    event_type: eventType,
    session_id: safeString(raw?.session_id || raw?.sessionId, "", STRING_LIMITS.session_id),
    visitor_id: safeString(raw?.visitor_id || raw?.visitorId, "", STRING_LIMITS.visitor_id),
    page_instance_id: safeString(raw?.page_instance_id || raw?.pageInstanceId, "", STRING_LIMITS.page_instance_id),
    url,
    path: safeString(raw?.path || pathFromUrl(url), pathFromUrl(url), STRING_LIMITS.path),
    page_title: safeString(raw?.page_title || raw?.pageTitle, "unknown", STRING_LIMITS.page_title),
    referrer,
    landing_url: cleanHttpUrl(raw?.landing_url || raw?.landingUrl || url, url),
    landing_path: safeString(raw?.landing_path || raw?.landingPath || pathFromUrl(raw?.landing_url || raw?.landingUrl || url), "", STRING_LIMITS.path),
    language: safeString(raw?.language, "", STRING_LIMITS.language),
    screen_resolution: safeString(raw?.screen_resolution || raw?.screenResolution, "", STRING_LIMITS.screen_resolution),
    device_type: safeString(raw?.device_type || raw?.deviceType || raw?.deviceCategory, "", STRING_LIMITS.device_type),
    source: safeString(raw?.source || "edge_session_tracker", "edge_session_tracker", STRING_LIMITS.source),
    conversion_type: safeString(raw?.conversion_type || raw?.conversionType || "", "", STRING_LIMITS.conversion_type),
    exit_reason: normalizeEventType(raw?.exit_reason || raw?.exitReason || ""),
    is_final: raw?.is_final === true || raw?.final === true,
    client_sent_at: safeInteger(raw?.client_sent_at || raw?.clientSentAt || raw?.timestamp, now),
    page_elapsed_ms: safeInteger(raw?.page_elapsed_ms || raw?.pageElapsedMs),
    page_visible_ms: safeInteger(raw?.page_visible_ms || raw?.pageVisibleMs),
    page_engaged_ms: safeInteger(raw?.page_engaged_ms || raw?.pageEngagedMs),
    session_elapsed_ms: safeInteger(raw?.session_elapsed_ms || raw?.sessionElapsedMs),
    metadata,
  };

  const errors = [];
  if (!SESSION_EVENT_TYPES.has(event.event_type)) errors.push("event_type is not allowed");
  if (!event.event_id) errors.push("event_id is required");
  if (!event.session_id) errors.push("session_id is required");
  if (!event.visitor_id) errors.push("visitor_id is required");
  if (!event.page_instance_id) errors.push("page_instance_id is required");
  if (!event.url || !isClientSurgeOrigin(event.url)) errors.push("url must be a ClientSurge URL");
  if (event.referrer && !cleanHttpUrl(event.referrer, "")) errors.push("referrer is invalid");
  if (event.exit_reason && !COMPLETION_REASONS.has(event.exit_reason)) errors.push("exit_reason is not allowed");
  if (event.page_engaged_ms > event.page_visible_ms) errors.push("page_engaged_ms cannot exceed page_visible_ms");
  if (event.page_visible_ms > event.page_elapsed_ms) errors.push("page_visible_ms cannot exceed page_elapsed_ms");

  return errors.length ? { ok: false, errors } : { ok: true, event };
}

async function runStatement(db, sql, ...values) {
  return db.prepare(sql).bind(...values).run();
}

async function firstStatement(db, sql, ...values) {
  return db.prepare(sql).bind(...values).first();
}

async function allStatement(db, sql, ...values) {
  const result = await db.prepare(sql).bind(...values).all();
  return Array.isArray(result?.results) ? result.results : [];
}

function changes(result) {
  return Number(result?.meta?.changes || result?.changes || 0);
}

async function insertEventDedupe(db, event, receivedAt) {
  const result = await runStatement(
    db,
    "INSERT OR IGNORE INTO analytics_events (event_id, session_id, page_instance_id, event_type, received_at) VALUES (?, ?, ?, ?, ?)",
    event.event_id,
    event.session_id,
    event.page_instance_id,
    event.event_type,
    receivedAt,
  );
  return changes(result) > 0;
}

async function getSession(db, sessionId) {
  return firstStatement(db, "SELECT * FROM visitor_sessions WHERE session_id = ?", sessionId);
}

async function insertSessionIfMissing(db, event, request, receivedAt) {
  const metadata = event.metadata;
  const result = await runStatement(
    db,
    `INSERT OR IGNORE INTO visitor_sessions (
      session_id, visitor_id, first_seen_at, last_seen_at, landing_url, landing_path,
      current_url, current_path, referrer, page_title, page_count, elapsed_ms,
      visible_ms, engaged_ms, last_event_type, status, is_bounce, engagement_level,
      telegram_completion_sent, conversion_count, country, city, region, postal_code,
      timezone, network, asn, ip_address, browser, operating_system, device_type,
      screen_resolution, language, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 0, ?, 'active', 1, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    event.session_id,
    event.visitor_id,
    receivedAt,
    receivedAt,
    event.landing_url || event.url,
    event.landing_path || event.path,
    event.url,
    event.path,
    event.referrer || "",
    event.page_title,
    event.event_type,
    ENGAGEMENT_LEVELS.LIKELY_BOUNCE,
    metadata.country,
    metadata.city,
    metadata.region,
    metadata.postal_code,
    metadata.timezone,
    metadata.network,
    metadata.asn,
    metadata.ip_address,
    metadata.browser,
    metadata.operating_system,
    event.device_type,
    event.screen_resolution,
    event.language,
    metadata.user_agent,
    receivedAt,
    receivedAt,
  );
  return changes(result) > 0;
}

async function upsertPageview(db, event, receivedAt, sessionWasCreated) {
  const result = await runStatement(
    db,
    `INSERT OR IGNORE INTO visitor_pageviews (
      session_id, visitor_id, page_instance_id, url, path, page_title, referrer,
      entered_at, last_seen_at, elapsed_ms, visible_ms, engaged_ms, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
    event.session_id,
    event.visitor_id,
    event.page_instance_id,
    event.url,
    event.path,
    event.page_title,
    event.referrer || "",
    receivedAt,
    receivedAt,
    receivedAt,
    receivedAt,
  );

  const inserted = changes(result) > 0;
  if (inserted && !sessionWasCreated) {
    await runStatement(
      db,
      "UPDATE visitor_sessions SET page_count = page_count + 1, updated_at = ? WHERE session_id = ? AND status = 'active'",
      receivedAt,
      event.session_id,
    );
  }
  return inserted;
}

function capDuration(value, maxAllowed) {
  return Math.max(0, Math.min(safeInteger(value), safeInteger(maxAllowed)));
}

async function updatePageDurations(db, event, receivedAt) {
  const page = await firstStatement(
    db,
    "SELECT * FROM visitor_pageviews WHERE session_id = ? AND page_instance_id = ?",
    event.session_id,
    event.page_instance_id,
  );
  if (!page) return null;

  const maxObserved = Math.min(MAX_SESSION_DURATION_MS, Math.max(0, receivedAt - Number(page.entered_at || receivedAt) + HEARTBEAT_INTERVAL_MS * 2));
  const elapsed = capDuration(event.page_elapsed_ms, maxObserved);
  const visible = capDuration(event.page_visible_ms, elapsed);
  const engaged = capDuration(event.page_engaged_ms, visible);
  const shouldExit = event.event_type === "route_change" || event.event_type === "page_exit" || event.event_type === "session_end";
  const exitReason = event.event_type === "route_change" ? "navigation_completed" : event.exit_reason || "explicit_exit";

  await runStatement(
    db,
    `UPDATE visitor_pageviews
     SET last_seen_at = MAX(last_seen_at, ?),
         exited_at = CASE WHEN ? THEN COALESCE(exited_at, ?) ELSE exited_at END,
         elapsed_ms = MAX(elapsed_ms, ?),
         visible_ms = MAX(visible_ms, ?),
         engaged_ms = MAX(engaged_ms, ?),
         exit_reason = CASE WHEN ? THEN COALESCE(exit_reason, ?) ELSE exit_reason END,
         updated_at = ?
     WHERE session_id = ? AND page_instance_id = ?`,
    receivedAt,
    shouldExit ? 1 : 0,
    receivedAt,
    elapsed,
    visible,
    engaged,
    shouldExit ? 1 : 0,
    exitReason,
    receivedAt,
    event.session_id,
    event.page_instance_id,
  );

  return { elapsed, visible, engaged };
}

async function recalculateSessionTotals(db, sessionId, event, receivedAt) {
  const session = await getSession(db, sessionId);
  if (!session || session.status !== "active") return session;

  const totals = await firstStatement(
    db,
    "SELECT COUNT(*) AS page_count, COALESCE(SUM(visible_ms), 0) AS visible_ms, COALESCE(SUM(engaged_ms), 0) AS engaged_ms FROM visitor_pageviews WHERE session_id = ?",
    sessionId,
  );
  const pageCount = Math.max(1, safeInteger(totals?.page_count, 1));
  const visibleMs = Math.min(MAX_SESSION_DURATION_MS, safeInteger(totals?.visible_ms));
  const engagedMs = Math.min(visibleMs, safeInteger(totals?.engaged_ms));
  const elapsedMs = Math.min(MAX_SESSION_DURATION_MS, Math.max(0, receivedAt - Number(session.first_seen_at || receivedAt)));
  const conversionCount = safeInteger(session.conversion_count);
  const bounce = isBounceSession({ pageCount, engagedMs, conversionCount }) ? 1 : 0;
  const engagementLevel = classifyEngagement(engagedMs);

  await runStatement(
    db,
    `UPDATE visitor_sessions
     SET last_seen_at = MAX(last_seen_at, ?),
         current_url = ?,
         current_path = ?,
         page_title = ?,
         page_count = ?,
         elapsed_ms = ?,
         visible_ms = ?,
         engaged_ms = ?,
         last_event_type = ?,
         is_bounce = ?,
         engagement_level = ?,
         device_type = COALESCE(NULLIF(?, ''), device_type),
         screen_resolution = COALESCE(NULLIF(?, ''), screen_resolution),
         language = COALESCE(NULLIF(?, ''), language),
         updated_at = ?
     WHERE session_id = ? AND status = 'active'`,
    receivedAt,
    event.url,
    event.path,
    event.page_title,
    pageCount,
    elapsedMs,
    visibleMs,
    engagedMs,
    event.event_type,
    bounce,
    engagementLevel,
    event.device_type,
    event.screen_resolution,
    event.language,
    receivedAt,
    sessionId,
  );

  return getSession(db, sessionId);
}

async function markConversion(db, event, receivedAt) {
  if (event.event_type !== "conversion") return;
  await runStatement(
    db,
    "UPDATE visitor_sessions SET conversion_count = conversion_count + 1, is_bounce = 0, last_event_type = ?, updated_at = ? WHERE session_id = ? AND status = 'active'",
    event.conversion_type || "conversion",
    receivedAt,
    event.session_id,
  );
}

export function buildSessionArrivalMessage(session) {
  return [
    "ClientSurge Website Visit",
    "",
    "📍 VISIT DETAILS",
    `Page: ${safeString(session.current_path || session.landing_path || "unknown")}`,
    `Page title: ${safeString(session.page_title || "unknown")}`,
    `Exact URL: ${safeString(session.current_url || session.landing_url || "unknown", "unknown", 900)}`,
    `Landing page: ${safeString(session.landing_url || "unknown", "unknown", 900)}`,
    `Referrer: ${safeString(session.referrer || "direct/unknown", "direct/unknown", 900)}`,
    "",
    "🌎 LOCATION",
    `Country: ${safeString(session.country)}`,
    `City: ${safeString(session.city)}`,
    `Region: ${safeString(session.region)}`,
    `Postal code: ${safeString(session.postal_code)}`,
    `IP address: ${safeString(session.ip_address)}`,
    `Timezone: ${safeString(session.timezone)}`,
    `Network: ${safeString(session.network)}`,
    `ASN: ${safeString(session.asn)}`,
    "",
    "💻 DEVICE",
    `Browser: ${safeString(session.browser)}`,
    `Operating system: ${safeString(session.operating_system)}`,
    `Device: ${safeString(session.device_type || "unknown")}`,
    `Screen: ${safeString(session.screen_resolution || "unknown")}`,
    `Language: ${safeString(session.language || "unknown")}`,
    "",
    "🧭 SESSION",
    `Visitor ID: ${safeString(session.visitor_id)}`,
    `Session ID: ${safeString(session.session_id)}`,
    `Pages viewed: ${safeInteger(session.page_count, 1)}`,
    `Arrived at: ${new Date(Number(session.first_seen_at || Date.now())).toISOString()}`,
    "Status: Active",
    "Session duration: Pending",
    "Last activity: Just now",
    "",
    "🧾 USER AGENT",
    safeString(session.user_agent || "unknown", "unknown", 900),
  ].join("\n");
}

export function buildSessionCompletionMessage(session) {
  const reason = session.completion_reason || "unknown";
  return [
    "ClientSurge Website Visit",
    "",
    "🏁 SESSION COMPLETED",
    `Visitor ID: ${safeString(session.visitor_id)}`,
    `Session ID: ${safeString(session.session_id)}`,
    `Landing page: ${safeString(session.landing_url || session.landing_path || "unknown", "unknown", 900)}`,
    `Exit page: ${safeString(session.exit_url || session.exit_path || session.current_url || "unknown", "unknown", 900)}`,
    `Pages viewed: ${safeInteger(session.page_count, 1)}`,
    `Arrived at: ${new Date(Number(session.first_seen_at || Date.now())).toISOString()}`,
    `Last active at: ${new Date(Number(session.last_seen_at || Date.now())).toISOString()}`,
    `Completed at: ${new Date(Number(session.completed_at || Date.now())).toISOString()}`,
    `Elapsed time: ${formatDuration(session.elapsed_ms)}`,
    `Visible time: ${formatDuration(session.visible_ms)}`,
    `Active engagement time: ${formatDuration(session.engaged_ms)}`,
    `Completion reason: ${ALLOWED_COMPLETION_LABELS[reason] || ALLOWED_COMPLETION_LABELS.unknown}`,
    `Bounce: ${safeInteger(session.is_bounce) ? "Yes" : "No"}`,
    `Engagement level: ${safeString(session.engagement_level || classifyEngagement(session.engaged_ms))}`,
  ].join("\n");
}

export async function sendTelegramMessage(text, env, correlationId, options = {}) {
  if (!env?.TELEGRAM_BOT_TOKEN || !env?.TELEGRAM_CHAT_ID) {
    console.warn(`[session-analytics:${correlationId}] missing_telegram_secrets`);
    return { ok: false, status: 500, error: "missing_telegram_secrets" };
  }

  const payload = {
    chat_id: options.chatId || env.TELEGRAM_CHAT_ID,
    text,
    disable_web_page_preview: true,
  };
  if (options.replyToMessageId) payload.reply_to_message_id = options.replyToMessageId;

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  if (!response.ok || data?.ok === false) {
    console.warn(`[session-analytics:${correlationId}] telegram_send_error status=${response.status} body=${safeString(JSON.stringify(data), "", 240)}`);
    return { ok: false, status: 502, error: "telegram_api_error" };
  }
  return { ok: true, messageId: data?.result?.message_id, chatId: payload.chat_id };
}

export async function editTelegramMessage(text, env, correlationId, options = {}) {
  if (!env?.TELEGRAM_BOT_TOKEN || !options.chatId || !options.messageId) {
    return { ok: false, status: 400, error: "missing_edit_target" };
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: options.chatId,
      message_id: options.messageId,
      text,
      disable_web_page_preview: true,
    }),
  });
  const data = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  if (!response.ok || data?.ok === false) {
    console.warn(`[session-analytics:${correlationId}] telegram_edit_error status=${response.status} body=${safeString(JSON.stringify(data), "", 240)}`);
    return { ok: false, status: 502, error: "telegram_api_error" };
  }
  return { ok: true };
}

async function sendArrivalIfNeeded(db, sessionWasCreated, event, env, correlationId) {
  if (!sessionWasCreated || !isVisitorAlertEnabled(env)) return { skipped: true };
  const session = await getSession(db, event.session_id);
  if (!session) return { skipped: true };
  const telegram = await sendTelegramMessage(buildSessionArrivalMessage(session), env, correlationId);
  if (!telegram.ok) return telegram;
  await runStatement(
    db,
    "UPDATE visitor_sessions SET telegram_chat_id = ?, telegram_start_message_id = ?, updated_at = ? WHERE session_id = ?",
    String(telegram.chatId || env.TELEGRAM_CHAT_ID),
    telegram.messageId ? String(telegram.messageId) : null,
    Date.now(),
    event.session_id,
  );
  return telegram;
}

async function sendCompletionIfNeeded(db, session, env, correlationId) {
  if (!session || safeInteger(session.telegram_completion_sent) === 1 || !isVisitorAlertEnabled(env)) {
    return { skipped: true };
  }

  const message = buildSessionCompletionMessage(session);
  const chatId = session.telegram_chat_id || env.TELEGRAM_CHAT_ID;
  const messageId = session.telegram_start_message_id;
  let telegram = { ok: false };
  if (chatId && messageId) {
    telegram = await editTelegramMessage(message, env, correlationId, { chatId, messageId });
  }
  if (!telegram.ok) {
    telegram = await sendTelegramMessage(message, env, correlationId, {
      chatId,
      replyToMessageId: messageId || undefined,
    });
  }
  if (!telegram.ok) return telegram;

  await runStatement(
    db,
    "UPDATE visitor_sessions SET telegram_completion_sent = 1, updated_at = ? WHERE session_id = ?",
    Date.now(),
    session.session_id,
  );
  return telegram;
}

export async function finalizeSession(db, sessionId, reason, env, correlationId, now = Date.now()) {
  const session = await getSession(db, sessionId);
  if (!session) return { ok: false, error: "session_not_found" };

  const completionReason = COMPLETION_REASONS.has(reason) ? reason : "unknown";
  if (session.status === "active") {
    const elapsedMs = Math.min(MAX_SESSION_DURATION_MS, Math.max(0, now - Number(session.first_seen_at || now)));
    const exitUrl = session.current_url || session.landing_url || "";
    const exitPath = session.current_path || session.landing_path || "";
    const bounce = isBounceSession({
      pageCount: session.page_count,
      engagedMs: session.engaged_ms,
      conversionCount: session.conversion_count,
    }) ? 1 : 0;
    await runStatement(
      db,
      `UPDATE visitor_sessions
       SET status = 'completed',
           completed_at = ?,
           last_seen_at = MAX(last_seen_at, ?),
           elapsed_ms = MAX(elapsed_ms, ?),
           exit_url = ?,
           exit_path = ?,
           completion_reason = ?,
           is_bounce = ?,
           engagement_level = ?,
           updated_at = ?
       WHERE session_id = ? AND status = 'active'`,
      now,
      now,
      elapsedMs,
      exitUrl,
      exitPath,
      completionReason,
      bounce,
      classifyEngagement(session.engaged_ms),
      now,
      sessionId,
    );
  }

  const completed = await getSession(db, sessionId);
  const telegram = await sendCompletionIfNeeded(db, completed, env, correlationId);
  return { ok: true, session: await getSession(db, sessionId), telegram };
}

export async function handleSessionEvent(request, env, correlationId = `cs_${Date.now()}`) {
  if (request.method === "OPTIONS") {
    if (!isAllowedSessionOrigin(request, env)) {
      return sessionJsonResponse(request, env, { ok: false, eventId: correlationId, error: "origin_not_allowed" }, 403, {
        [SESSION_ANALYTICS_HEADER]: "invalid-origin",
      });
    }
    return sessionJsonResponse(request, env, { ok: true, eventId: correlationId }, 200, {
      [SESSION_ANALYTICS_HEADER]: "preflight-ok",
    });
  }

  if (request.method !== "POST") {
    return sessionJsonResponse(request, env, { ok: false, eventId: correlationId, error: "method_not_allowed" }, 405, {
      Allow: "POST, OPTIONS",
      [SESSION_ANALYTICS_HEADER]: "method-not-allowed",
    });
  }

  if (!isAllowedSessionOrigin(request, env)) {
    return sessionJsonResponse(request, env, { ok: false, eventId: correlationId, error: "origin_not_allowed" }, 403, {
      [SESSION_ANALYTICS_HEADER]: "invalid-origin",
    });
  }

  if (shouldIgnoreSessionRequest(request, env)) {
    return sessionJsonResponse(request, env, { ok: true, eventId: correlationId, skipped: "ignored_ip" }, 200, {
      [SESSION_ANALYTICS_HEADER]: "ignored-ip",
    });
  }

  if (isLikelyBotSessionRequest(request)) {
    return sessionJsonResponse(request, env, { ok: true, eventId: correlationId, skipped: "bot" }, 200, {
      [SESSION_ANALYTICS_HEADER]: "bot-ignored",
    });
  }

  if (!env?.ANALYTICS_DB) {
    return sessionJsonResponse(request, env, { ok: false, eventId: correlationId, error: "analytics_db_unavailable" }, 503, {
      [SESSION_ANALYTICS_HEADER]: "db-unavailable",
    });
  }

  const parsed = await parseSessionJsonPayload(request);
  if (!parsed.ok) {
    return sessionJsonResponse(request, env, { ok: false, eventId: correlationId, error: parsed.error }, parsed.status, {
      [SESSION_ANALYTICS_HEADER]: parsed.error,
    });
  }

  const normalized = normalizeSessionPayload(parsed.data, request, correlationId);
  if (!normalized.ok) {
    return sessionJsonResponse(request, env, { ok: false, eventId: correlationId, error: "invalid_payload", details: normalized.errors }, 400, {
      [SESSION_ANALYTICS_HEADER]: "invalid-payload",
    });
  }

  try {
    const event = normalized.event;
    const db = env.ANALYTICS_DB;
    const receivedAt = Date.now();
    const freshEvent = await insertEventDedupe(db, event, receivedAt);
    if (!freshEvent) {
      return sessionJsonResponse(request, env, { ok: true, eventId: event.event_id, duplicate: true }, 200, {
        [SESSION_ANALYTICS_HEADER]: "duplicate",
      });
    }

    const existingSession = await getSession(db, event.session_id);
    if (existingSession && existingSession.status !== "active") {
      return sessionJsonResponse(request, env, { ok: true, eventId: event.event_id, sessionFinalized: true, newSessionRequired: true }, 200, {
        [SESSION_ANALYTICS_HEADER]: "session-finalized",
      });
    }

    const sessionWasCreated = await insertSessionIfMissing(db, event, request, receivedAt);
    await upsertPageview(db, event, receivedAt, sessionWasCreated);
    await updatePageDurations(db, event, receivedAt);
    await markConversion(db, event, receivedAt);
    const session = await recalculateSessionTotals(db, event.session_id, event, receivedAt);

    const arrival = await sendArrivalIfNeeded(db, sessionWasCreated, event, env, correlationId);
    let completion = null;
    if (event.event_type === "session_end" || (event.event_type === "page_exit" && event.is_final)) {
      completion = await finalizeSession(db, event.session_id, event.exit_reason || "explicit_exit", env, correlationId, receivedAt);
    }

    return sessionJsonResponse(request, env, {
      ok: true,
      eventId: event.event_id,
      sessionId: event.session_id,
      status: completion?.session?.status || session?.status || "active",
      arrivalTelegram: arrival?.ok === true,
      completionTelegram: completion?.telegram?.ok === true,
    }, 200, {
      [SESSION_ANALYTICS_HEADER]: completion ? "completed" : sessionWasCreated ? "started" : "accepted",
    });
  } catch (error) {
    console.warn(`[session-analytics:${correlationId}] database_error ${safeString(error?.message || error, "", 240)}`);
    return sessionJsonResponse(request, env, { ok: false, eventId: correlationId, error: "database_error" }, 500, {
      [SESSION_ANALYTICS_HEADER]: "database-error",
    });
  }
}

export async function finalizeInactiveSessions(env, correlationId = `cron_${Date.now()}`, now = Date.now()) {
  const db = env?.ANALYTICS_DB;
  if (!db) return { ok: false, error: "analytics_db_unavailable", finalized: 0 };
  const limit = Math.max(1, Math.min(100, safeInteger(env?.SESSION_FINALIZATION_BATCH_SIZE, 25)));
  const cutoff = now - SESSION_TIMEOUT_MS;
  const sessions = await allStatement(
    db,
    "SELECT * FROM visitor_sessions WHERE status = 'active' AND last_seen_at <= ? ORDER BY last_seen_at ASC LIMIT ?",
    cutoff,
    limit,
  );

  let finalized = 0;
  const errors = [];
  for (const session of sessions) {
    const result = await finalizeSession(db, session.session_id, "inactivity_timeout", env, correlationId, now);
    if (result.ok) finalized += 1;
    else errors.push({ session_id: session.session_id, error: result.error });
  }
  return { ok: errors.length === 0, finalized, errors };
}
