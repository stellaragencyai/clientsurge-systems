import edgeWorker, {
  repairPublicRouteMetadata,
} from "./clientsurge-security-edge-worker.mjs";
import {
  APP_SHELL_PUBLIC_PATHS,
} from "../src/lib/publicRouteMetadata.js";

export const ROUTE_EXPOSURE_SANITIZED_HEADER = "x-clientsurge-route-exposure-sanitized";
export const ROUTE_EXPOSURE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";
export const ROUTE_EXPOSURE_SANITIZER_VERSION = "2026-07-11T-phase2-full-public-shell";
export const APP_SHELL_FALLBACK_HEADER = "x-clientsurge-app-shell-fallback";
export const APP_SHELL_FALLBACK_VERSION = "2026-07-11T-phase2-full-public-shell";
export const HOMEPAGE_REPAIR_HEADER = "x-clientsurge-homepage-repair";
export const HOMEPAGE_REPAIR_VERSION = "2026-07-11T-phase2-full-public-shell";

const INTERNAL_ROUTE_WORDS = [
  "Admin Dashboard",
  "Admin / AI Status Dashboard",
  "Admin / System Runbook",
  "Admin / Task Status Dashboard",
  "Admin / Conversion Insights",
  "Admin / Automation Activity",
  "Admin / Deployment Control",
  "Business Setup",
  "Client Portal",
  "Client Dashboard",
  "Client Dashboard Entry",
  "Client Saas Dashboard",
  "Client Setup Lookup",
  "Setup Status",
  "Website Preview",
  "Function Audit",
  "System Observability",
  "Reconciliation",
  "Mission Control",
  "SaaS Admin",
  "AI Status Dashboard",
  "AI Marketing Command Center",
  "Onboarding Pipeline",
  "Opportunity Review Queue",
  "Automation Health",
  "Inbound Readiness",
  "Sprint2 Blocker",
  "SaaS Audit",
  "Performance Wars",
  "AI Sales Command Center",
  "Admin Install Guide",
  "Admin Onboarding",
  "Admin Lead Detail",
  "Admin Automation",
  "Admin Reconciliation",
];

// Expanded set: ALL public shell routes (marketing + utility + industry slugs)
// that should get full fallback replacement when route exposure is detected.
const PUBLIC_SHELL_ROUTES = new Set([
  ...APP_SHELL_PUBLIC_PATHS,
  // Industry canonical slugs (legacy short routes)
  "/med-spa", "/dental", "/hvac", "/plumbing", "/roofing",
  "/chiropractic", "/contractors", "/real-estate", "/personal-injury",
  "/property-services", "/veterinary", "/electrician", "/landscaping",
  "/tree-service", "/painting", "/pest-control", "/salon",
  "/auto-repair", "/accounting", "/fitness", "/law-firm",
  // Blog dynamic routes
  "/blog",
]);

const APP_SHELL_BLOCKED_PATH_PATTERN = /^\/(?:admin|dashboard|client|client-portal|client-dashboard|client-saas|dashboard-entry|onboarding|setup|functions?|function|internal|private|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44)(?:\/|$)/i;
const APP_SHELL_ASSET_PATH_PATTERN = /\.(?:js|mjs|css|map|json|png|jpe?g|gif|svg|webp|ico|txt|xml|woff2?|ttf|otf|wasm|pdf|zip)(?:$|\?)/i;

