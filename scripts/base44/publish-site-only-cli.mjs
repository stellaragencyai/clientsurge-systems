#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_APP_ID = "69dc4a79656fdba136d413d3";
const DEFAULT_CUSTOM_DOMAIN = "https://clientsurgesystems.com";
const DEFAULT_BASE44_ORIGIN = "https://grinning-apex-flow-growth.base44.app";
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");

function parseArgs(argv) {
  const options = {
    appId: DEFAULT_APP_ID,
    verifyUrl: DEFAULT_CUSTOM_DOMAIN,
    base44OriginUrl: DEFAULT_BASE44_ORIGIN,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    output: "",
    skipBuild: false,
    keepTemp: false,
    noVerify: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    if (arg === "--app-id") options.appId = next();
    else if (arg === "--verify-url") options.verifyUrl = next();
    else if (arg === "--base44-origin-url") options.base44OriginUrl = next();
    else if (arg === "--timeout-ms") options.timeoutMs = Number(next());
    else if (arg === "--output") options.output = next();
    else if (arg === "--skip-build") options.skipBuild = true;
    else if (arg === "--keep-temp") options.keepTemp = true;
    else if (arg === "--no-verify") options.noVerify = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/base44/publish-site-only-cli.mjs [options]

Builds the Vite site, copies only dist/ plus a minimal Base44 site config into a
temporary package, runs the Base44 CLI deploy from that package, and verifies
that the live domains serve the published asset.

Options:
  --app-id <id>                  Base44 app id. Defaults to ClientSurge.
  --verify-url <url>             Custom domain to verify after deploy.
  --base44-origin-url <url>      Base44 origin to verify after deploy.
  --skip-build                   Reuse the current dist/ output.
  --keep-temp                    Keep the temporary deploy package.
  --no-verify                    Skip live asset verification.
  --timeout-ms <ms>              Command timeout. Defaults to 600000.
  --output <path>                Write JSON summary to a file.
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

async function createDeployPackage(tempRoot) {
  const distDir = join(repoRoot, "dist");
  if (!existsSync(distDir)) {
    throw new Error("dist/ does not exist. Run without --skip-build or run npm run build first.");
  }

  await mkdir(join(tempRoot, "base44"), { recursive: true });
  await cp(distDir, join(tempRoot, "dist"), { recursive: true, force: true });
  await writeFile(
    join(tempRoot, "base44", "config.jsonc"),
    `{
  "name": "ClientSurge Systems",
  "site": {
    "installCommand": "node -e \\"console.log('using prebuilt dist')\\"",
    "buildCommand": "node -e \\"console.log('using prebuilt dist')\\"",
    "serveCommand": "node -e \\"console.log('using prebuilt dist')\\"",
    "outputDirectory": "./dist"
  }
}
`,
    "utf8",
  );
}

async function findLocalIndexAssets() {
  const assetsDir = join(repoRoot, "dist", "assets");
  const files = await readdir(assetsDir);
  return files.filter((file) => /^index-[A-Za-z0-9_-]+\.js$/.test(file)).sort();
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    });
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      text: await response.text(),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function verifyLiveUrl(url, { appId, expectedAssets, timeoutMs }) {
  const htmlUrl = new URL(url);
  htmlUrl.searchParams.set("__codex_publish_probe", String(Date.now()));

  const html = await fetchText(htmlUrl.href, timeoutMs);
  const assetPath =
    html.text.match(/\/assets\/index-[^"'<>]+\.js/)?.[0] ||
    html.text.match(/\/assets\/[^"'<>]+\.js/)?.[0] ||
    "";

  let asset = null;
  if (assetPath) {
    const assetUrl = new URL(assetPath, html.finalUrl || htmlUrl.href);
    assetUrl.searchParams.set("__codex_asset_probe", String(Date.now()));
    const assetResponse = await fetchText(assetUrl.href, timeoutMs);
    asset = {
      url: assetUrl.href,
      path: assetPath,
      status: assetResponse.status,
      ok: assetResponse.ok,
      bytes: assetResponse.text.length,
      hasAppId: assetResponse.text.includes(appId),
      matchesLocalBuild:
        expectedAssets.length === 0 ||
        expectedAssets.some((expected) => assetPath.endsWith(`/${expected}`)),
    };
  }

  const ok =
    html.ok &&
    Boolean(asset) &&
    asset.ok &&
    asset.hasAppId &&
    asset.matchesLocalBuild;

  return {
    url,
    status: html.status,
    finalUrl: html.finalUrl,
    htmlBytes: html.text.length,
    asset,
    ok,
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
    repoRoot,
    tempRoot: "",
    build: null,
    deploy: null,
    verification: [],
    cleanedTemp: false,
  };

  const tempRoot = join(tmpdir(), `clientsurge-base44-site-${Date.now()}`);
  summary.tempRoot = tempRoot;

  try {
    if (!options.skipBuild) {
      summary.build = await runCommand("npm", ["run", "build"], {
        cwd: repoRoot,
        timeoutMs: options.timeoutMs,
      });
    }

    await createDeployPackage(tempRoot);

    const cliPrefix = resolve(
      process.env.BASE44_CLI_PREFIX || join(tmpdir(), "base44-cli-runtime"),
    );
    await mkdir(cliPrefix, { recursive: true });

    summary.deploy = await runCommand(
      "npx",
      ["--prefix", cliPrefix, "--yes", "base44", "--app-id", options.appId, "deploy", "--yes"],
      {
        cwd: tempRoot,
        timeoutMs: options.timeoutMs,
      },
    );

    if (!options.noVerify) {
      const expectedAssets = await findLocalIndexAssets();
      const urls = [options.verifyUrl, options.base44OriginUrl].filter(Boolean);
      summary.verification = [];
      for (const url of urls) {
        summary.verification.push(
          await verifyLiveUrl(url, {
            appId: options.appId,
            expectedAssets,
            timeoutMs: Math.min(options.timeoutMs, 60_000),
          }),
        );
      }
    }

    summary.ok =
      (!summary.build || summary.build.code === 0) &&
      summary.deploy.code === 0 &&
      (options.noVerify || summary.verification.every((item) => item.ok));
  } catch (error) {
    summary.error = {
      message: error.message,
      result: error.result || null,
    };
    process.exitCode = 1;
  } finally {
    if (!options.keepTemp) {
      assertSafeTempPath(tempRoot);
      await rm(tempRoot, { recursive: true, force: true });
      summary.cleanedTemp = true;
    }

    if (options.output) {
      await writeFile(resolve(repoRoot, options.output), `${JSON.stringify(summary, null, 2)}\n`);
    }

    console.log(`\nBASE44_SITE_ONLY_PUBLISH_RESULT ${JSON.stringify(summary, null, 2)}`);

    if (!summary.ok) {
      process.exitCode = 1;
    }
  }
}

main();
