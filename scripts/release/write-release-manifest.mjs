#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_REPOSITORY = "stellaragencyai/clientsurge-systems";

function parseArgs(argv) {
  const args = {
    output: "dist/release.json",
    sha: "",
    repository: process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY,
    ref: process.env.GITHUB_REF || "",
    workflow: process.env.GITHUB_WORKFLOW || "",
    runId: process.env.GITHUB_RUN_ID || "",
    runAttempt: process.env.GITHUB_RUN_ATTEMPT || "",
    appId: process.env.BASE44_APP_ID || "",
    environment: process.env.DEPLOYMENT_ENVIRONMENT || "staging",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") args.output = argv[++index] || args.output;
    else if (arg === "--sha") args.sha = argv[++index] || "";
    else if (arg === "--repository") args.repository = argv[++index] || args.repository;
    else if (arg === "--ref") args.ref = argv[++index] || "";
    else if (arg === "--workflow") args.workflow = argv[++index] || "";
    else if (arg === "--run-id") args.runId = argv[++index] || "";
    else if (arg === "--run-attempt") args.runAttempt = argv[++index] || "";
    else if (arg === "--app-id") args.appId = argv[++index] || "";
    else if (arg === "--environment") args.environment = argv[++index] || args.environment;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/release/write-release-manifest.mjs [options]

Options:
  --output <path>          Output path. Default: dist/release.json
  --sha <git-sha>          Exact source commit. Defaults to GITHUB_SHA or git HEAD.
  --repository <owner/repo>
  --ref <git-ref>
  --workflow <name>
  --run-id <id>
  --run-attempt <number>
  --app-id <base44-app-id>
  --environment <name>     staging or production
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

export function normalizeSha(value) {
  const sha = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`Expected a full 40-character Git SHA, received: ${value || "<empty>"}`);
  }
  return sha;
}

function readGitHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

export function buildReleaseManifest({
  sha,
  repository = DEFAULT_REPOSITORY,
  ref = "",
  workflow = "",
  runId = "",
  runAttempt = "",
  appId = "",
  environment = "staging",
  generatedAt = new Date().toISOString(),
}) {
  const normalizedSha = normalizeSha(sha);

  return {
    schema_version: 1,
    artifact_type: "vite-dist",
    repository,
    sha: normalizedSha,
    short_sha: normalizedSha.slice(0, 12),
    ref: ref || null,
    environment,
    base44_app_id: appId || null,
    generated_at: generatedAt,
    workflow: workflow || null,
    run_id: runId || null,
    run_attempt: runAttempt || null,
  };
}

export function writeReleaseManifest(outputPath, manifest) {
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return absoluteOutput;
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  return fileURLToPath(import.meta.url) === resolve(process.argv[1]);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sha = args.sha || process.env.GITHUB_SHA || readGitHead();
  const manifest = buildReleaseManifest({ ...args, sha });
  const outputPath = writeReleaseManifest(args.output, manifest);

  console.log(JSON.stringify({ ok: true, output: outputPath, manifest }, null, 2));
}

if (isDirectExecution()) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}
