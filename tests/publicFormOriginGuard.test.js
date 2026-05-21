import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getAllowedPublicFormOrigins,
  normalizeOrigin,
  validatePublicFormOrigin,
} from "../base44/functions/_shared/publicFormOriginGuard.js";

const submitLeadCaptureSource = readFileSync(
  new URL("../base44/functions/submitLeadCapture/entry.ts", import.meta.url),
  "utf8"
);
const submitContactInquirySource = readFileSync(
  new URL("../base44/functions/submitContactInquiry/entry.ts", import.meta.url),
  "utf8"
);

function requestWithOrigin(origin) {
  return {
    headers: new Headers(origin ? { origin } : {}),
  };
}

test("public form origin guard allows ClientSurge production origins", () => {
  assert.equal(normalizeOrigin("https://clientsurgesystems.com/contact"), "https://clientsurgesystems.com");
  assert.equal(validatePublicFormOrigin(requestWithOrigin("https://clientsurgesystems.com")).ok, true);
  assert.equal(validatePublicFormOrigin(requestWithOrigin("https://www.clientsurgesystems.com")).ok, true);
});

test("public form origin guard blocks missing malformed and untrusted origins", () => {
  assert.deepEqual(validatePublicFormOrigin(requestWithOrigin("")), {
    ok: false,
    status: 403,
    error: "Invalid request origin",
  });
  assert.equal(validatePublicFormOrigin(requestWithOrigin("not a url")).ok, false);
  assert.equal(validatePublicFormOrigin(requestWithOrigin("https://evil.example")).ok, false);
});

test("public form origin guard can include configured deployment origins", () => {
  const env = {
    get(key) {
      return key === "PUBLIC_FORM_ALLOWED_ORIGINS" ? "https://preview.example, https://staging.example/path" : "";
    },
  };

  const allowedOrigins = getAllowedPublicFormOrigins(env);
  assert.equal(allowedOrigins.has("https://preview.example"), true);
  assert.equal(allowedOrigins.has("https://staging.example"), true);
});

test("public lead and contact endpoints call the shared origin guard before parsing payloads", () => {
  assert.match(submitLeadCaptureSource, /validatePublicFormOrigin\(req\)/);
  assert.match(submitLeadCaptureSource, /if \(!originGuard\.ok\)/);
  assert.match(submitContactInquirySource, /validatePublicFormOrigin\(req\)/);
  assert.match(submitContactInquirySource, /if \(!originGuard\.ok\)/);
});
