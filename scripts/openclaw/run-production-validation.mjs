#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(process.cwd());
const asJson = process.argv.includes("--json");

const suites = [
  {
    id: "canonical_production_validation",
    label: "Canonical Production Validation",
    file: "tests/canonicalProductionValidation.test.js",
  },
  {
    id: "provider_proof",
    label: "Provider Proof Coverage",
    file: "tests/providerProof.test.js",
  },
  {
    id: "customer_lead_ingestion",
    label: "Customer Lead Ingestion Coverage",
    file: "tests/customerLeadIngestion.test.js",
  },
  {
    id: "webhook_runtime",
    label: "Webhook Runtime Coverage",
    file: "tests/webhookSecurity.test.js",
  },
  {
    id: "remote_workspace",
    label: "Remote Workspace Visibility",
    file: "tests/remoteSetupWorkspace.test.js",
  },
  {
    id: "canonical_boundaries",
    label: "Canonical Boundary Guards",
    file: "tests/leadModelBoundaries.test.js",
  },
  {
    id: "legacy_quarantine",
    label: "Legacy Quarantine",
    file: "tests/legacyQuarantine.test.js",
  },
];

function runSuite(suite) {
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, ["--test", suite.file], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const durationMs = Date.now() - startedAt;

  return {
    ...suite,
    passed: result.status === 0,
    duration_ms: durationMs,
    exit_code: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

const results = suites.map(runSuite);
const failed = results.filter((result) => !result.passed);
const summary = {
  generated_at: new Date().toISOString(),
  repo_root: repoRoot,
  suite: "canonical_production_validation",
  passed: failed.length === 0,
  passed_count: results.filter((result) => result.passed).length,
  failed_count: failed.length,
  total_duration_ms: results.reduce((sum, result) => sum + result.duration_ms, 0),
  results: results.map((result) => ({
    id: result.id,
    label: result.label,
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
  process.stdout.write("OpenClaw Canonical Production Validation\n");
  process.stdout.write(`Repo: ${summary.repo_root}\n`);
  process.stdout.write(`Generated: ${summary.generated_at}\n`);
  process.stdout.write(`Status: ${summary.passed ? "PASS" : "FAIL"}\n`);
  process.stdout.write(`Suites: ${summary.passed_count}/${results.length} passing\n`);
  process.stdout.write(`Duration: ${summary.total_duration_ms}ms\n\n`);

  for (const result of summary.results) {
    process.stdout.write(`- ${result.passed ? "PASS" : "FAIL"} ${result.label} (${result.duration_ms}ms)\n`);
    process.stdout.write(`  ${result.file}\n`);
    if (result.failure_excerpt?.length) {
      for (const line of result.failure_excerpt) {
        process.stdout.write(`  ${line}\n`);
      }
    }
  }
}

process.exit(summary.passed ? 0 : 1);
