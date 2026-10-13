#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReleaseManifest, normalizeSha, writeReleaseManifest } from "./write-release-manifest.mjs";
import { waitForExactRelease } from "./verify-live-release.mjs";

export const PRODUCTION_APP_ID = "69dc4a79656fdba136d413d3";
export const PRODUCTION_CONFIRMATION = "DEPLOY CLIENTSURGE PRODUCTION";

function parseArgs(argv) {
  const args = {
    appId: "",
    verifyUrl: "",
    sha: "",
    environment: "staging",
    output: "tmp/base44-exact-artifact-proof.json",
    skipBuild: false,
    skipTests: false,
    dryRun: false,
    allowProduction: false,
    confirmProduction: "",
    verifyTimeoutMs: 180000,
    verifyPollMs: 10000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--app-id") args.appId = argv[++index] || "";
    else if (arg === "--verify-url") args.verifyUrl = argv[++index] || "";
    else if (arg === "--sha") args.sha = argv[++index] || "";
    else if (arg === "--environment") args.environment = argv[++index] || args.environment;
    else if (arg === "--output") args.output = argv[++index] || args.output;
    else if (arg === "--verify-timeout-ms") args.verifyTimeoutMs = Number(argv[++index] || args.verifyTimeoutMs);
    else if (arg === "--verify-poll-ms") args.verifyPollMs = Number(argv[++index] || args.verifyPollMs);
    else if (arg === "--skip-build") args.skipBuild = true;
    else if (arg === "--skip-tests") args.skipTests = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--allow-production") args.allowProduction = true;
    else if (arg === "--confirm-production") args.confirmProduction = argv[++index] || "";
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/release/deploy-base44-exact-artifact.mjs --app-id <id> --verify-url <url> [options]

Options:
  --sha <full-sha>             Defaults to GITHUB_SHA or git HEAD.
  --environment <name>         Default: staging
  --output <path>              Default: tmp/base44-exact-artifact-proof.json
  --skip-build
  --skip-tests
  --dry-run                    Build, test, and stamp artifact without deploying.
  --allow-production           Required for the production app.
  --confirm-production <text>  Must equal: ${PRODUCTION_CONFIRMATION}
  --verify-timeout-ms <number>
  --verify-poll-ms <number>
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function readGitHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function readGitRef() {
  try {
    return execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function run(command, commandArgs, options = {}) {
  const printable = [command, ...commandArgs].join(" ");
  console.log(`> ${printable}`);
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = options.capture ? `\n${result.stdout || ""}\n${result.stderr || ""}` : "";
    throw new Error(`Command failed with exit code ${result.status}: ${printable}${detail}`);
  }

  return result;
}

function npxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

export function assertDeploymentTarget({ appId, environment, allowProduction, confirmProduction }) {
  if (!/^[0-9a-f]{24}$/i.test(String(appId || ""))) {
    throw new Error(`Invalid Base44 app ID: ${appId || "<empty>"}`);
  }

  const isProduction = appId.toLowerCase() === PRODUCTION_APP_ID || environment === "production";
  if (!isProduction) return { isProduction: false };

  if (!allowProduction) {
    throw new Error("Production deployment is disabled. Pass --allow-production only after staging proof has passed.");
  }
  if (confirmProduction !== PRODUCTION_CONFIRMATION) {
    throw new Error(`Production confirmation must exactly equal: ${PRODUCTION_CONFIRMATION}`);
  }

  return { isProduction: true };
}

function validateProjectConfig() {
  const configPath = resolve("base44/config.jsonc");
  if (!existsSync(configPath)) throw new Error("Missing base44/config.jsonc");
  const raw = readFileSync(configPath, "utf8").replace(/^\s*\/\/.*$/gm, "");
  const config = JSON.parse(raw);
  const outputDirectory = config?.site?.outputDirectory;
  if (outputDirectory !== "./dist" && outputDirectory !== "dist") {
    throw new Error(`base44/config.jsonc site.outputDirectory must be ./dist; found ${outputDirectory || "<missing>"}`);
  }
  return { configPath, outputDirectory };
}

function installAuthFromEnvironment() {
  const raw = process.env.BASE44_AUTH_JSON || process.env.BASE_44_AUTH_JSON || "";
  const authPath = resolve(homedir(), ".base44/auth/auth.json");

  if (!raw.trim()) {
    if (!existsSync(authPath)) {
      throw new Error("Base44 authentication is missing. Set BASE44_AUTH_JSON/BASE_44_AUTH_JSON or run base44 login on this machine.");
    }
    return { source: authPath, wroteFile: false };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Base44 auth environment JSON is invalid: ${error.message}`);
  }

  const normalized = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!normalized || typeof normalized !== "object") {
    throw new Error("Base44 auth JSON must contain an object or a one-item object array.");
  }

  mkdirSync(dirname(authPath), { recursive: true });
  writeFileSync(authPath, `${JSON.stringify(normalized, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(authPath, 0o600);
  } catch {
    // Windows may not support POSIX file modes; the file still stays outside the repo.
  }
  return { source: process.env.BASE44_AUTH_JSON ? "BASE44_AUTH_JSON" : "BASE_44_AUTH_JSON", wroteFile: true };
}

function writeProof(outputPath, payload) {
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return absoluteOutput;
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  return fileURLToPath(import.meta.url) === resolve(process.argv[1]);
}

export async function deployExactArtifact(args) {
  const startedAt = new Date().toISOString();
  const sha = normalizeSha(args.sha || process.env.GITHUB_SHA || readGitHead());
  const ref = process.env.GITHUB_REF || readGitRef();
  const target = assertDeploymentTarget({ ...args, appId: args.appId.toLowerCase() });
  const project = validateProjectConfig();
  const steps = [];

  const recordStep = (name, status, detail = null) => {
    steps.push({ name, status, detail, at: new Date().toISOString() });
  };

  try {
    if (!args.skipTests) {
      run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "test:release-gate:node"]);
      recordStep("release_gate_tests", "passed");
    } else {
      recordStep("release_gate_tests", "skipped");
    }

    if (!args.skipBuild) {
      run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
      recordStep("vite_build", "passed");
    } else {
      if (!existsSync(resolve("dist"))) throw new Error("--skip-build requires an existing dist directory");
      recordStep("vite_build", "skipped_existing_dist");
    }

    const manifest = buildReleaseManifest({
      sha,
      repository: process.env.GITHUB_REPOSITORY || "stellaragencyai/clientsurge-systems",
      ref,
      workflow: process.env.GITHUB_WORKFLOW || "local-exact-artifact-deploy",
      runId: process.env.GITHUB_RUN_ID || "",
      runAttempt: process.env.GITHUB_RUN_ATTEMPT || "",
      appId: args.appId,
      environment: args.environment,
    });
    const manifestPath = writeReleaseManifest("dist/release.json", manifest);
    recordStep("release_manifest", "written", { path: manifestPath, sha });

    if (args.dryRun) {
      const proof = {
        ok: true,
        dry_run: true,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        source_sha: sha,
        target: { app_id: args.appId, environment: args.environment, production: target.isProduction },
        project,
        steps,
      };
      proof.output = writeProof(args.output, proof);
      return proof;
    }

    const auth = installAuthFromEnvironment();
    recordStep("base44_auth", "ready", { source: auth.source, wrote_file: auth.wroteFile });

    const cliEnv = { ...process.env, BASE44_APP_ID: args.appId };
    run(npxCommand(), ["--yes", "base44@latest", "whoami"], { env: cliEnv });
    recordStep("base44_whoami", "passed");

    run(npxCommand(), ["--yes", "base44@latest", "site", "deploy", "-y", "--app-id", args.appId], { env: cliEnv });
    recordStep("base44_site_deploy", "passed", { app_id: args.appId });

    if (!args.verifyUrl) throw new Error("--verify-url is required for a real deployment");
    const verification = await waitForExactRelease({
      baseUrl: args.verifyUrl,
      expectedSha: sha,
      timeoutMs: args.verifyTimeoutMs,
      pollMs: args.verifyPollMs,
    });
    recordStep("exact_sha_verification", verification.ok ? "passed" : "failed", verification);

    if (!verification.ok) {
      throw new Error(`Base44 deployed, but ${args.verifyUrl}/release.json did not report expected SHA ${sha}`);
    }

    const proof = {
      ok: true,
      dry_run: false,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      source_sha: sha,
      live_sha: verification.live_sha,
      target: { app_id: args.appId, environment: args.environment, production: target.isProduction, verify_url: args.verifyUrl },
      project,
      verification,
      steps,
    };
    proof.output = writeProof(args.output, proof);
    return proof;
  } catch (error) {
    recordStep("deployment", "failed", { message: error.message || String(error) });
    const proof = {
      ok: false,
      dry_run: Boolean(args.dryRun),
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      source_sha: sha,
      target: { app_id: args.appId, environment: args.environment, production: target.isProduction, verify_url: args.verifyUrl || null },
      project,
      error: error.message || String(error),
      steps,
    };
    proof.output = writeProof(args.output, proof);
    throw Object.assign(new Error(proof.error), { proof });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.appId) throw new Error("--app-id is required");
  if (!args.dryRun && !args.verifyUrl) throw new Error("--verify-url is required unless --dry-run is used");

  const proof = await deployExactArtifact(args);
  console.log(JSON.stringify(proof, null, 2));
}

if (isDirectExecution()) {
  main().catch((error) => {
    if (error.proof) console.error(JSON.stringify(error.proof, null, 2));
    else console.error(error.message || error);
    process.exit(1);
  });
}
