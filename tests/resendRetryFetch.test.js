import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { resendFetch } from "../base44/functions/_shared/resendFetch.js";

const retryableStatuses = [429, 500, 502, 503, 504];

function listFunctionFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      return listFunctionFiles(path);
    }
    return /\.(ts|js)$/.test(entry.name) ? [path] : [];
  });
}

test("resendFetch retries rate limits and server failures exactly once", async () => {
  for (const status of retryableStatuses) {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      calls.push(status);
      return new Response("{}", { status });
    };

    try {
      const response = await resendFetch("https://api.resend.com/emails", {}, { retryDelayMs: 1 });
      assert.equal(response.status, status);
      assert.equal(calls.length, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
});

test("resendFetch does not retry successful or caller-error responses", async () => {
  for (const status of [200, 400, 401, 403, 404]) {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      calls.push(status);
      return new Response("{}", { status });
    };

    try {
      const response = await resendFetch("https://api.resend.com/emails", {}, { retryDelayMs: 1 });
      assert.equal(response.status, status);
      assert.equal(calls.length, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
});

test("all Base44 Resend API callers use the shared retry helper", () => {
  const files = listFunctionFiles("base44/functions").filter((file) => {
    const source = readFileSync(file, "utf8");
    return (
      source.includes("https://api.resend.com") &&
      !file.endsWith("base44/functions/_shared/resendFetch.js")
    );
  });

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\(["']https:\/\/api\.resend\.com/);
    assert.match(source, /resendFetch\(["']https:\/\/api\.resend\.com/);
  }
});

test("shared Resend retry helper keeps a two-second default delay", () => {
  const source = readFileSync("base44/functions/_shared/resendFetch.js", "utf8");
  assert.match(source, /retryDelayMs = 2000/);
});
