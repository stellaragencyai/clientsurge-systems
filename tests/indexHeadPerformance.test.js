import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const indexCss = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");

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

  assert.equal(fontUrls.length, 4);
  assert.equal(fontUrls.filter((url) => url.includes("family=Inter:wght@400;500;600;700")).length, 2);
  assert.equal(fontUrls.filter((url) => url.includes("family=Playfair+Display:wght@400;600")).length, 2);
  assert.equal(fontUrls.filter((url) => url.includes("family=Bebas+Neue")).length, 2);
  assert.equal(fontUrls.filter((url) => url.includes("family=Montserrat:wght@700;800;900")).length, 2);
  assert.ok(fontUrls.every((url) => !url.includes("ital")));
  assert.ok(fontUrls.every((url) => !url.includes("font-display")));
});

test("index head exposes a launch-ready social preview image", () => {
  assert.match(indexHtml, /<meta property="og:image" content="https:\/\/[^"]+"/);
  assert.match(indexHtml, /<meta property="og:image:width" content="1200"/);
  assert.match(indexHtml, /<meta property="og:image:height" content="630"/);
  assert.match(indexHtml, /<meta property="twitter:card" content="summary_large_image"/);
  assert.match(indexHtml, /<meta property="twitter:image" content="https:\/\/[^"]+"/);
});

test("css does not block rendering with Google Font imports", () => {
  assert.doesNotMatch(indexCss, /@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com/);
});
