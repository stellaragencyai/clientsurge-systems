import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const FRONTEND_SCAN_DIRS = ["src", "public"];
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage"]);
const SKIP_EXTENSIONS = new Set([
  ".avif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
  ".woff",
  ".woff2",
]);

const SECRET_KEY_PATTERNS = [
  /sk_live_[a-zA-Z0-9]{20,}/,
  /sk_test_[a-zA-Z0-9]{20,}/,
  /rk_live_[a-zA-Z0-9]{20,}/,
  /whsec_[a-zA-Z0-9+/=]{20,}/,
  /re_[a-zA-Z0-9]{20,}/,
  /OPENAI_API_KEY\s*=\s*["']sk-[a-zA-Z0-9]{20,}/,
  /TWILIO_AUTH_TOKEN\s*=\s*["'][a-zA-Z0-9]{30,}/,
];

function* walkFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) {
        yield* walkFiles(fullPath);
      }
      continue;
    }

    if (!SKIP_EXTENSIONS.has(path.extname(entry).toLowerCase())) {
      yield fullPath;
    }
  }
}

test("frontend source does not expose server-side provider secrets", () => {
  const findings = [];

  for (const scanDir of FRONTEND_SCAN_DIRS) {
    for (const filePath of walkFiles(scanDir)) {
      const source = readFileSync(filePath, "utf8");

      for (const pattern of SECRET_KEY_PATTERNS) {
        if (pattern.test(source)) {
          findings.push(`${filePath} matched ${pattern}`);
        }
      }
    }
  }

  assert.deepEqual(findings, []);
});

