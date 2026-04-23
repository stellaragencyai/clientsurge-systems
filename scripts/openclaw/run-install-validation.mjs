#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(process.cwd());
const asJson = process.argv.includes("--json");

const testFiles = [
  "tests/installPipeline.test.js",
  "tests/installRuntime.test.js",
  "tests/remoteSetupWorkspace.test.js",
  "tests/providerTests.test.js",
  "tests/webhookSecurity.test.js",
];

function runTestFile(file) {
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, ["--test", file], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const durationMs = Date.now() - startedAt;

  return {
    file,
    passed: result.status === 0,
    duration_ms: durationMs,
    exit_code: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

const results = testFiles.map(runTestFile);
const failed = results.filter((result) => !result.passed);
const summary = {
  generated_at: new Date().toISOString(),
  repo_root: repoRoot,
  suite: "canonical_install_validation",
  passed: failed.length === 0,
  passed_count: results.filter((result) => result.passed).length,
  failed_count: failed.length,
  total_duration_ms: results.reduce((sum, result) => sum + result.duration_ms, 0),
  results: results.map((result) => ({
    file: result.file,
    passed: result.passed,
    duration_ms: result.duration_ms,
    exit_code: result.exit_code,
    failure_excerpt: result.passed
      ? null
      : (result.stderr || result.stdout).trim().split(/\r?\n/).slice(-12),
  })),
};

if (asJson) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  process.stdout.write("OpenClaw Canonical Install Validation\n");
  process.stdout.write(`Repo: ${summary.repo_root}\n`);
  process.stdout.write(`Generated: ${summary.generated_at}\n`);
  process.stdout.write(`Status: ${summary.passed ? "PASS" : "FAIL"}\n`);
  process.stdout.write(`Suites: ${summary.passed_count}/${results.length} passing\n`);
  process.stdout.write(`Duration: ${summary.total_duration_ms}ms\n\n`);

  for (const result of summary.results) {
    process.stdout.write(`- ${result.passed ? "PASS" : "FAIL"} ${result.file} (${result.duration_ms}ms)\n`);
    if (result.failure_excerpt?.length) {
      for (const line of result.failure_excerpt) {
        process.stdout.write(`  ${line}\n`);
      }
    }
  }
}

process.exit(summary.passed ? 0 : 1);
