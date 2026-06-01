#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const DEFAULT_APPS = [
  {
    role: "production",
    appId: "69dc4a79656fdba136d413d3",
    verifyUrl: "https://clientsurgesystems.com",
    required: true,
  },
  {
    role: "staging-donor",
    appId: "69f959e2bc665e019e19840c",
    verifyUrl: "https://client-surge-systems-copy-9e19840c.base44.app",
    required: false,
  },
];

function parseArgs(argv) {
  const args = {
    dryRun: false,
    includeMirror: false,
    continueOnOptionalFailure: true,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--include-stellar-mirror") args.includeMirror = true;
    else if (arg === "--fail-optional") args.continueOnOptionalFailure = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/base44/publish-all-apps.mjs [--dry-run] [--include-stellar-mirror] [--fail-optional]

Publishes production first, then staging/mirror apps from the same GitHub main source.`);
      process.exit(0);
    }
  }

  return args;
}

function runNodeScript(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function summarizeOutput(output) {
  if (!output) return null;
  try {
    const parsed = JSON.parse(output);
    return {
      ok: parsed.ok,
      appId: parsed.appId || parsed.app_id || null,
      beforeAsset: parsed.beforeSignal?.asset || parsed.live_signal?.asset || null,
      afterAsset: parsed.afterSignal?.asset || null,
      updatedDate: parsed.updated_date || parsed.deployResult?.body?.updated_date || null,
      authEmail: parsed.auth_email || null,
    };
  } catch {
    return output.slice(0, 1000);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const apps = [...DEFAULT_APPS];
  if (args.includeMirror) {
    apps.push({
      role: "stellar-mirror",
      appId: "6a15f1424f4856ba4e9ed90b",
      verifyUrl: "https://client-surge-systems-copy-4e9ed90b.base44.app",
      required: false,
    });
  }

  const results = [];

  for (const app of apps) {
    const scriptArgs = [
      "--app-id",
      app.appId,
      "--verify-url",
      app.verifyUrl,
      "--summary",
    ];
    if (args.dryRun) scriptArgs.push("--dry-run");

    const result = runNodeScript("scripts/base44/publish-deploy-endpoint.mjs", scriptArgs);
    const record = {
      role: app.role,
      appId: app.appId,
      verifyUrl: app.verifyUrl,
      required: app.required,
      ok: result.ok,
      status: result.status,
      summary: summarizeOutput(result.stdout),
      error: result.stderr || null,
    };
    results.push(record);

    if (!record.ok && (app.required || !args.continueOnOptionalFailure)) {
      console.log(JSON.stringify({ ok: false, dryRun: args.dryRun, results }, null, 2));
      process.exit(1);
    }
  }

  const failedRequired = results.filter((result) => result.required && !result.ok);
  console.log(JSON.stringify({ ok: failedRequired.length === 0, dryRun: args.dryRun, results }, null, 2));
  process.exit(failedRequired.length === 0 ? 0 : 1);
}

main();
