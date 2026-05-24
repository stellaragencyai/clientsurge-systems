import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("ThemeProvider from next-themes wraps the app with class support", () => {
  const main = read("src/main.jsx");
  assert.match(main, /import \{ ThemeProvider \} from 'next-themes'/);
  assert.match(main, /attribute="class"/);
  assert.match(main, /storageKey="theme-preference"/);
});

test("CartSidebar acquires and releases the shared body scroll lock", () => {
  const cartSidebar = read("src/components/store/CartSidebar.jsx");
  assert.match(cartSidebar, /acquireBodyScrollLock\("cart-sidebar"\)/);
  assert.match(cartSidebar, /if \(!cartOpen\) return undefined;/);
});

test("CartSidebar checkout uses the documented direct Base44 functions endpoint", () => {
  const cartSidebar = read("src/components/store/CartSidebar.jsx");
  assert.match(cartSidebar, /base44\.functions\.fetch\("\/createCheckoutSession"/);
  assert.doesNotMatch(cartSidebar, /base44\.functions\.invoke\("createCheckoutSession"/);
  assert.match(cartSidebar, /if \(!response\.ok\)/);
});

test("store social proof ticker reads paid Order records instead of hardcoded purchases", () => {
  const ticker = read("src/components/store/SocialProofTicker.jsx");
  assert.match(ticker, /base44\.entities\.Order\.filter\(\{ payment_status: "paid" \}/);
  assert.doesNotMatch(ticker, /const \[purchaseSignals\] = useState\(\[/);
});

test("pricing package CTAs deep-link into the matching store package", () => {
  const pricing = read("src/components/landing/Pricing.jsx");
  const store = read("src/pages/Store.jsx");

  for (const packageKey of ["starter_system", "growth_system", "elite_system"]) {
    assert.match(pricing, new RegExp(`${packageKey}: "/store\\?package=${packageKey}"`));
  }

  assert.match(store, /params\.get\("package"\) \|\| params\.get\("plan"\)/);
  assert.match(store, /replaceItems\(pkg\.included_services\)/);
  assert.match(store, /setCartOpen\(true\)/);
});

test("Book page embeds Calendly with explicit responsive dimensions", () => {
  const book = read("src/pages/Book.jsx");
  assert.match(book, /<iframe/);
  assert.match(book, /width="100%"/);
  assert.match(book, /height="700"/);
  assert.match(book, /scrolling="yes"/);
  assert.match(book, /getPublicBookingLink\(\)/);
});

test("contact form honeypot aligns with backend bot detection", () => {
  const contact = read("src/pages/Contact.jsx");
  const submitContactInquiry = read("base44/functions/submitContactInquiry/entry.ts");

  assert.match(contact, /website_hp: ""/);
  assert.match(contact, /name="website_hp"/);
  assert.doesNotMatch(contact, /name="website_url"[\s\S]*aria-hidden="true"/);
  assert.match(submitContactInquiry, /payload\.website_hp \|\| payload\.website_honeypot \|\| payload\.company_website_hp/);
  assert.match(submitContactInquiry, /if \(contact\.honeypot\) \{/);
});

test("contact submission rejects oversized and malformed bodies before creating leads", () => {
  const submitContactInquiry = read("base44/functions/submitContactInquiry/entry.ts");

  assert.match(submitContactInquiry, /const MAX_CONTACT_BODY_BYTES = 12 \* 1024/);
  assert.match(submitContactInquiry, /content-length/);
  assert.match(submitContactInquiry, /Submission is too large/);
  assert.match(submitContactInquiry, /JSON body required/);
  assert.match(submitContactInquiry, /await req\.json\(\)\.catch\(\(\) => null\)/);
  assert.match(submitContactInquiry, /Invalid JSON body/);
});

test("production CSP permits Calendly frames", () => {
  const headers = read("public/_headers");
  assert.match(headers, /frame-src[^;\n]*https:\/\/calendly\.com/);
  assert.match(headers, /frame-src[^;\n]*https:\/\/assets\.calendly\.com/);
});

test("Base44 deploy headers cover exact sensitive route paths", () => {
  const headers = read("public/_headers");

  for (const path of ["/admin", "/admin/", "/client-portal", "/onboarding", "/setup/preview/security-check", "/motion-lab"]) {
    assert.match(headers, new RegExp(`${path.replace(/[/*]/g, (char) => `\\${char}`)}[\\s\\S]*X-Robots-Tag: noindex, nofollow, noarchive`));
    assert.match(headers, new RegExp(`${path.replace(/[/*]/g, (char) => `\\${char}`)}[\\s\\S]*Cache-Control: no-store`));
  }
});

test("sensitive route metadata falls back to noarchive and cache hints in-app", () => {
  const app = read("src/App.jsx");
  const index = read("index.html");

  assert.match(app, /noindex,nofollow,noarchive/);
  assert.match(app, /meta\[http-equiv="Cache-Control"\]/);
  assert.match(app, /cacheControlMeta\.setAttribute\("content", "no-store"\)/);
  assert.match(index, /var noindexPrefixes = \[/);
  assert.match(index, /"\/client-portal"/);
  assert.match(index, /"\/setup"/);
  assert.match(index, /"\/motion-lab"/);
  assert.match(index, /isSensitiveRoute \? "noindex,nofollow,noarchive" : "index,follow"/);
  assert.match(index, /"http-equiv": "Cache-Control"/);
  assert.match(index, /setAttribute\("content", "no-store"\)/);
});

test("Base44 deploy headers cache Vite asset chunks for a year", () => {
  const headers = read("public/_headers");

  assert.match(headers, /\/assets\/\*\.js[\s\S]*Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/assets\/\*\.css[\s\S]*Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/assets\/\*[\s\S]*Cache-Control: public, max-age=31536000, immutable/);
});

test("internal operational pages are lazy loaded out of the public app shell", () => {
  const app = read("src/App.jsx");

  for (const page of [
    "Onboarding",
    "BusinessSetup",
    "CredentialsSetup",
    "SetupStatus",
    "WebsitePreview",
    "AdminInstallGuide",
    "AISalesCommandCenter",
    "PerformanceWars",
  ]) {
    assert.match(app, new RegExp(`const ${page} = lazy\\(\\(\\) => import\\("\\./internal-pages/${page}"\\)\\)`));
    assert.doesNotMatch(app, new RegExp(`import ${page} from "\\./internal-pages/${page}"`));
  }
});

test("non-home public routes are lazy loaded out of the first app shell", () => {
  const app = read("src/App.jsx");
  const lazyPublicPages = {
    Start: "./pages/Start",
    Book: "./pages/Book",
    Contact: "./pages/Contact",
    Industries: "./pages/Industries",
    Blog: "./pages/Blog",
    Login: "./pages/Login",
    About: "./pages/About",
    Automations: "./pages/Automations",
    IndustryTemplate: "./components/landing/IndustryTemplate",
    LegalPage: "./internal-pages/LegalPage",
    AutomationServicePage: "./internal-pages/AutomationServicePage",
  };

  for (const [page, importPath] of Object.entries(lazyPublicPages)) {
    assert.match(app, new RegExp(`const ${page} = lazy\\(\\(\\) => import\\("${importPath.replaceAll("/", "\\/")}"\\)\\)`));
    assert.doesNotMatch(app, new RegExp(`import ${page} from "${importPath.replaceAll("/", "\\/")}"`));
  }

  assert.match(app, /componentProps=\{\{ industrySlug: slug \}\}/);
  assert.match(app, /componentProps=\{\{\s*fixedType: "privacy"/);
});

test("FAQ schema data is shared without importing the lazy FAQ component", () => {
  const home = read("src/pages/Home.jsx");
  const faq = read("src/components/landing/FAQ.jsx");
  const faqItems = read("src/lib/faqItems.js");

  assert.match(home, /import \{ FAQ_ITEMS \} from "@\/lib\/faqItems"/);
  assert.match(faq, /import \{ FAQ_ITEMS \} from "@\/lib\/faqItems"/);
  assert.doesNotMatch(faq, /export const FAQ_ITEMS/);
  assert.match(faqItems, /export const FAQ_ITEMS = \[/);
});

test("Vite manual chunks do not force unused empty vendor bundles", () => {
  const viteConfig = read("vite.config.js");

  assert.match(viteConfig, /"vendor-framer": \["framer-motion"\]/);
  assert.match(viteConfig, /"vendor-charts": \["recharts"\]/);
  assert.match(viteConfig, /"vendor-lucide": \["lucide-react"\]/);
  assert.doesNotMatch(viteConfig, /vendor-stripe/);
});

test("static fallback exposes only one raw h1 to crawlers", () => {
  const index = read("index.html");
  const h1s = index.match(/<h1\b/gi) || [];
  assert.equal(h1s.length, 1);
  assert.match(index, /<h1 id="static-home-heading">AI Automation Systems That Turn More Local Leads Into Booked Jobs<\/h1>/);
  assert.match(index, /<h2 id="static-book-heading">Book Your Free ClientSurge Automation Audit<\/h2>/);
});

test("legacy industry automation URLs redirect to canonical industry slugs", () => {
  const redirects = read("public/_redirects");
  const app = read("src/App.jsx");

  for (const [legacy, canonical] of [
    ["/roofing-automation", "/roofing"],
    ["/hvac-automation", "/hvac"],
    ["/dental-automation", "/dental"],
    ["/med-spa-automation", "/med-spa"],
    ["/chiropractic-automation", "/chiropractic"],
    ["/contractor-automation", "/contractors"],
  ]) {
    assert.match(redirects, new RegExp(`${legacy} ${canonical} 301`));
    assert.match(app, new RegExp(`from: routePath\\("${legacy.slice(1)}"\\), to: routePath\\("${canonical.slice(1)}"\\)`));
  }
});

test("Elite intake wizard persists progress and validates Google Business Profile URLs", () => {
  const wizard = read("src/components/onboarding/CredentialsWizard.jsx");
  assert.match(wizard, /clientsurge:elite-intake:/);
  assert.match(wizard, /sessionStorage\.setItem/);
  assert.match(wizard, /Step \{i \+ 1\}: \{step\.title\}/);
  assert.match(wizard, /host === "g\.page"/);
  assert.match(wizard, /host === "google\.com" && url\.pathname\.startsWith\("\/maps"\)/);
});

test("Elite intake color pickers preview and save brand colors", () => {
  const wizard = read("src/components/onboarding/CredentialsWizard.jsx");
  assert.match(wizard, /type="color"/);
  assert.match(wizard, /style=\{\{ backgroundColor: value \}\}/);
  assert.match(wizard, /primary_color: data\.primary_color/);
  assert.match(wizard, /secondary_color: data\.secondary_color/);
});

test("Footer exposes the six active industry routes and no dead tanning route", () => {
  const footer = read("src/components/landing/Footer.jsx");
  for (const route of ["/med-spa", "/dental", "/chiropractic", "/hvac", "/roofing", "/contractors"]) {
    assert.match(footer, new RegExp(`href: "${route}"`));
  }
  assert.doesNotMatch(footer, /\/tanning/);
});

test("public pages use setPageMetadata for descriptions and Open Graph tags", () => {
  for (const path of [
    "src/pages/Home.jsx",
    "src/pages/Store.jsx",
    "src/pages/Book.jsx",
    "src/pages/Contact.jsx",
    "src/pages/Blog.jsx",
    "src/pages/About.jsx",
    "src/pages/Industries.jsx",
    "src/pages/Automations.jsx",
    "src/pages/Login.jsx",
    "src/pages/Start.jsx",
    "src/components/landing/IndustryTemplate.jsx",
  ]) {
    const source = read(path);
    assert.match(source, /setPageMetadata\(/, `${path} should call setPageMetadata`);
  }
  const seo = read("src/lib/seo.js");
  assert.match(seo, /ensureMeta\("property", "og:title"\)/);
  assert.match(seo, /ensureMeta\("property", "og:description"\)/);
  assert.match(seo, /ensureMeta\("property", "og:image"\)/);
});

test("admin dashboard contains per-client LTV calculation", () => {
  const dashboardCards = read("src/components/admin/AdminDashboardCards.jsx");
  assert.match(dashboardCards, /export function LTVCard/);
  assert.match(dashboardCards, /Avg \$\{avgLTV\.toLocaleString\(\)\} \/ client/);
  assert.match(dashboardCards, /monthly_rate/);
});

test("public primary CTAs use blue gradients outside store checkout surfaces", () => {
  const benefits = read("src/components/landing/Benefits.jsx");
  const calculator = read("src/components/landing/LeadValueCalculator.jsx");
  const showcase = read("src/components/landing/LeadAutomationShowcase.jsx");

  assert.match(benefits, /background:"linear-gradient\(135deg,#0088CC[\s\S]{0,500}Make the Leap/);
  assert.match(calculator, /background: "linear-gradient\(135deg,#0088CC[\s\S]{0,500}Recover This Revenue/);
  assert.match(showcase, /background: "linear-gradient\(135deg, #0088CC[\s\S]{0,500}Book Your Demo/);
});
