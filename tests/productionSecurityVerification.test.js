import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evaluateCanonicalRedirect,
  evaluateCanonicalText,
  evaluatePublicHeaders,
  evaluateSensitiveHeaders,
  headersToObject,
} from "../scripts/verify-production-security.mjs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("production verifier normalizes headers for case-insensitive checks", () => {
  const headers = headersToObject({
    "Content-Security-Policy": "default-src 'self'",
    "X-Frame-Options": "SAMEORIGIN",
  });

  assert.equal(headers["content-security-policy"], "default-src 'self'");
  assert.equal(headers["x-frame-options"], "SAMEORIGIN");
});

test("production verifier accepts the canonical www-to-apex redirect", () => {
  const check = evaluateCanonicalRedirect({
    fromUrl: "https://www.clientsurgesystems.com/",
    status: 301,
    location: "https://clientsurgesystems.com/",
    expectedUrl: "https://clientsurgesystems.com/",
  });

  assert.equal(check.status, "pass");
});

test("production verifier fails redirect drift back to www", () => {
  const check = evaluateCanonicalRedirect({
    fromUrl: "https://www.clientsurgesystems.com/",
    status: 301,
    location: "https://www.clientsurgesystems.com/",
    expectedUrl: "https://clientsurgesystems.com/",
  });

  assert.equal(check.status, "fail");
});

test("production verifier requires public security headers", () => {
  const checks = evaluatePublicHeaders({
    target: "https://clientsurgesystems.com/",
    headers: {
      "content-security-policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'",
      "x-frame-options": "SAMEORIGIN",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=()",
      "cross-origin-opener-policy": "same-origin-allow-popups",
      "strict-transport-security": "max-age=31536000",
    },
  });

  assert.equal(checks.filter((check) => check.status === "fail").length, 0);
});

test("production verifier fails sensitive routes without noindex and no-store", () => {
  const checks = evaluateSensitiveHeaders({
    target: "https://clientsurgesystems.com/admin/",
    headers: {},
  });

  assert.deepEqual(checks.map((check) => check.status), ["fail", "fail"]);
});

test("production verifier flags alternate-domain references in sitemap-like documents", () => {
  const check = evaluateCanonicalText({
    target: "https://clientsurgesystems.com/sitemap.xml",
    body: "<loc>https://www.clientsurgesystems.com/</loc>",
    canonicalOrigin: "https://clientsurgesystems.com",
    alternateOrigin: "https://www.clientsurgesystems.com",
  });

  assert.equal(check.status, "fail");
});

test("Base44 release script keeps the production security gate visible after publish", () => {
  const releaseScript = read("scripts/release-base44.ps1");

  assert.match(releaseScript, /\[switch\]\$RunProductionSecurityGate/);
  assert.match(releaseScript, /Run: npm run verify:production-security/);
  assert.match(releaseScript, /Use -RunProductionSecurityGate only after the live publish has finished/);
  assert.match(releaseScript, /Invoke-CommandString 'npm run verify:production-security'/);
});
