import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const functionConfig = readFileSync(
  new URL("../base44/functions/createCheckoutSession/function.jsonc", import.meta.url),
  "utf8"
);
const checkoutSource = readFileSync(
  new URL("../base44/functions/createCheckoutSession/main.ts", import.meta.url),
  "utf8"
);
const backendCatalog = readFileSync(
  new URL("../base44/functions/createCheckoutSession/salesCatalog.shared.js", import.meta.url),
  "utf8"
);

test("Base44 deploys the checkout implementation protected by this contract", () => {
  assert.match(functionConfig, /"entry"\s*:\s*"main\.ts"/);
});

test("checkout charges setup now and delays monthly billing by 30 days", () => {
  assert.match(checkoutSource, /mode:\s*"subscription"/);
  assert.match(checkoutSource, /trial_period_days:\s*30/);
  assert.match(
    checkoutSource,
    /end_behavior:\s*\{\s*missing_payment_method:\s*"cancel"\s*\}/
  );
  assert.match(checkoutSource, /buildStripeLineItemsForPricingSummary\(pricingSummary\)/);
});

test("backend package catalog matches the final live billing contract", () => {
  const expected = [
    {
      key: "starter_system",
      setup: 249,
      monthly: 99,
      setupPrice: "price_1TyJ0sBVGjsISdG0WTYUzr4U",
      monthlyPrice: "price_1TyJ0zBVGjsISdG05Nwwf4CR",
    },
    {
      key: "growth_system",
      setup: 499,
      monthly: 249,
      setupPrice: "price_1TyJ15BVGjsISdG0kwqh9Pkk",
      monthlyPrice: "price_1TyJ1CBVGjsISdG06Qlx3730",
    },
    {
      key: "pro_system",
      setup: 999,
      monthly: 499,
      setupPrice: "price_1TyJ1IBVGjsISdG00IO5OwMd",
      monthlyPrice: "price_1TyJ1PBVGjsISdG0e9F1BvaO",
    },
  ];

  for (const pkg of expected) {
    const packageBlock = new RegExp(
      `package_key:\\s*"${pkg.key}"[\\s\\S]*?setup_price_id:\\s*"${pkg.setupPrice}"[\\s\\S]*?monthly_price_id:\\s*"${pkg.monthlyPrice}"[\\s\\S]*?setup_total:\\s*${pkg.setup}[\\s\\S]*?monthly_total:\\s*${pkg.monthly}`
    );
    assert.match(backendCatalog, packageBlock);
  }
});
