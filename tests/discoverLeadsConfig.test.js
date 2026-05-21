import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const discoverLeadsEntry = readFileSync(
  new URL("../base44/functions/discoverLeads/entry.ts", import.meta.url),
  "utf8"
);
const discoverLeadsGuard = readFileSync(
  new URL("../base44/functions/shared/discoverLeadsGuard.ts", import.meta.url),
  "utf8"
);
const srcEnvReadme = readFileSync(new URL("../src/README_ENV.md", import.meta.url), "utf8");
const docsEnvReadme = readFileSync(new URL("../docs/README_ENV.md", import.meta.url), "utf8");

test("discoverLeads fails clearly when the server-side Google Maps key is missing", () => {
  assert.match(discoverLeadsEntry, /import \{ requireGoogleMapsKey \}/);
  assert.match(discoverLeadsEntry, /requireGoogleMapsKey\(\);/);
  assert.match(discoverLeadsGuard, /Deno\.env\.get\("GOOGLE_MAPS_API_KEY"\)/);
  assert.match(
    discoverLeadsGuard,
    /Google Maps API key is not configured\. Set GOOGLE_MAPS_API_KEY in environment variables\./
  );
  assert.match(discoverLeadsGuard, /status:\s*503/);
});

test("environment docs list GOOGLE_MAPS_API_KEY as a server-side secret", () => {
  assert.match(srcEnvReadme, /GOOGLE_MAPS_API_KEY/);
  assert.match(srcEnvReadme, /discoverLeads/);
  assert.match(srcEnvReadme, /503/);
  assert.match(docsEnvReadme, /GOOGLE_MAPS_API_KEY/);
  assert.match(docsEnvReadme, /discoverLeads, lead enrichment/);
});
