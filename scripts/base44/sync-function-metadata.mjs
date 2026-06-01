#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const DEFAULT_DONOR_PATH = "C:\\Users\\nolan\\Documents\\base44-eject-clientsurge";

function parseArgs(argv) {
  const args = {
    donorPath: DEFAULT_DONOR_PATH,
    write: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--donor-path") args.donorPath = argv[++i] || args.donorPath;
    else if (arg === "--write") args.write = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/base44/sync-function-metadata.mjs [--write] [--json] [--donor-path <path>]

Ensures every Base44 function entry.ts in production has a matching function.jsonc.
Donor function.jsonc files are used when present, but production source code remains authoritative.`);
      process.exit(0);
    }
  }

  return args;
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files;
}

function normalizeRel(path) {
  return path.split(sep).join("/");
}

function stripJsonComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function parseJsonc(path) {
  try {
    return JSON.parse(stripJsonComments(readFileSync(path, "utf8")));
  } catch {
    return null;
  }
}

function stableFunctionConfig(name, donorConfig) {
  const config = {
    ...(donorConfig && typeof donorConfig === "object" ? donorConfig : {}),
    name,
    entry: "entry.ts",
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

function syncFunctionMetadata({ repoRoot, donorPath, write }) {
  const functionRoot = join(repoRoot, "base44", "functions");
  const donorFunctionRoot = join(donorPath, "base44", "functions");
  const entries = walkFiles(functionRoot).filter((path) => path.endsWith(`${sep}entry.ts`));
  const results = [];

  for (const entryPath of entries) {
    const functionDir = dirname(entryPath);
    const functionName = normalizeRel(relative(functionRoot, functionDir));
    const targetPath = join(functionDir, "function.jsonc");
    const donorPathForFunction = join(donorFunctionRoot, ...functionName.split("/"), "function.jsonc");
    const donorConfig = existsSync(donorPathForFunction) ? parseJsonc(donorPathForFunction) : null;
    const expected = stableFunctionConfig(functionName, donorConfig);
    const current = existsSync(targetPath) ? readFileSync(targetPath, "utf8") : "";
    const changed = current !== expected;

    if (changed && write) {
      writeFileSync(targetPath, expected, "utf8");
    }

    results.push({
      name: functionName,
      target: normalizeRel(relative(repoRoot, targetPath)),
      source: donorConfig ? "donor" : "generated",
      changed,
    });
  }

  return results;
}

function syncConnectorMetadata({ repoRoot, donorPath, write }) {
  const donorStripe = join(donorPath, "base44", "connectors", "stripe.jsonc");
  const targetStripe = join(repoRoot, "base44", "connectors", "stripe.jsonc");
  if (!existsSync(donorStripe)) return [];

  const donorText = readFileSync(donorStripe, "utf8");
  const current = existsSync(targetStripe) ? readFileSync(targetStripe, "utf8") : "";
  const changed = current !== donorText;
  if (changed && write) {
    mkdirSync(dirname(targetStripe), { recursive: true });
    writeFileSync(targetStripe, donorText, "utf8");
  }

  return [{
    name: "stripe",
    target: normalizeRel(relative(repoRoot, targetStripe)),
    source: "donor",
    changed,
  }];
}

function format(report) {
  const changedFunctions = report.functions.filter((item) => item.changed);
  const donorBacked = report.functions.filter((item) => item.source === "donor").length;
  const generated = report.functions.filter((item) => item.source === "generated").length;
  const connectorChanges = report.connectors.filter((item) => item.changed);

  return [
    "Base44 Function Metadata Sync",
    `Mode: ${report.write ? "write" : "check"}`,
    `Function entries: ${report.functions.length}`,
    `Donor-backed metadata: ${donorBacked}`,
    `Generated metadata: ${generated}`,
    `Function metadata changes: ${changedFunctions.length}`,
    `Connector metadata changes: ${connectorChanges.length}`,
    changedFunctions.length ? `Changed function sample: ${changedFunctions.slice(0, 12).map((item) => item.name).join(", ")}` : "Changed function sample: none",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(".");
  const donorPath = resolve(args.donorPath);
  const report = {
    checked_at: new Date().toISOString(),
    write: args.write,
    repo_root: repoRoot,
    donor_path: donorPath,
    functions: syncFunctionMetadata({ repoRoot, donorPath, write: args.write }),
    connectors: syncConnectorMetadata({ repoRoot, donorPath, write: args.write }),
  };
  report.ok = report.functions.every((item) => args.write || !item.changed) && report.connectors.every((item) => args.write || !item.changed);

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(format(report));

  process.exitCode = report.ok ? 0 : 1;
}

main();