// Expanded detection patterns — catches more Base44 boilerplate variations
const GENERATED_BASE44_COPY = /ClientSurge Systems manages\s+\d+\s+data types|Premium AI-driven automation systems built to increase bookings|organize, track, and share your work in 1 place|including launch gates|available pages|app pages|manage\s+\d+\s+data types|data types including|Browse all pages|View all pages|All pages|App pages|Your pages/i;
const GENERATED_DIRECTORY_PATTERN = /(?:ClientSurge Systems manages\s+\d+\s+data types|organize, track, and share your work in 1 place|including launch gates|<h[1-4][^>]*>\s*(?:Pages|Available Pages|App Pages|All Pages)\s*<\/h[1-4]>|available pages|app pages|browse all pages|view all pages)/i;
const INTERNAL_TEXT_PATTERN = new RegExp(INTERNAL_ROUTE_WORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const INTERNAL_HREF_PATTERN = /<a\b[^>]*href=["']\/(?:admin|dashboard|client-portal|client-dashboard|client-saas|dashboard-entry|setup|internal|functions?|function|mission-control|observability|reconciliation|saas|lead-intelligence|sam|medspa-dashboard|api|base44|onboarding|install|audit)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi;

const ROUTE_COPY = {
  "/": {
    eyebrow: "AI Growth System for Service Businesses",
    title: "Turn your website into an AI-powered sales system.",
    lede: "ClientSurge installs lead capture, instant response, booking, follow-up, review, and reactivation workflows for local service businesses.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/automations",
    secondaryLabel: "See Automations",
    panelTitle: "Starter, Growth, and Pro",
    panelBody: "Clear AI automation packages for businesses that need faster lead response and better follow-up.",
  },
  "/pricing": {
    eyebrow: "Packages",
    title: "Choose the automation system your business needs next.",
    lede: "Compare Starter, Growth, and Pro packages with clear setup fees, monthly pricing, install expectations, and support paths.",
    primaryHref: "/product-signup?package=growth_system",
    primaryLabel: "Start Growth System",
    secondaryHref: "/automations",
    secondaryLabel: "Review Automations",
    panelTitle: "Simple package ladder",
    panelBody: "Starter covers the basics. Growth adds more conversion infrastructure. Pro is built for businesses that want the most complete setup.",
  },
  "/automations": {
    eyebrow: "Automations",
    title: "Six core automations that stop leads from slipping away.",
    lede: "Lead capture, missed-call recovery, AI follow-up, booking, review requests, and lead reactivation work together as one conversion system.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/how-it-works",
    secondaryLabel: "See How It Works",
    panelTitle: "Built as a system",
    panelBody: "Each automation supports the same outcome: respond faster, follow up consistently, and move qualified leads toward booked conversations.",
  },
  "/proof": {
    eyebrow: "Proof Standards",
    title: "Truthful proof only. No fake testimonials. No fake live stats.",
    lede: "ClientSurge separates verified production proof, internal test evidence, demo screenshots, and claims that still need validation.",
    primaryHref: "/how-it-works",
    primaryLabel: "See The System",
    secondaryHref: "/contact",
    secondaryLabel: "Ask A Question",
    panelTitle: "Proof before hype",
    panelBody: "The proof layer is designed to show what is real, what is tested, and what must not be presented as live customer evidence yet.",
  },
  "/contact": {
    eyebrow: "Contact",
    title: "Talk to ClientSurge about your automation setup.",
    lede: "Ask questions about packages, setup, AI voice agents, lead follow-up, booking automation, or the best starting point for your business.",
    primaryHref: "mailto:support@clientsurgesystems.com",
    primaryLabel: "Email Support",
    secondaryHref: "/pricing",
    secondaryLabel: "Compare Packages",
    panelTitle: "Best first question",
    panelBody: "Tell us your business type, current website, monthly lead volume, and where leads are currently getting lost.",
  },
  "/store": {
    eyebrow: "Automation Store",
    title: "Browse individual ClientSurge automation services.",
    lede: "Explore lead capture, missed-call recovery, AI follow-up, booking, review, and reactivation automations available for your system.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/automations",
    secondaryLabel: "See All Automations",
    panelTitle: "Build your stack",
    panelBody: "Start with a package or add individual automations to match your business needs.",
  },
  "/faq": {
    eyebrow: "FAQ",
    title: "Answers to common ClientSurge questions.",
    lede: "Learn about packages, setup timelines, AI automation workflows, billing, support, and what to expect after go-live.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/contact",
    secondaryLabel: "Ask A Question",
    panelTitle: "Straight answers",
    panelBody: "No hype. Just clear answers about what ClientSurge does, how it works, and what it costs.",
  },
  "/how-it-works": {
    eyebrow: "How It Works",
    title: "From website to AI-powered sales system.",
    lede: "ClientSurge captures leads, responds instantly, follows up automatically, books appointments, requests reviews, and reactivates cold leads.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/automations",
    secondaryLabel: "See Automations",
    panelTitle: "Done-for-you setup",
    panelBody: "We configure, test, and install the system. You focus on running your business.",
  },
  "/about": {
    eyebrow: "About",
    title: "ClientSurge Systems builds AI automation for local businesses.",
    lede: "We install packaged AI systems that help local service businesses respond faster, recover missed opportunities, and move leads toward booked appointments.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/contact",
    secondaryLabel: "Contact Us",
    panelTitle: "Our mission",
    panelBody: "Make enterprise-grade lead automation accessible and affordable for local service businesses.",
  },
  "/blog": {
    eyebrow: "Blog",
    title: "ClientSurge Systems articles and insights.",
    lede: "Read about AI automation, lead capture, follow-up strategies, booking workflows, reviews, and local service business growth.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/contact",
    secondaryLabel: "Contact Support",
    panelTitle: "Practical insights",
    panelBody: "Articles focused on real automation workflows and how they help local businesses grow.",
  },
  "/testimonials": {
    eyebrow: "Workflow Scenarios",
    title: "How ClientSurge workflows handle real lead situations.",
    lede: "Review workflow scenarios and trust signals that show how the system responds to leads, missed calls, and follow-up opportunities.",
    primaryHref: "/how-it-works",
    primaryLabel: "See How It Works",
    secondaryHref: "/proof",
    secondaryLabel: "Proof Standards",
    panelTitle: "Scenario previews",
    panelBody: "These previews show how automations work. Verified customer testimonials are always labeled as such.",
  },
  "/roadmap": {
    eyebrow: "Roadmap",
    title: "ClientSurge automation roadmap and planned improvements.",
    lede: "See what we are building next. Future items are not live proof until they are verified and deployed.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/contact",
    secondaryLabel: "Ask About Roadmap",
    panelTitle: "What's coming",
    panelBody: "Planned improvements to lead capture, follow-up, booking, reviews, and reactivation automations.",
  },
  "/book": {
    eyebrow: "Book a Demo",
    title: "Book a ClientSurge demo and system walkthrough.",
    lede: "See the AI automation system in action. We'll walk through lead capture, instant response, follow-up, booking, and reactivation workflows.",
    primaryHref: "/contact",
    primaryLabel: "Contact to Book",
    secondaryHref: "/pricing",
    secondaryLabel: "Compare Packages",
    panelTitle: "See before you buy",
    panelBody: "We'll show you exactly how the system works for your industry before you make a decision.",
  },
  "/login": {
    eyebrow: "Client Login",
    title: "Log in to your ClientSurge client portal.",
    lede: "Access your dashboard, automation status, lead activity, billing, and support resources.",
    primaryHref: "/login",
    primaryLabel: "Client Login",
    secondaryHref: "/contact",
    secondaryLabel: "Need Help?",
    panelTitle: "Client portal access",
    panelBody: "If you have trouble logging in, contact support and we'll help you get access to your dashboard.",
  },
  "/industries": {
    eyebrow: "Industries",
    title: "AI automation systems adapted for your industry.",
    lede: "ClientSurge adapts lead capture, follow-up, booking, and reactivation workflows for HVAC, plumbing, roofing, med spas, dental, legal intake, and more.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/contact",
    secondaryLabel: "Ask About Your Industry",
    panelTitle: "Industry-specific",
    panelBody: "Each industry gets messaging, AI personality, and lead qualification tailored to its workflows.",
  },
};

const DEFAULT_COPY = {
  eyebrow: "ClientSurge Systems",
  title: "AI automation systems for local service businesses.",
  lede: "ClientSurge helps local businesses respond faster, follow up consistently, book more qualified conversations, and recover leads that normally go cold.",
  primaryHref: "/pricing",
  primaryLabel: "Compare Packages",
  secondaryHref: "/contact",
  secondaryLabel: "Contact Support",
  panelTitle: "Public page protected",
  panelBody: "This public page is being served through the hardened ClientSurge route shell. Internal app directories and admin routes are intentionally not shown.",
};

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0];
  const normalized = value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  return normalized || "/";
}

