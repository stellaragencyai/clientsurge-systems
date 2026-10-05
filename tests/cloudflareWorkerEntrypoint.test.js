import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const wranglerConfig = readFileSync(
  new URL("../wrangler.clientsurge-security.toml", import.meta.url),
  "utf8",
);

test("Cloudflare deploy entrypoint uses the Telegram tracker wrapper", () => {
  assert.match(
    wranglerConfig,
    /main\s*=\s*"cloudflare\/clientsurge-security-telegram-wrapper\.mjs"/,
  );
  assert.doesNotMatch(
    wranglerConfig,
    /main\s*=\s*"cloudflare\/clientsurge-homepage-repair-wrapper\.mjs"/,
  );
  assert.doesNotMatch(
    wranglerConfig,
    /main\s*=\s*"cloudflare\/clientsurge-production-safe-entry\.mjs"/,
  );
});

test("Cloudflare deploy config binds the Worker as the production custom domain", () => {
  assert.match(wranglerConfig, /pattern\s*=\s*"clientsurgesystems\.com"\s*\ncustom_domain\s*=\s*true/);
  assert.match(wranglerConfig, /pattern\s*=\s*"www\.clientsurgesystems\.com"\s*\ncustom_domain\s*=\s*true/);
});
