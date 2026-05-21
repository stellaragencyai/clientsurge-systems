import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  fetchWithTimeout,
  stripeFetch,
  twilioFetch,
} from "../base44/functions/_shared/providerFetch.js";

function listFunctionFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      return listFunctionFiles(path);
    }
    return /\.(ts|js)$/.test(entry.name) ? [path] : [];
  });
}

test("fetchWithTimeout aborts provider requests after the configured deadline", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      });
    });

  try {
    await assert.rejects(
      fetchWithTimeout("https://api.twilio.com/example", {}, { timeoutMs: 5, label: "Twilio API request" }),
      /Twilio API request timed out after 5ms/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Twilio and Stripe wrappers set provider-specific timeout labels", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url, init) => {
    requested.push({ url, hasSignal: Boolean(init.signal) });
    return new Response("{}", { status: 200 });
  };

  try {
    await twilioFetch("https://api.twilio.com/example", {});
    await stripeFetch("https://api.stripe.com/example", {});
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requested, [
    { url: "https://api.twilio.com/example", hasSignal: true },
    { url: "https://api.stripe.com/example", hasSignal: true },
  ]);
});

test("Base44 Twilio Stripe and Resend callers do not use raw provider fetches", () => {
  const files = listFunctionFiles("base44/functions").filter(
    (file) => !file.endsWith("base44/functions/_shared/providerFetch.js")
  );
  const rawProviderFetch =
    /\bfetch\(\s*(?:TWILIO_API_URL|["'`]https:\/\/api\.(?:twilio|stripe|resend)\.com)/;

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, rawProviderFetch, file);
  }
});

test("Resend Twilio and Stripe helpers expose provider timeouts", () => {
  const resendSource = readFileSync("base44/functions/_shared/resendFetch.js", "utf8");
  const providerSource = readFileSync("base44/functions/_shared/providerFetch.js", "utf8");

  assert.match(resendSource, /label: "Resend API request"/);
  assert.match(providerSource, /label: "Twilio API request"/);
  assert.match(providerSource, /label: "Stripe API request"/);
  assert.match(providerSource, /timeoutMs: 10000/);
  assert.match(providerSource, /timeoutMs: 15000/);
});
