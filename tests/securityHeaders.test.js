import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function readProjectFile(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function getCspDirective(csp, directiveName) {
  return csp
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith(`${directiveName} `)) || "";
}

test("index.html CSP no longer allows arbitrary HTTPS scripts", () => {
  const index = readProjectFile("index.html");
  const match = index.match(/Content-Security-Policy" content="([^"]+)"/);
  assert.ok(match, "CSP meta tag should exist");
  const csp = match[1];
  const scriptSrc = getCspDirective(csp, "script-src");

  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.ok(!scriptSrc.split(/\s+/).includes("https:"), "script-src must not include bare https:");
  assert.match(scriptSrc, /https:\/\/js\.stripe\.com/);
});

test("public headers include browser hardening and noindex protections", () => {
  const headers = readProjectFile("public/_headers");

  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /Permissions-Policy:/);
  assert.match(headers, /Strict-Transport-Security: max-age=31536000; includeSubDomains; preload/);
  assert.match(headers, /X-Frame-Options: SAMEORIGIN/);
  assert.match(headers, /\/admin\/\*[\s\S]*X-Robots-Tag: noindex, nofollow, noarchive/);
  assert.match(headers, /\/client-portal\/\*[\s\S]*Cache-Control: no-store/);
  assert.match(headers, /\/onboarding\*[\s\S]*Cache-Control: no-store/);
  assert.match(headers, /\/setup\/preview\*[\s\S]*Cache-Control: no-store/);
  assert.match(headers, /\/motion-lab\*[\s\S]*Cache-Control: no-store/);
});

test("robots blocks sensitive operational surfaces from discovery", () => {
  const robots = readProjectFile("public/robots.txt");

  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/client-portal/);
  assert.match(robots, /Disallow: \/setup\/preview/);
  assert.match(robots, /Disallow: \/onboarding/);
  assert.match(robots, /Disallow: \/motion-lab/);
});

test("security.txt gives researchers a clear defensive disclosure path", () => {
  const securityTxt = readProjectFile("public/.well-known/security.txt");

  assert.match(securityTxt, /Contact: mailto:support@clientsurgesystems\.com/);
  assert.match(securityTxt, /Canonical: https:\/\/clientsurgesystems\.com\/\.well-known\/security\.txt/);
});
