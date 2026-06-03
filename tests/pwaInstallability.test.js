import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const indexHtml = readFileSync("index.html", "utf8");
const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
const serviceWorker = readFileSync("public/sw.js", "utf8");
const mainSource = readFileSync("src/main.jsx", "utf8");

test("index exposes a PWA manifest with installable metadata", () => {
  assert.match(indexHtml, /<link rel="manifest" href="\/manifest\.json" \/>/);
  assert.equal(manifest.name, "ClientSurge Systems");
  assert.equal(manifest.short_name, "ClientSurge");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.theme_color, "#0A1628");
  assert.ok(manifest.icons.some((icon) => icon.src === "/pwa-icon.svg" && icon.purpose.includes("maskable")));
});

test("production app registers the local service worker", () => {
  assert.match(mainSource, /import\.meta\.env\.PROD/);
  assert.match(mainSource, /'serviceWorker' in navigator/);
  assert.match(mainSource, /navigator\.serviceWorker\.register\('\/sw\.js'\)/);
  assert.match(mainSource, /registration\.update\(\)/);
});

test("service worker caches only same-origin static PWA assets", () => {
  assert.match(serviceWorker, /const CACHE_NAME = "clientsurge-shell-v2"/);
  assert.match(serviceWorker, /const CORE_ASSETS = \["\/manifest\.json", "\/pwa-icon\.svg"\]/);
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
  assert.match(serviceWorker, /event\.request\.method !== "GET"/);
  assert.match(serviceWorker, /event\.request\.mode === "navigate"/);
  assert.match(serviceWorker, /includes\("text\/html"\)/);
  assert.match(serviceWorker, /caches\.delete\(key\)/);
});