function acceptsHtmlNavigation(request) {
  const accept = request.headers.get("accept") || "";
  const mode = request.headers.get("sec-fetch-mode") || "";
  return accept.includes("text/html") || mode === "navigate" || accept === "";
}

function isPublicShellPath(pathname = "/") {
  const normalized = normalizePathname(pathname);
  if (PUBLIC_SHELL_ROUTES.has(normalized)) return true;
  // Industry dynamic routes: /industries/:slug
  if (/^\/industries\/[^/]+$/.test(normalized)) return true;
  // Blog dynamic routes: /blog/:slug
  if (/^\/blog\/[^/]+$/.test(normalized)) return true;
  // Legacy industry short routes not in the set
  if (/^\/(?:med-spa|dental|hvac|plumbing|roofing|chiropractic|contractors|real-estate|personal-injury|property-services|veterinary|electrician|landscaping|tree-service|painting|pest-control|salon|auto-repair|accounting|fitness|law-firm)$/.test(normalized)) return true;
  return false;
}

function isPrivateSurfacePath(pathname = "/") {
  return APP_SHELL_BLOCKED_PATH_PATTERN.test(normalizePathname(pathname));
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCopyForPath(pathname = "/") {
  const normalized = normalizePathname(pathname);
  return ROUTE_COPY[normalized] || DEFAULT_COPY;
}

function buildRouteFallbackHtml(pathname = "/") {
  const path = normalizePathname(pathname);
  const copy = getCopyForPath(path);
  const title = `${copy.title} | ClientSurge Systems`;
  const canonical = `https://clientsurgesystems.com${path === "/" ? "" : path}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta name="description" content="${escapeHtml(copy.lede)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(copy.lede)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 18% 8%, rgba(0,174,239,.14), transparent 34%), linear-gradient(135deg,#f7fbff 0%,#ffffff 52%,#eef8ff 100%); color: #0f172a; }
      .shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header, footer { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px 0; }
      .brand { color: #07111f; font-weight: 950; letter-spacing: -.04em; text-decoration: none; font-size: 21px; }
      nav { display: flex; flex-wrap: wrap; gap: 14px; }
      a { color: #075985; font-weight: 800; text-decoration: none; }
      .hero { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(280px,.95fr); gap: 42px; align-items: center; padding: clamp(52px, 7vw, 88px) 0 clamp(44px, 7vw, 72px); }
      .eyebrow { margin: 0 0 14px; color: #0079cc; font-size: 13px; font-weight: 950; letter-spacing: .15em; text-transform: uppercase; }
      h1 { margin: 0; max-width: 780px; font-size: clamp(34px, 5vw, 60px); line-height: 1; letter-spacing: -.055em; }
      .lede { max-width: 720px; margin: 22px 0 0; color: #475569; font-size: clamp(17px, 1.7vw, 20px); line-height: 1.65; }
      .actions, .bullets { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 999px; padding: 0 22px; background: linear-gradient(135deg,#003b8f,#00aeef); color: white !important; box-shadow: 0 14px 32px rgba(0,107,176,.22); }
      .button.secondary { background: #fff; color: #0f172a !important; border: 1px solid #cbd5e1; box-shadow: none; }
      .bullets span, .panel { border: 1px solid #dbe7e4; background: rgba(255,255,255,.92); }
      .bullets span { border-radius: 999px; padding: 8px 12px; color: #334155; font-size: 14px; font-weight: 700; }
      .panel { border-radius: 30px; padding: 30px; box-shadow: 0 24px 70px rgba(15,23,42,.12); }
      .panel h2 { margin: 0 0 14px; color: #0f172a; font-size: 30px; letter-spacing: -.045em; }
      .panel p, footer p { color: #475569; line-height: 1.65; }
      .status { display: inline-flex; align-items: center; gap: 8px; margin-top: 18px; padding: 10px 13px; border-radius: 999px; background: #eff8ff; color: #075985; font-size: 13px; font-weight: 850; }
      .status::before { content: ""; width: 8px; height: 8px; border-radius: 999px; background: #00aeef; box-shadow: 0 0 0 5px rgba(0,174,239,.12); }
      @media (max-width: 820px) { header, footer, .hero { display: block; } nav { margin-top: 16px; } .hero { padding-top: 42px; } .panel { margin-top: 28px; } }
    </style>
  </head>
  <body>
    <main class="shell" aria-label="ClientSurge Systems public website">
      <header>
        <a class="brand" href="/">ClientSurge Systems</a>
        <nav aria-label="Public navigation">
          <a href="/pricing">Pricing</a>
          <a href="/automations">Automations</a>
          <a href="/proof">Proof</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      <section class="hero" aria-labelledby="public-heading">
        <div>
          <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
          <h1 id="public-heading">${escapeHtml(copy.title)}</h1>
          <p class="lede">${escapeHtml(copy.lede)}</p>
          <div class="actions">
            <a class="button" href="${escapeHtml(copy.primaryHref)}">${escapeHtml(copy.primaryLabel)}</a>
            <a class="button secondary" href="${escapeHtml(copy.secondaryHref)}">${escapeHtml(copy.secondaryLabel)}</a>
          </div>
          <div class="bullets" aria-label="Key automations">
            <span>Lead capture</span>
            <span>Missed-call recovery</span>
            <span>AI follow-up</span>
            <span>Booking automation</span>
            <span>Review requests</span>
            <span>Lead reactivation</span>
          </div>
        </div>
        <aside class="panel" aria-label="ClientSurge public fallback panel">
          <h2>${escapeHtml(copy.panelTitle)}</h2>
          <p>${escapeHtml(copy.panelBody)}</p>
          <div class="status">Public route shell hardened</div>
        </aside>
      </section>
      <footer>
        <p>ClientSurge Systems installs AI automation systems for local service businesses.</p>
        <nav aria-label="Legal navigation">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/sms-terms">SMS Terms</a>
          <a href="/refund-policy">Refund Policy</a>
        </nav>
      </footer>
    </main>
  </body>
</html>`;
}

function isAppShellFallbackEligibleRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (!acceptsHtmlNavigation(request)) return false;

  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);
  if (pathname === "/") return false;
  if (APP_SHELL_ASSET_PATH_PATTERN.test(pathname)) return false;
  if (pathname.startsWith("/.well-known/")) return false;
  if (isPrivateSurfacePath(pathname)) return false;
  return true;
}

