(() => {
  if (window.__clientsurgeTelegramClickTracker) return;
  window.__clientsurgeTelegramClickTracker = true;
  window.__clientsurgeSessionDurationTracker = true;

  const privatePath = /^\/(admin|dashboard|client-saas|dashboard-entry|onboarding|setup|functions?|function|internal|private|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44|client-portal)(\/|$)/i;
  const path = window.location.pathname || "/";
  if (privatePath.test(path)) return;

  const hostname = window.location.hostname || "";
  if (hostname.includes("preview-sandbox") || hostname.includes("base44.app") || hostname.includes("preview")) return;

  const EVENT_URL = window.location.origin + "/__cs_telegram_click";
  const SESSION_EVENT_URL = window.location.origin + "/api/analytics/v1/session-event";
  const INTERNAL_KEY = "cs_internal_traffic";
  const LEGACY_CLICK_SESSION_KEY = "cs_telegram_session";
  const SESSION_KEY = "cs_visitor_session";
  const VISITOR_KEY = "cs_visitor_id";
  const SESSION_TIMEOUT = 60 * 1000;
  const HEARTBEAT_INTERVAL = 15 * 1000;
  const ACTIVE_WINDOW = 30 * 1000;
  const DEDUPE_WINDOW = 1500;
  let lastSignature = "";
  let lastSignatureAt = 0;
  let activeSession = null;
  let pageInstanceId = "";
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
        startedSent: false,
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
    rememberSession(getSession());
    return now;
  }

  function markActivity() {
    lastActivityAt = Date.now();
  }

  function sessionPayload(eventType, extra) {
    const now = Date.now();
    const session = getSession();
    const url = window.location.href;
    return {
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
      ...(extra || {}),
    };
  }

  function sendSessionEvent(eventType, extra, preferBeacon) {
    if (!pageInstanceId) return;
    const body = JSON.stringify(sessionPayload(eventType, extra));
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
      is_final: Boolean(isFinal),
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
      source: "edge_tracker_v2",
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
