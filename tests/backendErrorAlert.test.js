import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildBackend5xxAlertEmail,
  resolveBackendErrorAlertConfig,
  sendBackend5xxAlert,
  shouldAlertOnStatus,
} from "../base44/functions/_shared/backendErrorAlert.js";

test("backend error alert only sends for 5xx statuses", async () => {
  assert.equal(shouldAlertOnStatus(499), false);
  assert.equal(shouldAlertOnStatus(500), true);
  assert.equal(shouldAlertOnStatus(599), true);
  assert.equal(shouldAlertOnStatus(600), false);

  const result = await sendBackend5xxAlert({
    functionName: "testFunction",
    status: 409,
    error: "not fatal",
    env: {
      RESEND_API_KEY: "re_test",
      ADMIN_NOTIFICATION_EMAIL: "ops@example.com",
    },
    fetchEmail: async () => {
      throw new Error("should not send");
    },
  });

  assert.deepEqual(result, { sent: false, reason: "not_5xx" });
});

test("backend error alert uses admin notification config instead of hardcoded recipients", async () => {
  assert.deepEqual(
    resolveBackendErrorAlertConfig({
      ADMIN_EMAIL: "fallback@example.com",
      ADMIN_NOTIFICATION_EMAIL: "alerts@example.com",
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "system@example.com",
    }),
    {
      resendKey: "re_test",
      fromEmail: "system@example.com",
      toEmail: "alerts@example.com",
    }
  );

  const sends = [];
  const result = await sendBackend5xxAlert({
    functionName: "checkout",
    status: 503,
    error: "provider failed",
    env: {
      ADMIN_NOTIFICATION_EMAIL: "alerts@example.com",
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "system@example.com",
    },
    fetchEmail: async (url, options) => {
      sends.push({ url, body: JSON.parse(options.body), headers: options.headers });
      return { ok: true };
    },
    now: new Date("2026-05-21T20:15:00.000Z"),
  });

  assert.equal(result.sent, true);
  assert.equal(sends.length, 1);
  assert.equal(sends[0].url, "https://api.resend.com/emails");
  assert.equal(sends[0].headers.Authorization, "Bearer re_test");
  assert.equal(sends[0].body.to, "alerts@example.com");
  assert.equal(sends[0].body.from, "ClientSurge Alerts <system@example.com>");
  assert.match(sends[0].body.subject, /\[ClientSurge\] 5xx Error: checkout/);
  assert.match(sends[0].body.text, /Status: 503/);
  assert.match(sends[0].body.text, /provider failed/);
});

test("healthCheck exposes config-driven 5xx alert utility without hardcoded Nolan recipients", () => {
  const source = readFileSync("base44/functions/healthCheck/entry.ts", "utf8");

  assert.match(source, /sendBackend5xxAlert/);
  assert.match(source, /ADMIN_NOTIFICATION_EMAIL/);
  assert.match(source, /ADMIN_EMAIL/);
  assert.doesNotMatch(source, /nolan@clientsurgesystems\.com/);
  assert.doesNotMatch(source, /TELEGRAM_NOLAN/);
  assert.doesNotMatch(source, /7776809236/);
});
