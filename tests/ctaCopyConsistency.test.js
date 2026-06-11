import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = [
  "src/components/landing",
  "src/components/medspa",
  "src/data",
  "src/lib",
  "src/pages",
];
const blockedPhrases = [
  "Book Your Free Demo",
  "Book a Demo",
  "Book Demo",
  "Book Free Demo",
  "Book a Free Demo",
  "Schedule Demo",
  "Get My Free Demo",
  "Free Demo",
  "Make the Leap",
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) return listFiles(fullPath);
    return /\.(jsx|js|json)$/.test(entry) ? [fullPath] : [];
  });
}

test("public CTA copy avoids stale demo-first and Make the Leap language", () => {
  const offenders = [];

  for (const file of roots.flatMap(listFiles)) {
    const content = readFileSync(file, "utf8");
    for (const phrase of blockedPhrases) {
      if (content.includes(phrase)) offenders.push(`${file}: ${phrase}`);
    }
  }

  assert.deepEqual(offenders, []);
});

test("public CTA copy preserves Free Automation Audit as the primary CTA", () => {
  const requiredFiles = [
    "src/components/landing/Navbar.jsx",
    "src/components/landing/Footer.jsx",
    "src/components/landing/MobileCallBar.jsx",
    "src/pages/Automations.jsx",
    "src/pages/Industries.jsx",
  ];

  for (const file of requiredFiles) {
    const content = readFileSync(file, "utf8");
    assert.match(content, /Free Automation Audit/, `${file} should use Free Automation Audit`);
  }
});
