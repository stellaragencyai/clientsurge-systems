#!/usr/bin/env node

import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const APP_ID = process.env.BASE44_APP_ID || "69dc4a79656fdba136d413d3";
const BASE_URL = (process.env.RELEASE_BASE_URL || "https://clientsurgesystems.com").replace(/\/$/, "");
const ALLOW_ENDPOINT_FALLBACK = process.env.ALLOW_BASE44_ENDPOINT_FALLBACK !== "false";
const ALLOW_UI_FALLBACK = process.env.ALLOW_BASE44_UI_FALLBACK === "true";
const SKIP_INSTALL = process.env.SKIP_NPM_INSTALL === "true";
const SKIP_TESTS = process.env.SKIP_RELEASE_TESTS === "true";
const PROOF_PATH = resolve(process.env.RELEASE_PROOF_PATH || "tmp/production-release-proof.json");

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, BASE44_APP_ID: APP_ID },
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result;
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function assertSource() {
  const sha = process.env.RELEASE_SHA || process.env.GITHUB_SHA || git("rev-parse", "HEAD");
  const branch = process.env.GITHUB_REF_NAME || process.env.RELEASE_BRANCH || git("branch", "--show-current");
  if (!process.env.ALLOW_NON_MAIN_RELEASE && branch !== "main") {
    throw new Error(`Refusing production release from branch '${branch}'. Expected main.`);
  }
  const dirty = git("status", "--porcelain=v1");
  if (dirty && process.env.ALLOW_DIRTY_RELEASE !== "true") {
    throw new Error("Refusing production release from a dirty worktree.");
  }
  return { sha, branch };
}

function writeProof(proof) {
  mkdirSync(dirname(PROOF_PATH), { recursive: true });
  writeFileSync(PROOF_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
}

const source = assertSource();
const proof = {
  ok: false,
  app_id: APP_ID,
  base_url: BASE_URL,
  source_sha: source.sha,
  source_branch: source.branch,
  started_at: new Date().toISOString(),
  deployment_method: null,
  stages: [],
};

try {
  run("node", ["scripts/release/write-release-marker.mjs", "--sha", source.sha]);
  proof.stages.push({ stage: "release_marker", ok: true });

  if (!SKIP_INSTALL) {
    run("npm", ["ci"]);
    proof.stages.push({ stage: "npm_ci", ok: true });
  }

  run("npm", ["run", "build"]);
  proof.stages.push({ stage: "build", ok: true });

  if (!SKIP_TESTS) {
    run("npm", ["run", "test:release-gate:node"]);
    proof.stages.push({ stage: "release_gate_tests", ok: true });
  }

  let deployed = false;
  const cliResult = run("npx", ["--yes", "base44@latest", "site", "deploy", "-y"], { allowFailure: true });
  if (cliResult.status === 0) {
    deployed = true;
    proof.deployment_method = "base44_cli_site_deploy";
  } else {
    proof.stages.push({ stage: "base44_cli_site_deploy", ok: false, exit_code: cliResult.status });
  }

  if (!deployed && ALLOW_ENDPOINT_FALLBACK) {
    const endpointResult = run("node", [
      "scripts/base44/publish-deploy-endpoint.mjs",
      "--app-id", APP_ID,
      "--verify-url", BASE_URL,
      "--verify-wait-ms", "180000",
      "--verify-poll-ms", "10000",
      "--summary",
      "--output", "tmp/base44-endpoint-publish-proof.json",
    ], { allowFailure: true });
    if (endpointResult.status === 0) {
      deployed = true;
      proof.deployment_method = "base44_deploy_endpoint_fallback";
    } else {
      proof.stages.push({ stage: "base44_deploy_endpoint_fallback", ok: false, exit_code: endpointResult.status });
    }
  }

  if (!deployed && ALLOW_UI_FALLBACK) {
    const uiResult = run("node", [
      "scripts/base44/publish-ui-clicker.mjs",
      "--yes",
      "--headless",
      "--timeout-ms", "180000",
      "--output", "tmp/base44-ui-publish-proof.json",
    ], { allowFailure: true });
    if (uiResult.status === 0) {
      deployed = true;
      proof.deployment_method = "base44_ui_click_fallback";
    } else {
      proof.stages.push({ stage: "base44_ui_click_fallback", ok: false, exit_code: uiResult.status });
    }
  }

  if (!deployed) throw new Error("All configured Base44 deployment methods failed.");
  proof.stages.push({ stage: "base44_deploy", ok: true, method: proof.deployment_method });

  run("node", [
    "scripts/release/verify-live-release.mjs",
    "--sha", source.sha,
    "--base-url", BASE_URL,
    "--timeout-ms", "300000",
    "--poll-ms", "10000",
    "--output", "tmp/live-release-sha-proof.json",
  ]);
  proof.stages.push({ stage: "exact_sha_live_verification", ok: true });

  run("npm", ["run", "smoke:public-routes", "--", `--base-url=${BASE_URL}`]);
  proof.stages.push({ stage: "public_route_smoke", ok: true });

  proof.ok = true;
  proof.completed_at = new Date().toISOString();
  writeProof(proof);
  console.log(JSON.stringify(proof, null, 2));
} catch (error) {
  proof.ok = false;
  proof.completed_at = new Date().toISOString();
  proof.error = error.message || String(error);
  writeProof(proof);
  console.error(JSON.stringify(proof, null, 2));
  process.exit(1);
}
