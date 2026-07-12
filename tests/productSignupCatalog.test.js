import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PACKAGE_OFFERS } from "../src/lib/salesCatalog.js";

const signup = readFileSync(new URL("../src/pages/ProductSignup.jsx", import.meta.url), "utf8");

const checkoutPackages = PACKAGE_OFFERS.filter((offer) => offer.checkout_enabled);

test("product signup derives all package names, prices, and features from the canonical catalog", () => {
  assert.match(signup, /PACKAGE_OFFERS/);
  assert.match(signup, /CHECKOUT_PACKAGES = PACKAGE_OFFERS\.filter/);
  assert.match(signup, /currentPkg\.setup_total \+ currentPkg\.monthly_total/);
  assert.match(signup, /currentPkg\.included_services/);

  assert.deepEqual(
    checkoutPackages.map((offer) => [offer.package_key, offer.setup_total, offer.monthly_total]),
    [
      ["starter_system", 797, 497],
      ["growth_system", 1297, 997],
      ["pro_system", 2497, 1997],
    ],
  );
});

test("checkout states the exact first payment structure", () => {
  assert.match(signup, /First Stripe payment:/);
  assert.match(signup, /first payment includes the one-time setup fee and the first month/i);
  assert.match(signup, /monthly subscription then renews/);
});

test("signup package summaries match the locked six-automation offer", () => {
  assert.match(signup, /Instant lead response and missed-call text-back/);
  assert.match(signup, /Starter plus 14-day nurture and AI booking handoff/);
  assert.match(signup, /Growth plus old lead reactivation and review requests/);
  assert.doesNotMatch(signup, /reporting layer|voice receptionist|annual discount/i);
});

test("industry selection is required and uses canonical CRM labels", () => {
  assert.match(signup, /Please select your industry/);
  assert.match(signup, /Industry \/ Business Type \*/);
  for (const industry of [
    "HVAC",
    "Roofing & Restoration",
    "Dental & Orthodontics",
    "Med Spa & Aesthetics",
    "Plumbing",
    "Physical Therapy & Rehabilitation",
    "Contractors & Trades",
  ]) {
    assert.match(signup, new RegExp(industry.replace(/[&]/g, "&")));
  }
});

test("checkout still routes through the Base44 session function and Stripe", () => {
  assert.match(signup, /createCheckoutSession/);
  assert.match(signup, /success_url/);
  assert.match(signup, /cancel_url/);
  assert.match(signup, /Continue to Secure Checkout/);
  assert.match(signup, /no card details stored by ClientSurge/i);
});
