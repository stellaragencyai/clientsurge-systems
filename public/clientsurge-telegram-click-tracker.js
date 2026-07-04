(() => {
 if (window.__clientsurgeTelegramClickTracker) return;
 window.__clientsurgeTelegramClickTracker = true;

 // ── Preview sandbox guard ──────────────────────────────────────────────
 // Skip all tracking in Base44 preview environments to prevent CORS
 // preflight failures that block page rendering.
 const hostname = window.location.hostname || "";
 if (
 hostname.includes("preview-sandbox") ||
 hostname.includes("base44.app") ||
 hostname.includes("preview")
 ) {
 return;
 }

 const WORKER_URL = "https://clientsurge-telegram-tracker.nolanfstrommer.workers.dev/";
 const INTERNAL_STORAGE_KEY = "cs_internal_traffic";
 const SESSION_STORAGE_KEY = "cs_telegram_session";
 const VISITOR_STORAGE_KEY = "cs_visitor_id";
 const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

 const params = new URLSearchParams(window.location.search);
 if (params.get("internal") === "true") {
 localStorage.setItem(INTERNAL_STORAGE_KEY, "true");
 console.info("ClientSurge tracker: internal traffic mode enabled for this browser.");
 }
 if (params.get("internal") === "false") {
 localStorage.removeItem(INTERNAL_STORAGE_KEY);
 console.info("ClientSurge tracker: internal traffic mode disabled for this browser.");
 }

 if (localStorage.getItem(INTERNAL_STORAGE_KEY) === "true") return;

 const userAgent = navigator.userAgent || "";
 const botPattern = /bot|crawler|spider|crawling|slurp|ahrefs|semrush|gptbot|claudebot|facebookexternalhit|linkedinbot|bingpreview|pingdom|uptimerobot|headlesschrome|phantomjs|python-requests|curl|wget/i;
 if (botPattern.test(userAgent)) return;

 function createId(prefix) {
 if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
 return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
 }

 function readJson(key) {
 try {
 return JSON.parse(localStorage.getItem(key) || "null");
 } catch {
 return null;
 }
 }

 function writeJson(key, value) {
 try {
 localStorage.setItem(key, JSON.stringify(value));
 } catch {}
 }

 function getVisitorId() {
 let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
 if (!visitorId) {
 visitorId = createId("visitor");
 localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
 }
 return visitorId;
 }

 function getSession() {
 const now = Date.now();
 const existing = readJson(SESSION_STORAGE_KEY);
 const shouldStartNew = !existing || !existing.sessionId || !existing.lastSeenAt || now - existing.lastSeenAt > SESSION_TIMEOUT_MS;
 const session = shouldStartNew
 ? {
 sessionId: createId("session"),
 startedAt: now,
 lastSeenAt: now,
 pagesViewed: 0,
 clickCount: 0,
 landingPage: window.location.href,
 referrer: document.referrer || ""
 }
 : existing;

 const currentPath = window.location.pathname + window.location.search;
 if (session.lastPagePath !== currentPath) {
 session.pagesViewed = Number(session.pagesViewed || 0) + 1;
 session.lastPagePath = currentPath;
 }
 session.lastSeenAt = now;
 writeJson(SESSION_STORAGE_KEY, session);
 return session;
 }

 function detectDevice() {
 if (/tablet|ipad/i.test(userAgent)) return "Tablet";
 if (/mobile|iphone|android/i.test(userAgent)) return "Mobile";
 return "Desktop";
 }

 function detectBrowser() {
 if (/Edg\//i.test(userAgent)) return "Edge";
 if (/OPR\//i.test(userAgent)) return "Opera";
 if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) return "Chrome";
 if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
 if (/Firefox\//i.test(userAgent)) return "Firefox";
 return "Unknown";
 }

 function detectOS() {
 if (/Windows NT 10\.0/i.test(userAgent)) return "Windows 10/11";
 if (/Windows/i.test(userAgent)) return "Windows";
 if (/Mac OS X/i.test(userAgent)) return "macOS";
 if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
 if (/Android/i.test(userAgent)) return "Android";
 if (/Linux/i.test(userAgent)) return "Linux";
 return "Unknown";
 }

 function getUtm() {
 const current = new URL(window.location.href);
 const utm = {};
 ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "msclkid"].forEach((key) => {
 const value = current.searchParams.get(key);
 if (value) utm[key] = value;
 });
 return utm;
 }

 function cssPath(element) {
 if (!element || !element.tagName) return "unknown";
 if (element.id) return `${element.tagName.toLowerCase()}#${element.id}`;
 const classes = String(element.className || "")
 .split(/\s+/)
 .filter(Boolean)
 .slice(0, 3)
 .join(".");
 return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
 }

 function clickLabel(target) {
 return (
 target.getAttribute("data-track-click") ||
 target.getAttribute("aria-label") ||
 target.getAttribute("title") ||
 target.innerText ||
 target.textContent ||
 target.id ||
 "Unknown click"
 )
 .replace(/\s+/g, " ")
 .trim()
 .slice(0, 180);
 }

 function classifyIntent(target, text, href) {
 const combined = `${text || ""} ${href || ""} ${target?.className || ""} ${target?.id || ""}`.toLowerCase();
 if (href?.startsWith("tel:")) return "phone_click";
 if (href?.startsWith("mailto:")) return "email_click";
 if (/checkout|stripe|buy|purchase|start now|package|pricing|compare packages/.test(combined)) return "checkout_or_pricing_click";
 if (/audit|free audit|contact|book|demo|call|appointment|consult|quote|get started/.test(combined)) return "lead_intent_click";
 if (/sms|privacy|terms|refund/.test(combined)) return "legal_or_policy_click";
 return "general_click";
 }

 function sendClick(target) {
 const session = getSession();
 const now = Date.now();
 session.clickCount = Number(session.clickCount || 0) + 1;
 session.lastSeenAt = now;
 writeJson(SESSION_STORAGE_KEY, session);

 const text = clickLabel(target);
 const href = target.href || target.getAttribute("href") || "";
 const payload = {
 eventType: "click",
 intent: classifyIntent(target, text, href),
 page: window.location.href,
 pageTitle: document.title || "",
 text,
 href,
 referrer: session.referrer || document.referrer || "direct/unknown",
 landingPage: session.landingPage || window.location.href,
 timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
 language: navigator.language || "unknown",
 browser: detectBrowser(),
 os: detectOS(),
 device: detectDevice(),
 visitorId: getVisitorId(),
 sessionId: session.sessionId,
 timeOnSite: Math.max(0, Math.round((now - Number(session.startedAt || now)) / 1000)),
 pagesViewed: Number(session.pagesViewed || 1),
 clickCount: Number(session.clickCount || 1),
 selector: cssPath(target),
 utm: getUtm()
 };

 fetch(WORKER_URL, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 keepalive: true
 }).catch(() => {});
 }

 getSession();

 document.addEventListener(
 "click",
 (event) => {
 const target = event.target?.closest?.("a, button, [role='button'], [data-track-click]");
 if (!target) return;
 sendClick(target);
 },
 true
 );
})();