function shouldUseAppShellFallback(request, response, error = null) {
  if (!isAppShellFallbackEligibleRequest(request)) return false;
  if (error) return true;
  if (!response) return true;

  const contentType = response.headers.get("content-type") || "";
  if (response.status >= 400) return true;
  if (contentType.includes("text/plain") && /cache|miss|not found|error/i.test(response.statusText || "")) return true;
  return false;
}

async function fetchAppShellFallback(request, env, ctx) {
  const originalUrl = new URL(request.url);
  const originalPathname = normalizePathname(originalUrl.pathname);
  const fallbackUrl = new URL(request.url);
  fallbackUrl.pathname = "/";
  fallbackUrl.search = "";
  fallbackUrl.hash = "";

  const fallbackRequest = new Request(fallbackUrl.toString(), request);
  const fallbackResponse = await edgeWorker.fetch(fallbackRequest, env, ctx);
  const headers = new Headers(fallbackResponse.headers);
  const contentType = headers.get("content-type") || "";

  headers.set(APP_SHELL_FALLBACK_HEADER, `${APP_SHELL_FALLBACK_VERSION}; from=${originalPathname}`);
  headers.set("Cache-Control", "no-store, max-age=0");

  if (!contentType.includes("text/html")) {
    return new Response(fallbackResponse.body, {
      status: fallbackResponse.status,
      statusText: fallbackResponse.statusText,
      headers,
    });
  }

  let html = await fallbackResponse.text();
  html = repairPublicRouteMetadata(html, originalPathname);

  return new Response(html, {
    status: 200,
    statusText: "OK",
    headers,
  });
}

