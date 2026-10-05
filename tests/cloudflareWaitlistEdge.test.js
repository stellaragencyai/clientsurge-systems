import test from "node:test";
import assert from "node:assert/strict";

import worker, {
  HOMEPAGE_MOTION_HEADER,
  PRELAUNCH_WAITLIST_ORIGIN_HEADER,
  STATIC_FALLBACK_PAINT_GUARD_HEADER,
  STATIC_FALLBACK_PAINT_GUARD_STYLE_ID,
  WAITLIST_BASE44_APP_ID,
  WAITLIST_EDGE_VERSION,
  WAITLIST_PROFILE_HEADER,
  WAITLIST_SUBSCRIBE_HEADER,
} from "../cloudflare/clientsurge-security-edge-worker.mjs";

test("Cloudflare security edge preserves the live prelaunch waitlist shell", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    "<!doctype html><html><head><title>PreLaunch Countdown</title></head><body><div id=\"root\"></div></body></html>",
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );

  try {
    const response = await worker.fetch(new Request("https://clientsurgesystems.com/"));
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(PRELAUNCH_WAITLIST_ORIGIN_HEADER), WAITLIST_EDGE_VERSION);
    assert.equal(response.headers.get(STATIC_FALLBACK_PAINT_GUARD_HEADER), null);
    assert.equal(response.headers.get(HOMEPAGE_MOTION_HEADER), null);
    assert.match(body, /PreLaunch Countdown/);
    assert.doesNotMatch(body, new RegExp(STATIC_FALLBACK_PAINT_GUARD_STYLE_ID));
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare security edge bridges the broken prelaunch waitlist subscribe function", async () => {
  const previousFetch = globalThis.fetch;
  const subscriberId = "6a812dfeed00000000000001";
  const calls = [];
  let storedProfileTokenHash = "";

  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const bodyText = request.method === "POST" || request.method === "PUT"
      ? await request.clone().text()
      : "";
    const body = bodyText ? JSON.parse(bodyText) : null;
    calls.push({ method: request.method, url: request.url, body });

    if (request.method === "POST" && request.url === `https://base44.app/api/apps/${WAITLIST_BASE44_APP_ID}/entities/Subscriber`) {
      return Response.json({
        id: subscriberId,
        first_name: body.first_name,
        reference_code: body.reference_code,
        eligibility_status: body.eligibility_status,
        offer_summary: body.offer_summary,
        launch_at: body.launch_at,
        eligibility_expires_at: body.eligibility_expires_at,
      });
    }

    if (request.method === "PUT" && request.url === `https://base44.app/api/apps/${WAITLIST_BASE44_APP_ID}/entities/Subscriber/${subscriberId}` && body.profile_token_hash) {
      storedProfileTokenHash = body.profile_token_hash;
      return Response.json({ success: true });
    }

    throw new Error(`Unexpected Base44 request in test: ${request.method} ${request.url}`);
  };

  try {
    const response = await worker.fetch(new Request(
      `https://clientsurgesystems.com/api/apps/${WAITLIST_BASE44_APP_ID}/functions/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://clientsurgesystems.com",
        },
        body: JSON.stringify({
          email: "ADA@example.COM",
          first_name: "Ada",
          phone_number: "(602) 587-4608",
          marketing_consent: true,
          sms_consent: true,
          source: "coming-soon",
          landing_page: "/",
        }),
      },
    ));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(WAITLIST_SUBSCRIBE_HEADER), WAITLIST_EDGE_VERSION);
    assert.equal(body.success, true);
    assert.equal(body.subscriber_id, subscriberId);
    assert.equal(body.first_name, "Ada");
    assert.equal(body.waitlist_position, null);
    assert.match(body.reference_code, /^CS-FND-[A-Z0-9]+-[A-F0-9]{6}$/);
    assert.match(body.profile_token, new RegExp(`^${subscriberId}\\.[a-f0-9]{32}$`));
    assert.equal(calls[0].body.normalized_email, "ada@example.com");
    assert.equal(calls[0].body.phone_normalized, "+16025874608");
    assert.equal(calls[0].body.marketing_consent, true);
    assert.equal(calls[0].body.sms_status, "active");
    assert.equal(calls[1].body.profile_token_hash.length, 64);
    assert.equal(storedProfileTokenHash.length, 64);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare security edge rejects invalid prelaunch waitlist emails before Base44 writes", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Base44 should not be called for invalid waitlist payloads");
  };

  try {
    const response = await worker.fetch(new Request(
      `https://clientsurgesystems.com/api/apps/${WAITLIST_BASE44_APP_ID}/functions/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      },
    ));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(response.headers.get(WAITLIST_SUBSCRIBE_HEADER), WAITLIST_EDGE_VERSION);
    assert.equal(body.success, false);
    assert.match(body.error, /valid email/i);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare security edge saves prelaunch waitlist profile updates with the issued token", async () => {
  const previousFetch = globalThis.fetch;
  const subscriberId = "6a812dfeed00000000000002";
  let storedProfileTokenHash = "";
  const calls = [];

  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const bodyText = request.method === "POST" || request.method === "PUT"
      ? await request.clone().text()
      : "";
    const body = bodyText ? JSON.parse(bodyText) : null;
    calls.push({ method: request.method, url: request.url, body });

    if (request.method === "POST") {
      return Response.json({ id: subscriberId, first_name: "Grace", eligibility_status: "eligible" });
    }

    if (request.method === "PUT" && body.profile_token_hash) {
      storedProfileTokenHash = body.profile_token_hash;
      return Response.json({ success: true });
    }

    if (request.method === "GET") {
      return Response.json({
        id: subscriberId,
        profile_token_hash: storedProfileTokenHash,
        profile_token_expires_at: "2099-01-01T00:00:00.000Z",
      });
    }

    if (request.method === "PUT" && body.company_name) {
      assert.equal(body.company_name, "Grace Systems");
      assert.equal(body.industry, "HVAC");
      assert.equal(body.website_url, "https://example.com/");
      assert.equal(body.primary_problem, "Missed calls");
      assert.match(body.profile_completed_at, /^\d{4}-\d{2}-\d{2}T/);
      return Response.json({ success: true });
    }

    throw new Error(`Unexpected Base44 request in test: ${request.method} ${request.url}`);
  };

  try {
    const subscribeResponse = await worker.fetch(new Request(
      `https://clientsurgesystems.com/api/apps/${WAITLIST_BASE44_APP_ID}/functions/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "grace@example.com", first_name: "Grace" }),
      },
    ));
    const subscription = await subscribeResponse.json();

    const profileResponse = await worker.fetch(new Request(
      `https://clientsurgesystems.com/api/apps/${WAITLIST_BASE44_APP_ID}/functions/updateSubscriberProfile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_token: subscription.profile_token,
          company_name: "Grace Systems",
          industry: "HVAC",
          website_url: "example.com",
          primary_problem: "Missed calls",
        }),
      },
    ));
    const profile = await profileResponse.json();

    assert.equal(profileResponse.status, 200);
    assert.equal(profileResponse.headers.get(WAITLIST_PROFILE_HEADER), WAITLIST_EDGE_VERSION);
    assert.deepEqual(profile, { success: true, message: "Profile saved." });
    assert.equal(calls.filter((call) => call.method === "GET").length, 1);
    assert.equal(calls.filter((call) => call.method === "PUT").length, 2);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
