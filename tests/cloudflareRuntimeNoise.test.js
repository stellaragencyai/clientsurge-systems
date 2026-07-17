import test from "node:test";
import assert from "node:assert/strict";

import worker, {
  ANONYMOUS_SESSION_RECORDING_HEADER,
  ANONYMOUS_USER_ME_HEADER,
  isAnonymousSessionRecordingRequest,
  isAnonymousUserMeRequest,
} from "../cloudflare/clientsurge-security-edge-worker.mjs";

test("Cloudflare security edge worker suppresses anonymous public User/me noise", async () => {
  const anonymousRequest = new Request(
    "https://clientsurgesystems.com/api/apps/69dc4a79656fdba136d413d3/entities/User/me",
  );
  const authenticatedRequest = new Request(
    "https://clientsurgesystems.com/api/apps/69dc4a79656fdba136d413d3/entities/User/me",
    { headers: { cookie: "base44_session=example" } },
  );

  assert.equal(isAnonymousUserMeRequest(anonymousRequest), true);
  assert.equal(isAnonymousUserMeRequest(authenticatedRequest), false);

  const response = await worker.fetch(anonymousRequest);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get(ANONYMOUS_USER_ME_HEADER), "edge-v1");
  assert.equal(await response.text(), "null");
});

test("Cloudflare security edge worker suppresses anonymous session recording ingest noise", async () => {
  const anonymousRequest = new Request(
    "https://clientsurgesystems.com/api/runtime/session-recordings/ingest",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: [] }),
    },
  );
  const authenticatedRequest = new Request(
    "https://clientsurgesystems.com/api/runtime/session-recordings/ingest",
    {
      method: "POST",
      headers: { cookie: "base44_session=example", "content-type": "application/json" },
      body: JSON.stringify({ events: [] }),
    },
  );
  const appScopedRequest = new Request(
    "https://clientsurgesystems.com/api/apps/69dc4a79656fdba136d413d3/runtime/session-recordings/ingest",
    { method: "OPTIONS" },
  );

  assert.equal(isAnonymousSessionRecordingRequest(anonymousRequest), true);
  assert.equal(isAnonymousSessionRecordingRequest(authenticatedRequest), false);
  assert.equal(isAnonymousSessionRecordingRequest(appScopedRequest), true);

  const response = await worker.fetch(anonymousRequest);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get(ANONYMOUS_SESSION_RECORDING_HEADER), "edge-v1");
  assert.equal(response.headers.get("x-base44-recording-skip"), "sampled");
  assert.equal(await response.text(), "");
});
