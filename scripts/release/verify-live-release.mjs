#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function readArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function resolveSha() {
  const explicit = readArg("--sha") || process.env.RELEASE_SHA || process.env.GITHUB_SHA;
  if (explicit) return explicit.trim();
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

const expectedSha = resolveSha();
const baseUrl = (readArg("--base-url") || process.env.RELEASE_BASE_URL || "https://clientsurgesystems.com").replace(/\/$/, "");
const timeoutMs = Number(readArg("--timeout-ms", "240000"));
const pollMs = Number(readArg("--poll-ms", "10000"));
const output = readArg("--output");
const startedAt = Date.now();
let attempts = 0;
let lastResult = null;

while (Date.now() - startedAt <= timeoutMs) {
  attempts += 1;
  const url = `${baseUrl}/release.json?sha=${encodeURIComponent(expectedSha)}&t=${Date.now()}`;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch {}
    lastResult = {
      status: response.status,
      url: response.url,
      payload,
      body_preview: payload ? null : text.slice(0, 240),
    };
    if (response.ok && payload?.sha === expectedSha) {
      const proof = {
        ok: true,
        expected_sha: expectedSha,
        live_sha: payload.sha,
        attempts,
        elapsed_ms: Date.now() - startedAt,
        verified_at: new Date().toISOString(),
        base_url: baseUrl,
      };
      if (output) {
        const path = resolve(output);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
      }
      console.log(JSON.stringify(proof, null, 2));
      process.exit(0);
    }
  } catch (error) {
    lastResult = { error: error.message };
  }
  await new Promise((resolvePromise) => setTimeout(resolvePromise, pollMs));
}

const failure = {
  ok: false,
  expected_sha: expectedSha,
  attempts,
  elapsed_ms: Date.now() - startedAt,
  base_url: baseUrl,
  last_result: lastResult,
  failure_reason: "live_release_sha_did_not_match_before_timeout",
};
if (output) {
  const path = resolve(output);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(failure, null, 2)}\n`, "utf8");
}
console.error(JSON.stringify(failure, null, 2));
process.exit(1);
