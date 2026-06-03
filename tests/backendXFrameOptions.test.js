import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const toPosixPath = (file) => file.replace(/\\/g, "/");

const walkFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  });

const filesMatching = (pattern, dir) => {
  const regex = new RegExp(pattern);
  return walkFiles(dir)
    .filter((file) => regex.test(readFileSync(file, "utf8")))
    .map((file) => toPosixPath(relative(process.cwd(), file)));
};

const lineMatches = (pattern, dir) => {
  const regex = new RegExp(pattern);
  return walkFiles(dir).flatMap((file) => {
    const relativeFile = toPosixPath(relative(process.cwd(), file));
    return readFileSync(file, "utf8")
      .split(/\r?\n/)
      .flatMap((line, index) =>
        regex.test(line) ? [`${relativeFile}:${index + 1}:${line}`] : [],
      );
  });
};

test("backend functions use secure JSON responses instead of raw Response.json", () => {
  const matches = lineMatches("Response\\.json", "base44/functions");
  assert.deepEqual(matches, []);
});

test("non-json backend Response constructors declare X-Frame-Options", () => {
  const files = filesMatching("new Response", "base44/functions");
  const helperFiles = new Set([
    "base44/functions/_shared/response.ts",
    "base44/functions/_shared/secureJson.js",
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
