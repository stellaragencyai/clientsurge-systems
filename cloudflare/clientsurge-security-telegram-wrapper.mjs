import securityEdgeWrapper from "./clientsurge-security-edge-wrapper.mjs";

const SITE_ORIGIN = "https://clientsurgesystems.com";
const TRACKER_PATH = "/clientsurge-telegram-click-tracker.js";
const EVENT_PATH = "/__cs_telegram_click";
const TELEGRAM_TRACKER_SCRIPT_ID = "clientsurge-telegram-click-tracker";
const TELEGRAM_EDGE_HEADER = "x-clientsurge-telegram-tracker";

function textResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": SITE_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "text/plain; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function trackerScriptResponse() {
  return new Response(TRACKER_JS, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": SITE_ORIGIN,
      [TELEGRAM_EDGE_HEADER]: "script-v1",
    },
  });
}

function parseBlockedIps(env) {
  return String(env?.BLOCKED_IPS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
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

function safeString(value, fallback = "unknown", maxLength = 240) {
  const normalized = String(value || fallback).replace(/\s+/g, " ").trim();
  return normalized.slice(0, maxLength) || fallback;
}

function formatUtm(utm = {}) {
  const entries = Object.entries(utm || {}).filter(([, value]) => value);
  if (!entries.length) return "none";
  return entries.map(([key, value]) => `${key}=${safeString(value, "", 90)}`).join(" | ");
}

async function handleTelegramEvent(request, env) {
  if (request.method === "OPTIONS") return textResponse("OK");
  if (request.method !== "POST") return textResponse("Method Not Allowed", 405);

  let data;
  try {
    data = await request.json();
  } catch {
    return textResponse("Bad JSON", 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (parseBlockedIps(env).includes(ip)) {
    return textResponse("Internal traffic ignored", 200, { [TELEGRAM_EDGE_HEADER]: "internal-ignored" });
  }

  if (isLikelyBot(request)) {
    return textResponse("Bot ignored", 200, { [TELEGRAM_EDGE_HEADER]: "bot-ignored" });
  }

  if (!env?.TELEGRAM_BOT_TOKEN || !env?.TELEGRAM_CHAT_ID) {
    return textResponse("Missing Telegram credentials", 500, { [TELEGRAM_EDGE_HEADER]: "missing-telegram-secrets" });
  }

  const cf = request.cf || {};
  const ua = request.headers.get("User-Agent") || "unknown";
  const message = [
    "🔥 ClientSurge Website Activity",
    "",
    `Intent: ${safeString(data.intent)}`,
    `Clicked: ${safeString(data.text)}`,
    `Page: ${safeString(data.page, "unknown", 500)}`,
    `Destination: ${safeString(data.href || "none", "none", 500)}`,
    `Landing Page: ${safeString(data.landingPage, "unknown", 500)}`,
    `Referrer: ${safeString(data.referrer || "direct/unknown", "direct/unknown", 500)}`,
    `UTM: ${formatUtm(data.utm)}`,
    "",
    `Country: ${safeString(cf.country)}`,
    `Region: ${safeString(cf.region)}`,
    `City: ${safeString(cf.city)}`,
    `Timezone: ${safeString(data.timezone)}`,
    "",
    `Browser/OS: ${safeString(data.browser)} / ${safeString(data.os)}`,
    `Device: ${safeString(data.device)}`,
    `Language: ${safeString(data.language)}`,
    "",
    `Time on Site: ${safeString(data.timeOnSite || "0", "0", 20)} sec`,
    `Pages Viewed: ${safeString(data.pagesViewed || "1", "1", 20)}`,
    `Clicks This Session: ${safeString(data.clickCount || "1", "1", 20)}`,
    "",
    `Session ID: ${safeString(data.sessionId)}`,
    `Visitor ID: ${safeString(data.visitorId)}`,
    "",
    `IP: ${ip}`,
    `ASN: ${safeString(cf.asn)}`,
    `User Agent: ${safeString(ua, "unknown", 180)}`,
  ].join("\n");

  const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
      disable_web_page_preview: true,
    }),
  });

  if (!telegramResponse.ok) {
    return textResponse(await telegramResponse.text(), telegramResponse.status, { [TELEGRAM_EDGE_HEADER]: "telegram-error" });
  }

  return textResponse("OK", 200, { [TELEGRAM_EDGE_HEADER]: "sent" });
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

    if (request.method === "OPTIONS" && url.pathname === EVENT_PATH) {
      return textResponse("OK");
    }

    if (url.pathname === TRACKER_PATH && (request.method === "GET" || request.method === "HEAD")) {
      return request.method === "HEAD"
        ? new Response(null, { status: 200, headers: trackerScriptResponse().headers })
        : trackerScriptResponse();
    }

    if (url.pathname === EVENT_PATH) {
      return handleTelegramEvent(request, env);
    }

    const response = await securityEdgeWrapper.fetch(request, env, ctx);
    if (!shouldInjectTracker(request, response)) return response;

    const headers = new Headers(response.headers);
    headers.set(TELEGRAM_EDGE_HEADER, "injected-v1");
    headers.set("Cache-Control", "no-store, max-age=0");

    const html = injectTelegramTracker(await response.text());
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

const TRACKER_JS = `
(() => {
  if (window.__clientsurgeTelegramClickTracker) return;
  window.__clientsurgeTelegramClickTracker = true;

  const EVENT_URL = "https://clientsurgesystems.com/__cs_telegram_click";
  const INTERNAL_KEY = "cs_internal_traffic";
  const SESSION_KEY = "cs_telegram_session";
  const VISITOR_KEY = "cs_visitor_id";
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  const params = new URLSearchParams(window.location.search);

  if (params.get("internal") === "true") {
    localStorage.setItem(INTERNAL_KEY, "true");
    console.info("ClientSurge Telegram tracker internal mode ON.");
  }

  if (params.get("internal") === "false") {
    localStorage.removeItem(INTERNAL_KEY);
    console.info("ClientSurge Telegram tracker internal mode OFF.");
  }

  if (localStorage.getItem(INTERNAL_KEY) === "true") return;

  const ua = navigator.userAgent || "";
  if (/bot|crawler|spider|crawling|slurp|ahrefs|semrush|gptbot|claudebot|facebookexternalhit|linkedinbot|bingpreview|pingdom|uptimerobot|headlesschrome|python-requests|curl|wget/i.test(ua)) return;

  function makeId(prefix) {
    return window.crypto?.randomUUID
      ? prefix + "_" + window.crypto.randomUUID()
      : prefix + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {}
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
        startedAt: now,
        lastSeenAt: now,
        pagesViewed: 0,
        clickCount: 0,
        landingPage: window.location.href,
        referrer: document.referrer || "direct/unknown"
      };
    }

    const path = window.location.pathname + window.location.search;
    if (session.lastPagePath !== path) {
      session.pagesViewed = Number(session.pagesViewed || 0) + 1;
      session.lastPagePath = path;
    }

    session.lastSeenAt = now;
    write(SESSION_KEY, session);
    return session;
  }

  function browser() {
    if (/Edg\//i.test(ua)) return "Edge";
    if (/OPR\//i.test(ua)) return "Opera";
    if (/Chrome\//i.test(ua)) return "Chrome";
    if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
    if (/Firefox\//i.test(ua)) return "Firefox";
    return "Unknown";
  }

  function os() {
    if (/Windows NT 10\.0/i.test(ua)) return "Windows 10/11";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Android/i.test(ua)) return "Android";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
  }

  function device() {
    if (/tablet|ipad/i.test(ua)) return "Tablet";
    if (/mobile|iphone|android/i.test(ua)) return "Mobile";
    return "Desktop";
  }

  function label(el) {
    return (
      el.getAttribute("data-track-click") ||
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      el.innerText ||
      el.textContent ||
      el.id ||
      "Unknown click"
    ).replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function cssPath(el) {
    if (!el || !el.tagName) return "unknown";
    if (el.id) return el.tagName.toLowerCase() + "#" + el.id;
    const classes = String(el.className || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    return el.tagName.toLowerCase() + (classes ? "." + classes : "");
  }

  function utmParams() {
    const source = new URL(window.location.href).searchParams;
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "msclkid"].forEach((key) => {
      const value = source.get(key);
      if (value) utm[key] = value;
    });
    return utm;
  }

  function classifyIntent(el, text, href) {
    const combined = String(text + " " + href + " " + el.className + " " + el.id).toLowerCase();
    if (href.startsWith("tel:")) return "phone_click";
    if (href.startsWith("mailto:")) return "email_click";
    if (/checkout|stripe|buy|purchase|pricing|compare packages|see plans|starter|growth|pro/.test(combined)) return "checkout_or_pricing_click";
    if (/audit|free audit|contact|book|demo|call|appointment|consult|quote|get started|start with contact/.test(combined)) return "lead_intent_click";
    return "general_click";
  }

  function send(el) {
    const session = getSession();
    const now = Date.now();
    session.clickCount = Number(session.clickCount || 0) + 1;
    session.lastSeenAt = now;
    write(SESSION_KEY, session);

    const text = label(el);
    const href = el.href || el.getAttribute("href") || "";
    const payload = {
      eventType: "click",
      intent: classifyIntent(el, text, href),
      page: window.location.href,
      pageTitle: document.title || "",
      text,
      href,
      referrer: session.referrer || document.referrer || "direct/unknown",
      landingPage: session.landingPage || window.location.href,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      language: navigator.language || "unknown",
      browser: browser(),
      os: os(),
      device: device(),
      selector: cssPath(el),
      visitorId: getVisitorId(),
      sessionId: session.sessionId,
      timeOnSite: Math.max(0, Math.round((now - Number(session.startedAt || now)) / 1000)),
      pagesViewed: Number(session.pagesViewed || 1),
      clickCount: Number(session.clickCount || 1),
      utm: utmParams()
    };

    fetch(EVENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  }

  getSession();

  document.addEventListener("click", function (event) {
    const el = event.target?.closest?.("a, button, [role='button'], [data-track-click]");
    if (!el) return;
    send(el);
  }, true);
})();
`;
