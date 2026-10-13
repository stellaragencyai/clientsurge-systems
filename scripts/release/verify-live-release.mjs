#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSha } from "./write-release-manifest.mjs";

function parseArgs(argv) {
  const args = {
    baseUrl: "",
    expectedSha: "",
    manifestPath: "/release.json",
    timeoutMs: 180000,
    pollMs: 10000,
    output: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") args.baseUrl = argv[++index] || "";
    else if (arg === "--expected-sha") args.expectedSha = argv[++index] || "";
    else if (arg === "--manifest-path") args.manifestPath = argv[++index] || args.manifestPath;
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++index] || args.timeoutMs);
    else if (arg === "--poll-ms") args.pollMs = Number(argv[++index] || args.pollMs);
    else if (arg === "--output") args.output = argv[++index] || "";
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/release/verify-live-release.mjs --base-url <url> [options]

Options:
  --expected-sha <sha>     Defaults to GITHUB_SHA or git HEAD.
  --manifest-path <path>   Default: /release.json
  --timeout-ms <number>    Default: 180000
  --poll-ms <number>       Default: 10000
  --output <path>          Optional JSON proof output.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.baseUrl) throw new Error("--base-url is required");
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) throw new Error("--timeout-ms must be positive");
  if (!Number.isFinite(args.pollMs) || args.pollMs <= 0) throw new Error("--poll-ms must be positive");

  return args;
}

function readGitHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function writeProof(outputPath, payload) {
  if (!outputPath) return;
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export async function fetchReleaseManifest({ baseUrl, manifestPath = "/release.json" }) {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const path = manifestPath.startsWith("/") ? manifestPath : `/${manifestPath}`;
  const requestUrl = new URL(`${normalizedBase}${path}`);
  requestUrl.searchParams.set("cache_bust", `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const response = await fetch(requestUrl, {
    redirect: "follow",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });

  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return {
    requested_url: requestUrl.toString(),
    final_url: response.url,
    status: response.status,
    ok: response.ok,
    body,
    body_preview: body ? null : text.slice(0, 300),
  };
}

export async function waitForExactRelease({
  baseUrl,
  expectedSha,
  manifestPath = "/release.json",
  timeoutMs = 180000,
  pollMs = 10000,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms)),
}) {
  const normalizedSha = normalizeSha(expectedSha);
  const startedAt = now();
  let attempts = 0;
  let lastResult = null;

  while (now() - startedAt <= timeoutMs) {
    attempts += 1;
    try {
      lastResult = await fetchReleaseManifest({ baseUrl, manifestPath });
      const liveSha = String(lastResult.body?.sha || "").toLowerCase();
      if (lastResult.ok && liveSha === normalizedSha) {
        return {
          ok: true,
          expected_sha: normalizedSha,
          live_sha: liveSha,
          attempts,
          elapsed_ms: now() - startedAt,
          checked_at: new Date().toISOString(),
          response: lastResult,
        };
      }
    } catch (error) {
      lastResult = {
        ok: false,
        status: 0,
        error: error.message || String(error),
      };
    }

    if (now() - startedAt >= timeoutMs) break;
    await sleep(Math.min(pollMs, Math.max(0, timeoutMs - (now() - startedAt))));
  }

  return {
    ok: false,
    expected_sha: normalizedSha,
    live_sha: lastResult?.body?.sha || null,
    attempts,
    elapsed_ms: now() - startedAt,
    checked_at: new Date().toISOString(),
    reason: "timeout_waiting_for_exact_release_sha",
    response: lastResult,
  };
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  return fileURLToPath(import.meta.url) === resolve(process.argv[1]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const expectedSha = args.expectedSha || process.env.GITHUB_SHA || readGitHead();
  const proof = await waitForExactRelease({ ...args, expectedSha });
  writeProof(args.output, proof);
  console.log(JSON.stringify(proof, null, 2));
  if (!proof.ok) process.exit(1);
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
