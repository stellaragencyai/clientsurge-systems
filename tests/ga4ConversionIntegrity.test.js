import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const ga4Source = read("src/lib/ga4.js");
const analyticsSource = read("src/lib/analytics.js");
const checkoutObserverSource = read("src/lib/ga4CheckoutObserver.js");
const eventHelpersSource = read("src/utils/ga4Events.js");
const autoCtaSource = read("src/components/analytics/AutoCTAAnalytics.jsx");
const publicFunctionSource = read("src/lib/publicFunctionClient.js");
const base44ClientSource = read("src/api/base44Client.js");
const orderSuccessSource = read("src/internal-pages/OrderSuccess.jsx");
const configSchemaSource = read("base44/entities/GA4Configuration.jsonc");
const setupFunctionSource = read("base44/functions/setupGA4Configuration/entry.ts");

test("GA4 private credentials cannot be persisted in GA4Configuration", () => {
  assert.doesNotMatch(configSchemaSource, /"api_secret"\s*:/);
  assert.match(configSchemaSource, /"server_side_tracking_enabled"\s*:/);
  assert.match(setupFunctionSource, /GA4_SECRET_MUST_USE_SECRET_STORE/);
  assert.match(setupFunctionSource, /GA4_API_SECRET/);
  assert.doesNotMatch(setupFunctionSource, /api_secret:\s*api_secret/);
});

test("GA4 setup remains configured until live delivery is independently verified", () => {
  assert.match(setupFunctionSource, /setup_status:\s*"configured"/);
  assert.match(setupFunctionSource, /server_side_tracking_enabled:\s*false/);
  assert.doesNotMatch(setupFunctionSource, /last_verified_at\s*:/);
});

test("canonical GA4 key-event catalog is consistent", () => {
  for (const eventName of ["generate_lead", "begin_checkout", "purchase", "demo_booked"]) {
    assert.match(ga4Source, new RegExp(`\\b${eventName}\\b`));
    assert.match(configSchemaSource, new RegExp(`"${eventName}"`));
    assert.match(setupFunctionSource, new RegExp(`"${eventName}"`));
  }

  assert.match(eventHelpersSource, /GA4_EVENTS\.GENERATE_LEAD/);
  assert.match(eventHelpersSource, /GA4_EVENTS\.BEGIN_CHECKOUT/);
  assert.match(eventHelpersSource, /GA4_EVENTS\.PURCHASE/);
  assert.match(eventHelpersSource, /GA4_EVENTS\.DEMO_BOOKED/);
});

test("failed or merely attempted forms cannot masquerade as successful submissions", () => {
  assert.match(ga4Source, /FORM_SUBMIT_ATTEMPT:\s*"form_submit_attempt"/);
  assert.match(ga4Source, /params\.submission_status !== "success"/);
  assert.match(eventHelpersSource, /submission_status:\s*"success"/);
});

test("React Router navigation sends explicit SPA page views", () => {
  assert.match(autoCtaSource, /trackGa4PageView\s*\(/);
  assert.match(autoCtaSource, /location\.pathname/);
  assert.match(autoCtaSource, /location\.search/);
  assert.match(autoCtaSource, /GA4_EVENTS\.PRICING_VIEW/);
  assert.match(autoCtaSource, /GA4_EVENTS\.CTA_CLICK/);
  assert.doesNotMatch(autoCtaSource, /cta_click_auto/);
});

test("GA4 initialization and event dispatch use one canonical helper", () => {
  assert.match(analyticsSource, /trackGa4Event/);
  assert.match(analyticsSource, /installGa4CheckoutObserver/);
  assert.match(ga4Source, /dataLayerConfig/);
  assert.match(ga4Source, /if \(!existingConfig\)/);
  assert.match(ga4Source, /if \(!existingScript\)/);
  assert.match(ga4Source, /EVENT_DEDUP_WINDOW_MS/);
});

test("contact outcomes emit lead events only after a successful backend response", () => {
  assert.match(publicFunctionSource, /if \(!response\.ok \|\| data\?\.success === false\)/);
  assert.match(publicFunctionSource, /trackSuccessfulPublicOutcome\(functionName, payload, data\)/);
  assert.match(publicFunctionSource, /trackSuccessfulFormSubmit/);
  assert.match(publicFunctionSource, /trackContactSubmit/);
  assert.match(publicFunctionSource, /trackLeadSubmit/);
});

test("audit requests are tracked as requests, not confirmed demo bookings", () => {
  assert.match(base44ClientSource, /functionName !== "scheduleDemoBooking"/);
  assert.match(base44ClientSource, /trackAuditRequestSubmitted/);
  assert.match(base44ClientSource, /trackLeadSubmit/);
  assert.doesNotMatch(base44ClientSource, /trackDemoBooked/);
  assert.doesNotMatch(base44ClientSource, /GA4_EVENTS\.DEMO_BOOKED/);
});

test("begin_checkout fires only after checkout session creation succeeds", () => {
  assert.match(checkoutObserverSource, /createCheckoutSession/);
  assert.match(checkoutObserverSource, /response\.ok/);
  assert.match(checkoutObserverSource, /checkoutUrl/);
  assert.match(checkoutObserverSource, /GA4_EVENTS\.BEGIN_CHECKOUT/);
});

test("purchase remains tied to a verified order and is idempotent in the success page", () => {
  assert.match(orderSuccessSource, /if \(!orderInfo\?\.id\) return/);
  assert.match(orderSuccessSource, /clientsurge:ga4-purchase-fired:/);
  assert.match(orderSuccessSource, /trackEvent\("purchase"/);
  assert.match(orderSuccessSource, /transaction_id:/);
});
