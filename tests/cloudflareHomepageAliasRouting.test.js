import test from "node:test";
import assert from "node:assert/strict";

import worker, {
  homepageAliasLocation,
  isHomepageAliasPath,
} from "../cloudflare/clientsurge-security-edge-worker-routing.mjs";

test("homepage aliases are recognized before Base44 fallback", () => {
  for (const path of ["/home", "/Home", "/homepage", "/HomePage", "/home-page", "/index", "/index.html", "/main", "/landing", "/landing-page"]) {
    assert.equal(isHomepageAliasPath(path), true, `${path} should be treated as a homepage alias`);
  }

  for (const path of ["/", "/pricing", "/contact", "/admin", "/client-portal"]) {
    assert.equal(isHomepageAliasPath(path), false, `${path} should not be treated as a homepage alias`);
  }
});

test("homepage alias redirect resolves to canonical root and preserves query", async () => {
  const response = await worker.fetch(new Request("https://www.clientsurgesystems.com/Home?utm_source=test"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://clientsurgesystems.com/?utm_source=test");
});

test("homepage alias location normalizes direct bad paths to root", () => {
  const location = homepageAliasLocation(new URL("https://clientsurgesystems.com/index.html"));

  assert.equal(location, "https://clientsurgesystems.com/");
});
