#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const APP_CONFIG_PATH = path.resolve("base44/.app.jsonc");
const AUTH_PATH = path.join(os.homedir(), ".base44", "auth", "auth.json");
const BASE44_API_URL = process.env.BASE44_API_URL || "https://app.base44.com";
const QUARANTINE_ROOT = path.resolve("base44/functions_quarantine");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getQuarantinedFunctionNames() {
  if (!fs.existsSync(QUARANTINE_ROOT)) return new Set();

  const names = new Set();
  for (const folder of fs.readdirSync(QUARANTINE_ROOT, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const folderPath = path.join(QUARANTINE_ROOT, folder.name);
    for (const item of fs.readdirSync(folderPath, { withFileTypes: true })) {
      if (item.isDirectory()) names.add(item.name);
    }
  }
  return names;
}

async function main() {
  const app = readJson(APP_CONFIG_PATH);
  const auth = readJson(AUTH_PATH);
  const quarantined = getQuarantinedFunctionNames();
  const url = new URL(`/api/apps/${app.id}/backend-functions`, BASE44_API_URL);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "User-Agent": "ClientSurge Base44 quarantine automation audit",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch Base44 functions: ${response.status} ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  const functions = Array.isArray(payload.functions) ? payload.functions : [];
  const conflicts = [];

  for (const fn of functions) {
    if (!quarantined.has(fn.name)) continue;
    const automations = Array.isArray(fn.automations) ? fn.automations : [];
    if (!automations.length) continue;
    conflicts.push({
      function: fn.name,
      automations: automations.map((automation) => automation.name || automation.type || "unnamed automation"),
    });
  }

  const summary = {
    generated_at: new Date().toISOString(),
    quarantined_functions_count: quarantined.size,
    remote_functions_count: functions.length,
    conflicts_count: conflicts.length,
    conflicts,
  };

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write("Base44 Automation Quarantine Audit\n");
    process.stdout.write(`Generated: ${summary.generated_at}\n`);
    process.stdout.write(`Quarantined functions: ${summary.quarantined_functions_count}\n`);
    process.stdout.write(`Remote functions: ${summary.remote_functions_count}\n`);
    process.stdout.write(`Conflicts: ${summary.conflicts_count}\n`);

    if (conflicts.length) {
      process.stdout.write("\nQuarantined functions still attached to Base44 automations:\n");
      for (const item of conflicts) {
        process.stdout.write(`- ${item.function}: ${item.automations.join("; ")}\n`);
      }
    }
  }

  if (conflicts.length) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
