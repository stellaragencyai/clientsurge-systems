import test from "node:test";
import assert from "node:assert/strict";

import { originRequestFor } from "../cloudflare/clientsurge-security-edge-worker.mjs";

test("Cloudflare edge routes Base44 API calls to the Base44 API host", () => {
  const originRequest = originRequestFor(new Request(
    "https://clientsurgesystems.com/api/apps/69dc4a79656fdba136d413d3/functions/submitContactInquiry",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "clientsurgesystems.com",
      },
      body: "{}",
    },
  ));
  const originUrl = new URL(originRequest.url);

  assert.equal(originUrl.hostname, "base44.app");
  assert.equal(originUrl.pathname, "/api/apps/69dc4a79656fdba136d413d3/functions/submitContactInquiry");
  assert.equal(originRequest.method, "POST");
  assert.equal(originRequest.headers.get("host"), null);
});

test("Cloudflare edge keeps public pages on the Base44 app host", () => {
  const originRequest = originRequestFor(new Request("https://clientsurgesystems.com/store?plan=starter"));
  const originUrl = new URL(originRequest.url);

  assert.equal(originUrl.hostname, "grinning-apex-flow-growth.base44.app");
  assert.equal(originUrl.pathname, "/store");
  assert.equal(originUrl.search, "?plan=starter");
});
