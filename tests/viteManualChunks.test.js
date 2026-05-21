import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const viteConfig = readFileSync("vite.config.js", "utf8");

test("Vite manual chunks do not force an empty Stripe vendor bundle", () => {
  assert.doesNotMatch(viteConfig, /vendor-stripe/);
  assert.doesNotMatch(viteConfig, /"@stripe\/stripe-js"/);
});

test("Vite manual chunks keep the active heavy UI libraries split", () => {
  assert.match(viteConfig, /"vendor-framer": \["framer-motion"\]/);
  assert.match(viteConfig, /"vendor-charts": \["recharts"\]/);
  assert.match(viteConfig, /"vendor-lucide": \["lucide-react"\]/);
});