export function looksLikeRouteExposureHtml(html = "") {
  const text = String(html || "");
  // Any single strong signal is enough to trigger full replacement
  if (GENERATED_DIRECTORY_PATTERN.test(text) && (INTERNAL_TEXT_PATTERN.test(text) || GENERATED_BASE44_COPY.test(text))) return true;
  if (GENERATED_BASE44_COPY.test(text) && INTERNAL_TEXT_PATTERN.test(text)) return true;
  if (GENERATED_DIRECTORY_PATTERN.test(text) && /<a\b[^>]*href=["']\/(?:admin|dashboard|client|setup|store|book|login|onboarding|functions?|mission-control|saas|observability|reconciliation|internal|install|audit)[^"']*["']/i.test(text)) return true;
  // Direct detection: "Pages" heading with a following list/nav containing internal links
  if (/<h[1-4][^>]*>\s*(?:Pages|Available Pages|App Pages|All Pages)\s*<\/h[1-4]>/i.test(text) && INTERNAL_HREF_PATTERN.test(text)) return true;
  // "manages N data types" anywhere in the HTML
  if (/manages\s+\d+\s+data types/i.test(text)) return true;
  // Multiple internal route links in a directory/list context
  const internalLinkCount = (text.match(INTERNAL_HREF_PATTERN) || []).length;
  if (internalLinkCount >= 3) return true;
  return false;
}

