import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const rg = (...args) =>
  execFileSync("rg", args, { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);

test("backend functions use secure JSON responses instead of raw Response.json", () => {
  let matches = [];
  try {
    matches = rg("-n", "Response\\.json", "base44/functions");
  } catch {
    matches = [];
  }

  assert.deepEqual(matches, []);
});

test("non-json backend Response constructors declare X-Frame-Options", () => {
  const files = rg("-l", "new Response", "base44/functions");
  const helperFiles = new Set([
    "base44\\functions\\_shared\\response.ts",
    "base44/functions/_shared/response.ts",
    "base44\\functions\\_shared\\secureJson.js",
    "base44/functions/_shared/secureJson.js",
    "base44\\functions\\shared\\response.ts",
    "base44/functions/shared/response.ts",
  ]);

  const missing = files.filter((file) => {
    if (helperFiles.has(file)) return false;
    const source = readFileSync(file, "utf8");
    return !source.includes("X-Frame-Options");
  });

  assert.deepEqual(missing, []);
});

test("shared JavaScript helpers do not import TypeScript response modules", () => {
  for (const file of [
    "base44/functions/_shared/legacyQuarantine.js",
    "base44/functions/_shared/stripeOrderWebhook.js",
    "base44/functions/_shared/webhookSecurity.js",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /from ["'].*response\.ts["']/);
    assert.match(source, /from "\.\/secureJson\.js"/);
  }
});
