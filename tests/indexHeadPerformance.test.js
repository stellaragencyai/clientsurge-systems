import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("index head includes payment and messaging resource hints", () => {
  const hintedOrigins = [
    "https://js.stripe.com",
    "https://checkout.stripe.com",
    "https://api.twilio.com",
    "https://api.resend.com",
  ];

  for (const origin of hintedOrigins) {
    assert.match(indexHtml, new RegExp(`<link rel="dns-prefetch" href="${origin.replace(/\./g, "\\.")}"`));
    assert.match(indexHtml, new RegExp(`<link rel="preconnect" href="${origin.replace(/\./g, "\\.")}" crossorigin`));
  }
});

test("index head loads only the approved Google Font subsets", () => {
  const fontUrls = [...indexHtml.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/g)].map((match) => match[0]);

  assert.equal(fontUrls.length, 2);
  assert.ok(fontUrls.every((url) => url.includes("family=Inter:wght@400;500;600;700")));
  assert.ok(fontUrls.every((url) => url.includes("family=Playfair+Display:wght@400;600")));
  assert.ok(fontUrls.every((url) => !url.includes("800")));
  assert.ok(fontUrls.every((url) => !url.includes("0,700")));
  assert.ok(fontUrls.every((url) => !url.includes("ital")));
  assert.ok(fontUrls.every((url) => !url.includes("font-display")));
});
