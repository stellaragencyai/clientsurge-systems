#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { hostname } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_REPO_PATH = "C:\\Users\\nolan\\Code\\ClientSurge\\clientsurge-systems";
const DEFAULT_MIRROR_PATH = "C:\\Users\\nolan\\Code\\ClientSurge\\clientsurge-systems-main-mirror";
const PRODUCTION_APP_ID = "69dc4a79656fdba136d413d3";
const PRODUCTION_URL = "https://clientsurgesystems.com";
const STAGING_DONOR_APP_ID = "69f959e2bc665e019e19840c";
const STAGING_DONOR_URL = "https://client-surge-systems-copy-9e19840c.base44.app";

function parseArgs(argv) {
  const args = {
    repoPath: DEFAULT_REPO_PATH,
    mirrorPath: DEFAULT_MIRROR_PATH,
    json: false,
    liveSecurity: false,
    skipBase44: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo-path") args.repoPath = argv[++i] || args.repoPath;
    else if (arg === "--mirror-path") args.mirrorPath = argv[++i] || args.mirrorPath;
    else if (arg === "--json") args.json = true;
    else if (arg === "--live-security") args.liveSecurity = true;
    else if (arg === "--skip-base44") args.skipBase44 = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/sync/audit-sync-status.mjs [--json] [--live-security] [--skip-base44]

Checks GitHub main, active repo, clean mirror, Base44 publish state, scheduled tasks,
and Cloudflare edge readiness without changing live infrastructure.`);
      process.exit(0);
    }
  }

  return args;
}

function run(command, args, { cwd = process.cwd(), allowFailure = true } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const record = {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
  if (!record.ok && !allowFailure) {
    throw new Error(`${command} ${args.join(" ")} failed: ${record.stderr || record.stdout}`);
  }
  return record;
}

function git(cwd, args) {
  return run("git", args, { cwd });
}

function getGitState(repoPath, mirrorPath) {
  const localSha = git(repoPath, ["rev-parse", "HEAD"]).stdout;
  const branch = git(repoPath, ["branch", "--show-current"]).stdout;
  const activeStatus = git(repoPath, ["status", "--porcelain=v1"]).stdout;
  const originMain = git(repoPath, ["ls-remote", "origin", "refs/heads/main"]).stdout.split(/\s+/)[0] || "";

  const mirrorExists = existsSync(mirrorPath);
  const mirrorSha = mirrorExists ? git(mirrorPath, ["rev-parse", "HEAD"]).stdout : "";
  const mirrorBranch = mirrorExists ? git(mirrorPath, ["branch", "--show-current"]).stdout : "";
  const mirrorStatus = mirrorExists ? git(mirrorPath, ["status", "--porcelain=v1"]).stdout : "";

  return {
    branch,
    active_sha: localSha,
    origin_main_sha: originMain,
    active_clean: activeStatus.length === 0,
    mirror_exists: mirrorExists,
    mirror_branch: mirrorBranch,
    mirror_sha: mirrorSha,
    mirror_clean: mirrorExists && mirrorStatus.length === 0,
    active_matches_origin_main: localSha === originMain,
    mirror_matches_origin_main: mirrorSha === originMain,
  };
}

function readTextIfExists(path) {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8").trim();
}

function readJsonIfExists(path) {
  const text = readTextIfExists(path);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { parse_error: true, raw: text };
  }
}

function getBase44PublishState(repoPath, mirrorPath, originMainSha, skipBase44) {
  const lastPublishedPath = join(mirrorPath, "logs", "base44-publish", "last-published-main.txt");
  const lastPublishedAllPath = join(mirrorPath, "logs", "base44-publish", "last-published-all.json");
  const lastPublishedSha = readTextIfExists(lastPublishedPath);
  const multiApp = readJsonIfExists(lastPublishedAllPath);
  const state = {
    last_published_sha: lastPublishedSha,
    matches_origin_main: Boolean(originMainSha && lastPublishedSha === originMainSha),
    multi_app: multiApp,
    multi_app_matches_origin_main: Boolean(originMainSha && multiApp?.sourceSha === originMainSha),
    app: null,
    staging_donor_app: null,
  };

  if (skipBase44) {
    state.app = { skipped: true };
    state.staging_donor_app = { skipped: true };
    return state;
  }

  const check = run(process.execPath, [
    "scripts/base44/check-app-access.mjs",
    "--app-id",
    PRODUCTION_APP_ID,
    "--verify-url",
    PRODUCTION_URL,
    "--json",
  ], { cwd: repoPath });

  if (!check.ok) {
    state.app = {
      ok: false,
      error: check.stderr || check.stdout,
    };
    return state;
  }

  try {
    state.app = JSON.parse(check.stdout);
  } catch {
    state.app = {
      ok: false,
      parse_error: true,
      raw: check.stdout,
    };
  }

  const stagingCheck = run(process.execPath, [
    "scripts/base44/check-app-access.mjs",
    "--app-id",
    STAGING_DONOR_APP_ID,
    "--verify-url",
    STAGING_DONOR_URL,
    "--json",
  ], { cwd: repoPath });

  if (!stagingCheck.ok) {
    state.staging_donor_app = {
      ok: false,
      error: stagingCheck.stderr || stagingCheck.stdout,
    };
  } else {
    try {
      state.staging_donor_app = JSON.parse(stagingCheck.stdout);
    } catch {
      state.staging_donor_app = {
        ok: false,
        parse_error: true,
        raw: stagingCheck.stdout,
      };
    }
  }

  return state;
}

function getScheduledTask(taskName) {
  const command = [
    `$task = Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;`,
    `$info = Get-ScheduledTaskInfo -TaskName '${taskName}' -ErrorAction Stop;`,
    "[pscustomobject]@{State=$task.State.ToString();LastRunTime=$info.LastRunTime;NextRunTime=$info.NextRunTime;LastTaskResult=$info.LastTaskResult} | ConvertTo-Json -Compress",
  ].join(" ");
  const result = run("pwsh", ["-NoProfile", "-Command", command]);
  if (!result.ok || !result.stdout) {
    return {
      installed: false,
      error: result.stderr || result.stdout,
    };
  }

  try {
    return {
      installed: true,
      ...JSON.parse(result.stdout),
    };
  } catch {
    return {
      installed: true,
      parse_error: true,
      raw: result.stdout,
    };
  }
}

function isTaskOverlapResult(task) {
  const result = Number(task?.LastTaskResult);
  return result === 267009 || result === 2147946720;
}

function getCloudflareState(repoPath, liveSecurity) {
  const machine = hostname();
  const statusPath = join(repoPath, "logs", "cloudflare-security", machine, "latest-security-edge-status.json");
  const monitor = readJsonIfExists(statusPath);
  const whoami = run("npx", ["wrangler", "whoami"], { cwd: repoPath });
  const authenticated = whoami.ok && !/not authenticated/i.test(`${whoami.stdout}\n${whoami.stderr}`);
  const state = {
    authenticated,
    monitor_status_path: statusPath,
    monitor,
    live_security: null,
  };

  if (liveSecurity) {
    const verify = run("npm", ["run", "verify:production-security"], { cwd: repoPath });
    state.live_security = {
      ok: verify.ok,
      output: verify.stdout || verify.stderr,
    };
  }

  return state;
}

function getGitHubReleaseGate(repoPath, sha) {
  const workflow = "clientsurge-release-gate.yml";
  if (!sha) {
    return {
      workflow,
      ok: false,
      status: "missing_sha",
    };
  }

  const result = run("gh", [
    "run",
    "list",
    "--workflow",
    workflow,
    "--branch",
    "main",
    "--commit",
    sha,
    "--limit",
    "5",
    "--json",
    "status,conclusion,url,headSha,workflowName,createdAt,updatedAt",
  ], { cwd: repoPath });

  if (!result.ok) {
    return {
      workflow,
      ok: false,
      status: "unavailable",
      error: result.stderr || result.stdout,
    };
  }

  try {
    const runs = JSON.parse(result.stdout || "[]");
    const run = runs
      .filter((candidate) => candidate.headSha === sha)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0];

    if (!run) {
      return {
        workflow,
        ok: false,
        status: "missing",
      };
    }

    return {
      workflow,
      ok: run.status === "completed" && run.conclusion === "success",
      status: run.status,
      conclusion: run.conclusion,
      url: run.url,
      updated_at: run.updatedAt,
    };
  } catch {
    return {
      workflow,
      ok: false,
      status: "parse_error",
      raw: result.stdout,
    };
  }
}

function evaluate(report) {
  const failures = [];
  const warnings = [];

  if (!report.git.active_clean) failures.push("Active repo is dirty.");
  if (!report.git.mirror_exists) failures.push("Clean mirror is missing.");
  if (!report.git.mirror_clean) failures.push("Clean mirror is dirty.");
  if (!report.git.active_matches_origin_main) warnings.push("Active branch HEAD is not origin/main; this is expected when working on a merge branch but should be intentional.");
  if (!report.git.mirror_matches_origin_main) failures.push("Clean mirror is not at origin/main.");
  if (!report.github.release_gate.ok) failures.push("GitHub release gate has not passed for origin/main.");
  if (!report.base44.matches_origin_main) failures.push("Base44 last published SHA does not match origin/main.");
  if (!report.base44.multi_app_matches_origin_main) failures.push("Base44 multi-app publish state does not match origin/main.");
  if (report.base44.app && report.base44.app.ok === false) failures.push("Base44 production app access check failed.");
  if (report.base44.staging_donor_app && report.base44.staging_donor_app.ok === false) failures.push("Base44 staging donor app access check failed.");
  if (report.base44.app?.live_signal?.hasDonorAppId) failures.push("Production live signal contains donor app ID.");
  if (!report.base44.staging_donor_app?.live_signal?.hasDonorAppId) failures.push("Staging donor live signal does not contain donor app ID.");
  if (!report.tasks.base44.installed) {
    failures.push("Base44 sync scheduled task is missing.");
  } else if (Number(report.tasks.base44.LastTaskResult) !== 0) {
    if (isTaskOverlapResult(report.tasks.base44) && report.base44.matches_origin_main) {
      warnings.push("Base44 sync scheduled task last result indicates an overlapping/running tick, but publish state matches origin/main.");
    } else {
      failures.push("Base44 sync scheduled task is failing.");
    }
  }

  if (!report.tasks.cloudflare.installed) {
    failures.push("Cloudflare security scheduled task is missing.");
  } else if (Number(report.tasks.cloudflare.LastTaskResult) !== 0) {
    if (isTaskOverlapResult(report.tasks.cloudflare)) {
      warnings.push("Cloudflare security scheduled task last result indicates an overlapping/running tick.");
    } else {
      failures.push("Cloudflare security scheduled task is failing.");
    }
  }

  const cloudflareStatus = report.cloudflare.monitor?.status || "";
  if (cloudflareStatus === "auth_required" || !report.cloudflare.authenticated) {
    warnings.push("Cloudflare edge release is waiting on Wrangler authentication.");
  } else if (cloudflareStatus && !["verified", "released"].includes(cloudflareStatus)) {
    failures.push(`Cloudflare monitor status is ${cloudflareStatus}.`);
  }

  if (report.cloudflare.live_security && !report.cloudflare.live_security.ok) {
    failures.push("Live production security verification is still failing.");
  }

  return {
    ok: failures.length === 0,
    failures,
    warnings,
  };
}

function format(report) {
  const lines = [
    "ClientSurge Sync Status",
    `Checked: ${report.checked_at}`,
    `Machine: ${report.machine}`,
    `Overall: ${report.summary.ok ? "OK" : "ATTENTION"}`,
    "",
    `GitHub main: ${report.git.origin_main_sha}`,
    `GitHub release gate: ${report.github.release_gate.status || "unknown"} conclusion=${report.github.release_gate.conclusion || "unknown"} ok=${report.github.release_gate.ok}`,
    `Active: ${report.git.branch} ${report.git.active_sha} clean=${report.git.active_clean}`,
    `Mirror: ${report.git.mirror_branch || "missing"} ${report.git.mirror_sha || "missing"} clean=${report.git.mirror_clean}`,
    `Base44 published: ${report.base44.last_published_sha || "unknown"} matches_main=${report.base44.matches_origin_main}`,
    `Base44 multi-app: ${report.base44.multi_app?.sourceSha || "unknown"} matches_main=${report.base44.multi_app_matches_origin_main}`,
    `Base44 app: ${report.base44.app?.app_name || "unknown"} auth=${report.base44.app?.auth_email || "unknown"} ok=${report.base44.app?.ok ?? "unknown"}`,
    `Base44 live app IDs: production=${Boolean(report.base44.app?.live_signal?.hasProductionAppId)} donor=${Boolean(report.base44.app?.live_signal?.hasDonorAppId)}`,
    `Base44 staging donor: ${report.base44.staging_donor_app?.app_name || "unknown"} ok=${report.base44.staging_donor_app?.ok ?? "unknown"} asset=${report.base44.staging_donor_app?.live_signal?.asset || "unknown"}`,
    `Task Base44: installed=${report.tasks.base44.installed} state=${report.tasks.base44.State || "unknown"} last=${report.tasks.base44.LastTaskResult ?? "unknown"} next=${report.tasks.base44.NextRunTime ?? "unknown"}`,
    `Task Cloudflare: installed=${report.tasks.cloudflare.installed} state=${report.tasks.cloudflare.State || "unknown"} last=${report.tasks.cloudflare.LastTaskResult ?? "unknown"} next=${report.tasks.cloudflare.NextRunTime ?? "unknown"}`,
    `Cloudflare: authenticated=${report.cloudflare.authenticated} monitor=${report.cloudflare.monitor?.status || "missing"}`,
  ];

  if (report.summary.warnings.length) {
    lines.push("", "Warnings:");
    for (const warning of report.summary.warnings) lines.push(`- ${warning}`);
  }

  if (report.summary.failures.length) {
    lines.push("", "Failures:");
    for (const failure of report.summary.failures) lines.push(`- ${failure}`);
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoPath = resolve(args.repoPath);
  const mirrorPath = resolve(args.mirrorPath);
  const gitState = getGitState(repoPath, mirrorPath);
  const report = {
    checked_at: new Date().toISOString(),
    machine: hostname(),
    repo_path: repoPath,
    mirror_path: mirrorPath,
    git: gitState,
    base44: getBase44PublishState(repoPath, mirrorPath, gitState.origin_main_sha, args.skipBase44),
    tasks: {
      base44: getScheduledTask("ClientSurge-Base44-SyncMirror"),
      cloudflare: getScheduledTask("ClientSurge-Cloudflare-Security-Edge"),
    },
    github: {
      release_gate: getGitHubReleaseGate(repoPath, gitState.origin_main_sha),
    },
    cloudflare: getCloudflareState(repoPath, args.liveSecurity),
  };
  report.summary = evaluate(report);

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(format(report));

  process.exitCode = report.summary.failures.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
