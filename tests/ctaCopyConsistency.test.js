import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src/components/landing", "src/pages"];
const blockedPhrases = [
  "Book Your Free Demo",
  "Book a Demo",
  "Book Demo",
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) return listFiles(fullPath);
    return /\.(jsx|js)$/.test(entry) ? [fullPath] : [];
  });
}

test("public CTA copy uses the current Make the Leap language", () => {
  const offenders = [];

  for (const file of roots.flatMap(listFiles)) {
    const content = readFileSync(file, "utf8");
    for (const phrase of blockedPhrases) {
      if (content.includes(phrase)) offenders.push(`${file}: ${phrase}`);
    }
  }

  assert.deepEqual(offenders, []);
});
