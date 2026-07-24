(() => {
  if (window.__clientsurgeTelegramClickTracker) return;
  window.__clientsurgeTelegramClickTracker = true;

  const privatePath = /^\/(admin|dashboard|client-saas|dashboard-entry|onboarding|setup|functions?|function|internal|private|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44|client-portal)(\/|$)/i;
  const path = window.location.pathname || "/";
  if (privatePath.test(path)) return;

  const hostname = window.location.hostname || "";
  if (hostname.includes("preview-sandbox") || hostname.includes("base44.app") || hostname.includes("preview")) return;

  const EVENT_URL = window.location.origin + "/__cs_telegram_click";
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
    ).replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function deviceCategory() {
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobile|iphone|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function browserSummary() {
    const browser = /Edg\//i.test(ua) ? "Edge" : /OPR\//i.test(ua) ? "Opera" : /Chrome\//i.test(ua) ? "Chrome" : /Safari\//i.test(ua) && !/Chrome\//i.test(ua) ? "Safari" : /Firefox\//i.test(ua) ? "Firefox" : "Unknown browser";
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