function removePatterns(html, patterns) {
  let nextHtml = String(html || "");
  for (const pattern of patterns) {
    nextHtml = nextHtml.replace(pattern, "");
  }
  return nextHtml;
}

export function sanitizeGeneratedPagesDirectoryHtml(html = "") {
  let nextHtml = String(html || "");
  // Remove "Pages" heading + following list/nav/section
  nextHtml = nextHtml.replace(/<h[1-4][^>]*>\s*(?:Pages|Available Pages|App Pages|All Pages)\s*<\/h[1-4]>\s*<(ul|ol|nav|section|div)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Remove "manages N data types" blocks
  nextHtml = nextHtml.replace(/<[^>]+>\s*ClientSurge Systems manages\s+\d+\s+data types[\s\S]*?<\/[^>]+>/gi, "");
  nextHtml = nextHtml.replace(/<[^>]+>\s*manages\s+\d+\s+data types[\s\S]*?<\/[^>]+>/gi, "");
  nextHtml = nextHtml.replace(/<[^>]+>\s*organize, track, and share your work in 1 place[\s\S]*?<\/[^>]+>/gi, "");
  // Remove all internal route links
  nextHtml = nextHtml.replace(INTERNAL_HREF_PATTERN, "");
  // Remove stray boilerplate text fragments
  return removePatterns(nextHtml, [
    /ClientSurge Systems manages\s+\d+\s+data types[^<]*/gi,
    /manages\s+\d+\s+data types[^<]*/gi,
    /including launch gates[^<]*/gi,
    /organize, track, and share your work in 1 place[^<]*/gi,
    /Premium AI-driven automation systems built to increase bookings[^<]*/gi,
    /available pages[^<]*/gi,
    /app pages[^<]*/gi,
    /browse all pages[^<]*/gi,
    /view all pages[^<]*/gi,
  ]);
}

export function shouldRepairHomepage(request, html = "") {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (normalizePathname(new URL(request.url).pathname) !== "/") return false;
  return looksLikeRouteExposureHtml(html);
}

export function shouldRepairPublicRoute(request, html = "") {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const pathname = normalizePathname(new URL(request.url).pathname);
  return isPublicShellPath(pathname) && looksLikeRouteExposureHtml(html);
}

export function buildEmergencyHomepageHtml() {
  return buildRouteFallbackHtml("/");
}

export function buildPublicRouteFallbackHtml(pathname = "/") {
  return buildRouteFallbackHtml(pathname);
}

const EDGE_GUARD_SCRIPT = `<script id="${ROUTE_EXPOSURE_GUARD_SCRIPT_ID}">
(() => {
  if (window.__clientsurgeEdgeRouteExposureGuard) return;
  window.__clientsurgeEdgeRouteExposureGuard = true;
  const INTERNAL_PATH = /^\/(admin|dashboard|client|client-portal|client-dashboard|client-saas|dashboard-entry|setup|functions?|function|internal|private|onboarding|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44)(\/|$)/i;
  const GENERATED_COPY = /ClientSurge Systems manages \d+ data types|manages \d+ data types|organize, track, and share your work in 1 place|including launch gates|available pages|app pages|browse all pages|view all pages|all pages|data types including/i;
  const PAGES_HEADING = /^(Pages|Available Pages|App Pages|All Pages)$/i;
  const text = (node) => (node && node.textContent || '').replace(/\s+/g, ' ').trim();
  const removeGeneratedDirectory = () => {
    for (const heading of Array.from(document.querySelectorAll('h1,h2,h3,h4'))) {
      if (!PAGES_HEADING.test(text(heading)) && !/available pages|app pages|all pages/i.test(text(heading))) continue;
      const next = heading.nextElementSibling;
      let prev = heading.previousElementSibling;
      const previousNodes = [];
      while (prev && previousNodes.length < 4 && (GENERATED_COPY.test(text(prev)) || /^ClientSurge Systems$/i.test(text(prev)))) {
        previousNodes.push(prev);
        prev = prev.previousElementSibling;
      }
      if (next && /^(UL|OL|NAV|SECTION|DIV)$/i.test(next.tagName)) next.remove();
      heading.remove();
      previousNodes.forEach((node) => node.remove());
    }
    for (const node of Array.from(document.querySelectorAll('p,h1,h2,h3,h4,span,div'))) {
      const t = text(node);
      if (GENERATED_COPY.test(t) || /manages \d+ data types/i.test(t)) {
        // Only remove if the node's own text (not children) matches
        if (node.children.length === 0 || GENERATED_COPY.test(t)) node.remove();
      }
    }
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      let url;
      try { url = new URL(a.getAttribute('href'), location.origin); } catch { continue; }
      if (!INTERNAL_PATH.test(url.pathname)) continue;
      const item = a.closest('li') || a;
      item.setAttribute('data-clientsurge-internal-link-hidden', 'true');
      item.style.display = 'none';
      a.setAttribute('rel', 'nofollow noopener noreferrer');
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeGeneratedDirectory, { once: true });
  else removeGeneratedDirectory();
  const observer = new MutationObserver(removeGeneratedDirectory);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 120000);
})();
</script>`;

export function injectEdgeRouteExposureGuard(html = "") {
  if (html.includes(ROUTE_EXPOSURE_GUARD_SCRIPT_ID)) return html;
  if (html.includes("</body>")) return html.replace("</body>", `${EDGE_GUARD_SCRIPT}\n</body>`);
  return `${html}\n${EDGE_GUARD_SCRIPT}`;
}

function forceNoindexIfPrivate(pathname, html = "") {
  if (!isPrivateSurfacePath(pathname)) return html;
  if (/<meta\s+name=["']robots["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex,nofollow" />');
  }
  return html.replace("</head>", '<meta name="robots" content="noindex,nofollow" />\n</head>');
}

function shouldSanitizeHtml(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  return (response.headers.get("content-type") || "").includes("text/html");
}

export default {
  async fetch(request, env, ctx) {
    let response;
    try {
      response = await edgeWorker.fetch(request, env, ctx);
    } catch (error) {
      if (!shouldUseAppShellFallback(request, null, error)) throw error;
      response = await fetchAppShellFallback(request, env, ctx);
    }

    if (shouldUseAppShellFallback(request, response)) {
      response = await fetchAppShellFallback(request, env, ctx);
    }

    if (!shouldSanitizeHtml(request, response)) return response;

    const url = new URL(request.url);
    const pathname = normalizePathname(url.pathname);
    const originalHtml = await response.text();
    const routeExposure = looksLikeRouteExposureHtml(originalHtml);
    const publicRouteRepaired = shouldRepairPublicRoute(request, originalHtml);
    const homepageRepaired = shouldRepairHomepage(request, originalHtml);

    // If route exposure is detected on ANY non-private HTML route, replace
    // the entire page with a clean fallback — never leak partial boilerplate.
    const shouldFullReplace = publicRouteRepaired || (routeExposure && !isPrivateSurfacePath(pathname));

    const repairedHtml = shouldFullReplace
      ? buildRouteFallbackHtml(pathname)
      : sanitizeGeneratedPagesDirectoryHtml(originalHtml);
    const guardedHtml = forceNoindexIfPrivate(pathname, injectEdgeRouteExposureGuard(repairedHtml));

    const headers = new Headers(response.headers);
    headers.set(ROUTE_EXPOSURE_SANITIZED_HEADER, shouldFullReplace ? "full-replaced" : routeExposure ? "removed" : "armed");
    headers.set("x-clientsurge-route-exposure-version", ROUTE_EXPOSURE_SANITIZER_VERSION);
    headers.set("Cache-Control", "no-store, max-age=0");
    headers.set("content-type", "text/html; charset=UTF-8");

    if (homepageRepaired || (shouldFullReplace && pathname === "/")) {
      headers.set(HOMEPAGE_REPAIR_HEADER, HOMEPAGE_REPAIR_VERSION);
    }

    return new Response(guardedHtml, {
      status: shouldFullReplace ? 200 : response.status,
      statusText: shouldFullReplace ? "OK" : response.statusText,
      headers,
    });
  },
};