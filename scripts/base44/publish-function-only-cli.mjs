#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_APP_ID = "69dc4a79656fdba136d413d3";
const DEFAULT_VERIFY_URL = "https://clientsurgesystems.com";
const DEFAULT_ORIGIN = "https://clientsurgesystems.com";
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");

function parseArgs(argv) {
  const options = {
    appId: DEFAULT_APP_ID,
    functionName: "",
    verifyUrl: DEFAULT_VERIFY_URL,
    origin: DEFAULT_ORIGIN,
    expectStatus: 0,
    expectBodyContains: "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
    keepTemp: false,
    noVerify: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      index += 1;
      return value;
    };

    if (arg === "--app-id") options.appId = next();
    else if (arg === "--function") options.functionName = next();
    else if (arg === "--verify-url") options.verifyUrl = next();
    else if (arg === "--origin") options.origin = next();
    else if (arg === "--expect-status") options.expectStatus = Number(next());
    else if (arg === "--expect-body-contains") options.expectBodyContains = next();
    else if (arg === "--timeout-ms") options.timeoutMs = Number(next());
    else if (arg === "--keep-temp") options.keepTemp = true;
    else if (arg === "--no-verify") options.noVerify = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!/^[A-Za-z0-9_-]+$/.test(options.functionName)) {
    throw new Error("--function must be a Base44 function folder name");
  }
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number");
  }
  if (options.expectStatus && !Number.isInteger(options.expectStatus)) {
    throw new Error("--expect-status must be an integer HTTP status");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/base44/publish-function-only-cli.mjs --function <name> [options]

Copies one Base44 function folder into a temporary package, runs Base44 CLI
deploy from that package, and optionally verifies the live function URL.

Options:
  --app-id <id>                    Base44 app id. Defaults to ClientSurge.
  --function <name>                Required function folder under base44/functions.
  --verify-url <url>               Site origin for /api/functions/<name> proof.
  --origin <url>                   Origin header for verification POST.
  --expect-status <status>         Require this verification HTTP status.
  --expect-body-contains <text>    Require this text in verification body.
  --no-verify                      Skip the live POST verification.
  --keep-temp                      Keep the temporary deploy package.
  --timeout-ms <ms>                Command timeout. Defaults to 300000.
`);
}

function runCommand(command, args, { cwd, timeoutMs }) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectRun(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const result = { command, args, cwd, code, stdout, stderr, timedOut };
      if (code === 0 && !timedOut) {
        resolveRun(result);
        return;
      }
      const error = new Error(
        timedOut
          ? `${command} timed out after ${timeoutMs}ms`
          : `${command} exited with code ${code}`,
      );
      error.result = result;
      rejectRun(error);
    });
  });
}

async function createDeployPackage(tempRoot, functionName) {
  const sourceDir = join(repoRoot, "base44", "functions", functionName);
  if (!existsSync(sourceDir)) {
    throw new Error(`Function folder not found: ${sourceDir}`);
  }

  await mkdir(join(tempRoot, "base44", "functions"), { recursive: true });
  await cp(sourceDir, join(tempRoot, "base44", "functions", functionName), {
    recursive: true,
    force: true,
  });
  await writeFile(
    join(tempRoot, "base44", "config.jsonc"),
    `{
  "name": "ClientSurge Systems"
}
`,
    "utf8",
  );
}

async function verifyFunction(options) {
  const url = new URL(`/api/functions/${options.functionName}`, options.verifyUrl);
  const response = await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: {
      "content-type": "application/json",
      origin: options.origin,
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    body: "{}",
  });
  const body = await response.text();
  const ok =
    (!options.expectStatus || response.status === options.expectStatus) &&
    (!options.expectBodyContains || body.includes(options.expectBodyContains));

  return {
    ok,
    url: response.url,
    status: response.status,
    contentType: response.headers.get("content-type"),
    body: body.slice(0, 2000),
  };
}

function assertSafeTempPath(pathToRemove) {
  const tempRoot = resolve(tmpdir());
  const resolved = resolve(pathToRemove);
  if (resolved === tempRoot || !resolved.startsWith(`${tempRoot}${sep}`)) {
    throw new Error(`Refusing to remove non-temp path: ${resolved}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = {
    ok: false,
    appId: options.appId,
    functionName: options.functionName,
    tempRoot: join(tmpdir(), `clientsurge-base44-function-${options.functionName}-${Date.now()}`),
    deploy: null,
    verification: null,
    cleanedTemp: false,
  };

  try {
    await createDeployPackage(summary.tempRoot, options.functionName);
    const cliPrefix = resolve(
      process.env.BASE44_CLI_PREFIX || join(tmpdir(), "base44-cli-runtime"),
    );
    await mkdir(cliPrefix, { recursive: true });
    summary.deploy = await runCommand(
      "npx",
      ["--prefix", cliPrefix, "--yes", "base44", "--app-id", options.appId, "deploy", "--yes"],
      {
        cwd: summary.tempRoot,
        timeoutMs: options.timeoutMs,
      },
    );

    if (!options.noVerify) {
      summary.verification = await verifyFunction(options);
    }

    summary.ok =
      summary.deploy.code === 0 &&
      (options.noVerify || summary.verification?.ok === true);
  } catch (error) {
    summary.error = {
      message: error.message,
      result: error.result || null,
    };
    process.exitCode = 1;
  } finally {
    if (!options.keepTemp) {
      assertSafeTempPath(summary.tempRoot);
      await rm(summary.tempRoot, { recursive: true, force: true });
      summary.cleanedTemp = true;
    }
    console.log(`\nBASE44_FUNCTION_ONLY_PUBLISH_RESULT ${JSON.stringify(summary, null, 2)}`);
    if (!summary.ok) process.exitCode = 1;
  }
}

main();
