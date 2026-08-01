import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  APP_SHELL_PUBLIC_PATHS,
  PUBLIC_DIRECTORY_PAGES,
  PUBLIC_ROUTE_METADATA,
  PUBLIC_ROUTE_PATHS,
  SITEMAP_STATIC_PATHS,
  STATIC_ROUTE_ALIASES,
} from "../src/lib/publicRouteMetadata.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const contactPageSource = readFileSync(new URL("../src/pages/Contact.jsx", import.meta.url), "utf8");

const INTENDED_PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/automations",
  "/contact",
  "/industries",
  "/proof",
  "/faq",
  "/how-it-works",
  "/about",
  "/blog",
  "/testimonials",
  "/roadmap",
  "/privacy",
  "/terms",
  "/sms-terms",
  "/refund-policy",
];

const HOMEPAGE_TITLE = "ClientSurge Systems | AI-Powered Sales Systems for Local Businesses";
const CONTACT_TITLE = "Contact ClientSurge Systems | Questions and Support";

const BANNED_CONTACT_COPY = [
  "Need Help?",
  "Questions Before Choosing a System?",
  "Send a Setup Question",
  "Tell us what you need help choosing, connecting, or understanding.",
  "Compare Packages → Guided Intake → Checkout",
];

test("shared public route arrays stay aligned to the Track A whitelist", () => {
  assert.deepEqual(PUBLIC_DIRECTORY_PAGES, INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(PUBLIC_ROUTE_PATHS, INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(SITEMAP_STATIC_PATHS, INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(Object.keys(PUBLIC_ROUTE_METADATA), INTENDED_PUBLIC_ROUTES);
  for (const route of INTENDED_PUBLIC_ROUTES) {
    assert.ok(APP_SHELL_PUBLIC_PATHS.includes(route), `${route} should render in the app shell`);
  }
});

test("legacy public aliases collapse into the cleaned public surface", () => {
  for (const [from, to] of Object.entries(STATIC_ROUTE_ALIASES)) {
    assert.ok(from.startsWith("/"), `${from} should be absolute`);
    const targetPath = String(to).split(/[?#]/)[0];
    assert.ok(
      INTENDED_PUBLIC_ROUTES.includes(targetPath) ||
        ["/product-signup", "/client-portal", "/admin"].includes(targetPath) ||
        targetPath.startsWith("/admin/") ||
        targetPath.startsWith("/setup/"),
      `${from} should redirect to an intended public or guarded utility route`,
    );
  }
});

test("static fallback does not contain generated route map or public Pages directory", () => {
  assert.doesNotMatch(indexHtml, /var routeMap\s*=/);
  assert.doesNotMatch(indexHtml, />Pages</i);
  assert.doesNotMatch(indexHtml, /Admin Dashboard|Business Setup|Client Portal|Internal|Function Audit/i);
});

test("public copy lock protects homepage and contact metadata", () => {
  assert.equal(PUBLIC_ROUTE_METADATA["/"].title, HOMEPAGE_TITLE);
  assert.equal(PUBLIC_ROUTE_METADATA["/contact"].title, CONTACT_TITLE);
  assert.ok(indexHtml.includes(`<title>${HOMEPAGE_TITLE}</title>`));
  assert.doesNotMatch(indexHtml, /AI Growth Systems for Local Service Businesses/);
});

test("contact page keeps approved Contact Us wording and blocks setup-only drift", () => {
  assert.match(contactPageSource, />\s*Contact Us\s*</);
  assert.match(contactPageSource, /Send us a message and we will get right back to you within one business day\./);
  assert.match(contactPageSource, /message="Thanks for reaching out\. Your inquiry has been logged\."/);

  for (const phrase of BANNED_CONTACT_COPY) {
    assert.ok(!contactPageSource.includes(phrase), `Contact page should not contain banned copy: ${phrase}`);
  }
});
