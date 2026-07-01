import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const wranglerConfig = readFileSync(
  new URL("../wrangler.clientsurge-security.toml", import.meta.url),
  "utf8",
);

test("Cloudflare deploy entrypoint uses the route exposure sanitizer wrapper", () => {
  assert.match(
    wranglerConfig,
    /main\s*=\s*"cloudflare\/clientsurge-security-edge-wrapper\.mjs"/,
  );
  assert.doesNotMatch(
    wranglerConfig,
    /main\s*=\s*"cloudflare\/clientsurge-homepage-repair-wrapper\.mjs"/,
  );
});
